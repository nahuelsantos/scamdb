import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { migrateScam, overlayFrom } from '../../tools/migrate-eschamuyo.mjs';

const old = JSON.parse(readFileSync(new URL('../fixtures/eschamuyo/scams.json', import.meta.url)));

test('migrateScam turns an eschamuyo scam into a scamdb entry', () => {
  const e = migrateScam(old.scams[0], '2026-11-13');
  assert.equal(e.id, 'ar/whatsapp-codigo');
  assert.equal(e.country, 'ar');
  assert.equal(e.status, 'active');
  assert.deepEqual(e.examples, [{ text: old.scams[0].example }]);
  assert.deepEqual(e.sources, old.scams[0].sources);
  assert.equal(e.updated, '2026-11-13');
  assert.equal('isNew' in e, false);
  assert.equal('example' in e, false);
});
test('migrateScam leaves steps, signals and reportTo for the author', () => {
  const e = migrateScam(old.scams[0], '2026-11-13');
  assert.deepEqual([e.steps, e.signals, e.reportTo], [[], [], []]);
});
test('overlayFrom keeps eschamuyo order and isNew flags', () => {
  const o = overlayFrom(old);
  assert.equal(o.order.length, 20);
  assert.equal(o.order[0], 'whatsapp-codigo');
  assert.equal(typeof o.isNew['whatsapp-codigo'], 'boolean');
});
