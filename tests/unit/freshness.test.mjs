import { test } from 'node:test';
import assert from 'node:assert/strict';
import { freshness, toMarkdown } from '../../tools/freshness.mjs';

const e = (id, status, date) => ({ id, status, sources: [{ date }], _path: `data/x/scams/${id}.json` });

test('freshness: statuses due against today, not against the entry\'s own updated date', () => {
  const r = freshness([e('x/new', 'active', '2026-01-01'), e('x/old', 'active', '2024-01-01'), e('x/ancient', 'fading', '2021-01-01'), e('x/gone', 'archived', '2015-01-01')], '2026-11-17');
  assert.deepEqual(r.changes.map((c) => [c.id, c.due]), [['x/old', 'fading'], ['x/ancient', 'archived']]);
  assert.ok(!r.changes.some((c) => c.id === 'x/gone'), 'archived entries stay archived');
});

test('freshness: active entries that fade within 90 days are listed before they fade', () => {
  const r = freshness([e('x/soon', 'active', '2024-12-01')], '2026-11-17');
  assert.deepEqual(r.changes, []);
  assert.deepEqual(r.soon.map((s) => s.id), ['x/soon']);
  assert.match(toMarkdown(r), /x\/soon/);
});
