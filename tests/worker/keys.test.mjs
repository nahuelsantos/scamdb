import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { makeWorker } from './harness.mjs';
import { sign } from '../../worker/session.js';
import { newKey } from '../../worker/keys.js';

const w = await makeWorker();
after(() => w.dispose());
const session = `scamdb_session=${await sign({ githubId: 7, login: 'ana', exp: Date.now() + 3600000 }, 'x'.repeat(32))}`;
const auth = (extra = {}) => ({ cookie: session, 'x-requested-with': 'scamdb', ...extra });
const create = async () => (await w.fetch('/v1/keys', { method: 'POST', headers: auth() })).json();
const report = (key, ip = '198.51.100.9') => w.fetch('/v1/reports', { method: 'POST',
  headers: { 'content-type': 'application/json', authorization: `Bearer ${key}`, 'cf-connecting-ip': ip },
  body: JSON.stringify({ text: 'me pidieron un código', country: 'ar' }) });

test('newKey has the documented format', () => assert.match(newKey(), /^sk_[A-Za-z0-9_-]{43}$/));
test('GET /v1/keys/me without a session is 401', async () => {
  const r = await w.fetch('/v1/keys/me');
  assert.equal(r.status, 401);
  assert.equal((await r.json()).error, 'not_signed_in');
});
test('POST without the CSRF header is 403', async () => {
  assert.equal((await w.fetch('/v1/keys', { method: 'POST', headers: { cookie: session } })).status, 403);
});
test('POST creates a key shown once and stored only as a hash', async () => {
  const r = await w.fetch('/v1/keys', { method: 'POST', headers: auth() });
  assert.equal(r.status, 201);
  const { key, prefix } = await r.json();
  assert.match(key, /^sk_/);
  assert.equal(prefix, key.slice(0, 7) + '…');
  const row = await w.db.prepare('SELECT * FROM keys WHERE github_id = 7').first();
  assert.ok(!JSON.stringify(row).includes(key));
  assert.match(row.key_hash, /^[0-9a-f]{64}$/);
});
test('POST again replaces the key and the old one stops working', async () => {
  const { key: first } = await create();
  const { key: second } = await create();
  assert.notEqual(first, second);
  assert.equal((await report(first)).status, 403); // no key and no Turnstile token
  assert.equal((await report(second)).status, 201);
});
test('a keyed report needs no Turnstile, counts in usage and is limited at 200 a day', async () => {
  const { key } = await create();
  assert.equal((await report(key)).status, 201);
  const me = await (await w.fetch('/v1/keys/me', { headers: { cookie: session } })).json();
  assert.equal(me.login, 'ana');
  assert.equal(me.hasKey, true);
  assert.ok(me.usageToday.reports >= 1);
  assert.equal(me.limits.reports, 200);
  const keyRow = await w.db.prepare('SELECT id FROM keys WHERE github_id = 7').first();
  const day = new Date().toISOString().slice(0, 10);
  await w.db.prepare('INSERT INTO hits (bucket, day, count) VALUES (?, ?, 200) ON CONFLICT (bucket, day) DO UPDATE SET count = 200').bind('reports:gh:7', day).run();
  assert.equal((await report(key)).status, 429);
});
test('DELETE removes the key', async () => {
  await create();
  assert.equal((await w.fetch('/v1/keys/me', { method: 'DELETE', headers: auth() })).status, 204);
  const me = await (await w.fetch('/v1/keys/me', { headers: { cookie: session } })).json();
  assert.equal(me.hasKey, false);
  assert.equal(me.prefix, null);
});
test('refused keyed reports do not use up the global daily cap', async () => {
  const { key } = await create();
  const day = new Date().toISOString().slice(0, 10);
  await w.db.prepare('INSERT INTO hits (bucket, day, count) VALUES (?, ?, 200) ON CONFLICT (bucket, day) DO UPDATE SET count = 200').bind('reports:gh:7', day).run();
  const before = (await w.db.prepare("SELECT count FROM hits WHERE bucket = 'reports:global' AND day = ?").bind(day).first())?.count ?? 0;
  for (let i = 0; i < 5; i++) assert.equal((await report(key)).status, 429);
  const afterCount = (await w.db.prepare("SELECT count FROM hits WHERE bucket = 'reports:global' AND day = ?").bind(day).first())?.count ?? 0;
  assert.equal(afterCount, before);
});
test('deleting and recreating a key does not reset the daily limit', async () => {
  await create();
  await w.fetch('/v1/keys/me', { method: 'DELETE', headers: auth() });
  const { key } = await create();
  assert.equal((await report(key)).status, 429); // still over 200 for this GitHub account today
});
test('a tampered session cookie on /v1/keys/me is 401', async () => {
  const r = await w.fetch('/v1/keys/me', { headers: { cookie: session.slice(0, -2) + 'xx' } });
  assert.equal(r.status, 401);
});
