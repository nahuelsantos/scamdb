import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sketch } from '../../lib/sketch.js';

const draw = (seed) => { const s = sketch(seed); return s.rect(10, 10, 100, 60) + s.circle(50, 50, 40) + s.line(0, 0, 90, 10); };

test('same seed gives the same SVG', () => assert.equal(draw(7), draw(7)));
test('different seeds differ', () => assert.notEqual(draw(7), draw(8)));
test('no colour attributes, only classes', () => {
  const s = sketch(1);
  const svg = s.rect(0, 0, 50, 50, { fill: 'card', shade: true }) + s.path('M0 0 L10 10', { kind: 'acc' });
  assert.doesNotMatch(svg, /stroke="#|fill="#|currentColor|stroke="[a-z]/);
  assert.match(svg, /class="sk"/);
  assert.match(svg, /class="sk-acc"/);
});
test('shade adds hatching paths', () => assert.match(sketch(2).circle(30, 30, 50, { shade: true }), /class="sk-shade"/));
test('a card fill comes first', () => assert.match(sketch(3).rect(0, 0, 40, 40, { fill: 'card' }), /^<path class="sk-fill-card"/));
test('thin lines get their own class', () => assert.match(sketch(4).line(0, 0, 10, 0, { kind: 'thin' }), /class="sk-thin"/));
test('dashed lines carry a dash pattern', () => assert.match(sketch(5).path('M0 0 L100 0', { dash: [2, 10] }), /stroke-dasharray="2 10"/));
test('coordinates have at most one decimal', () => {
  for (const [, d] of draw(9).matchAll(/ d="([^"]+)"/g)) assert.doesNotMatch(d, /\d\.\d{2,}/);
});
