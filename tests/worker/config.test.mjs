import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { makeWorker } from './harness.mjs';

const noSecrets = await makeWorker({ bindings: { IP_SALT: undefined, SESSION_SECRET: undefined, GITHUB_CLIENT_ID: undefined, GITHUB_CLIENT_SECRET: undefined, TURNSTILE_SECRET: undefined } });
const weak = await makeWorker({ bindings: { SESSION_SECRET: 'short', IP_SALT: 'short' } });
after(() => { noSecrets.dispose(); weak.dispose(); });

for (const [name, w] of [['missing', noSecrets], ['too short', weak]]) {
  test(`with ${name} secrets, reports answer 503 not_configured (with CORS)`, async () => {
    const r = await w.fetch('/v1/reports', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text: 'x', country: 'ar', turnstileToken: 'ok' }) });
    assert.equal(r.status, 503);
    assert.equal((await r.json()).error, 'not_configured');
    assert.equal(r.headers.get('access-control-allow-origin'), '*');
  });
  test(`with ${name} secrets, keys and sign-in answer 503 not_configured`, async () => {
    for (const [path, method, want] of [['/v1/keys/me', 'GET', 503], ['/auth/github', 'GET', 302], ['/auth/github/callback?state=a&code=b', 'GET', 302]]) {
      const r = await w.fetch(path, { method, headers: { cookie: 'scamdb_state=a' } });
      assert.equal(r.status, want, path);
    }
  });
}
test('static fallthrough still works without secrets', async () => {
  const r = await noSecrets.fetch('/v1/reports', { method: 'OPTIONS' });
  assert.equal(r.status, 204);
});
test('sign-in that is not switched on sends you back to the account page, not to a JSON error', async () => {
  const r = await noSecrets.fetch('/auth/github');
  assert.equal(r.status, 302);
  assert.equal(r.headers.get('location'), '/account/?error=setup');
});
