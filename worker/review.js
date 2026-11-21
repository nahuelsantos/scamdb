// Source review queue (docs/sources.md). Two sides, both separate from the public API and from training:
//   POST /v1/collect            the home-lab collector adds candidates (Bearer COLLECTOR_TOKEN)
//   GET  /v1/review/items       the owner's review page lists them (GitHub sign-in, reviewers only)
//   POST /v1/review/items/:id   ... and marks one useful, skip or back to new
import { HttpError, json, readJson } from './http.js';
import { sessionFrom } from './session.js';

// GitHub numeric ids (they survive a username change). REVIEWER_GITHUB_IDS="1,2" replaces the default.
const OWNER_GITHUB_ID = 2228984; // nahuelsantos
const reviewers = (env) => (env.REVIEWER_GITHUB_IDS ? String(env.REVIEWER_GITHUB_IDS).split(',').map((s) => Number(s.trim())) : [OWNER_GITHUB_ID]);

const enc = new TextEncoder();
/** Constant-time comparison of two strings (via their SHA-256, so lengths do not leak either). */
async function same(a, b) {
  const [x, y] = await Promise.all([a, b].map((s) => crypto.subtle.digest('SHA-256', enc.encode(s))));
  const u = new Uint8Array(x), v = new Uint8Array(y);
  let diff = 0;
  for (let i = 0; i < u.length; i++) diff |= u[i] ^ v[i];
  return diff === 0;
}

const MAX_ITEMS = 50;
const str = (v, max) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null);
const iso = (v) => (typeof v === 'string' && !Number.isNaN(Date.parse(v)) ? new Date(v).toISOString() : null);

export async function handleCollect(request, env) {
  const m = (request.headers.get('authorization') ?? '').match(/^Bearer (\S+)$/);
  if (!m || !(await same(m[1], env.COLLECTOR_TOKEN))) throw new HttpError(401, 'bad_token', 'The collector token is missing or wrong.');
  const body = await readJson(request, 400000);
  const items = Array.isArray(body.items) ? body.items : null;
  if (!items || items.length > MAX_ITEMS) throw new HttpError(400, 'bad_items', `Send { items: [...] } with at most ${MAX_ITEMS} items.`);
  const now = new Date().toISOString();
  const rows = [];
  for (const it of items) {
    const url = str(it?.url, 2000), title = str(it?.title, 300), source = str(it?.source, 64);
    if (!url || !/^https?:\/\//.test(url) || !title || !source || !/^[a-z]{2}-[a-z0-9-]+$/.test(source)) throw new HttpError(400, 'bad_item', 'Every item needs source, an http(s) url and a title.');
    rows.push([source, url, title, str(it.text, 4000), str(it.lang, 2), str(it.country, 2), iso(it.publishedAt), now, Number.isFinite(it.score) ? Math.round(it.score) : 0]);
  }
  if (!rows.length) return json({ added: 0, known: 0 });
  const stmt = env.DB.prepare(`INSERT INTO source_items (source, url, title, text, lang, country, published_at, collected_at, score)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (url) DO NOTHING`);
  const results = await env.DB.batch(rows.map((r) => stmt.bind(...r)));
  const added = results.reduce((n, r) => n + (r.meta?.changes ?? 0), 0);
  return json({ added, known: rows.length - added });
}

async function reviewer(request, env) {
  const user = await sessionFrom(request, env);
  if (!user) throw new HttpError(401, 'not_signed_in', 'Sign in with GitHub first.');
  if (!reviewers(env).includes(Number(user.githubId))) throw new HttpError(403, 'not_a_reviewer', 'This page is only for scamdb reviewers.');
  return user;
}
const STATUSES = ['new', 'useful', 'skip'];

export async function handleReview(request, env) {
  const user = await reviewer(request, env);
  const url = new URL(request.url);
  if (request.method === 'GET') {
    const status = STATUSES.includes(url.searchParams.get('status')) ? url.searchParams.get('status') : 'new';
    const limit = Math.min(Math.max(Number(url.searchParams.get('limit')) || 20, 1), 100);
    const before = Number(url.searchParams.get('before')) || null; // id cursor for older pages
    const order = status === 'new' ? 'score DESC, id DESC' : 'reviewed_at DESC, id DESC';
    const { results } = await env.DB.prepare(`SELECT id, source, url, title, text, lang, country, published_at, collected_at, score, status, note, reviewed_at
      FROM source_items WHERE status = ?${before ? ' AND id < ?' : ''} ORDER BY ${order} LIMIT ?`).bind(...[status, ...(before ? [before] : []), limit]).all();
    const counts = Object.fromEntries(STATUSES.map((s) => [s, 0]));
    for (const r of (await env.DB.prepare('SELECT status, count(*) AS n FROM source_items GROUP BY status').all()).results) counts[r.status] = r.n;
    return json({ login: user.login, status, counts, items: results }, 200, { 'cache-control': 'no-store' });
  }
  // POST /v1/review/items/:id: changes need the same CSRF header as the account page.
  if (request.headers.get('x-requested-with') !== 'scamdb') throw new HttpError(403, 'csrf', 'Missing X-Requested-With: scamdb.');
  const id = Number(url.pathname.split('/').pop());
  const body = await readJson(request, 4000);
  if (!STATUSES.includes(body.status)) throw new HttpError(400, 'bad_status', `status must be one of ${STATUSES.join(', ')}.`);
  const note = str(body.note, 1000);
  const r = await env.DB.prepare('UPDATE source_items SET status = ?, note = coalesce(?, note), reviewed_at = ? WHERE id = ?')
    .bind(body.status, note, body.status === 'new' ? null : new Date().toISOString(), id).run();
  if (!r.meta.changes) throw new HttpError(404, 'not_found', 'No such item.');
  return json({ id, status: body.status });
}
