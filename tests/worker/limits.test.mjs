import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { makeWorker } from './harness.mjs';
import { ipHash, hit, utcDay, secondsToUtcMidnight } from '../../worker/limits.js';

const w = await makeWorker();
after(() => w.dispose());
const NOON = new Date('2026-11-16T12:00:00Z');

test('ipHash changes with the day and the salt, and never contains the ip', async () => {
  const a = await ipHash('203.0.113.7', 'salt', '2026-11-16');
  assert.notEqual(a, await ipHash('203.0.113.7', 'salt', '2026-11-17'));
  assert.notEqual(a, await ipHash('203.0.113.7', 'other', '2026-11-16'));
  assert.match(a, /^[0-9a-f]{64}$/);
  assert.ok(!a.includes('203'));
});
test('hit allows max and then refuses', async () => {
  const r = [];
  for (let i = 0; i < 4; i++) r.push(await hit(w.db, 'b:max', 3, NOON));
  assert.deepEqual(r.map((x) => x.ok), [true, true, true, false]);
  assert.equal(r[3].count, 4);
});
test('buckets are independent', async () => {
  await hit(w.db, 'b:one', 1, NOON);
  assert.equal((await hit(w.db, 'b:two', 1, NOON)).ok, true);
});
test('a new day starts again at zero', async () => {
  await hit(w.db, 'b:day', 1, NOON);
  assert.equal((await hit(w.db, 'b:day', 1, NOON)).ok, false);
  assert.equal((await hit(w.db, 'b:day', 1, new Date('2026-11-17T00:00:01Z'))).ok, true);
});
test('utcDay and secondsToUtcMidnight', () => {
  assert.equal(utcDay(NOON), '2026-11-16');
  assert.equal(secondsToUtcMidnight(new Date('2026-11-16T23:59:30Z')), 30);
  assert.equal(secondsToUtcMidnight(new Date('2026-11-16T23:59:59.900Z')), 1);
});
