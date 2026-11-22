// The real path: checks answer from the local copy of the counts (worker/mirror.js) and write the database after the
// answer. The Worker is called directly, with an in-memory Cache API and a database whose batch can be held back.
import { test, after, before } from 'node:test';
import assert from 'node:assert/strict';
import { makeWorker } from './harness.mjs';
import { handle } from '../../worker/index.js';

const w = await makeWorker();
after(() => w.dispose());
let store;
before(() => {
  store = new Map();
  globalThis.caches = { default: {
    put: async (req, res) => { store.set(req.url, await res.text()); },
    match: async (req) => (store.has(req.url) ? new Response(store.get(req.url)) : undefined),
    delete: async (req) => store.delete(req.url),
  } };
});
// A database whose batches wait for `gate` when given one.
const heldDb = (gate) => new Proxy(w.db, { get: (db, k) => (k === 'batch' ? async (s) => { if (gate) await gate; return db.batch(s); } : typeof db[k] === 'function' ? db[k].bind(db) : db[k]) });
const env = (db = w.db) => ({ DB: db, ASSETS: { fetch: (req) => w.fetch(new URL(typeof req === 'string' ? req : req.url).pathname) }, IP_SALT: 'salt-salt-salt-salt', SESSION_SECRET: 'x'.repeat(32) });
const check = (ip, text, e, ctx) => handle(new Request('https://scamdb.dev/v1/isitascam', { method: 'POST', headers: { 'content-type': 'application/json', 'cf-connecting-ip': ip },
  body: JSON.stringify({ text }) }), e, ctx);
const words = ['parcel', 'invoice', 'refund', 'lottery', 'dentist', 'library', 'garden', 'tickets', 'insurance', 'pension', 'charity', 'airport'];

test('a check answers while the database write is still waiting, and the write happens after', async () => {
  let release;
  const gate = new Promise((ok) => { release = ok; });
  const pending = [];
  const r = await check('198.51.100.60', 'your parcel is waiting, pay the fee here', env(heldDb(gate)), { waitUntil: (p) => pending.push(p) });
  assert.equal(r.status, 200, 'answered without the database');
  const before = await w.db.prepare("SELECT count(*) AS n FROM check_prints WHERE subject LIKE 'ip:%'").first();
  release();
  await Promise.all(pending);
  const after = await w.db.prepare("SELECT count(*) AS n FROM check_prints WHERE subject LIKE 'ip:%'").first();
  assert.equal(after.n, before.n + 1, 'the database got the check afterwards');
});
test('the daily limit holds from the local copy, even before any database write lands', async () => {
  let release;
  const gate = new Promise((ok) => { release = ok; });
  const pending = [];
  const e = env(heldDb(gate)), ctx = { waitUntil: (p) => pending.push(p) };
  const codes = [];
  for (let i = 0; i < 11; i++) codes.push((await check('198.51.100.61', `a message about the ${words[i]} number ${i}`, e, ctx)).status);
  assert.deepEqual(codes.slice(0, 10), Array(10).fill(200));
  assert.equal(codes[10], 429);
  release();
  await Promise.all(pending);
  const row = await w.db.prepare("SELECT sum(count) AS n FROM hits WHERE bucket LIKE 'isitascam:ip:%' AND bucket NOT LIKE '%@%'").first();
  assert.ok(row.n >= 11, 'the database counted every check, the refused one too');
});
test('near-identical messages are refused from the local copy too', async () => {
  const pending = [];
  const e = env(heldDb(new Promise(() => {}))), ctx = { waitUntil: (p) => pending.push(p) };
  const base = 'Your Netflix payment failed, update your card within 24 hours or your account will be closed';
  const codes = [];
  for (let i = 0; i < 6; i++) codes.push((await check('198.51.100.62', `${base} ${'!'.repeat(i)}`, e, ctx)).status);
  assert.deepEqual(codes, [200, 200, 200, 200, 200, 429]);
});
test('when the database answers, its exact counts replace a copy that was behind', async () => {
  // The database already holds 9 checks for this IP today (made elsewhere); the copy here knows nothing yet.
  const pending = [];
  const ip = '198.51.100.63';
  const e = env(), ctx = { waitUntil: (p) => pending.push(p) };
  assert.equal((await check(ip, 'first message about the garden', e, ctx)).status, 200);
  await Promise.all(pending);
  const bucketRow = (await w.db.prepare("SELECT bucket FROM hits WHERE bucket LIKE 'isitascam:ip:%' AND count = 1 AND bucket NOT LIKE '%@%' ORDER BY rowid DESC LIMIT 1").first());
  await w.db.prepare('UPDATE hits SET count = 9 WHERE bucket = ?').bind(bucketRow.bucket).run();
  pending.length = 0;
  assert.equal((await check(ip, 'second message about the library', e, ctx)).status, 200, 'the copy said 1, so this one passes');
  await Promise.all(pending); // the database said 10: the copy is now 10
  assert.equal((await check(ip, 'third message about the airport', e, ctx)).status, 429);
});
