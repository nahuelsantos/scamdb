#!/usr/bin/env node
// Which entries are going stale. The validator checks an entry's status against its own `updated` date, so an entry
// marked "active" stays valid forever even when its newest source is years old by now. This compares against today:
//
//   node tools/freshness.mjs               Markdown report (statuses due to change, entries due for a re-check)
//   node tools/freshness.mjs --json        the same as JSON
//   node tools/freshness.mjs --today 2027-06-01   pretend it is another day (tests, planning)
//   node tools/freshness.mjs --fix         apply the status changes (active -> fading, fading -> archived) and set
//                                          `updated` to today on those entries; review the diff before committing
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { loadRepo } from '../lib/load.js';

const YEAR = 365.25 * 864e5;

/** Status changes due today, and the entries whose newest source is oldest (to re-research first). */
export function freshness(entries, today, { recheck = 20 } = {}) {
  const now = Date.parse(today);
  const rows = entries.map((e) => {
    const newest = (e.sources ?? []).map((s) => s.date).filter(Boolean).sort().at(-1) ?? null;
    const age = newest ? (now - Date.parse(newest)) / YEAR : Infinity;
    const due = e.status !== 'archived' && age > 5 ? 'archived' : e.status === 'active' && age > 2 ? 'fading' : null;
    return { id: e.id, path: e._path, status: e.status, newest, age: Math.round(age * 10) / 10, due };
  });
  const changes = rows.filter((r) => r.due);
  const oldest = rows.filter((r) => r.status !== 'archived' && !r.due).sort((a, b) => b.age - a.age).slice(0, recheck);
  // Within the next 90 days: lets the importer refresh an entry before it fades.
  const soon = rows.filter((r) => !r.due && r.status === 'active' && r.age > 2 - 0.25);
  return { today, total: rows.length, changes, soon, oldest };
}

export function toMarkdown(r) {
  const line = (x) => `- \`${x.id}\`: ${x.status}${x.due ? ` → **${x.due}**` : ''}, newest source ${x.newest ?? 'none'} (${x.age} years)`;
  return [
    `# Freshness ${r.today}`,
    '',
    `${r.total} entries. ${r.changes.length} status change${r.changes.length === 1 ? '' : 's'} due, ${r.soon.length} active entr${r.soon.length === 1 ? 'y fades' : 'ies fade'} within 90 days.`,
    '',
    '## Status changes due',
    '',
    r.changes.length ? r.changes.map(line).join('\n') : 'None.',
    '',
    'Find a newer source (the import skill\'s local-evidence rule applies) or run `node tools/freshness.mjs --fix`.',
    '',
    '## Active entries that fade within 90 days',
    '',
    r.soon.length ? r.soon.map(line).join('\n') : 'None.',
    '',
    '## Oldest sources (re-check these first)',
    '',
    r.oldest.map(line).join('\n'),
    '',
  ].join('\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const value = (n) => (args.includes(n) ? args[args.indexOf(n) + 1] : null);
  const root = resolve('.');
  const today = value('--today') ?? new Date().toISOString().slice(0, 10);
  const repo = loadRepo(root);
  const r = freshness(repo.entries, today);
  if (args.includes('--fix')) {
    for (const c of r.changes) {
      const file = join(root, c.path);
      const s = readFileSync(file, 'utf8');
      const out = s.replace(`"status": "${c.status}"`, `"status": "${c.due}"`).replace(/"updated": "\d{4}-\d{2}-\d{2}"/, `"updated": "${today}"`);
      writeFileSync(file, out);
    }
    console.log(`${r.changes.length} entr${r.changes.length === 1 ? 'y' : 'ies'} updated; run npm run validate and review the diff.`);
  } else console.log(args.includes('--json') ? JSON.stringify(r, null, 2) : toMarkdown(r));
}
