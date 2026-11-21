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

// ---- Burst limits (per minute), with the real values ----
import { burst, BURST } from '../../worker/limits.js';
import { sign } from '../../worker/session.js';

test('burst allows max in a minute, refuses the next, and starts again the next minute', async () => {
  const at = (s) => new Date(`2026-11-16T12:00:${String(s).padStart(2, '0')}Z`);
  const r = [];
  for (let i = 0; i < 4; i++) r.push(await burst(w.db, 'b:burst', 3, at(10 + i)));
  assert.deepEqual(r.map((x) => x.ok), [true, true, true, false]);
  assert.equal(r[3].retryAfter, 47);
  assert.equal((await burst(w.db, 'b:burst', 3, new Date('2026-11-16T12:01:00Z'))).ok, true);
});
test('the real burst limits are larger than nothing and smaller than the daily ones', () => {
  assert.deepEqual(BURST, { checks: 10, reports: 20, feed: 60 });
});

const real = await makeWorker({ bindings: { BURST_CHECKS: undefined, BURST_REPORTS: undefined, BURST_FEED: undefined } });
after(() => real.dispose());
const keyFor = async (githubId) => {
  const session = `scamdb_session=${await sign({ githubId, login: `b${githubId}`, exp: Date.now() + 3600000 }, 'x'.repeat(32))}`;
  return (await (await real.fetch('/v1/keys', { method: 'POST', headers: { cookie: session, 'x-requested-with': 'scamdb' } })).json()).key;
};
test('a key gets 10 checks a minute, then 429 too_fast with Retry-After', async () => {
  const key = await keyFor(901);
  const check = () => real.fetch('/v1/isitascam', { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${key}`, 'cf-connecting-ip': '198.51.100.7' },
    body: JSON.stringify({ text: 'the cat sat on the warm windowsill all afternoon' }) });
  assert.equal((await check()).status, 200, 'the first check of the minute goes through');
  // Fill this minute and the next with 10 checks, so the next request is over the burst limit whenever it lands.
  const now = Date.now();
  for (const t of [now, now + 60000]) {
    const d = new Date(t);
    await real.db.prepare('INSERT INTO hits (bucket, day, count) VALUES (?, ?, 10) ON CONFLICT (bucket, day) DO UPDATE SET count = 10')
      .bind(`isitascam:gh:901@${d.toISOString().slice(11, 16)}`, d.toISOString().slice(0, 10)).run();
  }
  const r = await check();
  assert.equal(r.status, 429);
  assert.equal((await r.json()).error, 'too_fast');
  const wait = Number(r.headers.get('retry-after'));
  assert.ok(wait >= 1 && wait <= 60, `retry-after ${wait}`);
});
test('keyless checks have no burst limit of their own (their daily limit of 10 is smaller)', async () => {
  const send = () => real.fetch('/v1/isitascam', { method: 'POST', headers: { 'content-type': 'application/json', 'cf-connecting-ip': '198.51.100.8' },
    body: JSON.stringify({ text: 'the cat sat on the warm windowsill all afternoon' }) });
  const r = await send();
  assert.equal(r.status, 200);
  const rows = (await real.db.prepare("SELECT bucket FROM hits WHERE bucket LIKE 'isitascam:ip:%@%'").all()).results;
  assert.equal(rows.length, 0);
});
