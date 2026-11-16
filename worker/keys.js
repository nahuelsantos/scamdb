// API keys (completed in Task 6). authKey looks a Bearer key up by its SHA-256 hash.
export async function hashKey(key) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** The key row for `Authorization: Bearer sk_…`, or null. */
export async function authKey(request, env) {
  const m = (request.headers.get('authorization') ?? '').match(/^Bearer (sk_[A-Za-z0-9_-]{43})$/);
  if (!m) return null;
  const row = await env.DB.prepare('SELECT id, github_login FROM keys WHERE key_hash = ?').bind(await hashKey(m[1])).first();
  return row ? { id: row.id, githubLogin: row.github_login } : null;
}

/** Counts one call of `endpoint` for a key today. */
export async function recordUsage(db, keyId, endpoint, now = new Date()) {
  await db.prepare('INSERT INTO usage (key_id, day, endpoint, count) VALUES (?, ?, ?, 1) ON CONFLICT (key_id, day, endpoint) DO UPDATE SET count = count + 1')
    .bind(keyId, now.toISOString().slice(0, 10), endpoint).run();
}
