import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { makeWorker } from './harness.mjs';
import { handle } from '../../worker/index.js';

const w = await makeWorker();
after(() => w.dispose());

test('wrangler.jsonc runs the Worker only on the dynamic paths', () => {
  const cfg = JSON.parse(readFileSync(new URL('../../wrangler.jsonc', import.meta.url), 'utf8').replace(/^\s*\/\/.*$/gm, ''));
  assert.deepEqual(cfg.assets.run_worker_first, ['/v1/reports', '/v1/keys*', '/auth/*']);
  assert.equal(cfg.main, 'worker/index.js');
  assert.equal(cfg.d1_databases[0].binding, 'DB');
  assert.deepEqual(cfg.triggers.crons, ['17 4 * * *']);
});
test('a path the Worker does not handle falls through to the static assets', async () => {
  const r = await handle(new Request('https://scamdb.dev/whatever'), { ASSETS: { fetch: async () => new Response('STATIC') } });
  assert.equal(await r.text(), 'STATIC');
});
test('OPTIONS /v1/reports answers CORS', async () => {
  const r = await w.fetch('/v1/reports', { method: 'OPTIONS' });
  assert.equal(r.status, 204);
  assert.equal(r.headers.get('access-control-allow-origin'), '*');
  assert.match(r.headers.get('access-control-allow-methods'), /POST/);
});
test('an unexpected failure returns a JSON 500 without details', async () => {
  const env = { DB: { prepare() { throw new Error('boom'); } }, IP_SALT: 's', TURNSTILE_SECRET: 'x' };
  const r = await handle(new Request('https://scamdb.dev/v1/reports', { method: 'POST', headers: { 'content-type': 'application/json',
    authorization: 'Bearer sk_' + 'a'.repeat(43) }, body: JSON.stringify({ text: 'hola', country: 'ar' }) }), env);
  assert.equal(r.status, 500);
  const body = await r.json();
  assert.equal(body.error, 'internal');
  assert.doesNotMatch(JSON.stringify(body), /boom/);
});
test('the migration creates the four tables', async () => {
  const { results } = await w.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE '\\_%' ESCAPE '\\' AND name NOT LIKE 'sqlite%' ORDER BY name").all();
  assert.deepEqual(results.map((r) => r.name), ['hits', 'keys', 'reports', 'usage']);
});
