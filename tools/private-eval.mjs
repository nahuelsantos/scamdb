#!/usr/bin/env node
// The encrypted private labelled set (see lib/private-eval.js).
//
//   node tools/private-eval.mjs keygen    print a new key (keep it; put it in the EVAL_PRIVATE_KEY GitHub secret)
//   node tools/private-eval.mjs seal      eval/private/messages.json -> eval/private.enc   (needs EVAL_PRIVATE_KEY)
//   node tools/private-eval.mjs open      eval/private.enc -> eval/private/messages.json   (needs EVAL_PRIVATE_KEY)
//   node tools/private-eval.mjs prune     drop report copies past their 180-day expiry and re-seal
//   node tools/private-eval.mjs import-reports <reports.json>   add reviewed reports (a JSON export of the D1 reports table)
//
// Score it with: EVAL_PRIVATE_KEY=… node tools/eval.mjs --private
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { seal, open, newKey, ENC_PATH, PLAIN_PATH, isExpired, reportsToMessages, mergeReports } from '../lib/private-eval.js';

const root = new URL('..', import.meta.url).pathname;
const [cmd] = process.argv.slice(2);
const key = process.env.EVAL_PRIVATE_KEY;
const enc = join(root, ...ENC_PATH), plain = join(root, ...PLAIN_PATH);

if (cmd === 'keygen') console.log(newKey());
else if (cmd === 'seal') {
  writeFileSync(enc, seal(readFileSync(plain, 'utf8'), key) + '\n');
  console.log(`Wrote ${ENC_PATH.join('/')}`);
} else if (cmd === 'open') {
  mkdirSync(dirname(plain), { recursive: true });
  writeFileSync(plain, open(readFileSync(enc, 'utf8'), key));
  console.log(`Wrote ${PLAIN_PATH.join('/')} (gitignored)`);
} else if (cmd === 'prune' || cmd === 'import-reports') {
  // Re-seals the set without expired report copies; import-reports also adds reviewed reports from a JSON export of
  // the D1 reports table (an array of rows). Nothing plain is written to disk.
  const data = JSON.parse(open(readFileSync(enc, 'utf8'), key));
  const before = data.messages.length;
  const copies = cmd === 'import-reports' ? reportsToMessages(JSON.parse(readFileSync(process.argv[3], 'utf8')), { includeNew: process.argv.includes('--include-new') }) : [];
  data.messages = mergeReports(data.messages, copies);
  // Re-sealing changes the ciphertext even when nothing changed, so only write when a message was added or dropped.
  if (data.messages.length === before && !copies.length) { console.log(`${before} messages, nothing expired or added; ${ENC_PATH.join('/')} unchanged`); process.exit(0); }
  writeFileSync(enc, seal(JSON.stringify(data, null, 2), key) + '\n');
  console.log(`${before} -> ${data.messages.length} messages (${copies.length} report copies offered; expired ones dropped). Wrote ${ENC_PATH.join('/')}`);
} else {
  console.error('Usage: node tools/private-eval.mjs keygen|seal|open|prune|import-reports <reports.json> [--include-new]');
  process.exit(1);
}
