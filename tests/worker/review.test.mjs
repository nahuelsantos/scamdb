import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { makeWorker } from './harness.mjs';
import { sign } from '../../worker/session.js';

const TOKEN = 'c'.repeat(40);
const w = await makeWorker({ bindings: { COLLECTOR_TOKEN: TOKEN } });
const off = await makeWorker();
after(() => { w.dispose(); off.dispose(); });

const cookie = async (githubId) => `scamdb_session=${await sign({ githubId, login: `u${githubId}`, exp: Date.now() + 3600000 }, 'x'.repeat(32))}`;
const owner = await cookie(2228984);
const stranger = await cookie(7);
const item = (n, extra = {}) => ({ source: 'fr-reddit-arnaques', url: `https://www.reddit.com/r/arnaques/comments/${n}/`, title: `SMS colis ${n}`, text: 'Votre colis est bloqué', lang: 'fr', country: 'fr', publishedAt: '2026-11-20T10:00:00Z', score: n, ...extra });
const collect = (items, token = TOKEN, target = w) => target.fetch('/v1/collect', { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` }, body: JSON.stringify({ items }) });
const list = (c, q = '') => w.fetch(`/v1/review/items${q}`, { headers: { cookie: c } });
const mark = (c, id, body, csrf = true) => w.fetch(`/v1/review/items/${id}`, { method: 'POST', headers: { cookie: c, 'content-type': 'application/json', ...(csrf ? { 'x-requested-with': 'scamdb' } : {}) }, body: JSON.stringify(body) });

test('the collector adds new items and skips links it already sent', async () => {
  let r = await collect([item(1), item(2)]);
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { added: 2, known: 0 });
  r = await collect([item(2), item(3)]);
  assert.deepEqual(await r.json(), { added: 1, known: 1 });
});
test('a wrong or missing collector token is 401 and adds nothing', async () => {
  assert.equal((await collect([item(9)], 'd'.repeat(40))).status, 401);
  assert.equal((await w.fetch('/v1/collect', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"items":[]}' })).status, 401);
  assert.equal((await w.db.prepare("SELECT count(*) AS n FROM source_items WHERE url LIKE '%/9/'").first()).n, 0);
});
test('without COLLECTOR_TOKEN the collect route is switched off', async () => {
  assert.equal((await collect([item(1)], TOKEN, off)).status, 503);
});
test('bad items are refused as a whole', async () => {
  assert.equal((await collect([item(4), { title: 'no url', source: 'fr-x' }])).status, 400);
  assert.equal((await collect([item(5, { url: 'javascript:alert(1)' })])).status, 400);
  assert.equal((await collect(Array.from({ length: 51 }, (_, i) => item(100 + i)))).status, 400);
  assert.equal((await w.db.prepare("SELECT count(*) AS n FROM source_items WHERE url LIKE '%/4/'").first()).n, 0);
});
test('only signed-in reviewers can see the queue', async () => {
  assert.equal((await w.fetch('/v1/review/items')).status, 401);
  const r = await list(stranger);
  assert.equal(r.status, 403);
  assert.equal((await r.json()).error, 'not_a_reviewer');
});
test('the owner sees new items, best score first, with counts', async () => {
  const r = await list(owner);
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('cache-control'), 'no-store');
  const body = await r.json();
  assert.equal(body.counts.new, 3);
  assert.deepEqual(body.items.map((i) => i.title), ['SMS colis 3', 'SMS colis 2', 'SMS colis 1']);
  assert.equal(body.items[0].text, 'Votre colis est bloqué');
});
test('marking an item moves it between lists; it needs the CSRF header', async () => {
  const { items } = await (await list(owner)).json();
  const id = items[0].id;
  assert.equal((await mark(owner, id, { status: 'useful' }, false)).status, 403);
  assert.equal((await mark(stranger, id, { status: 'useful' })).status, 403);
  assert.equal((await mark(owner, id, { status: 'maybe' })).status, 400);
  assert.equal((await mark(owner, 99999, { status: 'skip' })).status, 404);
  const r = await mark(owner, id, { status: 'useful', note: 'real SMS text' });
  assert.equal(r.status, 200);
  const useful = await (await list(owner, '?status=useful')).json();
  assert.deepEqual(useful.items.map((i) => [i.id, i.note]), [[id, 'real SMS text']]);
  assert.ok(useful.items[0].reviewed_at);
  assert.equal(useful.counts.new, 2);
  await mark(owner, id, { status: 'new' });
  assert.equal((await (await list(owner)).json()).counts.new, 3);
});
test('the review queue never shows up in the public API or the reports', async () => {
  assert.equal((await w.db.prepare('SELECT count(*) AS n FROM reports').first()).n, 0);
  const r = await w.fetch('/v1/isitascam', { method: 'POST', headers: { 'content-type': 'application/json', 'cf-connecting-ip': '198.51.100.1' }, body: JSON.stringify({ text: 'Votre colis est bloqué' }) });
  assert.ok(!JSON.stringify(await r.json()).includes('reddit.com'));
});
