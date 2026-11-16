import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreWithWorkersAI, combine, MODELS, _resetCache } from '../../worker/scorer.js';

const catalogue = {
  version: 'v1',
  signals: new Map([['asks_for_code', { label: { en: 'Asks for a code' } }], ['money_request', { label: { en: 'Asks for money' } }]]),
  entries: [
    { id: 'ar/whatsapp-codigo', country: 'ar', name: { en: 'WhatsApp theft with the code' }, phrases: { en: ['whatsapp code'] } },
    { id: 'au/parcel', country: 'au', name: { en: 'Parcel text' }, phrases: { en: ['parcel on hold'] } },
  ],
};
const TEXT = 'Send me the código you just got';

/** A fake Workers AI binding: entry vectors point "ar/whatsapp-codigo" towards the message. */
function fakeAI({ chat = { verdict: 'scam', score: 0.93, signals: [{ id: 'asks_for_code', evidence: 'código' }] }, throws, hang, calls = [] } = {}) {
  return {
    calls,
    run: async (model, input) => {
      calls.push(model);
      if (throws) throw new Error('boom');
      if (hang) return new Promise(() => {});
      if (model === MODELS.embed) return { data: input.text.map((t) => (t.includes('WhatsApp') || t === TEXT ? [1, 0] : [0, 1])) };
      return { response: chat };
    },
  };
}

test('uses embeddings and the chat answer', async () => {
  _resetCache();
  const r = await scoreWithWorkersAI(fakeAI(), { text: TEXT, catalogue });
  assert.equal(r.score, 0.93);
  assert.equal(r.verdict, 'scam');
  assert.equal(r.matches[0].id, 'ar/whatsapp-codigo');
  assert.ok(r.matches[0].similarity > 0.9);
  assert.ok(!r.matches.some((m) => m.id === 'au/parcel'));
});
test('returns null when the model throws', async () => assert.equal(await scoreWithWorkersAI(fakeAI({ throws: true }), { text: TEXT, catalogue }), null));
test('returns null when it times out', async () => {
  _resetCache();
  assert.equal(await scoreWithWorkersAI(fakeAI({ hang: true }), { text: TEXT, catalogue }, { timeoutMs: 20 }), null);
});
test('returns null when the answer is not an object', async () => {
  _resetCache();
  assert.equal(await scoreWithWorkersAI(fakeAI({ chat: 'not json' }), { text: TEXT, catalogue }), null);
});
for (const [name, chat] of [['an unknown verdict', { verdict: 'maybe', score: 0.5, signals: [] }], ['a score above 1', { verdict: 'scam', score: 7, signals: [] }]]) {
  test(`returns null for ${name}`, async () => {
    _resetCache();
    assert.equal(await scoreWithWorkersAI(fakeAI({ chat }), { text: TEXT, catalogue }), null);
  });
}
test('a JSON string answer is parsed', async () => {
  _resetCache();
  const r = await scoreWithWorkersAI(fakeAI({ chat: '{"verdict":"suspicious","score":0.4,"signals":[]}' }), { text: TEXT, catalogue });
  assert.equal(r.verdict, 'suspicious');
});
test('catalogue embeddings are computed once per version', async () => {
  _resetCache();
  const calls = [];
  const ai = fakeAI({ calls });
  await scoreWithWorkersAI(ai, { text: TEXT, catalogue });
  await scoreWithWorkersAI(ai, { text: TEXT, catalogue });
  // first call: catalogue + message + chat; second: message + chat
  assert.equal(calls.filter((m) => m === MODELS.embed).length, 3);
});

const matcher = { verdict: 'suspicious', score: null, signals: [{ id: 'money_request', evidence: 'transfer' }, { id: 'impersonation', evidence: 'your bank' }], matches: [{ id: 'au/parcel' }] };
test('combine drops invented evidence', () => {
  const c = combine(matcher, { verdict: 'scam', score: 0.8, signals: [{ id: 'asks_for_code', evidence: 'transfer now' }], matches: [] }, 'please transfer, your bank');
  assert.ok(!c.signals.some((s) => s.id === 'asks_for_code'));
});
test('combine floors the verdict when the hard rules fire', () => {
  const c = combine(matcher, { verdict: 'not_recognised', score: 0.1, signals: [], matches: [] }, 'please transfer, your bank');
  assert.equal(c.verdict, 'suspicious');
  assert.equal(c.score, 0.1);
});
test('combine keeps matcher evidence for the same id and merges matches', () => {
  const c = combine(matcher, { verdict: 'scam', score: 0.9, signals: [{ id: 'money_request', evidence: 'TRANSFER' }], matches: [{ id: 'ar/whatsapp-codigo', similarity: 0.8 }, { id: 'au/parcel', similarity: 0.7 }] }, 'please transfer, your bank');
  assert.equal(c.signals.find((s) => s.id === 'money_request').evidence, 'transfer');
  assert.deepEqual(c.matches.map((m) => m.id), ['au/parcel', 'ar/whatsapp-codigo']);
  assert.equal(c.verdict, 'scam');
});
test('country limits the matches but keeps the cache whole', async () => {
  _resetCache();
  const r = await scoreWithWorkersAI(fakeAI(), { text: TEXT, catalogue, country: 'au' });
  assert.ok(!r.matches.some((m) => m.id.startsWith('ar/')));
  const all = await scoreWithWorkersAI(fakeAI(), { text: TEXT, catalogue });
  assert.equal(all.matches[0].id, 'ar/whatsapp-codigo');
});
test('keyless requests never use the scorer, even with the AI binding', async () => {
  const { usesScorer } = await import('../../worker/isitascam.js');
  assert.equal(usesScorer(null, { AI: {} }), false);
  assert.equal(usesScorer({ id: 'k' }, {}), false);
  assert.equal(usesScorer({ id: 'k' }, { AI: {} }), true);
});

test('an unknown signal id is dropped, the verdict kept', async () => {
  _resetCache();
  const r = await scoreWithWorkersAI(fakeAI({ chat: { verdict: 'scam', score: 0.5, signals: [{ id: 'nope', evidence: 'x' }, { id: 'asks_for_code', evidence: 'código' }] } }), { text: TEXT, catalogue });
  assert.equal(r.verdict, 'scam');
  assert.deepEqual(r.signals.map((s) => s.id), ['asks_for_code']);
});
test('the chat-completions answer shape is read', async () => {
  _resetCache();
  const ai = { run: async (model, input) => (model === MODELS.embed ? { data: input.text.map(() => [1, 0]) } : { choices: [{ message: { content: '```json\n{"verdict":"suspicious","score":0.4,"signals":[]}\n```' } }] }) };
  assert.equal((await scoreWithWorkersAI(ai, { text: TEXT, catalogue })).verdict, 'suspicious');
});
test('combine never says not_recognised when the catalogue matched', () => {
  const c = combine({ verdict: 'suspicious', score: null, signals: [], matches: [{ id: 'au/parcel' }] }, { verdict: 'not_recognised', score: 0.05, signals: [], matches: [] }, 'parcel');
  assert.equal(c.verdict, 'suspicious');
});
test('the chat model is a current one, not the retired llama-3.1-8b', () => assert.notEqual(MODELS.chat, '@cf/meta/llama-3.1-8b-instruct'));

test('a failure says why: the chat model throwing names the chat stage and its message', async () => {
  _resetCache();
  const diag = {};
  const ai = { run: async (model, input) => { if (model === MODELS.embed) return { data: input.text.map(() => [1, 0]) }; throw new Error('5006: system role not supported'); } };
  assert.equal(await scoreWithWorkersAI(ai, { text: TEXT, catalogue }, { diag }), null);
  assert.deepEqual(diag, { reason: 'chat', detail: '5006: system role not supported' });
});
test('a failure says why: an embedding error, a timeout and an unreadable answer', async () => {
  _resetCache();
  const d1 = {}, d2 = {}, d3 = {};
  await scoreWithWorkersAI(fakeAI({ throws: true }), { text: TEXT, catalogue }, { diag: d1 });
  assert.equal(d1.reason, 'embed');
  await scoreWithWorkersAI(fakeAI({ hang: true }), { text: TEXT, catalogue }, { timeoutMs: 20, diag: d2 });
  assert.equal(d2.reason, 'timeout');
  assert.match(d2.detail, /^embed after \d+ ms$/);
  await scoreWithWorkersAI(fakeAI({ chat: 'I think this is a scam.' }), { text: TEXT, catalogue }, { diag: d3 });
  assert.deepEqual(d3, { reason: 'answer', detail: 'I think this is a scam.' });
});
test('the answer shows why the AI step was skipped, and nothing extra when it ran', async () => {
  const { buildAnswer } = await import('../../worker/isitascam.js');
  const result = { verdict: 'suspicious', score: null, signals: [], matches: [] };
  const skipped = buildAnswer({ result, catalogue, top: null, lang: 'en', country: 'au', scorer: 'matcher', scorerError: { reason: 'chat', detail: 'boom' } });
  assert.deepEqual(skipped.engine.scorerError, { reason: 'chat', detail: 'boom' });
  const ran = buildAnswer({ result, catalogue, top: null, lang: 'en', country: 'au', scorer: 'workers-ai', scorerError: null });
  assert.equal('scorerError' in ran.engine, false);
});
