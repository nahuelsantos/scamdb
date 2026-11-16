import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fingerprint, distance, NEAR_BITS } from '../../worker/probes.js';

const base = 'Hi Mum, I dropped my phone, this is my new number. Can you transfer $900 today? I will pay you back tomorrow';
test('a fingerprint is 16 hex digits and stable', () => {
  assert.match(fingerprint(base), /^[0-9a-f]{16}$/);
  assert.equal(fingerprint(base), fingerprint(base));
  assert.equal(fingerprint(base), fingerprint(base.toUpperCase()), 'case and punctuation do not matter');
});
test('small edits stay near; different messages are far', () => {
  for (const v of [base.replace('Mum', 'Mom'), base.replace('$900', '$950'), base.replace('today', 'now'), base + ' x']) {
    assert.ok(distance(fingerprint(base), fingerprint(v)) <= NEAR_BITS, v);
  }
  for (const other of ['Your parcel is waiting at the depot, pick it up before Friday', 'Meeting moved to 3pm, room 4', 'Your verification code is 1234, do not share it']) {
    assert.ok(distance(fingerprint(base), fingerprint(other)) > NEAR_BITS, other);
  }
});
