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
