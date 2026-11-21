// The AI runs after the response: POST answers at once with the matcher's verdict and ai.status "pending"; the AI
// answer comes from GET /v1/isitascam/{id}, for the same key only. The Worker is called directly here, with a fake
// Workers AI and an in-memory stand-in for the Cache API, because Miniflare cannot fake the AI binding.
import { test, after, before } from 'node:test';
import assert from 'node:assert/strict';
import { makeWorker } from './harness.mjs';
import { handle } from '../../worker/index.js';
import { sign } from '../../worker/session.js';
import { MODELS } from '../../worker/scorer.js';

const w = await makeWorker();
after(() => w.dispose());
const store = new Map();
before(() => {
  globalThis.caches = { default: {
    put: async (req, res) => { store.set(req.url, await res.text()); },
    match: async (req) => (store.has(req.url) ? new Response(store.get(req.url)) : undefined),
  } };
});
const fakeAI = (delayMs = 0) => ({
  run: async (model, input) => {
    await new Promise((r) => setTimeout(r, delayMs));
    if (model === MODELS.embed) return { data: input.text.map(() => [1, 0]) };
    return { response: { verdict: 'scam', score: 0.97, signals: [{ id: 'asks_for_code', evidence: 'read me the 6-digit code' }] } };
  },
});
const env = (ai) => ({ DB: w.db, AI: ai, ASSETS: { fetch: (req) => w.fetch(new URL(typeof req === 'string' ? req : req.url).pathname) },
  IP_SALT: 'salt-salt-salt-salt', SESSION_SECRET: 'x'.repeat(32), BURST_CHECKS: '1000' });
const keyFor = async (githubId) => {
  const session = `scamdb_session=${await sign({ githubId, login: `k${githubId}`, exp: Date.now() + 3600000 }, 'x'.repeat(32))}`;
  return (await (await w.fetch('/v1/keys', { method: 'POST', headers: { cookie: session, 'x-requested-with': 'scamdb' } })).json()).key;
};
const TEXT = "This is your bank's fraud team. To protect your money, read me the 6-digit code we just sent you.";
const post = (key, body, e, ctx) => handle(new Request('https://scamdb.dev/v1/isitascam', { method: 'POST',
  headers: { 'content-type': 'application/json', authorization: `Bearer ${key}`, 'cf-connecting-ip': '198.51.100.40' }, body: JSON.stringify(body) }), e, ctx);
const get = (key, id, e) => handle(new Request(`https://scamdb.dev/v1/isitascam/${id}`, { headers: key ? { authorization: `Bearer ${key}` } : {} }), e, {});

test('with a key, the check answers at once and the AI answer follows on GET', async () => {
  const key = await keyFor(501);
  const pending = [];
  // The AI stays blocked until the test lets it go: the answer can only arrive if it does not wait for the AI.
  let release;
  const gate = new Promise((ok) => { release = ok; });
  const ai = { run: async (model, input) => { await gate; return fakeAI().run(model, input); } };
  const e = env(ai);
  const r = await post(key, { text: TEXT }, e, { waitUntil: (p) => pending.push(p) });
  assert.equal(r.status, 200);
  const first = await r.json();
  assert.equal(first.engine.scorer, 'matcher');
  assert.equal(first.ai.status, 'pending');
  assert.match(first.ai.poll, /^https:\/\/scamdb\.dev\/v1\/isitascam\/[0-9a-f-]{36}$/);
  // Before the AI is done: 202 pending.
  const early = await get(key, first.ai.id, e);
  assert.equal(early.status, 202);
  release();
  await Promise.all(pending);
  const done = await get(key, first.ai.id, e);
  assert.equal(done.status, 200);
  const final = await done.json();
  assert.equal(final.ai.status, 'done');
  assert.equal(final.engine.scorer, 'workers-ai');
  assert.equal(typeof final.score, 'number');
});
test('another key cannot read the AI answer, and no key gets 401', async () => {
  const key = await keyFor(502), other = await keyFor(503);
  const pending = [];
  const e = env(fakeAI());
  const first = await (await post(key, { text: TEXT + ' a' }, e, { waitUntil: (p) => pending.push(p) })).json();
  await Promise.all(pending);
  assert.equal((await get(other, first.ai.id, e)).status, 404);
  assert.equal((await get(null, first.ai.id, e)).status, 401);
});
test('wait: true keeps the single call with the AI score', async () => {
  const key = await keyFor(504);
  const r = await post(key, { text: TEXT + ' b', wait: true }, env(fakeAI()), { waitUntil: () => assert.fail('nothing runs after the response') });
  const body = await r.json();
  assert.equal(body.engine.scorer, 'workers-ai');
  assert.equal(body.ai, undefined);
});
test('when the AI fails in the background, the stored answer says failed and keeps the matcher verdict', async () => {
  const key = await keyFor(505);
  const pending = [];
  const e = env({ run: async () => { throw new Error('boom'); } });
  const first = await (await post(key, { text: TEXT + ' c' }, e, { waitUntil: (p) => pending.push(p) })).json();
  await Promise.all(pending);
  const final = await (await get(key, first.ai.id, e)).json();
  assert.equal(final.ai.status, 'failed');
  assert.equal(final.verdict, first.verdict);
});
test('keyless checks never get an ai field', async () => {
  const r = await handle(new Request('https://scamdb.dev/v1/isitascam', { method: 'POST', headers: { 'content-type': 'application/json', 'cf-connecting-ip': '198.51.100.41' },
    body: JSON.stringify({ text: TEXT + ' d' }) }), env(fakeAI()), { waitUntil: () => assert.fail('no AI without a key') });
  assert.equal((await r.json()).ai, undefined);
});
