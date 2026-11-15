import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildApi, datasetMeta, changesFromGit } from '../../tools/build-api.mjs';
import { loadRepo } from '../../lib/load.js';

const OK = new URL('../fixtures/repo-ok/', import.meta.url).pathname;
const meta = { version: '2026-11-15.abc1234', builtAt: '2026-11-15T12:00:00Z' };

function build() {
  const out = mkdtempSync(join(tmpdir(), 'scamdb-api-'));
  const written = buildApi(loadRepo(OK), out, meta, OK);
  return { out, written, json: (p) => JSON.parse(readFileSync(join(out, p))) };
}

test('writes exactly the static endpoint files', () => {
  const { out, written } = build();
  assert.deepEqual([...written].sort(), [
    'v1/ar/contacts.json', 'v1/ar/scams.json', 'v1/br/contacts.json', 'v1/br/scams.json',
    'v1/changes.json', 'v1/countries.json', 'v1/index.json', 'v1/scamdb.zip',
    'v1/scams.json', 'v1/scams/ar/ejemplo.json', 'v1/scams/br/exemplo.json', 'v1/signals.json',
  ]);
  for (const p of written) assert.ok(existsSync(join(out, p)), p);
  rmSync(out, { recursive: true });
});
test('every JSON file carries license, attribution and version', () => {
  const { out, written, json } = build();
  for (const p of written.filter((p) => p.endsWith('.json'))) {
    const j = json(p);
    assert.equal(j.license, 'CC BY 4.0', p);
    assert.equal(j.attribution, 'scamdb.dev · CC BY 4.0', p);
    assert.equal(j.version, meta.version, p);
  }
  rmSync(out, { recursive: true });
});
test('one entry file holds that entry', () => {
  const { out, json } = build();
  assert.equal(json('v1/scams/ar/ejemplo.json').data.id, 'ar/ejemplo');
  rmSync(out, { recursive: true });
});
test('a Portuguese-only country builds', () => {
  const { out, json } = build();
  assert.equal(json('v1/br/scams.json').data[0].name.pt, 'Golpe do filho com número novo');
  rmSync(out, { recursive: true });
});
test('index.json counts entries per country', () => {
  const { out, json } = build();
  const d = json('v1/index.json').data;
  assert.deepEqual(d.countries, [{ code: 'ar', scams: 1 }, { code: 'br', scams: 1 }]);
  assert.equal(d.total, 2);
  assert.equal(d.docs, 'https://scamdb.dev/docs/');
  rmSync(out, { recursive: true });
});
test('without git, changes fall back to each entry updated date', () => {
  const dir = mkdtempSync(join(tmpdir(), 'scamdb-nogit-'));
  cpSync(OK, dir, { recursive: true });
  const rows = changesFromGit(dir, loadRepo(dir).entries);
  assert.deepEqual(rows.map((r) => [r.id, r.change, r.date]), [['ar/ejemplo', 'edited', '2026-11-13'], ['br/exemplo', 'edited', '2026-11-13']]);
  rmSync(dir, { recursive: true });
});
test('without git, the version is marked local', () => {
  const dir = mkdtempSync(join(tmpdir(), 'scamdb-nogit-'));
  assert.match(datasetMeta(dir).version, /^\d{4}-\d{2}-\d{2}\.local$/);
  rmSync(dir, { recursive: true });
});

test('a shallow clone falls back to updated dates instead of calling everything "added"', async () => {
  const { execFileSync } = await import('node:child_process');
  const src = mkdtempSync(join(tmpdir(), 'scamdb-full-'));
  cpSync(OK, src, { recursive: true });
  const g = (cwd, ...a) => execFileSync('git', ['-C', cwd, '-c', 'user.name=t', '-c', 'user.email=t@t', ...a], { stdio: 'ignore' });
  g(src, 'init', '-q'); g(src, 'add', '.'); g(src, 'commit', '-q', '-m', 'one');
  g(src, 'commit', '-q', '--allow-empty', '-m', 'two');
  const shallow = mkdtempSync(join(tmpdir(), 'scamdb-shallow-'));
  rmSync(shallow, { recursive: true });
  execFileSync('git', ['clone', '-q', '--depth', '1', `file://${src}`, shallow], { stdio: 'ignore' });
  const rows = changesFromGit(shallow, loadRepo(shallow).entries);
  assert.deepEqual(rows.map((r) => r.change), ['edited', 'edited']);
  rmSync(src, { recursive: true }); rmSync(shallow, { recursive: true });
});
