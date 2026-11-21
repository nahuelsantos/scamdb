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
const run = (body, token = TOKEN) => w.fetch('/v1/collect/run', { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
const RUN = { startedAt: '2026-11-22T06:40:00Z', host: 'plunder', ok: true, candidates: 3, added: 2, known: 1, error: null,
  sources: [{ id: 'nl-fraudehelpdesk', ok: true, kept: 3, total: 10 }, { id: 'fr-ameli', ok: false, kept: 0, total: 0, error: 'HTTP 404' }] };

test('the collector reports a run; only its token may', async () => {
  assert.equal((await run(RUN, 'd'.repeat(40))).status, 401);
  assert.equal((await run({ ...RUN, sources: [{ id: 'not an id' }] })).status, 400);
  const r = await run(RUN);
  assert.equal(r.status, 201);
});
test('the owner reads the last runs, newest first, with each source result', async () => {
  await run({ ...RUN, ok: false, error: 'sending failed: HTTP 503', added: 0 });
  assert.equal((await w.fetch('/v1/review/runs', { headers: { cookie: stranger } })).status, 403);
  const r = await w.fetch('/v1/review/runs', { headers: { cookie: owner } });
  assert.equal(r.status, 200);
  const { runs } = await r.json();
  assert.equal(runs.length, 2);
  assert.equal(runs[0].ok, false); assert.equal(runs[0].error, 'sending failed: HTTP 503');
  assert.deepEqual(runs[1].sources[1], { id: 'fr-ameli', ok: false, kept: 0, total: 0, error: 'HTTP 404' });
  assert.equal(runs[1].host, 'plunder');
});
test('at most 14 runs are listed', async () => {
  for (let i = 0; i < 15; i++) await run(RUN);
  assert.equal((await (await w.fetch('/v1/review/runs', { headers: { cookie: owner } })).json()).runs.length, 14);
});
test('before migration 0009 the Runs tab gets an empty list, not an error', async () => {
  const { SCHEMA } = await import('./harness.mjs');
  const old = await makeWorker({ schema: SCHEMA.slice(0, SCHEMA.indexOf('CREATE TABLE collector_runs')) });
  try {
    const r = await old.fetch('/v1/review/runs', { headers: { cookie: owner } });
    assert.equal(r.status, 200);
    assert.deepEqual((await r.json()).runs, []);
  } finally { await old.dispose(); }
});
const flip = (c, id, allowed, csrf = true) => w.fetch(`/v1/review/sources/${id}`, { method: 'POST', headers: { cookie: c, 'content-type': 'application/json', ...(csrf ? { 'x-requested-with': 'scamdb' } : {}) }, body: JSON.stringify({ allowed }) });
const switches = async () => (await (await w.fetch('/v1/review/sources', { headers: { cookie: owner } })).json()).settings;

test('the owner switches a source off and on again; the collector reads the switches', async () => {
  let r = await flip(owner, 'de-vz-phishingradar', false);
  assert.equal(r.status, 200);
  assert.equal((await r.json()).isDefault, false);
  const s = await switches();
  assert.deepEqual(s.map((x) => [x.id, x.allowed, x.changed_by]), [['de-vz-phishingradar', false, 'u2228984']]);
  r = await w.fetch('/v1/collect/settings', { headers: { authorization: `Bearer ${TOKEN}` } });
  assert.deepEqual((await r.json()).settings, [{ id: 'de-vz-phishingradar', allowed: false }]);
  // back to the registry's default: the switch row goes away
  assert.equal((await (await flip(owner, 'de-vz-phishingradar', true)).json()).isDefault, true);
  assert.deepEqual(await switches(), []);
});
test('a source with something to read can be switched on from the page', async () => {
  assert.equal((await flip(owner, 'fr-lemonde-decodeurs', true)).status, 200);
  assert.deepEqual((await switches()).map((x) => [x.id, x.allowed]), [['fr-lemonde-decodeurs', true]]);
  await flip(owner, 'fr-lemonde-decodeurs', false);
});
test('sources with nothing to read, or lists of firms, cannot be switched on', async () => {
  const pharos = await flip(owner, 'fr-pharos', true);
  assert.equal(pharos.status, 409);
  assert.match((await pharos.json()).message, /no feed or page reader/);
  assert.equal((await flip(owner, 'fr-amf', true)).status, 409);
  assert.equal((await flip(owner, 'xx-unknown', false)).status, 404);
  assert.deepEqual(await switches(), []);
});
test('only the owner, with the CSRF header, can flip a switch; only the collector token reads them', async () => {
  assert.equal((await flip(stranger, 'de-vz-phishingradar', false)).status, 403);
  assert.equal((await flip(owner, 'de-vz-phishingradar', false, false)).status, 403);
  assert.equal((await w.fetch('/v1/review/sources/de-vz-phishingradar', { method: 'POST', headers: { 'content-type': 'application/json', 'x-requested-with': 'scamdb' }, body: '{"allowed":false}' })).status, 401);
  assert.equal((await w.fetch('/v1/collect/settings', { headers: { authorization: `Bearer ${'d'.repeat(40)}` } })).status, 401);
  assert.equal((await flip(owner, 'de-vz-phishingradar', 'no')).status, 400);
});
test('before migration 0010 switches report that they are not available', async () => {
  const { SCHEMA } = await import('./harness.mjs');
  const old = await makeWorker({ schema: SCHEMA.slice(0, SCHEMA.indexOf('CREATE TABLE source_settings')), bindings: { COLLECTOR_TOKEN: TOKEN } });
  try {
    assert.deepEqual(await (await old.fetch('/v1/review/sources', { headers: { cookie: owner } })).json(), { settings: [], switchable: false });
    assert.equal((await old.fetch('/v1/review/sources/de-vz-phishingradar', { method: 'POST', headers: { cookie: owner, 'content-type': 'application/json', 'x-requested-with': 'scamdb' }, body: '{"allowed":false}' })).status, 503);
    assert.deepEqual((await (await old.fetch('/v1/collect/settings', { headers: { authorization: `Bearer ${TOKEN}` } })).json()).settings, []);
  } finally { await old.dispose(); }
});
