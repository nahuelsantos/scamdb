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

test('a stored report has no phone number, email, card or link: placeholders instead', async () => {
  const r = await post({ ...ok, text: 'Hola Laura, soy del banco. Llamá al +54 9 11 4567-8901 o entrá a banco-seguro.top/login y pasame la tarjeta 4111 1111 1111 1111', whatHappened: 'Me escribieron a laura.perez@gmail.com' });
  assert.equal(r.status, 201);
  const row = await w.db.prepare('SELECT text, what_happened FROM reports WHERE id = ?').bind((await r.json()).id).first();
  assert.equal(row.text, 'Hola [name], soy del banco. Llamá al [number] o entrá a [link] y pasame la tarjeta [card]');
  assert.equal(row.what_happened, 'Me escribieron a [email]');
});

async function imageForm(fields = {}, file = new File([new Uint8Array(8)], 'a.png', { type: 'image/png' })) {
  const f = new FormData();
  f.append(file.type.startsWith('audio') ? 'audio' : 'image', file);
  for (const [k, v] of Object.entries(fields)) f.append(k, v);
  const req = new Request('https://x/', { method: 'POST', body: f });
  return { type: req.headers.get('content-type'), body: await req.arrayBuffer() };
}
const sendForm = async (form, headers = {}) => w.fetch('/v1/reports', { method: 'POST', headers: { 'content-type': form.type, 'cf-connecting-ip': ip(), ...headers }, body: form.body });

test('a screenshot report without a key is 401 key_required', async () => {
  const r = await sendForm(await imageForm({ country: 'ar', turnstileToken: 'ok' }));
  assert.equal(r.status, 401);
  assert.equal((await r.json()).error, 'key_required');
});
test('a keyed screenshot report without the AI binding is 503; audio is 400', async () => {
  const { sign } = await import('../../worker/session.js');
  const session = `scamdb_session=${await sign({ githubId: 77, login: 'eva', exp: Date.now() + 3600000 }, 'x'.repeat(32))}`;
  const key = (await (await w.fetch('/v1/keys', { method: 'POST', headers: { cookie: session, 'x-requested-with': 'scamdb' } })).json()).key;
  const auth = { authorization: `Bearer ${key}` };
  const r = await sendForm(await imageForm({ country: 'ar' }), auth);
  assert.equal(r.status, 503);
  assert.equal((await r.json()).error, 'not_available');
  const a = await sendForm(await imageForm({ country: 'ar' }, new File([new Uint8Array(8)], 'a.ogg', { type: 'audio/ogg' })), auth);
  assert.equal(a.status, 400);
});

test('a report is tagged with its catalogue match and the brands it names; indicators are domains and hashes only', async () => {
  const r = await post({ ...ok, text: 'Hola, te escribo de ANSES. Te va a llegar un código de WhatsApp, me lo pasás? Llamá al +54 9 11 4567-8901 o entrá a anses-tramite.top/pago' });
  const { id } = await r.json();
  const row = await w.db.prepare('SELECT scam_id, brands FROM reports WHERE id = ?').bind(id).first();
  assert.equal(row.scam_id, 'ar/whatsapp-codigo');
  assert.equal(row.brands, 'anses,whatsapp');
  const ind = (await w.db.prepare('SELECT kind, value FROM report_indicators WHERE report_id = ? ORDER BY kind').bind(id).all()).results;
  assert.deepEqual(ind.map((i) => i.kind), ['domain', 'phone']);
  assert.equal(ind[0].value, 'anses-tramite.top');
  assert.match(ind[1].value, /^[0-9a-f]{32}$/);
  assert.ok(!JSON.stringify(ind).includes('4567'), 'the phone number is never stored');
});
test('the same phone number in two reports gives the same hash', async () => {
  const send = async () => (await (await post({ ...ok, text: `Me llamaron del 011 4567-8901 pidiendo el código ${Math.random()}` })).json()).id;
  const [a, b] = [await send(), await send()];
  const v = async (id) => (await w.db.prepare("SELECT value FROM report_indicators WHERE report_id = ? AND kind = 'phone'").bind(id).first()).value;
  assert.equal(await v(a), await v(b));
});
