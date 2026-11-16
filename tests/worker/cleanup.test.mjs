import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { makeWorker } from './harness.mjs';
import { cleanup } from '../../worker/cleanup.js';

const w = await makeWorker();
after(() => w.dispose());
const NOW = new Date('2026-11-16T04:17:00Z');
const daysAgo = (n) => new Date(NOW.getTime() - n * 86400000);
const report = (id, age, status = 'new') => w.db.prepare("INSERT INTO reports (id, created_at, country, text, source, status) VALUES (?, ?, 'ar', 'x', 'api', ?)")
  .bind(id, daysAgo(age).toISOString(), status).run();

test('cleanup deletes old reports, counters, usage and check fingerprints, and keeps promoted and recent rows', async () => {
  await report('old', 181); await report('kept-promoted', 181, 'promoted'); await report('recent', 10);
  await w.db.prepare("INSERT INTO hits (bucket, day, count) VALUES ('a', ?, 1), ('b', ?, 1)").bind(daysAgo(3).toISOString().slice(0, 10), daysAgo(0).toISOString().slice(0, 10)).run();
  await w.db.prepare("INSERT INTO usage (key_id, day, endpoint, count) VALUES ('k', ?, 'reports', 1), ('k', ?, 'reports', 1)").bind(daysAgo(401).toISOString().slice(0, 10), daysAgo(0).toISOString().slice(0, 10)).run();
  await w.db.prepare("INSERT INTO check_prints (subject, day, print, created_at) VALUES ('gh:1', ?, 'ab', 'x'), ('gh:1', ?, 'cd', 'x')").bind(daysAgo(3).toISOString().slice(0, 10), daysAgo(0).toISOString().slice(0, 10)).run();
  assert.deepEqual(await cleanup(w.db, NOW), { reports: 1, hits: 1, usage: 1, prints: 1 });
  const ids = (await w.db.prepare('SELECT id FROM reports ORDER BY id').all()).results.map((r) => r.id);
  assert.deepEqual(ids, ['kept-promoted', 'recent']);
});
test('the daily cron runs the cleanup', async () => {
  await report('cron-old', 200);
  const worker = await w.mf.getWorker();
  await worker.scheduled({ scheduledTime: new Date(), cron: '17 4 * * *' });
  assert.equal(await w.db.prepare("SELECT id FROM reports WHERE id = 'cron-old'").first(), null);
});
