#!/usr/bin/env node
// Fits the score-fusion weights on the labelled set, from AI answers saved by `node tools/eval.mjs --ai --cache <file>`.
//
//   node tools/fit-fusion.mjs <cache.json>          leave-one-country-out results, then the weights fitted on everything
//   node tools/fit-fusion.mjs <cache.json> --write  also write worker/fusion-weights.js
//
// Each country is scored by weights fitted on the other eight, so the numbers show how the formula does on
// messages it never saw.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { loadRepo } from '../lib/load.js';
import { loadMessages } from '../lib/eval.js';
import { features, fit, probability, FEATURES } from '../lib/fusion.js';
import { matchMessage } from '../packages/matcher/index.js';
import { THRESHOLDS } from '../worker/fusion-weights.js';

const root = new URL('..', import.meta.url).pathname;
const args = process.argv.slice(2);
const chatModel = args.includes('--chat-model') ? args[args.indexOf('--chat-model') + 1] : '';
const [cachePath] = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--chat-model');
if (!cachePath) { console.error('Usage: node tools/fit-fusion.mjs <cache.json> [--write]'); process.exit(1); }
const cache = JSON.parse(readFileSync(cachePath, 'utf8'));
const repo = loadRepo(root);
const rows = loadMessages(root).flatMap((m) => {
  const scorer = cache[`${chatModel}${m.id}:${createHash('sha256').update(m.text).digest('hex').slice(0, 12)}`];
  if (!scorer) return [];
  return [{ m, x: features(matchMessage(m.text, repo.entries, { country: m.country }), scorer), y: m.label === 'scam' ? 1 : 0 }];
});
console.log(`${rows.length} messages with an AI answer.\n`);

// Leave one country out.
const held = [];
for (const cc of [...new Set(rows.map((r) => r.m.country))]) {
  const w = fit(rows.filter((r) => r.m.country !== cc));
  for (const r of rows.filter((r) => r.m.country === cc)) held.push({ ...r, p: probability(w, r.x) });
}
const verdict = (p) => (p >= THRESHOLDS.scam ? 'scam' : p >= THRESHOLDS.suspicious ? 'suspicious' : 'not_recognised');
const count = (f) => held.filter(f).length;
const scams = count((r) => r.y), safe = count((r) => !r.y);
console.log(`Held-out (thresholds scam >= ${THRESHOLDS.scam}, suspicious >= ${THRESHOLDS.suspicious}):`);
console.log(`  scams caught      ${count((r) => r.y && verdict(r.p) !== 'not_recognised')}/${scams}`);
console.log(`  scams called scam ${count((r) => r.y && verdict(r.p) === 'scam')}/${scams}`);
console.log(`  safe called scam  ${count((r) => !r.y && verdict(r.p) === 'scam')}/${safe}`);
console.log(`  safe flagged      ${count((r) => !r.y && verdict(r.p) !== 'not_recognised')}/${safe}`);
console.log('  hardest:', held.filter((r) => (r.y ? r.p < THRESHOLDS.suspicious : r.p >= THRESHOLDS.suspicious)).map((r) => `${r.m.id} ${r.p.toFixed(2)}`).join(', ') || 'none');

const weights = fit(rows);
console.log(`\nWeights on all ${rows.length}:`, Object.fromEntries(FEATURES.map((f, i) => [f, weights[i]])));
if (process.argv.includes('--write')) {
  writeFileSync(new URL('../worker/fusion-weights.js', import.meta.url), `// Fitted by tools/fit-fusion.mjs on ${rows.length} labelled messages (eval/). Order: ${FEATURES.join(', ')}.
// Re-fit after the labelled set or the engines change; the CI floors in tests/unit/eval.test.mjs still apply.
export const WEIGHTS = ${JSON.stringify(weights)};
// Verdict cut-offs on the fused probability.
export const THRESHOLDS = ${JSON.stringify(THRESHOLDS)};
`);
  console.log('Wrote worker/fusion-weights.js');
}
