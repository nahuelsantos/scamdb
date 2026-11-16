// Test harness: the Worker in Miniflare with an in-memory D1 and stub static assets.
import { Miniflare } from 'miniflare';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ROOT = new URL('../../', import.meta.url).pathname;
export const SCHEMA = readFileSync(join(ROOT, 'migrations/0001_init.sql'), 'utf8');

/** Default outbound stub: Turnstile token "ok" passes; GitHub answers a fixed user. */
export async function defaultFetch(request) {
  const url = new URL(request.url);
  if (url.hostname === 'challenges.cloudflare.com') {
    const form = await request.formData();
    return Response.json({ success: form.get('response') === 'ok' });
  }
  if (url.hostname === 'github.com' && url.pathname === '/login/oauth/access_token') return Response.json({ access_token: 't' });
  if (url.hostname === 'api.github.com' && url.pathname === '/user') return Response.json({ id: 42, login: 'ana' });
  return new Response('unexpected outbound ' + url, { status: 599 });
}

export async function makeWorker({ fetchMock = defaultFetch, bindings = {} } = {}) {
  const assets = mkdtempSync(join(tmpdir(), 'scamdb-assets-'));
  writeFileSync(join(assets, 'index.html'), '<p>STATIC</p>');
  writeFileSync(join(assets, '404.html'), '<p>STATIC 404</p>');
  const mf = new Miniflare({
    modules: true,
    modulesRoot: ROOT,
    scriptPath: join(ROOT, 'worker/index.js'),
    modulesRules: [{ type: 'ESModule', include: ['**/*.js'] }],
    compatibilityDate: '2026-08-01', // newest date this Miniflare's runtime supports; production uses wrangler.jsonc's
    d1Databases: ['DB'],
    bindings: Object.fromEntries(Object.entries({ IP_SALT: 'salt-salt-salt-salt', SESSION_SECRET: 'x'.repeat(32), GITHUB_CLIENT_ID: 'cid', GITHUB_CLIENT_SECRET: 'csecret',
      TURNSTILE_SECRET: '1x0000000000000000000000000000000AA', ...bindings }).filter(([, v]) => v !== undefined)),
    assets: { directory: assets, binding: 'ASSETS', routerConfig: { has_user_worker: true }, assetConfig: { not_found_handling: '404-page' } },
    outboundService: fetchMock,
  });
  const db = await mf.getD1Database('DB');
  for (const stmt of SCHEMA.split(';').map((s) => s.trim()).filter(Boolean)) await db.prepare(stmt).run();
  return {
    mf, db,
    fetch: (path, init = {}) => mf.dispatchFetch('https://scamdb.dev' + path, { redirect: 'manual', ...init }),
    dispose: () => mf.dispose(),
  };
}
