import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('weekly check steps that pipe into tee keep the real exit code', () => {
  const yml = readFileSync(new URL('../../.github/workflows/weekly-check.yml', import.meta.url), 'utf8');
  const steps = yml.split(/\n(?=      - )/).filter((s) => /\|\s*tee /.test(s));
  assert.equal(steps.length, 2);
  for (const s of steps) assert.match(s, /shell: bash|set -o pipefail/);
});
