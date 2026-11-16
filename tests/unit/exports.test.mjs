import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toCsv, toAtom, CSV_COLUMNS } from '../../lib/exports.js';

const entries = [
  { id: 'es/dgt', country: 'es', lang: 'es', status: 'active', name: { en: 'Fake "DGT" fine, pay now', es: 'Multa falsa de la DGT' }, channels: ['sms'], steps: [{ signal: 'urgency' }, { signal: 'unknown_link' }, { signal: 'urgency' }], updated: '2026-11-10', how: { en: 'A text says you have a fine & must pay <today>.' } },
  { id: 'au/x', country: 'au', lang: 'en', status: 'fading', name: { en: 'Line one,\nline two' }, channels: ['email', 'sms'], steps: [], updated: '2026-10-01' },
];
test('CSV: a BOM, the header, one row per entry, quoting and joined lists', () => {
  const csv = toCsv(entries);
  assert.ok(csv.startsWith('﻿' + CSV_COLUMNS.join(',')));
  const lines = csv.slice(1).trim().split('\r\n');
  assert.equal(lines.length, 3);
  assert.ok(lines[1].startsWith('es/dgt,es,es,active,"Fake ""DGT"" fine, pay now",Multa falsa de la DGT,sms,urgency|unknown_link,2026-11-10,'));
  assert.ok(csv.includes('"Line one,\nline two"'));
  assert.ok(lines.at(-1).includes(',email|sms,'));
});
test('Atom: valid escaping, newest first, a link per entry', () => {
  const atom = toAtom([{ id: 'es/dgt', change: 'added', date: '2026-11-10' }, { id: 'gone/x', change: 'edited', date: '2026-11-01' }], entries);
  assert.match(atom, /^<\?xml version="1.0" encoding="utf-8"\?>\n<feed xmlns="http:\/\/www.w3.org\/2005\/Atom">/);
  assert.ok(atom.includes('<title>New (ES): Fake &quot;DGT&quot; fine, pay now</title>'));
  assert.ok(atom.includes('must pay &lt;today&gt;.'));
  assert.ok(atom.includes('<link rel="alternate" href="https://scamdb.dev/catalogue/es/dgt/"/>'));
  assert.ok(!atom.includes('gone/x'), 'changes for missing entries are skipped');
  assert.equal((atom.match(/<entry>/g) ?? []).length, 1);
});
