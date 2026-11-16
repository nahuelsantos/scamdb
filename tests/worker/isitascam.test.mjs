import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { makeWorker } from './harness.mjs';
import { sign } from '../../worker/session.js';
import { utcDay } from '../../worker/limits.js';
import { VERSION } from '../../packages/matcher/index.js';

const w = await makeWorker();
after(() => w.dispose());
let n = 0;
const ip = () => `203.0.113.${++n}`;
const check = (body, { from = ip(), key, raw, type = 'application/json' } = {}) => w.fetch('/v1/isitascam', { method: 'POST',
  headers: { 'content-type': type, 'cf-connecting-ip': from, ...(key ? { authorization: `Bearer ${key}` } : {}) }, body: raw ?? JSON.stringify(body) });
const session = `scamdb_session=${await sign({ githubId: 7, login: 'ana', exp: Date.now() + 3600000 }, 'x'.repeat(32))}`;
const key = (await (await w.fetch('/v1/keys', { method: 'POST', headers: { cookie: session, 'x-requested-with': 'scamdb' } })).json()).key;
const CODE = 'Te va a llegar un código de WhatsApp, me lo pasás?';

test('keyless: a code request is a scam, matched, score null, scorer matcher', async () => {
  const r = await check({ text: CODE, lang: 'en' });
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('access-control-allow-origin'), '*');
  const b = await r.json();
  assert.equal(b.verdict, 'scam');
  assert.equal(b.score, null);
  assert.equal(b.matches[0].id, 'ar/whatsapp-codigo');
  assert.equal(b.matches[0].name, 'WhatsApp theft with the code');
  assert.equal(b.matches[0].url, 'https://scamdb.dev/v1/scams/ar/whatsapp-codigo.json');
  assert.equal(b.matches[0].page, 'https://scamdb.dev/catalogue/ar/whatsapp-codigo/');
  assert.deepEqual(b.whatToDo, ['Never read out the code']);
  assert.equal(b.reportTo, 'https://scamdb.dev/v1/ar/contacts.json');
  assert.deepEqual(b.engine, { matcher: VERSION, scorer: 'matcher' });
  assert.equal(b.datasetVersion, 't.1');
  const sig = b.signals.find((s) => s.id === 'asks_for_code');
  assert.equal(sig.label, 'Asks for a code');
  assert.ok(sig.evidence.length > 0);
});
test('labels and whatToDo follow lang, falling back to English', async () => {
  const b = await (await check({ text: CODE, lang: 'es' })).json();
  assert.deepEqual(b.whatToDo, ['No leas el código']);
  assert.equal(b.signals.find((s) => s.id === 'asks_for_code').label, 'Te pide un código');
  const pt = await (await check({ text: CODE, lang: 'pt' })).json();
  assert.deepEqual(pt.whatToDo, ['Never read out the code']);
});
test('ordinary text is not_recognised with no matches', async () => {
  const b = await (await check({ text: 'Hola, ¿venís el domingo?' })).json();
  assert.equal(b.verdict, 'not_recognised');
  assert.deepEqual(b.matches, []);
  assert.deepEqual(b.whatToDo, []);
  assert.equal(b.reportTo, null);
});
test('country filters matches', async () => {
  const b = await (await check({ text: CODE, country: 'au' })).json();
  assert.ok(!b.matches.some((m) => m.id.startsWith('ar/')));
  assert.equal(b.reportTo, 'https://scamdb.dev/v1/au/contacts.json');
});
for (const [name, body, field] of [
  ['missing text', {}, 'text'], ['blank text', { text: '   ' }, 'text'], ['text as a number', { text: 123 }, 'text'],
  ['text too long', { text: 'a'.repeat(5001) }, 'text'], ['unknown country', { text: 'x', country: 'zz' }, 'country'],
  ['lang not text', { text: 'x', lang: 5 }, 'lang'], ['report not boolean', { text: 'x', report: 'yes' }, 'report'],
]) {
  test(`400 for ${name}`, async () => {
    const r = await check(body);
    assert.equal(r.status, 400);
    const b = await r.json();
    assert.equal(b.error, 'invalid_check');
    assert.match(b.message, new RegExp(`^${field}`));
  });
}
test('non-JSON is 415', async () => assert.equal((await check(null, { raw: 'hi', type: 'text/plain' })).status, 415));
test('report without a key is refused', async () => {
  const r = await check({ text: CODE, report: true });
  assert.equal(r.status, 400);
  assert.match((await r.json()).message, /POST \/v1\/reports/);
});
test('report with a key stores one report; without report nothing is stored', async () => {
  const before = (await w.db.prepare("SELECT COUNT(*) AS c FROM reports WHERE source = 'isitascam'").first()).c;
  assert.equal((await check({ text: CODE }, { key })).status, 200);
  assert.equal((await w.db.prepare("SELECT COUNT(*) AS c FROM reports WHERE source = 'isitascam'").first()).c, before);
  assert.equal((await check({ text: CODE, report: true }, { key })).status, 200);
  const row = await w.db.prepare("SELECT * FROM reports WHERE source = 'isitascam' ORDER BY created_at DESC").first();
  assert.equal(row.text, CODE);
  assert.equal(row.country, 'ar');
});
test('keyed without the AI binding answers with the matcher', async () => {
  const b = await (await check({ text: CODE }, { key })).json();
  assert.equal(b.engine.scorer, 'matcher');
  assert.equal(b.score, null);
});
test('keyless limit is 10 a day per IP', async () => {
  const from = '192.0.2.77';
  const texts = ['hola', 'tu paquete llega mañana', 'reunión a las 10', 'ya pagué la luz', 'feliz cumple', 'nos vemos el sábado', 'traé pan', 'llegué bien', 'el turno es el lunes', 'gracias por todo', 'última'];
  for (let i = 0; i < 10; i++) assert.equal((await check({ text: texts[i] }, { from })).status, 200, `call ${i + 1}`);
  const r = await check({ text: texts[10] }, { from });
  assert.equal(r.status, 429);
  assert.equal((await r.json()).error, 'too_many_checks');
  assert.ok(Number(r.headers.get('retry-after')) > 0);
});
test('keyed limit is 50 a day per account', async () => {
  await w.db.prepare('INSERT INTO hits (bucket, day, count) VALUES (?, ?, 50) ON CONFLICT (bucket, day) DO UPDATE SET count = 50').bind('isitascam:gh:7', utcDay()).run();
  assert.equal((await check({ text: 'hola' }, { key })).status, 429);
});
test('OPTIONS returns CORS 204', async () => {
  const r = await w.fetch('/v1/isitascam', { method: 'OPTIONS' });
  assert.equal(r.status, 204);
  assert.equal(r.headers.get('access-control-allow-origin'), '*');
});
/** A multipart body with its content-type header (Miniflare doesn't set it from FormData). */
async function imageForm(extra = {}) {
  const f = new FormData();
  f.append('image', new File([new Uint8Array(8)], 'a.png', { type: 'image/png' }));
  for (const [k, v] of Object.entries(extra)) f.append(k, v);
  const req = new Request('https://x/', { method: 'POST', body: f });
  return { type: req.headers.get('content-type'), body: await req.arrayBuffer() };
}
test('a screenshot without a key is refused with 401 before any AI', async () => {
  const form = await imageForm();
  const r = await w.fetch('/v1/isitascam', { method: 'POST', headers: { 'content-type': form.type, 'cf-connecting-ip': ip() }, body: form.body });
  assert.equal(r.status, 401);
  assert.equal((await r.json()).error, 'key_required');
});
test('a keyed screenshot without the AI binding is 503 not_available', async () => {
  await w.db.prepare('DELETE FROM hits WHERE bucket = ?').bind('isitascam:gh:7').run();
  const form = await imageForm();
  const r = await w.fetch('/v1/isitascam', { method: 'POST', headers: { 'content-type': form.type, 'cf-connecting-ip': ip(), authorization: `Bearer ${key}` }, body: form.body });
  assert.equal(r.status, 503);
  assert.equal((await r.json()).error, 'not_available');
});
test('report with a key counts against the reports limit', async () => {
  await w.db.prepare('DELETE FROM hits WHERE bucket = ?').bind('isitascam:gh:7').run();
  await w.db.prepare('INSERT INTO hits (bucket, day, count) VALUES (?, ?, 200) ON CONFLICT (bucket, day) DO UPDATE SET count = 200').bind('reports:gh:7', utcDay()).run();
  const r = await check({ text: CODE, report: true }, { key });
  assert.equal(r.status, 429);
  assert.equal((await r.json()).error, 'too_many_reports');
});
test('a 5,000-character message sent as escapes is accepted', async () => {
  const raw = JSON.stringify({ text: 'é'.repeat(5000) }).replace(/é/g, '\\u00e9');
  assert.equal((await check(null, { raw })).status, 200);
});
test('a wrong key is 401 invalid_key, not a silent keyless check', async () => {
  for (const bad of ['Bearer sk_' + 'x'.repeat(43), 'Bearer nope', 'Basic abc']) {
    const r = await w.fetch('/v1/isitascam', { method: 'POST', headers: { 'content-type': 'application/json', 'cf-connecting-ip': ip(), authorization: bad }, body: JSON.stringify({ text: 'hola' }) });
    assert.equal(r.status, 401, bad);
    assert.equal((await r.json()).error, 'invalid_key');
  }
});

test('probe detection: the 6th near-identical check in a day is refused; other messages still work', async () => {
  const from = '192.0.2.150';
  const base = 'Hola ma, se me rompió el celu, este es mi número nuevo. Me pasás plata para pagar una deuda hoy?';
  const variants = [base, base.replace('Hola ma', 'Hola mami'), base.replace('hoy', 'ahora'), base.replace('plata', 'guita'), base + ' porfa'];
  for (const [i, t] of variants.entries()) assert.equal((await check({ text: t }, { from })).status, 200, `variant ${i + 1}`);
  const r = await check({ text: base.replace('deuda', 'cuenta') }, { from });
  assert.equal(r.status, 429);
  assert.equal((await r.json()).error, 'too_many_similar');
  assert.ok(Number(r.headers.get('retry-after')) > 0);
  assert.equal((await check({ text: 'el turno del médico es el jueves a las 9' }, { from })).status, 200);
});
test('probe detection stores a fingerprint, never the text', async () => {
  await check({ text: 'mensaje muy privado sobre mi cuenta del banco' }, { from: '192.0.2.151' });
  const rows = (await w.db.prepare('SELECT * FROM check_prints').all()).results;
  assert.ok(rows.length > 0);
  assert.ok(rows.every((r) => /^[0-9a-f]{16}$/.test(r.print)));
  assert.ok(!JSON.stringify(rows).includes('privado'));
  assert.ok(rows.every((r) => !r.subject.includes('192.0.2')), 'the IP is hashed');
});
test('probe detection counts keyed checks per GitHub account, whatever the IP', async () => {
  const base = 'Your Netflix payment failed, update your card within 24 hours or your account will be closed';
  for (let i = 0; i < 5; i++) assert.equal((await check({ text: `${base} ${'!'.repeat(i)}` }, { key, from: `198.51.100.${i + 20}` })).status, 200, `check ${i + 1}`);
  const r = await check({ text: `${base} now` }, { key, from: '198.51.100.99' });
  assert.equal(r.status, 429);
  assert.equal((await r.json()).error, 'too_many_similar');
});
test('on the site, a signed-in visitor with a key is counted as keyed; without the header the cookie is ignored', async () => {
  const headers = (extra) => ({ 'content-type': 'application/json', cookie: session, 'cf-connecting-ip': '203.0.113.200', ...extra });
  const send = (extra) => w.fetch('/v1/isitascam', { method: 'POST', headers: headers(extra), body: JSON.stringify({ text: 'una prueba de sesión distinta ' + Math.random() }) });
  const before = (await w.db.prepare("SELECT COALESCE(SUM(count), 0) AS n FROM usage WHERE endpoint = 'isitascam'").first()).n;
  assert.equal((await send({ 'x-requested-with': 'scamdb' })).status, 200);
  const mid = (await w.db.prepare("SELECT COALESCE(SUM(count), 0) AS n FROM usage WHERE endpoint = 'isitascam'").first()).n;
  assert.equal(mid, before + 1, 'counted against the key');
  assert.equal((await send({})).status, 200);
  const after = (await w.db.prepare("SELECT COALESCE(SUM(count), 0) AS n FROM usage WHERE endpoint = 'isitascam'").first()).n;
  assert.equal(after, mid, 'without X-Requested-With the cookie is not used');
});
test('CORS never lets another site send X-Requested-With', async () => {
  const r = await w.fetch('/v1/isitascam', { method: 'OPTIONS' });
  assert.ok(!/x-requested-with/i.test(r.headers.get('access-control-allow-headers') ?? ''));
  assert.notEqual(r.headers.get('access-control-allow-credentials'), 'true');
});
