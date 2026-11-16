import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { brandsIn } from '../../lib/brands.js';

const root = new URL('../..', import.meta.url).pathname;
const { brands } = JSON.parse(readFileSync(`${root}data/brands.json`, 'utf8'));
const countries = JSON.parse(readFileSync(`${root}data/countries.json`, 'utf8')).countries.map((c) => c.code);

test('brands.json: unique ids, known countries, lowercase aliases', () => {
  assert.equal(new Set(brands.map((b) => b.id)).size, brands.length);
  for (const b of brands) {
    assert.match(b.id, /^[a-z0-9-]+$/, b.id);
    assert.ok(b.name && b.aliases.length, b.id);
    assert.ok(b.countries.every((c) => countries.includes(c)), b.id);
    assert.ok(b.aliases.every((a) => a === a.toLowerCase()), b.id);
  }
  for (const cc of countries) assert.ok(brands.some((b) => b.countries.includes(cc)), `no brands for ${cc}`);
});
test('brandsIn matches whole words, accents and case aside, only for the country', () => {
  assert.deepEqual(brandsIn('Su paquete de CORREOS está retenido', brands, 'es'), ['correos']);
  assert.deepEqual(brandsIn('Seu pacote dos Correios', brands, 'br'), ['correios']);
  assert.deepEqual(brandsIn('Itaú: compra bloqueada', brands, 'br'), ['itau']);
  assert.deepEqual(brandsIn('the satellite dish', brands, 'mx'), [], 'sat only as a word');
  assert.deepEqual(brandsIn('HMRC refund', brands, 'au'), [], 'HMRC is not an au brand');
});
