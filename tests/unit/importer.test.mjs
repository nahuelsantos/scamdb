import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { TARGETS, pickNext, isDuplicate, isRejected } from '../../tools/importer.mjs';

const entry = (id, updated, extra = {}) => ({ id, country: id.split('/')[0], updated, name: { en: id }, phrases: { en: [] }, ...extra });
const repo = (entries) => ({ countries: [...new Set(entries.map((e) => e.country))].map((code) => ({ code })), entries });

test('targets start with Australia', () => assert.deepEqual(TARGETS, ['au', 'us', 'gb', 'ca', 'es', 'mx', 'br']));
test('pickNext prefers a target with no entries', () => assert.equal(pickNext(repo([entry('ar/a', '2026-11-01')]), { pending: [] }), 'au'));
test('pickNext skips pending', () => assert.equal(pickNext(repo([entry('ar/a', '2026-11-01')]), { pending: ['au'] }), 'us'));
test('pickNext falls back to the country whose newest entry is oldest', () => {
  const all = TARGETS.map((cc) => entry(`${cc}/x`, '2026-10-01'));
  all.push(entry('ar/a', '2026-01-01'), entry('gb/y', '2025-01-01'));
  assert.equal(pickNext(repo(all), { pending: [] }), 'ar');
  assert.equal(pickNext(repo(all), { pending: ['ar'] }), 'au');
});
test('pickNext throws when everything is pending', () => {
  const r = repo([entry('ar/a', '2026-11-01')]);
  assert.throws(() => pickNext(r, { pending: [...TARGETS, 'ar'] }), /nothing to import/);
});

const existing = [entry('au/parcel', '2026-11-01', { name: { en: 'Fake parcel delivery text' },
  phrases: { en: ['parcel on hold', 'pay the redelivery fee', 'missed delivery', 'tracking link', 'customs fee'] } })];
test('isDuplicate by name', () =>
  assert.equal(isDuplicate({ country: 'au', name: { en: 'Fake parcel delivery text!' }, phrases: { en: [] } }, existing), 'au/parcel'));
test('isDuplicate by three shared phrases', () =>
  assert.equal(isDuplicate({ country: 'au', name: { en: 'Courier scam' }, phrases: { en: ['Missed delivery', 'tracking link', 'customs fee', 'other'] } }, existing), 'au/parcel'));
test('isDuplicate ignores other countries and near misses', () => {
  assert.equal(isDuplicate({ country: 'us', name: { en: 'Fake parcel delivery text' }, phrases: { en: [] } }, existing), null);
  assert.equal(isDuplicate({ country: 'au', name: { en: 'Courier scam' }, phrases: { en: ['missed delivery', 'tracking link'] } }, existing), null);
});
test('isRejected by slug or by name', () => {
  const rejected = [{ country: 'au', slug: 'toll-road', name: 'Unpaid toll text', date: '2026-11-20' }];
  assert.equal(isRejected({ country: 'au', slug: 'toll-road', name: 'whatever' }, rejected), true);
  assert.equal(isRejected({ country: 'au', slug: 'other', name: 'Unpaid toll text.' }, rejected), true);
  assert.equal(isRejected({ country: 'us', slug: 'toll-road', name: 'x' }, rejected), false);
});
test('sources.json lists official https sources for every target', () => {
  const s = JSON.parse(readFileSync(new URL('../../importer/sources.json', import.meta.url)));
  for (const cc of TARGETS) {
    assert.ok(s[cc]?.length, cc);
    assert.ok(s[cc].some((x) => x.kind === 'official'), cc);
    for (const x of s[cc]) { assert.match(x.url, /^https:\/\//, `${cc} ${x.url}`); assert.ok(x.name, cc); assert.ok(['official', 'news'].includes(x.kind)); }
  }
});
test('rejected.json is a list', () => assert.ok(Array.isArray(JSON.parse(readFileSync(new URL('../../importer/rejected.json', import.meta.url))))));
