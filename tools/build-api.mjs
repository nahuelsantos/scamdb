// Writes the static API (dist/v1/...) from the loaded repo. Every JSON file is wrapped in the license envelope.
import { mkdirSync, writeFileSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { execFileSync } from 'node:child_process';
import { makeZip } from '../lib/zip.js';

export const LICENSE = 'CC BY 4.0';
export const ATTRIBUTION = 'scamdb.dev · CC BY 4.0';

const today = () => new Date().toISOString().slice(0, 10);
function git(root, args) {
  return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
}

/** { version: 'YYYY-MM-DD.<sha7>' (or '<today>.local' without git), builtAt } */
export function datasetMeta(root) {
  let version;
  try { version = git(root, ['log', '-1', '--format=%cs.%h']) || `${today()}.local`; } catch { version = `${today()}.local`; }
  return { version, builtAt: new Date().toISOString() };
}

/** Newest-first additions and edits of entries, from git; falls back to each entry's `updated` date. */
export function changesFromGit(root, entries) {
  const ids = new Set(entries.map((e) => e.id));
  const rows = [];
  try {
    // A shallow clone shows its oldest commit as adding every file: its history can't be trusted.
    if (git(root, ['rev-parse', '--is-shallow-repository']) === 'true') throw new Error('shallow');
    const log = git(root, ['log', '--name-status', '--format=@@%cs', '--', 'data/']);
    let date = '';
    const seen = new Set();
    for (const line of log.split('\n')) {
      if (line.startsWith('@@')) { date = line.slice(2); continue; }
      const m = line.match(/^([AM])\S*\s+.*data\/([a-z]{2})\/scams\/([^/]+)\.json$/);
      if (!m) continue;
      const id = `${m[2]}/${m[3]}`;
      if (seen.has(id) || !ids.has(id)) continue;
      seen.add(id);
      rows.push({ id, change: m[1] === 'A' ? 'added' : 'edited', date });
    }
  } catch { /* no git: fall back below */ }
  if (!rows.length) return entries.map((e) => ({ id: e.id, change: 'edited', date: e.updated }))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.id < b.id ? -1 : 1)).slice(0, 100);
  return rows.slice(0, 100);
}

function filesUnder(dir, base) {
  return readdirSync(dir).sort().flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? filesUnder(p, base) : [relative(base, p)];
  });
}

/** Writes every static endpoint under outDir and returns the written paths (relative to outDir). */
export function buildApi(repo, outDir, meta, root) {
  const written = [];
  const put = (path, data) => {
    const full = join(outDir, path);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, JSON.stringify({ license: LICENSE, attribution: ATTRIBUTION, version: meta.version, data }, null, 1) + '\n');
    written.push(path);
  };
  const byCountry = new Map(repo.countries.map((c) => [c.code, []]));
  for (const e of repo.entries) byCountry.get(e.country)?.push(e);

  put('v1/index.json', {
    countries: repo.countries.map((c) => ({ code: c.code, scams: byCountry.get(c.code).length })),
    total: repo.entries.length, builtAt: meta.builtAt, docs: 'https://scamdb.dev/docs/',
  });
  put('v1/countries.json', repo.countries);
  put('v1/signals.json', repo.signals);
  for (const c of repo.countries) {
    put(`v1/${c.code}/scams.json`, byCountry.get(c.code));
    put(`v1/${c.code}/contacts.json`, repo.contacts.get(c.code) ?? []);
  }
  for (const e of repo.entries) put(`v1/scams/${e.id}.json`, e);
  put('v1/scams.json', repo.entries);
  put('v1/changes.json', changesFromGit(root, repo.entries));

  const zipFiles = [...filesUnder(join(root, 'data'), root), 'LICENSE-DATA']
    .map((name) => { try { return { name, data: readFileSync(join(root, name)) }; } catch { return null; } }).filter(Boolean);
  mkdirSync(join(outDir, 'v1'), { recursive: true });
  writeFileSync(join(outDir, 'v1/scamdb.zip'), makeZip(zipFiles));
  written.push('v1/scamdb.zip');
  return written;
}
