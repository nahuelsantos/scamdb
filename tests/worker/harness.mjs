// Test harness: the Worker in Miniflare with an in-memory D1 and stub static assets.
import { Miniflare } from 'miniflare';
import { mkdtempSync, writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';

const ROOT = new URL('../../', import.meta.url).pathname;
export const SCHEMA = ['0001_init.sql', '0002_key_enc.sql', '0003_check_prints.sql', '0004_catalogue_vectors.sql', '0005_report_tags.sql', '0006_feed_access.sql', '0007_report_outcome.sql', '0008_source_items.sql', '0009_collector_runs.sql'].map((f) => readFileSync(join(ROOT, 'migrations', f), 'utf8').replace(/^--.*$/gm, '')).join(';\n');

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

export async function makeWorker({ fetchMock = defaultFetch, bindings = {}, schema = SCHEMA } = {}) {
  const assets = mkdtempSync(join(tmpdir(), 'scamdb-assets-'));
  writeFileSync(join(assets, 'index.html'), '<p>STATIC</p>');
  writeFileSync(join(assets, '404.html'), '<p>STATIC 404</p>');
  // A tiny catalogue for /v1/isitascam, in the shape the build writes.
  const put = (path, data) => { mkdirSync(dirname(join(assets, path)), { recursive: true }); writeFileSync(join(assets, path), JSON.stringify(data)); };
  put('v1/index.json', { version: 't.1', data: {} });
  put('assets/entries.json', { version: 't.1', signals: [{ id: 'asks_for_code', label: { en: 'Asks for a code', es: 'Te pide un código' } }, { id: 'urgency', label: { en: 'Rushes you' } }],
    entries: [
      { id: 'ar/whatsapp-codigo', country: 'ar', name: { es: 'Robo de WhatsApp con el código', en: 'WhatsApp theft with the code' }, phrases: { es: ['codigo de whatsapp', 'me pidieron un codigo', 'robo de whatsapp', 'codigo por mensaje', 'te llega un codigo'], en: ['whatsapp code', 'they asked me for a code', 'whatsapp theft', 'code by text', 'read me the code'] }, signals: ['asks_for_code'] },
      { id: 'au/parcel', country: 'au', name: { en: 'Parcel delivery text' }, phrases: { en: ['parcel delivery text', 'redelivery fee link', 'update my address', 'parcel on hold', 'courier text link'] }, signals: [] },
    ] });
  put('v1/brands.json', { version: 't.1', data: [{ id: 'anses', name: 'ANSES', countries: ['ar'], aliases: ['anses'] }, { id: 'whatsapp', name: 'WhatsApp', countries: ['ar', 'au'], aliases: ['whatsapp'] }] });
  put('v1/scams/ar/whatsapp-codigo.json', { version: 't.1', data: { id: 'ar/whatsapp-codigo', country: 'ar', whatToDo: { es: ['No leas el código'], en: ['Never read out the code'] } } });
  const mf = new Miniflare({
    modules: true,
    modulesRoot: ROOT,
    scriptPath: join(ROOT, 'worker/index.js'),
    modulesRules: [{ type: 'ESModule', include: ['**/*.js'] }],
    compatibilityDate: '2026-08-01', // newest date this Miniflare's runtime supports; production uses wrangler.jsonc's
    d1Databases: ['DB'],
    bindings: Object.fromEntries(Object.entries({ IP_SALT: 'salt-salt-salt-salt', SESSION_SECRET: 'x'.repeat(32), GITHUB_CLIENT_ID: 'cid', GITHUB_CLIENT_SECRET: 'csecret',
      TURNSTILE_SECRET: '1x0000000000000000000000000000000AA', TURNSTILE_SECRET_SITE: '1x0000000000000000000000000000000AA', ...bindings }).filter(([, v]) => v !== undefined)),
    assets: { directory: assets, binding: 'ASSETS', routerConfig: { has_user_worker: true }, assetConfig: { not_found_handling: '404-page' } },
    outboundService: fetchMock,
  });
  const db = await mf.getD1Database('DB');
  for (const stmt of schema.split(';').map((s) => s.trim()).filter(Boolean)) await db.prepare(stmt).run();
  return {
    mf, db,
    fetch: (path, init = {}) => mf.dispatchFetch('https://scamdb.dev' + path, { redirect: 'manual', ...init }),
    dispose: () => mf.dispose(),
  };
}
