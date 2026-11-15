import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateRepo } from '../../tools/validate.mjs';
import { loadRepo } from '../../lib/load.js';

const ROOT = new URL('../../', import.meta.url).pathname;

test('the real data is valid', () => assert.deepEqual(validateRepo(ROOT), []));
test('there are exactly 20 Argentine entries', () => assert.equal(loadRepo(ROOT).entries.length, 20));
test('every entry has its script, signals and who to report to', () => {
  for (const e of loadRepo(ROOT).entries) {
    assert.ok(e.steps.length >= 2, `${e.id} steps`);
    assert.ok(e.signals.length >= 1, `${e.id} signals`);
    assert.ok(e.reportTo.length >= 1, `${e.id} reportTo`);
  }
});
