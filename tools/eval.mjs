#!/usr/bin/env node
// Measures the engines on the labelled test set in eval/messages.
//
//   node tools/eval.mjs                  keyword matcher only (offline, free)
//   node tools/eval.mjs --ai             also the Workers AI scorer, as the API combines it (uses the daily free allowance:
//                                        about 200 checks; needs CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN with
//                                        "Workers AI: Read" permission)
//   node tools/eval.mjs --country au     one country
//   node tools/eval.mjs --out eval/results.md   also write the report to a file
import { writeFileSync } from 'node:fs';
import { loadRepo } from '../lib/load.js';
import { loadMessages, checkMessages, evaluate, report } from '../lib/eval.js';
import { matchMessage } from '../packages/matcher/index.js';
import { scoreWithWorkersAI, combine } from '../worker/scorer.js';

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const value = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : null);

const root = new URL('..', import.meta.url).pathname;
const repo = loadRepo(root);
const country = value('--country');
const messages = loadMessages(root).filter((m) => !country || m.country === country);
const problems = checkMessages(messages, new Set(repo.entries.map((e) => e.id)));
if (problems.length) {
  console.error(`The test set has problems:\n${problems.map((p) => `  ${p}`).join('\n')}`);
  process.exit(1);
}
if (!messages.length) { console.error('No messages in eval/messages.'); process.exit(1); }

/** The matcher exactly as the API runs it: the caller's country narrows the matches. */
const matcherEngine = (entries) => (m) => matchMessage(m.text, entries, { country: m.country });

/** A Workers AI binding look-alike that calls the REST API, so the scorer code runs unchanged. */
function restAI(accountId, token) {
  return {
    async run(model, input) {
      const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`, {
        method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify(input),
      });
      const body = await r.json().catch(() => ({}));
      if (!r.ok || body.success === false) throw new Error(`${r.status} ${JSON.stringify(body.errors ?? body).slice(0, 200)}`);
      return body.result;
    },
  };
}

const started = Date.now();
let out = `# scamdb engine report\n\n${messages.length} labelled messages (${messages.filter((m) => m.label === 'scam').length} scams, ${messages.filter((m) => m.label === 'safe').length} safe)${country ? ` for ${country}` : ''}.\n\n`;
out += report('Keyword matcher', await evaluate(messages, matcherEngine(repo.entries)));

if (flag('--ai')) {
  const { CLOUDFLARE_ACCOUNT_ID: id, CLOUDFLARE_API_TOKEN: token } = process.env;
  if (!id || !token) { console.error('--ai needs CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN.'); process.exit(1); }
  const ai = restAI(id, token);
  const catalogue = { version: 'eval', signals: new Map(repo.signals.map((s) => [s.id, s])), entries: repo.entries };
  const failures = {};
  const engine = async (m) => {
    const matcher = matchMessage(m.text, repo.entries, { country: m.country });
    const diag = {};
    const scored = await scoreWithWorkersAI(ai, { text: m.text, catalogue, country: m.country, hints: matcher.matches.map((x) => x.id) }, { diag, timeoutMs: 20000 });
    if (!scored) { failures[diag.reason] ??= { count: 0, example: diag.detail }; failures[diag.reason].count++; return matcher; }
    return combine(matcher, scored, m.text);
  };
  out += '\n' + report('Matcher + Workers AI (as the API answers keyed checks)', await evaluate(messages, engine, { concurrency: 3 }));
  if (Object.keys(failures).length) out += `\nThe AI step failed on some messages and the matcher answered: ${JSON.stringify(failures)}\n`;
}

out += `\n_${((Date.now() - started) / 1000).toFixed(1)} s_\n`;
console.log(out);
if (value('--out')) writeFileSync(value('--out'), out);
