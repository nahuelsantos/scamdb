import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reportsToMessages, mergeReports, isExpired } from '../../lib/private-eval.js';
import { checkMessages } from '../../lib/eval.js';

const row = (id, status, created_at = '2026-11-01T10:00:00Z', extra = {}) => ({ id, status, created_at, country: 'ar', channel: 'whatsapp', text: 'Hola, soy del banco, decime el código que te llegó', scam_id: null, ...extra });

test('reports become private messages only after a person reviews them', () => {
  const m = reportsToMessages([row('a', 'reviewed'), row('b', 'promoted', undefined, { scam_id: 'ar/falso-banco' }), row('c', 'rejected'), row('d', 'new')]);
  assert.deepEqual(m.map((x) => x.label), ['scam', 'scam', 'safe']);
  assert.equal(m[1].scam, 'ar/falso-banco');
  assert.equal(m[2].scam, null);
  assert.ok(m.every((x) => x.from === 'report' && /^p-ar-r[0-9a-f]{10}$/.test(x.id)));
  assert.ok(m.every((x) => !JSON.stringify(x).includes('"a"') && x.report.length === 64), 'the report id is stored only as a hash');
});

test('a report copy expires 180 days after the report, like the report itself', () => {
  const [m] = reportsToMessages([row('a', 'reviewed', '2026-11-01T10:00:00Z')]);
  assert.equal(m.expires, '2027-04-30');
  assert.ok(!isExpired(m, '2027-04-30'));
  assert.ok(isExpired(m, '2027-05-01'));
});

test('merging skips reports already copied and drops expired copies', () => {
  const [a] = reportsToMessages([row('a', 'reviewed', '2026-01-01T00:00:00Z')]);
  const [b] = reportsToMessages([row('b', 'reviewed', '2026-11-01T00:00:00Z')]);
  const merged = mergeReports([b], [b, a], '2026-11-18');
  assert.deepEqual(merged.map((x) => x.report), [b.report], 'b once; a (from January) has expired');
});

test('an uncatalogued report copy passes the set checks', () => {
  const m = reportsToMessages([row('a', 'reviewed')]);
  assert.deepEqual(checkMessages(m, new Set()), []);
});
