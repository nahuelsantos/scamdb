import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { makeWorker, SCHEMA } from './harness.mjs';
const SCHEMA_WITHOUT_QUEUE = SCHEMA.slice(0, SCHEMA.indexOf('CREATE TABLE source_items'));
const SCHEMA_WITHOUT_RUNS = SCHEMA.slice(0, SCHEMA.indexOf('CREATE TABLE collector_runs'));
import { cleanup } from '../../worker/cleanup.js';

const w = await makeWorker();
after(() => w.dispose());
const NOW = new Date('2026-11-16T04:17:00Z');
const daysAgo = (n) => new Date(NOW.getTime() - n * 86400000);
const report = (id, age, { status = 'new', text = 'x', contact = 'me@example.com', what = 'they called me' } = {}) =>
  w.db.prepare("INSERT INTO reports (id, created_at, country, text, contact, what_happened, key_id, outcome, source, status) VALUES (?, ?, 'ar', ?, ?, ?, 'k1', 'scam', 'api', ?)")
    .bind(id, daysAgo(age).toISOString(), text, contact, what, status).run();
const row = (id) => w.db.prepare('SELECT * FROM reports WHERE id = ?').bind(id).first();

test('after 180 days a report keeps its text and outcome but loses contact, story and key', async () => {
  await report('old', 181); await report('recent', 10); await report('old-empty', 181, { text: null });
  await w.db.prepare("INSERT INTO hits (bucket, day, count) VALUES ('a', ?, 1), ('b', ?, 1)").bind(daysAgo(3).toISOString().slice(0, 10), daysAgo(0).toISOString().slice(0, 10)).run();
  await w.db.prepare("INSERT INTO usage (key_id, day, endpoint, count) VALUES ('k', ?, 'reports', 1), ('k', ?, 'reports', 1)").bind(daysAgo(401).toISOString().slice(0, 10), daysAgo(0).toISOString().slice(0, 10)).run();
  await w.db.prepare("INSERT INTO check_prints (subject, day, print, created_at) VALUES ('gh:1', ?, 'ab', 'x'), ('gh:1', ?, 'cd', 'x')").bind(daysAgo(3).toISOString().slice(0, 10), daysAgo(0).toISOString().slice(0, 10)).run();
  assert.deepEqual(await cleanup(w.db, NOW), { reports: 1, anonymised: 1, hits: 1, usage: 1, prints: 1, indicators: 0, sources: 0 });
  const old = await row('old');
  assert.equal(old.text, 'x'); assert.equal(old.outcome, 'scam');
  assert.equal(old.contact, null); assert.equal(old.what_happened, null); assert.equal(old.key_id, null);
  assert.equal((await row('recent')).contact, 'me@example.com');
  assert.equal(await row('old-empty'), null);
});
test('the daily cron runs the cleanup', async () => {
  await report('cron-old', 200);
  const worker = await w.mf.getWorker();
  await worker.scheduled({ scheduledTime: new Date(), cron: '17 4 * * *' });
  assert.equal((await row('cron-old')).contact, null);
});
test('indicators are deleted after 180 days and with their report', async () => {
  await report('ind-old', 200); await report('ind-new', 5);
  await w.db.prepare("INSERT INTO report_indicators (report_id, kind, value, created_at) VALUES ('ind-old', 'domain', 'x.top', 'x'), ('gone', 'domain', 'y.top', 'x'), ('ind-new', 'phone', '+541100', 'x')").run();
  const out = await cleanup(w.db, NOW);
  assert.equal(out.indicators, 2);
  assert.deepEqual((await w.db.prepare('SELECT report_id FROM report_indicators').all()).results.map((r) => r.report_id), ['ind-new']);
});
test('a skipped source item loses its copied text after 30 days but keeps its link', async () => {
  const ins = (url, status, age) => w.db.prepare("INSERT INTO source_items (source, url, title, text, collected_at, status, reviewed_at) VALUES ('fr-x', ?, 't', 'copied text', 'x', ?, ?)").bind(url, status, age === null ? null : daysAgo(age).toISOString()).run();
  await ins('https://a.example/old-skip', 'skip', 31); await ins('https://a.example/new-skip', 'skip', 5); await ins('https://a.example/old-useful', 'useful', 60); await ins('https://a.example/new', 'new', null);
  assert.equal((await cleanup(w.db, NOW)).sources, 1);
  const rows = (await w.db.prepare('SELECT url, text FROM source_items ORDER BY id').all()).results;
  assert.deepEqual(rows.map((r) => r.text), [null, 'copied text', 'copied text', 'copied text']);
  assert.equal(rows[0].url, 'https://a.example/old-skip');
});
test('the cleanup still runs on a database without the review queue', async () => {
  const bare = await makeWorker({ schema: SCHEMA_WITHOUT_QUEUE });
  try { assert.equal((await cleanup(bare.db, NOW)).sources, null); } finally { await bare.dispose(); }
});
test('collector run summaries are deleted after 60 days', async () => {
  const ins = (age) => w.db.prepare("INSERT INTO collector_runs (received_at, ok, sources) VALUES (?, 1, '[]')").bind(daysAgo(age).toISOString()).run();
  await ins(61); await ins(5);
  await cleanup(w.db, NOW);
  assert.equal((await w.db.prepare('SELECT count(*) AS n FROM collector_runs').first()).n, 1);
});
test('the queue cleanup still runs on a database without the runs table', async () => {
  const bare = await makeWorker({ schema: SCHEMA_WITHOUT_RUNS });
  try { assert.equal((await cleanup(bare.db, NOW)).sources, 0); } finally { await bare.dispose(); }
});
