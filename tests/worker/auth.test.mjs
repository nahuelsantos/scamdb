import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { makeWorker, defaultFetch } from './harness.mjs';
import { sign, verify } from '../../worker/session.js';

const SECRET = 'x'.repeat(32);
let githubFails = false;
const w = await makeWorker({ fetchMock: async (req) => (githubFails && new URL(req.url).hostname.includes('github') ? new Response('no', { status: 500 }) : defaultFetch(req)) });
after(() => w.dispose());
const cookieOf = (r, name) => (r.headers.getSetCookie?.() ?? [r.headers.get('set-cookie')]).find((c) => c?.startsWith(name + '='));

test('sign and verify round-trip', async () => {
  const t = await sign({ githubId: 42, login: 'ana', exp: Date.now() + 60000 }, SECRET);
  assert.equal((await verify(t, SECRET)).login, 'ana');
});
test('a tampered token verifies to null', async () => {
  const t = await sign({ githubId: 42, login: 'ana', exp: Date.now() + 60000 }, SECRET);
  const [body, sig] = t.split('.');
  const forged = Buffer.from(JSON.stringify({ githubId: 1, login: 'mallory', exp: Date.now() + 60000 })).toString('base64url');
  assert.equal(await verify(`${forged}.${sig}`, SECRET), null);
  assert.equal(await verify(`${body}.${sig}x`, SECRET), null);
  assert.equal(await verify('garbage', SECRET), null);
});
test('an expired token verifies to null', async () => {
  assert.equal(await verify(await sign({ githubId: 42, login: 'ana', exp: Date.now() - 1 }, SECRET), SECRET), null);
});
test('/auth/github redirects to GitHub with a state cookie', async () => {
  const r = await w.fetch('/auth/github');
  assert.equal(r.status, 302);
  const loc = new URL(r.headers.get('location'));
  assert.equal(loc.origin + loc.pathname, 'https://github.com/login/oauth/authorize');
  assert.equal(loc.searchParams.get('client_id'), 'cid');
  assert.equal(loc.searchParams.get('redirect_uri'), 'https://scamdb.dev/auth/github/callback');
  const state = cookieOf(r, 'scamdb_state');
  assert.ok(state && state.includes(loc.searchParams.get('state')));
  assert.match(state, /HttpOnly/); assert.match(state, /Secure/); assert.match(state, /SameSite=Lax/);
});
test('the callback with the matching state signs in and redirects to /account/', async () => {
  const r = await w.fetch('/auth/github/callback?code=c&state=abc', { headers: { cookie: 'scamdb_state=abc' } });
  assert.equal(r.status, 302);
  assert.equal(r.headers.get('location'), '/account/');
  const s = cookieOf(r, 'scamdb_session');
  assert.ok(s);
  const token = s.split(';')[0].split('=')[1];
  assert.equal((await verify(token, SECRET)).login, 'ana');
});
for (const [name, url, cookie] of [['missing state', '/auth/github/callback?code=c', 'scamdb_state=abc'],
  ['mismatched state', '/auth/github/callback?code=c&state=xyz', 'scamdb_state=abc'], ['no state cookie', '/auth/github/callback?code=c&state=abc', '']]) {
  test(`the callback with ${name} is refused without a session`, async () => {
    const r = await w.fetch(url, { headers: cookie ? { cookie } : {} });
    assert.equal(r.status, 400);
    assert.equal((await r.json()).error, 'bad_state');
    assert.equal(cookieOf(r, 'scamdb_session'), undefined);
  });
}
test('a GitHub failure sends you back to the account page with an error', async () => {
  githubFails = true;
  const r = await w.fetch('/auth/github/callback?code=c&state=abc', { headers: { cookie: 'scamdb_state=abc' } });
  githubFails = false;
  assert.equal(r.status, 302);
  assert.equal(r.headers.get('location'), '/account/?error=github');
});


test('logout needs the X-Requested-With header (no cross-site sign-out)', async () => {
  assert.equal((await w.fetch('/auth/logout', { method: 'POST' })).status, 403);
  const r = await w.fetch('/auth/logout', { method: 'POST', headers: { 'x-requested-with': 'scamdb' } });
  assert.equal(r.status, 204);
  assert.match(cookieOf(r, 'scamdb_session'), /Max-Age=0/);
});
test('sign-in on www moves to the main domain first', async () => {
  const r = await w.mf.dispatchFetch('https://www.scamdb.dev/auth/github', { redirect: 'manual' });
  assert.equal(r.status, 301);
  assert.equal(r.headers.get('location'), 'https://scamdb.dev/auth/github');
});
