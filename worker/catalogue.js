// The catalogue, read from the Worker's own static assets (built from data/ on every deploy). Assets and code deploy
// together, so it is loaded once per isolate. Failed loads are not cached, so a passing hiccup doesn't stick.
const ORIGIN = 'https://scamdb.dev';
let cache = null; // { version, signals, entries, countries, full: Map }

async function asset(env, path) {
  const r = await env.ASSETS.fetch(new Request(ORIGIN + path));
  if (!r.ok) throw new Error(`asset ${path}: ${r.status}`);
  return r.json();
}

/** { version, signals: Map<id, {label}>, entries, countries: Set<code> } */
export async function loadCatalogue(env) {
  if (cache) return cache;
  const [{ version }, data] = await Promise.all([asset(env, '/v1/index.json'), asset(env, '/assets/entries.json')]);
  cache = {
    version,
    signals: new Map(data.signals.map((s) => [s.id, s])),
    entries: data.entries,
    countries: new Set(data.entries.map((e) => e.country)),
    full: new Map(),
  };
  return cache;
}

/** The full entry (whatToDo and the rest) from /v1/scams/<id>.json, or null (not cached when the fetch fails). */
export async function loadEntry(env, id) {
  const cat = await loadCatalogue(env);
  if (cat.full.has(id)) return cat.full.get(id);
  try {
    const entry = (await asset(env, `/v1/scams/${id}.json`)).data ?? null;
    cat.full.set(id, entry);
    return entry;
  } catch {
    return null;
  }
}
