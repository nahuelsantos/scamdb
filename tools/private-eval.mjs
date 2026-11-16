#!/usr/bin/env node
// The encrypted private labelled set (see lib/private-eval.js).
//
//   node tools/private-eval.mjs keygen    print a new key (keep it; put it in the EVAL_PRIVATE_KEY GitHub secret)
//   node tools/private-eval.mjs seal      eval/private/messages.json -> eval/private.enc   (needs EVAL_PRIVATE_KEY)
//   node tools/private-eval.mjs open      eval/private.enc -> eval/private/messages.json   (needs EVAL_PRIVATE_KEY)
//
// Score it with: EVAL_PRIVATE_KEY=… node tools/eval.mjs --private
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { seal, open, newKey, ENC_PATH, PLAIN_PATH } from '../lib/private-eval.js';

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
} else {
  console.error('Usage: node tools/private-eval.mjs keygen|seal|open');
  process.exit(1);
}
