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
// Raise a floor when a change improves it; never lower one to make a change pass.
import { loadMessages } from '../../lib/eval.js';
import { loadRepo } from '../../lib/load.js';
import { matchMessage } from '../../packages/matcher/index.js';
const root = new URL('../..', import.meta.url).pathname;
const repo = loadRepo(root);
const real = loadMessages(root);

test('the labelled set is well-formed: 22 per country, 12 scams, known entries, no real links or numbers', () => {
  assert.deepEqual(checkMessages(real, new Set(repo.entries.map((e) => e.id))), []);
  const countries = [...new Set(repo.entries.map((e) => e.country))].sort();
  for (const cc of countries) {
    const m = real.filter((x) => x.country === cc);
    assert.equal(m.length, 22, cc);
    assert.equal(m.filter((x) => x.label === 'scam').length, 12, cc);
  }
});
test('the matcher stays above its floors on the labelled set', async () => {
  const r = await evaluate(real, (m) => matchMessage(m.text, repo.entries, { country: m.country }));
  const x = rates(r.all);
  assert.ok(x.caught >= 95, `scams caught ${x.caught}%`);
  assert.ok(x.calledScam >= 40, `scams called "scam" ${x.calledScam}%`);
  assert.ok(x.top3 >= 72, `right match in top 3 ${x.top3}%`);
  assert.ok(x.falseScam <= 5, `safe messages called "scam" ${x.falseScam}%`);
  assert.ok(r.all.wrongMatches <= 102, `wrong matches ${r.all.wrongMatches}`);
});
