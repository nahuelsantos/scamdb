import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { toEschamuyo } from '../../tools/to-eschamuyo.mjs';
import { loadRepo } from '../../lib/load.js';

const fx = (f) => JSON.parse(readFileSync(new URL(`../fixtures/eschamuyo/${f}`, import.meta.url)));
const entries = loadRepo(new URL('../../', import.meta.url).pathname).entries;
const overlay = fx('overlay.json');

test('round trip: scamdb data gives back eschamuyo scams.json exactly', () =>
  assert.deepEqual(toEschamuyo(entries, overlay, '2026-11-15'), fx('scams.json')));

test('a new entry not in the overlay goes last, not new', () => {
  const extra = { ...structuredClone(entries[0]), id: 'ar/zz-nueva' };
  const out = toEschamuyo([...entries, extra], overlay, '2026-11-13');
  assert.equal(out.scams.at(-1).id, 'zz-nueva');
  assert.equal(out.scams.at(-1).isNew, false);
});

test('archived entries and other countries are left out', () => {
  const archived = { ...structuredClone(entries[0]), status: 'archived' };
  const other = { ...structuredClone(entries[1]), id: 'br/x', country: 'br' };
  const out = toEschamuyo([archived, other], overlay, '2026-11-13');
  assert.deepEqual(out.scams, []);
});
