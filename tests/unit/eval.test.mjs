import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, rates, checkMessages, report } from '../../lib/eval.js';

const msgs = [
  { id: 'au-01', country: 'au', label: 'scam', scam: 'au/a', channel: 'sms', text: 'scam one text here' },
  { id: 'au-02', country: 'au', label: 'scam', scam: 'au/b', channel: 'sms', text: 'scam two text here' },
  { id: 'au-03', country: 'au', label: 'safe', scam: null, channel: 'sms', text: 'safe one text here' },
  { id: 'au-04', country: 'au', label: 'safe', scam: null, channel: 'sms', text: 'safe two text here' },
];
const answers = {
  'au-01': { verdict: 'scam', matches: [{ id: 'au/a' }, { id: 'au/x' }] }, // right first, one wrong extra
  'au-02': { verdict: 'suspicious', matches: [{ id: 'au/x' }, { id: 'au/b' }] }, // right only in top 3
  'au-03': { verdict: 'scam', matches: [] }, // false "scam"
  'au-04': { verdict: 'not_recognised', matches: [] }, // correct
};

test('evaluate counts catches, matches and false alarms', async () => {
  const r = await evaluate(msgs, (m) => answers[m.id]);
  assert.deepEqual(r.all, { scams: 2, safe: 2, caught: 2, calledScam: 1, top1: 1, top3: 2, wrongMatches: 2, falseScam: 1, falseFlag: 1, safeMatched: 0 });
  assert.deepEqual(rates(r.all), { caught: 100, calledScam: 50, top1: 50, top3: 100, falseScam: 50, falseFlag: 50, safeMatched: 0 });
  assert.deepEqual(r.misses.map((x) => x.id), ['au-02', 'au-03']);
  assert.ok(r.byCountry.au);
});
test('evaluate works with async engines and keeps message order', async () => {
  const r = await evaluate(msgs, async (m) => { await new Promise((ok) => setTimeout(ok, m.id === 'au-01' ? 20 : 0)); return answers[m.id]; }, { concurrency: 4 });
  assert.equal(r.misses[0].id, 'au-02');
});
test('the report has a row per country and lists the misses', async () => {
  const md = report('Test', await evaluate(msgs, (m) => answers[m.id]));
  assert.match(md, /\| \*\*all\*\* \| 100% \(2\/2\)/);
  assert.match(md, /\| au \|/);
  assert.match(md, /`au-03` \(safe\): scam/);
});
test('checkMessages catches unknown entries, real URLs, phone numbers and bad labels', () => {
  const ids = new Set(['au/a']);
  const bad = [
    { id: 'au-01', country: 'au', label: 'scam', scam: 'au/nope', channel: 'sms', text: 'a long enough text' },
    { id: 'au-02', country: 'au', label: 'safe', scam: null, channel: 'sms', text: 'see https://example.com now' },
    { id: 'au-03', country: 'au', label: 'safe', scam: null, channel: 'sms', text: 'call me on 0412 345 678 ok' },
    { id: 'au-04', country: 'au', label: 'maybe', scam: null, channel: 'fax', text: 'a long enough text' },
  ];
  const p = checkMessages(bad, ids).join('\n');
  for (const want of ['au-01: scam "au/nope"', 'au-02: write links', 'au-03: looks like a real phone', 'au-04: label', 'au-04: unknown channel']) assert.ok(p.includes(want), want);
  assert.deepEqual(checkMessages([msgs[0]].map((m) => ({ ...m, scam: 'au/a' })), ids), []);
});

// The real labelled set: it must stay well-formed, and the matcher must not get worse than these floors.
// Raise a floor when a change improves it; never lower one to make a code change pass. Floors were re-measured once
// when the set grew from 198 to 450 harder messages (the same matcher scored lower on the new data).
import { loadMessages } from '../../lib/eval.js';
import { loadRepo } from '../../lib/load.js';
import { matchMessage } from '../../packages/matcher/index.js';
const root = new URL('../..', import.meta.url).pathname;
const repo = loadRepo(root);
const real = loadMessages(root);

test('the labelled set is well-formed: at least 22 per country, about half scams, known entries, no real links or numbers', () => {
  assert.deepEqual(checkMessages(real, new Set(repo.entries.map((e) => e.id))), []);
  const countries = [...new Set(repo.entries.map((e) => e.country))].sort();
  for (const cc of countries) {
    const m = real.filter((x) => x.country === cc);
    assert.ok(m.length >= 22, `${cc}: ${m.length} messages`);
    const share = m.filter((x) => x.label === 'scam').length / m.length;
    assert.ok(share >= 0.4 && share <= 0.65, `${cc}: ${Math.round(share * 100)}% scams`);
  }
});
test('the matcher stays above its floors on the labelled set', async () => {
  const r = await evaluate(real, (m) => matchMessage(m.text, repo.entries, { country: m.country }));
  const x = rates(r.all);
  assert.ok(x.caught >= 96, `scams caught ${x.caught}%`);
  assert.ok(x.calledScam >= 46, `scams called "scam" ${x.calledScam}%`);
  assert.ok(x.top3 >= 76, `right match in top 3 ${x.top3}%`);
  assert.ok(x.falseScam <= 7.5, `safe messages called "scam" ${x.falseScam}%`);
  assert.ok(r.all.wrongMatches / r.all.scams <= 0.95, `wrong matches per scam ${(r.all.wrongMatches / r.all.scams).toFixed(2)}`);
});

// The encrypted private set (eval/private.enc). Runs only where EVAL_PRIVATE_KEY is set (CI with the secret, or the
// owner's machine); prints nothing about the messages themselves.
import { loadPrivateMessages, seal, open, newKey } from '../../lib/private-eval.js';
test('sealing round-trips and a wrong key fails', () => {
  const k = newKey();
  const s = seal('{"messages":[]}', k);
  assert.equal(open(s, k), '{"messages":[]}');
  assert.throws(() => open(s, newKey()));
  assert.throws(() => seal('x', 'short'), /32 bytes/);
});
const priv = loadPrivateMessages(root);
test('the private set is well-formed and the matcher stays above its floors on it', { skip: priv ? false : 'no EVAL_PRIVATE_KEY' }, async () => {
  assert.deepEqual(checkMessages(priv, new Set(repo.entries.map((e) => e.id))), []);
  const r = await evaluate(priv, (m) => matchMessage(m.text, repo.entries, { country: m.country }));
  const x = rates(r.all);
  assert.ok(x.caught >= 85, `private: scams caught ${x.caught}%`);
  assert.ok(x.falseScam <= 20, `private: safe called "scam" ${x.falseScam}%`);
});
