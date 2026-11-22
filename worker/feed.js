// The organisation feed: aggregated scam trends and brand alerts from private reports. Never raw reports.
// Access: keys the owner approved (keys.feed = 1, tools/orgs.mjs). Counts under K_MIN are withheld, and example texts
// (already redacted at storage) are shown only for scams with K_MIN or more look-alike reports in the window, so no
// single person's report can be picked out.
import { json, HttpError } from './http.js';
import { hit, burst, BURST, secondsToUtcMidnight } from './limits.js';
import { COUNTRIES } from './reports.js';
import { loadBrands } from './catalogue.js';

export const K_MIN = 3;
export const FEED_DAILY = 500;
const DAY = 86400000;

/** Monday (UTC) of the week `iso` falls in, as YYYY-MM-DD. */
export function weekOf(iso) {
  const d = new Date(iso);
  const back = (d.getUTCDay() + 6) % 7;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - back)).toISOString().slice(0, 10);
}

/** Counts per key in `rows` ({ week, key }), with buckets under K_MIN dropped and counted as withheld. */
export function bucket(rows) {
  const out = {};
  for (const { week, key } of rows) {
    if (!key) continue;
    ((out[week] ??= {})[key] ??= 0);
    out[week][key]++;
  }
  let withheld = 0;
  for (const w of Object.values(out)) for (const [k, n] of Object.entries(w)) if (n < K_MIN) { withheld += n; delete w[k]; }
  return { weeks: out, withheld };
}

/** Keys whose count in the latest complete week is at least K_MIN and at least twice their average over the 4 weeks before. */
export function rising(weeks, latest) {
  const prev = Object.keys(weeks).filter((w) => w < latest).sort().slice(-4);
  return Object.entries(weeks[latest] ?? {}).filter(([k, n]) => {
    const avg = prev.reduce((s, w) => s + (weeks[w]?.[k] ?? 0), 0) / 4;
    return n >= K_MIN && n >= 2 * Math.max(avg, 0.5);
  }).map(([k, n]) => ({ id: k, count: n })).sort((a, b) => b.count - a.count);
}

function params(url) {
  const country = url.searchParams.get('country');
  if (!COUNTRIES.includes(country)) throw new HttpError(400, 'invalid_feed', `country: one of ${COUNTRIES.join(', ')}`);
  const weeks = Number(url.searchParams.get('weeks') ?? 8);
  if (!Number.isInteger(weeks) || weeks < 1 || weeks > 26) throw new HttpError(400, 'invalid_feed', 'weeks: a whole number from 1 to 26');
  return { country, weeks };
}

/** The key's row if it may read the feed; throws 401/403 otherwise, and counts the daily limit. */
async function feedKey(request, env, authKey) {
  const key = await authKey(request, env);
  if (!key) throw new HttpError(401, 'key_required', 'The feed needs an approved organisation key (scamdb.dev/feed/).');
  const row = await env.DB.prepare('SELECT feed, org FROM keys WHERE id = ?').bind(key.id).first();
  if (!row?.feed) throw new HttpError(403, 'feed_not_enabled', 'This key is not approved for the feed. See scamdb.dev/feed/ to ask for access.');
  const now = new Date();
  const maxBurst = Number(env.BURST_FEED) || BURST.feed; // a setting can raise it (the tests do)
  const b = await burst(env.DB, `feed:${key.id}`, maxBurst, now);
  if (!b.ok) throw new HttpError(429, 'too_fast', `Too many feed requests in one minute (limit ${maxBurst}). Wait a moment and try again.`, { 'retry-after': String(b.retryAfter) });
  if (!(await hit(env.DB, `feed:${key.id}`, FEED_DAILY, now)).ok)
    throw new HttpError(429, 'too_many_requests', `Daily feed limit reached (${FEED_DAILY}).`, { 'retry-after': String(secondsToUtcMidnight(now)) });
  return { ...key, org: row.org };
}

async function reportsSince(env, country, weeks, now = new Date()) {
  const since = new Date(now.getTime() - weeks * 7 * DAY).toISOString();
  const { results } = await env.DB.prepare("SELECT created_at, channel, scam_id, brands, text FROM reports WHERE country = ? AND created_at >= ? AND status != 'rejected'")
    .bind(country, since).all();
  return results.map((r) => ({ ...r, week: weekOf(r.created_at) }));
}

/** GET /v1/feed/trends?country=&weeks= */
export async function feedTrends(request, env, authKey) {
  const key = await feedKey(request, env, authKey);
  const { country, weeks } = params(new URL(request.url));
  const now = new Date();
  const rows = await reportsSince(env, country, weeks, now);
  const scams = bucket(rows.map((r) => ({ week: r.week, key: r.scam_id ?? 'unmatched' })));
  const channels = bucket(rows.map((r) => ({ week: r.week, key: r.channel ?? 'unknown' })));
  const latest = weekOf(new Date(now.getTime() - 7 * DAY).toISOString()); // the last complete week
  return json({
    country, weeks, org: key.org, kMin: K_MIN, generatedAt: now.toISOString(),
    totals: Object.fromEntries(Object.entries(rows.reduce((t, r) => ({ ...t, [r.week]: (t[r.week] ?? 0) + 1 }), {})).map(([w, n]) => [w, n < K_MIN ? null : n])),
    scams: scams.weeks, channels: channels.weeks, withheld: scams.withheld,
    rising: rising(scams.weeks, latest).filter((x) => x.id !== 'unmatched'),
  }, 200, { 'cache-control': 'private, max-age=300' });
}

/** GET /v1/feed/brands?brand=&country=&weeks= */
export async function feedBrands(request, env, authKey) {
  const key = await feedKey(request, env, authKey);
  const url = new URL(request.url);
  const { country, weeks } = params(url);
  const brand = url.searchParams.get('brand');
  const known = (await loadBrands(env)).find((b) => b.id === brand && b.countries.includes(country));
  if (!known) throw new HttpError(400, 'invalid_feed', `brand: a brand id for ${country} from /v1/brands.json`);
  const rows = (await reportsSince(env, country, weeks)).filter((r) => (r.brands ?? '').split(',').includes(brand));
  const counts = bucket(rows.map((r) => ({ week: r.week, key: brand })));
  // Examples: only from scams with K_MIN+ look-alike reports in the window; texts were redacted when stored.
  const byScam = Object.groupBy ? Object.groupBy(rows, (r) => r.scam_id ?? '') : rows.reduce((g, r) => ((g[r.scam_id ?? ''] ??= []).push(r), g), {});
  const examples = Object.entries(byScam).filter(([id, rs]) => id && rs.length >= K_MIN)
    .flatMap(([id, rs]) => rs.filter((r) => r.text).slice(-2).map((r) => ({ scam: id, channel: r.channel, week: r.week, text: r.text.slice(0, 280) })))
    .slice(0, 5);
  return json({
    brand: { id: known.id, name: known.name }, country, weeks, org: key.org, kMin: K_MIN, generatedAt: new Date().toISOString(),
    counts: Object.fromEntries(Object.entries(counts.weeks).map(([w, c]) => [w, c[brand]])), withheld: counts.withheld,
    scams: Object.entries(byScam).filter(([id, rs]) => id && rs.length >= K_MIN).map(([id, rs]) => ({ id, count: rs.length })).sort((a, b) => b.count - a.count),
    examples,
  }, 200, { 'cache-control': 'private, max-age=300' });
}

export const K_PUBLIC = 5;
/** GET /v1/trends?country=: the public view. Keyless, cached for an hour, scam counts only (no examples, no brands), and
 * counts under K_PUBLIC withheld. Built from the same private reports as the organisation feed. */
export async function publicTrends(request, env, ctx) {
  const url = new URL(request.url);
  const country = url.searchParams.get('country');
  if (!COUNTRIES.includes(country)) throw new HttpError(400, 'invalid_trends', `country: one of ${COUNTRIES.join(', ')}`);
  const cacheKey = new Request(`https://scamdb.dev/v1/trends?country=${country}`);
  const cache = globalThis.caches?.default;
  const hit = cache ? await cache.match(cacheKey) : null;
  if (hit) return hit;
  const weeks = 12, now = new Date();
  const rows = await reportsSince(env, country, weeks, now);
  const counts = {};
  for (const r of rows) { if (!r.scam_id) continue; ((counts[r.week] ??= {})[r.scam_id] ??= 0); counts[r.week][r.scam_id]++; }
  let withheld = 0;
  for (const w of Object.values(counts)) for (const [k, n] of Object.entries(w)) if (n < K_PUBLIC) { withheld += n; delete w[k]; }
  const totals = {};
  for (const [w, c] of Object.entries(counts)) { const n = Object.values(c).reduce((a, b) => a + b, 0); if (n) totals[w] = n; }
  const res = json({ country, weeks, kMin: K_PUBLIC, generatedAt: now.toISOString(), reports: rows.length >= K_PUBLIC ? rows.length : null, scams: counts, totals, withheld },
    200, { 'cache-control': 'public, max-age=3600', 'access-control-allow-origin': '*' });
  if (cache) ctx?.waitUntil?.(cache.put(cacheKey, res.clone()));
  return res;
}
