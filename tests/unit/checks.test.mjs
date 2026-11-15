import { test } from 'node:test';
import assert from 'node:assert/strict';
import { collectLinks } from '../../tools/check-links.mjs';
import { contactPattern } from '../../tools/check-contacts.mjs';
import { loadRepo } from '../../lib/load.js';

const OK = new URL('../fixtures/repo-ok/', import.meta.url).pathname;

test('collectLinks lists every https link once, with where it came from', () => {
  const links = collectLinks(loadRepo(OK));
  const urls = links.map((l) => l.url);
  assert.equal(new Set(urls).size, urls.length);
  assert.deepEqual(urls.sort(), ['https://chequeado.com/nota', 'https://g1.globo.com/nota', 'https://www.gov.br/', 'https://www.mpf.gob.ar/ufeci/']);
  assert.equal(links.find((l) => l.url === 'https://chequeado.com/nota').where, 'data/ar/scams/ejemplo.json');
});
test('a phone number matches with spaces instead of hyphens', () => assert.ok(contactPattern('0810-666-4444').test('Llamá al 0810 666 4444')));
test('a phone number with brackets matches without them', () => assert.ok(contactPattern('(011) 5071-0040').test('011 5071 0040')));
test('a phone number with letters matches the digits around them', () => assert.ok(contactPattern('0800 33 (FISCAL) 347225').test('0800-33-FISCAL (347225)')));
test('an email matches literally', () => assert.ok(contactPattern('denunciasufeci@mpf.gov.ar').test('x denunciasufeci@mpf.gov.ar y')));
test('a different number does not match', () => assert.equal(contactPattern('0810-666-4444').test('0810 666 4445'), false));
