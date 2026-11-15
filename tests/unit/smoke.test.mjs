import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('package is an ES module on Node 22+', () => {
  const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url)));
  assert.equal(pkg.type, 'module');
  assert.equal(pkg.engines.node, '>=22');
});
