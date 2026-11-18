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
test('tokens drop Portuguese, French and Dutch filler words but keep words that matter in English', () => {
  assert.deepEqual(tokens('Dit is het nummer van een vriend voor ons'), ['nummer', 'vriend']);
  assert.deepEqual(tokens('Votre colis est dans notre dépôt pour vous'), ['colis', 'notre', 'depot']);
  assert.deepEqual(tokens('my son at the door'), ['son', 'door']);
});
test('every STOP word is already in normalised form (otherwise it can never match a token)', async () => {
  const { STOP } = await import('../../lib/text.js');
  assert.deepEqual([...STOP].filter((w) => normalize(w) !== w), []);
});

test('normalize keeps Devanagari vowel signs (they are combining marks, not accents)', async () => {
  const { normalize } = await import('../../lib/text.js');
  assert.equal(normalize('आपका पार्सल रोक दिया गया है'), 'आपका पारसल रोक दिया गया है');
  assert.equal(normalize('Ça va? Łódź'), 'ca va lodz');
});
test('Arabic hamza and alef maqsura fold to their plain letters', async () => {
  const { normalize } = await import('../../lib/text.js');
  assert.equal(normalize('أي إلى آخر'), 'اي الي اخر');
  assert.equal(normalize('تعذّر 50 درهماً'), 'تعذر 50 درهما');
});
test('Hangul, kana and CJK are kept whole (no jamo split, voicing marks kept)', async () => {
  const { normalize } = await import('../../lib/text.js');
  assert.equal(normalize('검찰청 수사관입니다!'), '검찰청 수사관입니다');
  assert.equal(normalize('ギフトカードで支払って。'), 'ギフトカードで支払って');
  assert.equal(normalize('Café'), 'cafe');
});
