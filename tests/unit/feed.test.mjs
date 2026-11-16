import { test } from 'node:test';
import assert from 'node:assert/strict';
import { weekOf, bucket, rising, K_MIN } from '../../worker/feed.js';

test('weekOf gives the Monday (UTC) of the week', () => {
  assert.equal(weekOf('2026-11-16T10:00:00Z'), '2026-11-16'); // a Monday
  assert.equal(weekOf('2026-11-22T23:59:00Z'), '2026-11-16'); // Sunday
  assert.equal(weekOf('2026-11-23T00:00:00Z'), '2026-11-23');
});
test('bucket withholds counts under K_MIN', () => {
  const rows = [...Array(K_MIN)].map(() => ({ week: 'w1', key: 'a' })).concat([{ week: 'w1', key: 'b' }, { week: 'w1', key: 'b' }]);
  assert.deepEqual(bucket(rows), { weeks: { w1: { a: K_MIN } }, withheld: 2 });
});
test('rising: at least K_MIN and at least twice the 4-week average', () => {
  const weeks = { w1: { a: 1 }, w2: { a: 1 }, w3: { a: 1 }, w4: { a: 1 }, w5: { a: 6, b: 3, c: 4 } };
  // a: avg 1 → 6 ≥ 2 rises; b: avg 0 → 3 ≥ max(2*0.5,…) rises; c is new as well
  assert.deepEqual(rising(weeks, 'w5').map((x) => x.id), ['a', 'c', 'b']);
  assert.deepEqual(rising({ w1: { a: 5 }, w2: { a: 5 }, w3: { a: 5 }, w4: { a: 5 }, w5: { a: 6 } }, 'w5'), [], 'steady is not rising');
});
