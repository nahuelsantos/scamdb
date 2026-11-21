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

test('a report copy keeps no expiry, like the redacted text the report keeps', () => {
  const [m] = reportsToMessages([row('a', 'reviewed', '2026-01-01T00:00:00Z')]);
  assert.equal(m.expires, undefined);
  assert.ok(!isExpired(m, '2030-01-01'));
});

test('merging skips reports already copied and still drops copies that carry an expiry', () => {
  const [a] = reportsToMessages([row('a', 'reviewed', '2026-01-01T00:00:00Z')]);
  const [b] = reportsToMessages([row('b', 'reviewed', '2026-11-01T00:00:00Z')]);
  const old = { ...a, report: 'z'.repeat(64), expires: '2026-06-30' };
  const merged = mergeReports([b, old], [b, a], '2026-11-18');
  assert.deepEqual(merged.map((x) => x.report), [b.report, a.report]);
});

test('an uncatalogued report copy passes the set checks', () => {
  const m = reportsToMessages([row('a', 'reviewed')]);
  assert.deepEqual(checkMessages(m, new Set()), []);
});

test("before review, the reporter's answer labels the report; 'not sure' alone does not", async () => {
  const { reportsToMessages } = await import('../../lib/private-eval.js');
  const base = { country: 'ar', created_at: '2026-11-01T00:00:00Z', status: 'new', text: 'Tu codigo de verificacion es 123456, no lo compartas' };
  const [g] = reportsToMessages([{ ...base, id: 'g', outcome: 'genuine' }]);
  const [s] = reportsToMessages([{ ...base, id: 's', outcome: 'scam' }]);
  assert.equal(g.label, 'safe');
  assert.equal(s.label, 'scam');
  assert.equal(reportsToMessages([{ ...base, id: 'u', outcome: 'unsure' }]).length, 0);
  assert.equal(reportsToMessages([{ ...base, id: 'r', status: 'rejected', outcome: 'scam' }])[0].label, 'safe', 'the review wins');
});

test('a report whose country is unknown (xx) is not copied into the private set', () => {
  assert.deepEqual(reportsToMessages([{ id: 'x', country: 'xx', status: 'reviewed', created_at: '2026-11-01T00:00:00Z', text: 'Su paquete está retenido, pague [link]' }]), []);
});
