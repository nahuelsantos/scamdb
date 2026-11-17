import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pick, normalize, tokens, editDistance } from '../../lib/text.js';

test('pick returns the asked language', () => assert.equal(pick({ es: 'a', en: 'b' }, 'en'), 'b'));
test('pick falls back to the first language', () => assert.equal(pick({ es: 'a' }, 'en'), 'a'));
test('pick works with a non-Spanish entry', () => assert.equal(pick({ pt: 'b' }, 'es'), 'b'));
test('pick of nothing is undefined', () => assert.equal(pick(undefined), undefined));
test('normalize strips accents and punctuation', () => assert.equal(normalize('¿Código?'), 'codigo'));
test('tokens drop filler words', () => assert.deepEqual(tokens('que me pidieron un codigo'), ['pidieron', 'codigo']));
test('editDistance counts one typo', () => assert.equal(editDistance('codigo', 'codgo', 1), 1));

import { normalize as norm, foldChar } from '../../lib/text.js';
test('normalize keeps every alphabet and folds special letters (for European languages)', () => {
  assert.equal(norm('Straße'), 'strasse');
  assert.equal(norm('Łódź przelew'), 'lodz przelew');
  assert.equal(norm('København Æble Øre'), 'kobenhavn aeble ore');
  assert.equal(norm('İstanbul ışık'), 'istanbul isik');
  assert.equal(norm('Ελληνική Αστυνομία'), 'ελληνικη αστυνομια');
  assert.equal(norm('λογαριασμός'), 'λογαριασμοσ', 'final sigma folds to σ');
  assert.equal(norm('Кіберполіція'), 'кіберполіція');
  assert.equal(norm('Pague €1,99 o £20'), 'pague €1 99 o £20');
  assert.equal(norm('¡Ñandú, café!'), 'nandu cafe', 'Spanish unchanged');
  assert.equal(foldChar('ß'), 'ss');
});
test('the evidence map stays aligned with non-Latin text', async () => {
  const { readSignsWithEvidence } = await import('../../packages/matcher/index.js');
  const ev = readSignsWithEvidence('Привет! Pay the fee today €5');
  assert.ok(ev.some((s) => s.id === 'money_request' && /fee|€5/.test(s.evidence)));
  assert.ok(ev.some((s) => s.id === 'urgency' && s.evidence === 'today'));
});
