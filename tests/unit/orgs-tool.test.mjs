import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildQuery } from '../../tools/orgs.mjs';

test('approve and revoke build safe SQL', () => {
  assert.equal(buildQuery('approve', ['ana-cert', "CERT d'Exemple"]), "UPDATE keys SET feed = 1, org = 'CERT d''Exemple' WHERE github_login = 'ana-cert'");
  assert.equal(buildQuery('revoke', ['ana-cert']), "UPDATE keys SET feed = 0 WHERE github_login = 'ana-cert'");
  assert.match(buildQuery('list', []), /^SELECT github_login, org, feed/);
});
test('bad input is refused before any SQL is built', () => {
  assert.throws(() => buildQuery('approve', ["x'; DROP TABLE keys; --", 'Org']));
  assert.throws(() => buildQuery('approve', ['ana', 'Org; DROP']));
  assert.throws(() => buildQuery('delete', ['ana']));
});
