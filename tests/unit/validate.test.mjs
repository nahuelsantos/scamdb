import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validateRepo } from '../../tools/validate.mjs';
import { loadRepo } from '../../lib/load.js';

const OK = new URL('../fixtures/repo-ok/', import.meta.url).pathname;
const base = JSON.parse(readFileSync(join(OK, 'data/ar/scams/ejemplo.json')));

/** Copies the valid fixture repo, writes one entry file (patched), returns the errors. */
function errorsWith(fileName, patch) {
  const dir = mkdtempSync(join(tmpdir(), 'scamdb-'));
  cpSync(OK, dir, { recursive: true });
  const slug = fileName.replace(/\.json$/, '');
  const entry = { ...structuredClone(base), id: `ar/${slug}`, ...patch(structuredClone(base)) };
  writeFileSync(join(dir, 'data/ar/scams', fileName), JSON.stringify(entry));
  const errors = validateRepo(dir);
  rmSync(dir, { recursive: true });
  return errors.join('\n');
}

test('the valid fixture repo has no errors', () => assert.deepEqual(validateRepo(OK), []));
test('loadRepo reads entries sorted by id, with their path', () => {
  const repo = loadRepo(OK);
  assert.deepEqual(repo.entries.map((e) => e.id), ['ar/ejemplo', 'br/exemplo']);
  assert.equal(repo.entries[0]._path, 'data/ar/scams/ejemplo.json');
  assert.equal(Object.keys(repo.entries[0]).includes('_path'), false);
  assert.equal(repo.contacts.get('ar')[0].id, 'ar/ufeci');
});

test('rejects a bad slug', () => assert.match(errorsWith('Mi Estafa.json', () => ({ id: 'ar/Mi Estafa' })), /slug/));
test('rejects an id that does not match the file', () =>
  assert.match(errorsWith('id-mismatch.json', () => ({ id: 'ar/otra' })), /id must be ar\/id-mismatch/));
test('rejects an entry without sources', () => assert.match(errorsWith('no-source.json', () => ({ sources: [] })), /sources/));
test('rejects an http source', () =>
  assert.match(errorsWith('http-source.json', (e) => ({ sources: [{ ...e.sources[0], url: 'http://x.com' }] })), /https:\/\//));
test('rejects an undated source', () =>
  assert.match(errorsWith('undated-source.json', (e) => ({ sources: [{ ...e.sources[0], date: 'ayer' }] })), /date/));
test('rejects a wa.me link in an example', () =>
  assert.match(errorsWith('wa-link.json', () => ({ examples: [{ text: { es: 'escribime a wa.me/5491155551234' } }] })),
    /data\/ar\/scams\/wa-link\.json: examples\[0\]\.text\.es has a real link/));
test('rejects a short link in an example', () =>
  assert.match(errorsWith('short-link.json', () => ({ examples: [{ text: { es: 'Ganaste! entrá a bit.ly/premio' } }] })),
    /examples\[0\]\.text\.es has a real link/));
test('rejects a real phone number in an example', () =>
  assert.match(errorsWith('phone.json', () => ({ examples: [{ text: { es: 'llamá al 11 5555-1234 ya' } }] })), /real phone/));
test('rejects an unknown signal', () =>
  assert.match(errorsWith('unknown-signal.json', () => ({ signals: ['vibes'] })), /unknown signal "vibes"/));
test('rejects fewer than 5 phrases', () =>
  assert.match(errorsWith('few-phrases.json', () => ({ phrases: { es: ['uno dos', 'tres cuatro', 'cinco seis', 'siete ocho'] } })), /at least 5 phrases/));
test('rejects an unknown contact', () =>
  assert.match(errorsWith('bad-reportTo.json', () => ({ reportTo: ['ar/nadie'] })), /unknown contact "ar\/nadie"/));
test('rejects fields that are not in the schema', () =>
  assert.match(errorsWith('extra-field.json', () => ({ isNew: true })), /additional property "isNew"/));
test('rejects a phrase that shrinks to a common word', () =>
  assert.match(errorsWith('stop-phrase.json', (e) => ({ phrases: { es: [...e.phrases.es, 'que por'] } })), /phrase "que por"/));
test('rejects an unknown related id', () =>
  assert.match(errorsWith('bad-related.json', () => ({ related: ['ar/fantasma'] })), /unknown related "ar\/fantasma"/));
test('rejects a cheap-TLD scam domain', () =>
  assert.match(errorsWith('cheap-tld.json', () => ({ examples: [{ text: { es: 'Reclamá en mercadopago-reclamos.xyz ahora' } }] })), /real link/));
test('rejects wa.link and a path on an unknown TLD', () => {
  assert.match(errorsWith('walink.json', () => ({ examples: [{ text: { es: 'escribime wa.link/abc' } }] })), /real link/);
  assert.match(errorsWith('top.json', () => ({ examples: [{ text: { es: 'entrá a cuenta.top/x' } }] })), /real link/);
});
test('rejects a dotted phone number', () =>
  assert.match(errorsWith('dotted.json', () => ({ examples: [{ text: { es: 'llamá al 11.5555.1234' } }] })), /real phone/));
test('checks the story too', () =>
  assert.match(errorsWith('story.json', () => ({ story: { es: 'Le escribieron desde banco-galicia.online y cayó.' } })), /story\.es has a real link/));
test('checks steps and red flags too', () =>
  assert.match(errorsWith('steps.json', (e) => ({ steps: [e.steps[0], { text: { es: 'Te manda premios.shop' } }] })), /steps\[1\]\.text\.es has a real link/));
test('does not flag a missing space after a period, or money amounts', () => {
  const errs = errorsWith('ok-text.json', () => ({ story: { es: 'El Sr. Pérez.Me dijo que transfirió $3.600.000 y después 70.000.' } }));
  assert.doesNotMatch(errs, /real link|real phone/);
});
test('rejects a contact web way that is not https', () => {
  const dir = mkdtempSync(join(tmpdir(), 'scamdb-'));
  cpSync(OK, dir, { recursive: true });
  const p = join(dir, 'data/ar/contacts.json');
  const c = JSON.parse(readFileSync(p));
  c.contacts[0].ways.push({ type: 'web', value: 'javascript:alert(1)' });
  writeFileSync(p, JSON.stringify(c));
  const errs = validateRepo(dir).join('\n');
  rmSync(dir, { recursive: true });
  assert.match(errs, /ways\[2\]\.value must start with https:\/\//);
});

// Source age: active needs a source from the 2 years before `updated`; anything not archived, from the 5 years before.
const withSource = (date, status, updated = '2026-11-16') => (e) => ({ status, updated, sources: [{ ...e.sources[0], date }] });
test('an active scam with a source from the last 2 years is fine', () =>
  assert.doesNotMatch(errorsWith('recent.json', withSource('2025-01-10', 'active')), /source/));
test('an active scam whose newest source is over 2 years old must be fading', () =>
  assert.match(errorsWith('old-active.json', withSource('2024-06-01', 'active')), /active scam needs a source from the 2 years before updated/));
test('a fading scam can have sources up to 5 years old', () =>
  assert.doesNotMatch(errorsWith('fading.json', withSource('2022-01-01', 'fading')), /years before updated/));
test('a scam whose newest source is over 5 years old must be archived', () =>
  assert.match(errorsWith('too-old.json', withSource('2021-01-01', 'fading')), /needs a source from the 5 years before updated/));
test('an archived scam can be older than 5 years', () =>
  assert.doesNotMatch(errorsWith('archived.json', withSource('2019-01-01', 'archived')), /years before updated/));
