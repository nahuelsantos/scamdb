import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { callbackFor } from '../../worker/github.js';

const cfg = JSON.parse(readFileSync(new URL('../../wrangler.jsonc', import.meta.url), 'utf8').replace(/^\s*\/\/.*$/gm, ''));
const req = (url) => new Request(url);

test('production always signs in on scamdb.dev, whatever host the request came in on', () => {
  assert.equal(callbackFor(req('https://scamdb.workers.dev/auth/github'), {}), 'https://scamdb.dev/auth/github/callback');
  assert.equal(callbackFor(req('https://scamdb.dev/auth/github'), { ENVIRONMENT: 'production' }), 'https://scamdb.dev/auth/github/callback');
});
test('a UAT preview signs in on its own URL', () => {
  assert.equal(callbackFor(req('https://uat-scamdb.acct.workers.dev/auth/github?x=1'), { ENVIRONMENT: 'uat' }), 'https://uat-scamdb.acct.workers.dev/auth/github/callback');
});
test('previews use their own database, never production', () => {
  const prod = cfg.d1_databases.find((d) => d.binding === 'DB');
  const uat = cfg.previews.d1_databases.find((d) => d.binding === 'DB');
  assert.ok(uat, 'previews need a DB binding');
  assert.notEqual(uat.database_id, prod.database_id);
  assert.notEqual(uat.database_name, prod.database_name);
});
test('previews say they are UAT, keep the AI binding, and carry no routes or crons', () => {
  assert.equal(cfg.preview_urls, true, 'without it Previews get no URL');
  assert.equal(cfg.previews.vars.ENVIRONMENT, 'uat');
  assert.equal(cfg.previews.ai.binding, 'AI');
  assert.equal(cfg.previews.routes, undefined);
  assert.equal(cfg.previews.triggers, undefined);
});
test('preview URLs are not indexed', () => {
  assert.match(readFileSync(new URL('../../site/_headers', import.meta.url), 'utf8'), /https:\/\/:\w+\.:\w+\.workers\.dev\/\*\n\s+X-Robots-Tag: noindex/);
});
