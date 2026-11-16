// Deterministic helpers for the import-scams skill: which country to import next, duplicates, rejections.
// Usage: node tools/importer.mjs next [--pending au,us]   prints the country code to import (reads importer/runs.json)
//        node tools/importer.mjs status                    prints entries and newest date per country
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadRepo } from '../lib/load.js';
import { normalize } from '../lib/text.js';

/** Countries the importer covers, in the order it starts them. */
export const TARGETS = ['au', 'nz', 'us', 'gb', 'ca', 'es', 'mx', 'br'];

/** Newest `updated` date per country code ('' when it has no entries). */
function newest(repo) {
  const out = new Map();
  for (const e of repo.entries) if ((out.get(e.country) ?? '') < e.updated) out.set(e.country, e.updated);
  return out;
}

/**
 * The next country to import. A country's date is the later of its newest entry and its last import try
 * (`tried`, from importer/runs.json), so a country whose run found nothing or was rejected waits its turn.
 * Never-tried targets with no entries come first (in TARGETS order); then the oldest date wins. Countries in
 * `pending` (an open import pull request) are skipped.
 */
export function pickNext(repo, { pending = [], tried = {} } = {}) {
  const skip = new Set(pending);
  const dates = newest(repo);
  const fresh = TARGETS.find((cc) => !dates.has(cc) && !tried[cc] && !skip.has(cc));
  if (fresh) return fresh;
  const others = repo.countries.map((c) => c.code).filter((cc) => !TARGETS.includes(cc));
  const pool = [...TARGETS, ...others].filter((cc) => (dates.has(cc) || tried[cc]) && !skip.has(cc));
  if (!pool.length) throw new Error('nothing to import');
  const when = (cc) => [dates.get(cc) ?? '', tried[cc] ?? ''].sort().at(-1);
  return pool.reduce((best, cc) => (when(cc) < when(best) ? cc : best));
}

const names = (x) => Object.values(x?.name ?? {}).map(normalize).filter(Boolean);
const phrases = (x) => new Set(Object.values(x?.phrases ?? {}).flat().map(normalize).filter(Boolean));

/** The id of an existing entry in the candidate's country with the same name (any language) or 3+ shared phrases. */
export function isDuplicate(candidate, entries) {
  const cn = new Set(names(candidate));
  const cp = phrases(candidate);
  for (const e of entries) {
    if (e.country !== candidate.country) continue;
    if (names(e).some((n) => cn.has(n))) return e.id;
    let shared = 0;
    for (const p of phrases(e)) if (cp.has(p) && ++shared >= 3) return e.id;
  }
  return null;
}

/** True when importer/rejected.json has this scam (same country, and the same slug or name). */
export function isRejected(candidate, rejected) {
  const name = normalize(candidate.name);
  return rejected.some((r) => r.country === candidate.country && (r.slug === candidate.slug || (name && normalize(r.name) === name)));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const root = resolve(new URL('..', import.meta.url).pathname);
  const repo = loadRepo(root);
  const [cmd, ...rest] = process.argv.slice(2);
  if (cmd === 'next') {
    const arg = rest.join('=').match(/^--pending=?(.*)$/)?.[1] ?? '';
    const pending = arg.split(',').map((s) => s.trim()).filter(Boolean);
    const tried = JSON.parse(readFileSync(resolve(root, 'importer/runs.json'), 'utf8'));
    try { console.log(pickNext(repo, { pending, tried })); } catch (e) { console.error(e.message); process.exit(1); }
  } else if (cmd === 'status') {
    const dates = newest(repo);
    const codes = [...new Set([...TARGETS, ...repo.countries.map((c) => c.code)])];
    for (const cc of codes) console.log(`${cc}  ${String(repo.entries.filter((e) => e.country === cc).length).padStart(3)} entries  newest ${dates.get(cc) ?? '-'}`);
  } else {
    console.error('usage: node tools/importer.mjs next [--pending au,us] | status');
    process.exit(1);
  }
}
