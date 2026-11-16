import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildQuery } from '../../tools/reports.mjs';

test('list builds a safe query for a status and a limit', () => {
  const q = buildQuery('list', ['--status', 'new', '--limit', '50']);
  assert.match(q, /FROM reports WHERE status = 'new' ORDER BY created_at LIMIT 50$/);
});
test('list defaults to new reports, 200 at most', () => assert.match(buildQuery('list', []), /status = 'new' .*LIMIT 200$/));
test('list rejects an unknown status', () => assert.throws(() => buildQuery('list', ['--status', "new' OR 1=1 --"]), /status/));
test('list rejects a bad limit', () => assert.throws(() => buildQuery('list', ['--limit', '0']), /limit/));
test('list never selects the contact unless asked', () => {
  assert.doesNotMatch(buildQuery('list', []), /contact/);
  assert.match(buildQuery('list', ['--with-contact']), /contact/);
});
test('mark builds an update for valid ids', () => {
  const id = '3f2b8c1e-1d2a-4b3c-9d4e-5f6a7b8c9d0e';
  assert.equal(buildQuery('mark', ['reviewed', id]), `UPDATE reports SET status = 'reviewed' WHERE id IN ('${id}')`);
});
test('mark rejects a non-UUID id', () => assert.throws(() => buildQuery('mark', ['reviewed', '1; DROP TABLE reports']), /id/));
test('mark rejects an unknown status', () => assert.throws(() => buildQuery('mark', ['published', '3f2b8c1e-1d2a-4b3c-9d4e-5f6a7b8c9d0e']), /status/));
