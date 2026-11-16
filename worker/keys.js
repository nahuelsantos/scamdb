// Free API keys tied to a GitHub account. Looked up by SHA-256 hash; also stored encrypted so the signed-in owner
// can view it again. The plain key is never stored.
import { json, error } from './http.js';
import { sessionFrom } from './session.js';
export async function hashKey(key) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** The key row for `Authorization: Bearer sk_…`, or null. */
export async function authKey(request, env) {
  const m = (request.headers.get('authorization') ?? '').match(/^Bearer (sk_[A-Za-z0-9_-]{43})$/);
  if (!m) return null;
  const row = await env.DB.prepare('SELECT id, github_id, github_login FROM keys WHERE key_hash = ?').bind(await hashKey(m[1])).first();
  return row ? { id: row.id, githubId: row.github_id, githubLogin: row.github_login } : null;
}

/** Counts one call of `endpoint` for a key today. */
export async function recordUsage(db, keyId, endpoint, now = new Date()) {
  await db.prepare('INSERT INTO usage (key_id, day, endpoint, count) VALUES (?, ?, ?, 1) ON CONFLICT (key_id, day, endpoint) DO UPDATE SET count = count + 1')
    .bind(keyId, now.toISOString().slice(0, 10), endpoint).run();
}

export function newKey() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return 'sk_' + btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

const PREFIX = (key) => key.slice(0, 7) + '…';
const enc = new TextEncoder();
const b64 = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes)));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

/** AES-GCM key derived from SESSION_SECRET (HKDF), used only to store API keys so their owner can view them. */
async function vaultKey(env) {
  const base = await crypto.subtle.importKey('raw', enc.encode(env.SESSION_SECRET), 'HKDF', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'HKDF', hash: 'SHA-256', salt: enc.encode('scamdb'), info: enc.encode('api key vault v1') },
    base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
export async function sealKey(key, env) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await vaultKey(env), enc.encode(key));
  return `${b64(iv)}.${b64(ct)}`;
}
export async function openKey(sealed, env) {
  const [iv, ct] = sealed.split('.');
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(iv) }, await vaultKey(env), unb64(ct));
  return new TextDecoder().decode(pt);
}
const LIMITS = { reports: 200 };

/** GET /v1/keys/me, POST /v1/keys, DELETE /v1/keys/me — all need a signed-in session; changes need X-Requested-With: scamdb. */
export async function handleKeys(request, env) {
  const user = await sessionFrom(request, env);
  if (!user) return error(401, 'not_signed_in', 'Sign in with GitHub first.');
  const { pathname } = new URL(request.url);
  const changing = request.method !== 'GET';
  if (changing && request.headers.get('x-requested-with') !== 'scamdb') return error(403, 'csrf', 'Missing X-Requested-With: scamdb.');

  if (request.method === 'GET' && pathname === '/v1/keys/me') {
    const row = await env.DB.prepare('SELECT id, prefix, created_at FROM keys WHERE github_id = ?').bind(user.githubId).first();
    let usage = 0;
    if (row) {
      const u = await env.DB.prepare("SELECT count FROM usage WHERE key_id = ? AND day = ? AND endpoint = 'reports'").bind(row.id, new Date().toISOString().slice(0, 10)).first();
      usage = u?.count ?? 0;
    }
    return json({ login: user.login, hasKey: !!row, prefix: row?.prefix ?? null, createdAt: row?.created_at ?? null, usageToday: { reports: usage }, limits: LIMITS },
      200, { 'cache-control': 'no-store' });
  }
  if (request.method === 'GET' && pathname === '/v1/keys/me/reveal') {
    if (request.headers.get('x-requested-with') !== 'scamdb') return error(403, 'csrf', 'Missing X-Requested-With: scamdb.');
    const row = await env.DB.prepare('SELECT key_enc FROM keys WHERE github_id = ?').bind(user.githubId).first();
    if (!row) return error(404, 'no_key', 'You have no key yet.');
    if (!row.key_enc) return error(404, 'key_not_viewable', 'This key was created before keys could be viewed again. Replace it to see the new one any time.');
    return json({ key: await openKey(row.key_enc, env) }, 200, { 'cache-control': 'no-store' });
  }
  if (request.method === 'POST' && pathname === '/v1/keys') {
    const key = newKey();
    await env.DB.prepare(`INSERT INTO keys (id, key_hash, prefix, github_id, github_login, created_at, key_enc) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT (github_id) DO UPDATE SET key_hash = excluded.key_hash, prefix = excluded.prefix, github_login = excluded.github_login, created_at = excluded.created_at, key_enc = excluded.key_enc`)
      .bind(crypto.randomUUID(), await hashKey(key), PREFIX(key), user.githubId, user.login, new Date().toISOString(), await sealKey(key, env)).run();
    return json({ key, prefix: PREFIX(key) }, 201, { 'cache-control': 'no-store' });
  }
  if (request.method === 'DELETE' && pathname === '/v1/keys/me') {
    await env.DB.prepare('DELETE FROM keys WHERE github_id = ?').bind(user.githubId).run();
    return new Response(null, { status: 204 });
  }
  return error(404, 'not_found', 'No such endpoint.');
}
