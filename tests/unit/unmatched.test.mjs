import { test } from 'node:test';
import assert from 'node:assert/strict';
import { group, features, unmatched, toMarkdown } from '../../tools/unmatched.mjs';

const root = new URL('../..', import.meta.url).pathname;

test('similar unmatched scams are grouped as a candidate pattern; different ones stay apart', () => {
  const msgs = [
    { id: 'a', text: 'Your 11,430 Rewards Points will expire tonight unless redeemed, redeem now' },
    { id: 'b', text: 'Your 6,855 Rewards Points expire soon, redeem them now for gift cards' },
    { id: 'c', text: 'Hi mum, I lost my phone, this is my new number' },
  ];
  const groups = group(msgs);
  assert.deepEqual(groups.map((g) => g.map((m) => m.id).sort()), [['a', 'b'], ['c']]);
});

test('scripts without spaces are compared by two-character pieces', () => {
  assert.ok(features('ด่วนคืนเงิน').size > 1);
});

test('the queue lists only real scams with no catalogue entry, with their sources', () => {
  const list = unmatched(root);
  assert.ok(list.length > 0 && list.every((m) => m.label === 'scam' && !m.scam && m.source?.url));
  assert.match(toMarkdown(group(list)), /no known pattern/);
});
