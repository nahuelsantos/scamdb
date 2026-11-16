import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { makeWorker } from './harness.mjs';

const w = await makeWorker();
after(() => w.dispose());

let n = 0;
const ip = () => `198.51.100.${++n}`;
const post = (body, { from = ip(), type = 'application/json', raw, headers = {} } = {}) =>
  w.fetch('/v1/reports', { method: 'POST', headers: { 'content-type': type, 'cf-connecting-ip': from, ...headers }, body: raw ?? JSON.stringify(body) });
const ok = { text: 'Le hablo de PAMI, ¿me lee el código?', country: 'ar', channel: 'phone', source: 'eschamuyo', turnstileToken: 'ok' };

test('a valid keyless report with a Turnstile token is stored privately', async () => {
  const r = await post(ok);
  assert.equal(r.status, 201);
  const body = await r.json();
  assert.deepEqual(Object.keys(body).sort(), ['id', 'received']);
  const row = await w.db.prepare('SELECT * FROM reports WHERE id = ?').bind(body.id).first();
  assert.equal(row.status, 'new');
  assert.equal(row.source, 'eschamuyo');
  assert.equal(row.channel, 'phone');
  assert.equal(r.headers.get('access-control-allow-origin'), '*');
});
test('without a key or a Turnstile token: 403', async () => {
  const { turnstileToken, ...rest } = ok;
  const r = await post(rest);
  assert.equal(r.status, 403);
  assert.equal((await r.json()).error, 'turnstile_failed');
});
test('a bad Turnstile token: 403', async () => assert.equal((await post({ ...ok, turnstileToken: 'nope' })).status, 403));
for (const [name, patch, field] of [
  ['blank text and whatHappened', { text: '   ', whatHappened: '' }, 'text'],
  ['text as a number', { text: 42 }, 'text'],
  ['unknown country', { country: 'zz' }, 'country'],
  ['unknown channel', { channel: 'fax' }, 'channel'],
  ['text too long', { text: 'a'.repeat(5001) }, 'text'],
  ['contact too long', { contact: 'a'.repeat(201) }, 'contact'],
]) {
  test(`400 for ${name}`, async () => {
    const r = await post({ ...ok, ...patch });
    assert.equal(r.status, 400);
    const b = await r.json();
    assert.equal(b.error, 'invalid_report');
    assert.match(b.message, new RegExp(field));
    assert.equal(r.headers.get('access-control-allow-origin'), '*');
  });
}
test('400 for a body that is not JSON', async () => assert.equal((await post(null, { raw: '{oops' })).status, 400));
test('415 for text/plain', async () => assert.equal((await post(ok, { type: 'text/plain' })).status, 415));
test('413 for a body over 20 kB', async () => assert.equal((await post({ ...ok, text: 'a'.repeat(30000) })).status, 413));
test('the 11th keyless report from one IP is 429 with Retry-After; another IP still gets in', async () => {
  const from = '203.0.113.50';
  for (let i = 0; i < 10; i++) assert.equal((await post(ok, { from })).status, 201);
  const r = await post(ok, { from });
  assert.equal(r.status, 429);
  const after = Number(r.headers.get('retry-after'));
  assert.ok(Number.isInteger(after) && after > 0 && after <= 86400);
  assert.equal(r.headers.get('access-control-allow-origin'), '*');
  assert.equal((await post(ok, { from: '203.0.113.51' })).status, 201);
});
test('the global daily cap pauses reports with 503', async () => {
  const day = new Date().toISOString().slice(0, 10);
  await w.db.prepare("INSERT INTO hits (bucket, day, count) VALUES ('reports:global', ?, 2000) ON CONFLICT (bucket, day) DO UPDATE SET count = 2000").bind(day).run();
  const r = await post(ok);
  assert.equal(r.status, 503);
  assert.equal((await r.json()).error, 'reports_paused');
  await w.db.prepare("DELETE FROM hits WHERE bucket = 'reports:global'").run();
});
test('no raw IP is stored anywhere', async () => {
  await post(ok, { from: '192.0.2.77' });
  const { results } = await w.db.prepare('SELECT bucket FROM hits').all();
  assert.ok(results.every((r) => !r.bucket.includes('192.0.2.77')));
  const reports = await w.db.prepare('SELECT * FROM reports').all();
  assert.ok(!JSON.stringify(reports.results).includes('192.0.2.77'));
});
test('a report with a wrong key is 401 invalid_key', async () => {
  const r = await post({ ...ok }, { headers: { authorization: 'Bearer sk_' + 'y'.repeat(43) } });
  assert.equal(r.status, 401);
  assert.equal((await r.json()).error, 'invalid_key');
});
