// A fast local copy of the database's counters, in the Cache API of the Cloudflare location that answers.
//
// The database is far from most callers (one round trip is 0.1-0.2 s), so checks read their limits from this copy,
// add themselves to it at once, answer, and only then write to the database; the database's exact counts then
// replace the copy. The database stays the record: the copy can only be behind it (a new location, or an entry the
// cache dropped) and then reads 0, so a limit can let one or a few extra requests through but never refuses one the
// database would allow. Nothing personal is stored: names are the same salted subjects the database uses.
const PREFIX = '/__mirror/';
const url = (origin, name) => `${origin}${PREFIX}${encodeURIComponent(name)}`;
const cache = () => (typeof caches !== 'undefined' ? caches.default : null);

/** The stored value (a count or a list), or the fallback when the copy has none. */
export async function readMirror(origin, name, fallback) {
  const c = cache();
  if (!c) return fallback;
  try {
    const hit = await c.match(new Request(url(origin, name)));
    return hit ? await hit.json() : fallback;
  } catch { return fallback; }
}

/** Stores a value for `ttl` seconds. Best effort: a failed write only means the next read falls back. */
export async function writeMirror(origin, name, value, ttl) {
  const c = cache();
  if (!c) return;
  try {
    await c.put(new Request(url(origin, name)), new Response(JSON.stringify(value), { headers: { 'content-type': 'application/json', 'cache-control': `max-age=${Math.max(1, Math.round(ttl))}` } }));
  } catch { /* the copy is a speed-up only */ }
}

export async function dropMirror(origin, name) {
  const c = cache();
  if (!c) return;
  try { await c.delete(new Request(url(origin, name))); } catch { /* best effort */ }
}
