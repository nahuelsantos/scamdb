#!/usr/bin/env node
// Measures each light pattern (packages/matcher/signs.js, docs/light-patterns.md) on the labelled sets: how many genuine
// messages it helps (their verdict is lower with it than without it) and whether it ever weakens a scam (a scam's verdict
// is lower with it). A pattern earns its place by helping genuine messages and never weakening a scam.
//
//   node tools/light-patterns.mjs                     real and written sets
//   node tools/light-patterns.mjs --private           also the encrypted private set (needs EVAL_PRIVATE_KEY; don't commit)
//   node tools/light-patterns.mjs --file reports.json also a local JSON list of { text, country, label: scam|safe }
//                                                     (e.g. the owner's reports; never commit it)
//   node tools/light-patterns.mjs --json              machine-readable output (used by the tests)
import { readFileSync } from 'node:fs';
import { loadRepo } from '../lib/load.js';
import { loadMessages, loadRealMessages } from '../lib/eval.js';
import { loadPrivateMessages } from '../lib/private-eval.js';
import { matchMessage, countryLangs, LIGHT_PATTERNS, LIGHT_OFF, lightPatternsIn } from '../packages/matcher/index.js';

const RANK = { not_recognised: 0, suspicious: 1, scam: 2 };

/** For each pattern: { id, helped: [genuine messages it lowers], weakened: [scam messages it lowers] } on one set. */
export function measure(messages, entries) {
  const verdict = (m) => RANK[matchMessage(m.text, entries, { country: m.country }).verdict];
  // Only messages where a pattern calmed a sign can change when it is switched off.
  const applied = messages.map((m) => lightPatternsIn(m.text, countryLangs(entries, m.country)));
  const on = messages.map((m, i) => (applied[i].length ? verdict(m) : null));
  return LIGHT_PATTERNS.map(({ id }) => {
    LIGHT_OFF.add(id);
    try {
      const helped = [], weakened = [];
      messages.forEach((m, i) => {
        if (!applied[i].includes(id) || on[i] >= verdict(m)) return;
        (m.label === 'scam' ? weakened : helped).push(m);
      });
      return { id, helped, weakened };
    } finally { LIGHT_OFF.delete(id); }
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const root = new URL('..', import.meta.url).pathname;
  const entries = loadRepo(root).entries;
  const sets = { real: loadRealMessages(root), written: loadMessages(root) };
  if (args.includes('--private')) sets.private = loadPrivateMessages(root) ?? [];
  if (args.includes('--file')) sets.file = JSON.parse(readFileSync(args[args.indexOf('--file') + 1], 'utf8'));
  const results = Object.fromEntries(Object.entries(sets).map(([name, msgs]) => [name, measure(msgs, entries)]));
  if (args.includes('--json')) {
    console.log(JSON.stringify(Object.fromEntries(Object.entries(results).map(([n, r]) => [n, r.map((x) => ({ id: x.id, helped: x.helped.length, weakened: x.weakened.length }))]))));
  } else {
    const names = Object.keys(sets);
    console.log(`| pattern | calms | ${names.map((n) => `${n}: genuine helped / scams weakened`).join(' | ')} |`);
    console.log(`|---|---|${names.map(() => '---').join('|')}|`);
    LIGHT_PATTERNS.forEach((p, i) => console.log(`| \`${p.id}\` | ${p.calms} | ${names.map((n) => `${results[n][i].helped.length} / ${results[n][i].weakened.length}`).join(' | ')} |`));
    for (const n of names) for (const r of results[n]) for (const m of r.weakened) console.log(`\nWEAKENS A SCAM (${n}, ${r.id}): ${m.text.slice(0, 120).replace(/\n/g, ' ')}`);
  }
}
