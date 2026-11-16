import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fit, probability, features, FEATURES } from '../../lib/fusion.js';
import { WEIGHTS, THRESHOLDS } from '../../worker/fusion-weights.js';

test('fit learns a weight that separates the classes', () => {
  const rows = [...Array(20)].map((_, i) => ({ x: [1, i % 2], y: i % 2 }));
  const w = fit(rows);
  assert.ok(probability(w, [1, 1]) > 0.8);
  assert.ok(probability(w, [1, 0]) < 0.2);
});
test('features are scaled to 0..1 and line up with the weights', () => {
  const x = features({ verdict: 'scam', signals: [{ id: 'asks_for_code' }, { id: 'urgency' }], matches: [{ id: 'a', score: 9 }] }, { score: 0.9, nearest: 0.72 });
  assert.equal(x.length, FEATURES.length);
  assert.equal(WEIGHTS.length, FEATURES.length);
  assert.deepEqual(x, [1, 0.9, 1, 1, 0.5, 1, 0.72]);
  assert.ok(x.every((v) => v >= 0 && v <= 1));
});
test('the shipped weights trust the AI most and keep sane cut-offs', () => {
  const ai = WEIGHTS[FEATURES.indexOf('ai')];
  assert.ok(ai > 0 && WEIGHTS.slice(2).every((w) => Math.abs(w) <= ai), 'the AI score carries the largest weight');
  assert.ok(THRESHOLDS.suspicious < THRESHOLDS.scam && THRESHOLDS.scam < 1);
  // A message the AI calls safe, with no signs and no match, is cleared.
  assert.ok(probability(WEIGHTS, [1, 0.02, 0, 0, 0, 0, 0.3]) < THRESHOLDS.suspicious);
});
