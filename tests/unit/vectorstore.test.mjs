import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encodeVectors, decodeVectors } from '../../worker/vectorstore.js';
import { scoreWithWorkersAI, MODELS, _resetCache } from '../../worker/scorer.js';

const cos = (a, b) => { let d = 0, x = 0, y = 0; for (let i = 0; i < a.length; i++) { d += a[i] * b[i]; x += a[i] ** 2; y += b[i] ** 2; } return d / Math.sqrt(x * y); };
const rand = (n, seed) => Array.from({ length: n }, (_, i) => Math.sin(seed * 999 + i * 7.3) * (1 + (i % 5)));

test('int8 storage keeps similarities within 0.01 and is about a quarter of float32 JSON', () => {
  const list = [1, 2, 3, 4].map((s) => ({ id: `x/${s}`, v: rand(1024, s) }));
  const text = encodeVectors(list);
  const back = decodeVectors(text);
  assert.deepEqual(back.map((b) => b.id), list.map((l) => l.id));
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) assert.ok(Math.abs(cos(list[i].v, list[j].v) - cos(back[i].v, back[j].v)) < 0.01);
  assert.ok(text.length < JSON.stringify(list).length / 4);
});

const catalogue = { version: 'v9', signals: new Map([['urgency', { label: { en: 'Rushes you' } }]]), entries: [{ id: 'au/a', country: 'au', name: { en: 'A' }, phrases: { en: ['a b'] } }, { id: 'au/b', country: 'au', name: { en: 'B' }, phrases: { en: ['c d'] } }] };
const ai = (calls) => ({ run: async (model, input) => { calls.push(input.text?.length ?? 'chat'); return model === MODELS.embed ? { data: input.text.map(() => [1, 0]) } : { response: { verdict: 'scam', score: 0.9, signals: [] } }; } });

test('a saved copy means the catalogue is not embedded again', async () => {
  _resetCache();
  const calls = [];
  const store = { get: async () => [{ id: 'au/a', v: [1, 0] }, { id: 'au/b', v: [0, 1] }], put: async () => assert.fail('should not save') };
  const r = await scoreWithWorkersAI(ai(calls), { text: 'hi', catalogue }, { store });
  assert.equal(r.verdict, 'scam');
  assert.ok(!calls.includes(2), `only the message was embedded: ${calls}`);
});
test('a missing or stale copy is computed once and saved', async () => {
  _resetCache();
  const calls = [], saved = [];
  const store = { get: async () => [{ id: 'au/a', v: [1, 0] }], put: async (version, list) => saved.push([version, list.length]) };
  await scoreWithWorkersAI(ai(calls), { text: 'hi', catalogue }, { store });
  assert.ok(calls.includes(2), 'the catalogue was embedded');
  assert.deepEqual(saved, [['v9', 2]]);
});
