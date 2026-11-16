import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validateRepo } from '../../tools/validate.mjs';

const OK = new URL('../fixtures/repo-ok/', import.meta.url).pathname;
const base = JSON.parse(readFileSync(join(OK, 'data/ar/scams/ejemplo.json')));
function errorsWith(patch, file = 'lang-case.json', mutateRepo) {
  const dir = mkdtempSync(join(tmpdir(), 'scamdb-'));
  cpSync(OK, dir, { recursive: true });
  if (mutateRepo) mutateRepo(dir);
  if (patch) writeFileSync(join(dir, 'data/ar/scams', file), JSON.stringify({ ...structuredClone(base), id: `ar/${file.replace('.json', '')}`, ...patch(structuredClone(base)) }));
  const e = validateRepo(dir).join('\n');
  rmSync(dir, { recursive: true });
  return e;
}

test('the fixture repo is valid with languages', () => assert.equal(errorsWith(null), ''));
test('an entry must say its original language', () => assert.match(errorsWith((e) => { delete e.lang; return { ...e, lang: undefined }; }), /missing lang|lang/));
test('a text field needs an English version', () => assert.match(errorsWith((e) => ({ how: { es: e.how.es } })), /how needs an English version \(en\)/));
test('a text field needs the original language', () => assert.match(errorsWith((e) => ({ lang: 'pt', how: { en: e.how.en } })), /how needs the original language \(pt\)/));
test('an English-original entry needs only English', () => {
  const en = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v && typeof v === 'object' && !Array.isArray(v) && 'en' in v ? { en: v.en } : v]));
  const errs = errorsWith(({ id, ...e }) => ({ ...en(e), lang: 'en', steps: e.steps.map((s) => ({ ...s, text: { en: s.text.en } })), examples: e.examples.map((x) => ({ text: { en: x.text.en } })) }), 'english-only.json');
  assert.doesNotMatch(errs, /english-only/);
});
test('a contact name needs English', () => {
  const errs = errorsWith(null, undefined, (dir) => {
    const p = join(dir, 'data/ar/contacts.json');
    const c = JSON.parse(readFileSync(p));
    c.contacts[0].name = { es: 'UFECI' };
    writeFileSync(p, JSON.stringify(c));
  });
  assert.match(errs, /name needs an English version \(en\)/);
});
