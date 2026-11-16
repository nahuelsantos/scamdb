import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { makeWorker } from './harness.mjs';
import { sign } from '../../worker/session.js';

const w = await makeWorker();
after(() => w.dispose());
const keyFor = async (githubId) => {
  const session = `scamdb_session=${await sign({ githubId, login: `u${githubId}`, exp: Date.now() + 3600000 }, 'x'.repeat(32))}`;
  return (await (await w.fetch('/v1/keys', { method: 'POST', headers: { cookie: session, 'x-requested-with': 'scamdb' } })).json()).key;
};
const get = (path, key) => w.fetch(path, { headers: key ? { authorization: `Bearer ${key}` } : {} });
const plain = await keyFor(101), org = await keyFor(102);
await w.db.prepare("UPDATE keys SET feed = 1, org = 'Test CERT' WHERE github_id = 102").run();

const ago = (days) => new Date(Date.now() - days * 86400000).toISOString();
let n = 0;
const report = (scam, brands, days, text = 'Hola [name], te escribo de ANSES por tu trámite [link]') => w.db.prepare('INSERT INTO reports (id, created_at, country, channel, text, source, scam_id, brands) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
  .bind(`r${++n}`, ago(days), 'ar', 'whatsapp', text, 'api', scam, brands).run();
for (let i = 0; i < 4; i++) await report('ar/falso-anses-pami', 'anses', 8);
await report('ar/whatsapp-codigo', 'whatsapp', 8, 'one lonely report that must never be shown');

test('the feed needs a key, and an approved one', async () => {
  assert.equal((await get('/v1/feed/trends?country=ar')).status, 401);
  const r = await get('/v1/feed/trends?country=ar', plain);
  assert.equal(r.status, 403);
  assert.equal((await r.json()).error, 'feed_not_enabled');
});
test('trends: counts per scam and channel, counts under 3 withheld', async () => {
  const r = await get('/v1/feed/trends?country=ar&weeks=4', org);
  assert.equal(r.status, 200);
  const b = await r.json();
  assert.equal(b.org, 'Test CERT');
  const week = Object.keys(b.scams)[0];
  assert.equal(b.scams[week]['ar/falso-anses-pami'], 4);
  assert.equal(b.scams[week]['ar/whatsapp-codigo'], undefined, 'a single report is withheld');
  assert.equal(b.withheld, 1);
  assert.equal(b.channels[week].whatsapp, 5);
});
test('brands: weekly counts and redacted examples only from scams with 3+ look-alikes', async () => {
  const b = await (await get('/v1/feed/brands?country=ar&brand=anses', org)).json();
  assert.equal(Object.values(b.counts)[0], 4);
  assert.ok(b.examples.length > 0 && b.examples.length <= 5);
  assert.ok(b.examples.every((e) => e.scam === 'ar/falso-anses-pami' && e.text.includes('[name]')));
  const wa = await (await get('/v1/feed/brands?country=ar&brand=whatsapp', org)).json();
  assert.deepEqual(wa.examples, [], 'one report is never shown as an example');
  assert.ok(!JSON.stringify(wa).includes('lonely'));
});
test('bad parameters are 400', async () => {
  assert.equal((await get('/v1/feed/trends?country=xx', org)).status, 400);
  assert.equal((await get('/v1/feed/trends?country=ar&weeks=99', org)).status, 400);
  assert.equal((await get('/v1/feed/brands?country=ar&brand=hmrc', org)).status, 400);
});
test('feed answers never include contacts or what happened', async () => {
  await w.db.prepare("UPDATE reports SET contact = 'secret@contact.com', what_happened = 'my private story'").run();
  for (const p of ['/v1/feed/trends?country=ar', '/v1/feed/brands?country=ar&brand=anses']) {
    const t = await (await get(p, org)).text();
    assert.ok(!t.includes('secret@contact.com') && !t.includes('private story'), p);
  }
});
