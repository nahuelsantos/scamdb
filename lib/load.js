// Reads the data folder. readRepoFiles keeps parse errors; loadRepo returns clean objects.
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

function read(root, path) {
  try { return { path, json: JSON.parse(readFileSync(join(root, path), 'utf8')) }; }
  catch (e) { return { path, error: e.message }; }
}

/** Every data file as { path, json } or { path, error }. */
export function readRepoFiles(root) {
  const files = { countries: read(root, 'data/countries.json'), signals: read(root, 'data/signals.json'), contacts: [], entries: [] };
  const dataDir = join(root, 'data');
  for (const cc of existsSync(dataDir) ? readdirSync(dataDir).sort() : []) {
    if (!statSync(join(dataDir, cc)).isDirectory()) continue;
    if (existsSync(join(dataDir, cc, 'contacts.json'))) files.contacts.push({ country: cc, ...read(root, `data/${cc}/contacts.json`) });
    const scamsDir = join(dataDir, cc, 'scams');
    for (const f of existsSync(scamsDir) ? readdirSync(scamsDir).filter((f) => f.endsWith('.json')).sort() : [])
      files.entries.push({ country: cc, file: f, ...read(root, `data/${cc}/scams/${f}`) });
  }
  return files;
}

/** { countries, signals, contacts: Map<cc, Contact[]>, entries } — entries sorted by id, each with a hidden _path. */
export function loadRepo(root) {
  const f = readRepoFiles(root);
  const bad = [f.countries, f.signals, ...f.contacts, ...f.entries].find((x) => x.error);
  if (bad) throw new Error(`${bad.path}: ${bad.error}`);
  const entries = f.entries.map((e) => Object.defineProperty(e.json, '_path', { value: e.path, enumerable: false }))
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return {
    countries: f.countries.json.countries,
    signals: f.signals.json.signals,
    contacts: new Map(f.contacts.map((c) => [c.country, c.json.contacts])),
    entries,
  };
}
