import { test } from 'node:test';
import assert from 'node:assert/strict';
import { realLang, withRealExamples } from '../../lib/real-examples.js';
import { loadRepo } from '../../lib/load.js';

const root = new URL('../..', import.meta.url).pathname;

test('real messages go ahead of written examples, with their source; written ones stay marked synthetic', () => {
  const repo = withRealExamples(loadRepo(root), root);
  const e = repo.entries.find((x) => x.examples.some((ex) => ex.source));
  assert.ok(e, 'at least one entry has a real message');
  const firstWritten = e.examples.findIndex((ex) => ex.synthetic);
  const lastReal = e.examples.map((ex) => Boolean(ex.source)).lastIndexOf(true);
  assert.ok(firstWritten === -1 || lastReal < firstWritten, 'real messages come first');
  for (const ex of e.examples) assert.ok(ex.source ? !ex.synthetic && ex.source.url.startsWith('https://') : ex.synthetic === true);
});

test('a real message is keyed by the language it is written in', () => {
  assert.equal(realLang('Tu paquete está retenido', ['es'], 'es'), 'es');
  assert.equal(realLang('Your parcel is held at the depot, please pay the fee to release it', ['en', 'tl'], 'tl'), 'en');
  assert.equal(realLang('Pa send ng code na natanggap mo', ['en', 'tl'], 'tl'), 'tl');
  assert.equal(realLang('عميلنا العزيز تم إيقاف بطاقتك', ['ar', 'en'], 'ar'), 'ar');
});
