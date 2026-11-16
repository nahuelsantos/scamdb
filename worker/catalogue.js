// The catalogue, read from the Worker's own static assets (built from data/ on every deploy). No storage involved:
// cached per isolate and refreshed when /v1/index.json's dataset version changes (checked at most once a minute).
const ORIGIN = 'https://scamdb.dev';
const RECHECK_MS = 60_000;
let cache = null; // { version, signals, entries, countries, checkedAt, full: Map }

async function asset(env, path) {
  const r = await env.ASSETS.fetch(new Request(ORIGIN + path));
  if (!r.ok) throw new Error(`asset ${path}: ${r.status}`);
  return r.json();
}

/** { version, signals: Map<id, {label}>, entries, countries: Set<code> } */
export async function loadCatalogue(env, now = Date.now()) {
  if (cache && now - cache.checkedAt < RECHECK_MS) return cache;
  const { version } = await asset(env, '/v1/index.json');
  if (cache && cache.version === version) { cache.checkedAt = now; return cache; }
  const data = await asset(env, '/assets/entries.json');
  cache = {
    version,
    signals: new Map(data.signals.map((s) => [s.id, s])),
    entries: data.entries,
    countries: new Set(data.entries.map((e) => e.country)),
    checkedAt: now,
    full: new Map(),
  };
  return cache;
}

/** The full entry (whatToDo and the rest) from /v1/scams/<id>.json, or null. */
export async function loadEntry(env, id) {
  const cat = await loadCatalogue(env);
  if (cat.full.has(id)) return cat.full.get(id);
  let entry = null;
  try { entry = (await asset(env, `/v1/scams/${id}.json`)).data ?? null; } catch { entry = null; }
  cat.full.set(id, entry);
  return entry;
}
