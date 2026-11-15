// Hand-drawn icons, generated at build time in the pen-and-shading style (lib/sketch.js).
import { sketch } from '../../lib/sketch.js';

const svg = (inner, size = 64) => `<svg class="ic" viewBox="0 0 ${size} ${size}" aria-hidden="true" focusable="false">${inner}</svg>`;

/** Draws one icon: `parts` is a list of [shape, ...args, opts?] run through a sketcher with its own seed. */
function icon(seed, parts, extra = '') {
  const s = sketch(seed);
  return svg(parts.map(([shape, ...args]) => s[shape](...args)).join('') + extra);
}

export const ICONS = {
  phone: icon(101, [
    ['path', 'M20 14 c-6 3-8 12-2 22 s16 18 23 18 c4 0 7-3 8-6 l-9-7 c-3 1-4 3-7 1 s-8-8-9-11 c0-3 2-4 3-6 z', { fill: 'card', shade: true }],
    ['path', 'M40 12 c6 1 10 5 12 11 M38 20 c3 1 5 3 6 6', { kind: 'acc' }],
  ]),
  sms: icon(111, [
    ['rect', 10, 14, 44, 30, { fill: 'card', shade: true }],
    ['path', 'M18 44 l-4 10 12-10'],
    ['path', 'M18 24 h28 M18 32 h18', { kind: 'thin' }],
  ], '<text x="45" y="39" class="t-code">6</text>'),
  house: icon(121, [
    ['path', 'M16 26 v26 h32 v-26', { fill: 'card', shade: true }],
    ['path', 'M10 30 L32 12 L54 30'],
    ['rect', 27, 36, 10, 16],
    ['path', 'M46 6 v8 M46 18 v1', { kind: 'acc' }],
  ]),
  bank: icon(131, [
    ['path', 'M8 24 L32 10 L56 24 Z', { fill: 'card', shade: true }],
    ['path', 'M14 28 v20 M24 28 v20 M40 28 v20 M50 28 v20 M8 52 h48'],
    ['circle', 32, 38, 10, { kind: 'acc' }],
  ]),
  screen: icon(141, [
    ['rect', 10, 14, 44, 30, { fill: 'card', shade: true }],
    ['path', 'M24 52 h16 M32 44 v8'],
    ['path', 'M26 26 l6 6 -6 6 M34 38 h6', { kind: 'acc' }],
  ]),
  card: icon(151, [
    ['rect', 8, 18, 48, 30, { fill: 'card', shade: true }],
    ['path', 'M8 26 h48'],
    ['path', 'M16 38 h12', { kind: 'acc' }],
  ]),
  heart: icon(161, [
    ['path', 'M32 52 C 14 40, 8 30, 14 20 c5-7 14-6 18 2 c4-8 13-9 18-2 c6 10 0 20-18 32 z', { fill: 'card', shade: true }],
    ['path', 'M44 14 l6-6 M48 20 l8-2', { kind: 'acc' }],
  ]),
  ticket: icon(171, [
    ['path', 'M10 20 h44 v8 a4 4 0 0 0 0 8 v8 h-44 v-8 a4 4 0 0 0 0-8 z', { fill: 'card', shade: true }],
    ['path', 'M40 22 v20', { kind: 'thin' }],
    ['path', 'M18 28 l12 8 M30 28 l-12 8', { kind: 'acc' }],
  ]),
  chart: icon(181, [
    ['path', 'M10 52 h46 M12 52 V12'],
    ['path', 'M14 44 L26 32 L34 38 L52 16', { kind: 'acc' }],
    ['path', 'M44 16 h8 v8'],
  ]),
  gift: icon(191, [
    ['rect', 12, 26, 40, 26, { fill: 'card', shade: true }],
    ['path', 'M10 20 h44 v6 h-44 z M32 20 v32'],
    ['path', 'M32 20 c-4-10-16-8-10 0 M32 20 c4-10 16-8 10 0', { kind: 'acc' }],
  ]),
  cart: icon(201, [
    ['path', 'M8 12 h8 l6 28 h28 l4-18 H20'],
    ['circle', 26, 50, 6], ['circle', 46, 50, 6],
    ['path', 'M30 28 h14', { kind: 'acc' }],
  ]),
  briefcase: icon(211, [
    ['rect', 10, 20, 44, 30, { fill: 'card', shade: true }],
    ['path', 'M24 20 v-6 h16 v6 M10 32 h44'],
    ['circle', 32, 32, 6, { kind: 'acc' }],
  ]),
};

const RULES = [
  [/banco|mercado-pago|transferencia|prestamo/, (id) => (/banco|transferencia/.test(id) ? 'bank' : 'card')],
  [/cuento|alquiler/, () => 'house'],
  [/remoto/, () => 'screen'],
  [/romantica/, () => 'heart'],
  [/entradas/, () => 'ticket'],
  [/inversion|trabajo/, () => 'chart'],
  [/premio/, () => 'gift'],
  [/tienda|mercado-libre|comprobante/, () => 'cart'],
  [/correo|anses|arca/, () => 'briefcase'],
];

/** The drawing for an entry: by its id first, then by channel. */
export function iconFor(entry) {
  for (const [re, name] of RULES) if (re.test(entry.id)) return ICONS[name(entry.id)];
  if ((entry.channels ?? []).some((c) => c === 'whatsapp' || c === 'sms')) return ICONS.sms;
  return ICONS.phone;
}

/** Drawings for the steps of a script, by warning sign: a shaded circle with a small pen icon. */
function step(seed, parts, extra = '') {
  const s = sketch(seed);
  const inner = s.circle(38, 38, 66, { fill: 'card', shade: true }) + parts.map(([shape, ...args]) => s[shape](...args)).join('');
  return `<svg viewBox="0 0 80 80" aria-hidden="true" focusable="false">${inner}${extra}</svg>`;
}
export const STEP_ICONS = {
  impersonation: step(301, [['path', 'M27 24 c-4 2-5 8-1 15 s11 13 16 13 c3 0 5-2 6-4 l-6-5 c-2 1-3 2-5 1 s-6-6-7-8 c0-2 1-3 2-4 z'], ['path', 'M46 22 c4 1 7 4 8 8', { kind: 'thin' }]]),
  asks_for_code: step(311, [['rect', 22, 27, 32, 23], ['path', 'M22 29 l16 12 16-12']], '<text x="56" y="26" class="t-code">6</text>'),
  remote_access: step(321, [['rect', 21, 24, 34, 23], ['path', 'M31 54 h14 M38 47 v7'], ['path', 'M30 32 l5 4 -5 4', { kind: 'acc' }]]),
  urgency: step(331, [['circle', 38, 41, 30], ['path', 'M38 33 v9 l6 4'], ['path', 'M33 21 h10 M38 21 v5', { kind: 'thin' }]]),
  money_request: step(341, [['rect', 18, 28, 40, 22], ['circle', 38, 39, 10], ['path', 'M24 34 v10 M52 34 v10', { kind: 'thin' }]]),
  unknown_link: step(351, [['path', 'M33 43 l-5 5 a6 6 0 0 1 -9 -9 l7 -7 a6 6 0 0 1 9 0'], ['path', 'M43 33 l5 -5 a6 6 0 0 1 9 9 l-7 7 a6 6 0 0 1 -9 0'], ['path', 'M33 43 l10 -10', { kind: 'acc' }]]),
  new_number: step(361, [['rect', 28, 18, 20, 38], ['path', 'M34 50 h8', { kind: 'acc' }]], '<text x="50" y="26" class="t-code">+</text>'),
  secrecy: step(371, [['path', 'M24 40 c6-8 22-8 28 0 c-6 8-22 8-28 0 z'], ['path', 'M22 52 L54 26', { kind: 'acc' }]]),
  keep_on_line: step(381, [['path', 'M24 30 c8-6 20-6 28 0'], ['path', 'M28 36 c6-4 14-4 20 0'], ['circle', 38, 46, 6, { kind: 'acc' }]]),
  too_good_to_be_true: step(391, [['path', 'M38 20 l5 11 12 1 -9 8 3 12 -11-6 -11 6 3-12 -9-8 12-1 z']]),
  plain: step(401, [['path', 'M24 40 h24'], ['path', 'M42 33 l8 7 -8 7']]),
  end: step(411, [['rect', 25, 36, 26, 20], ['path', 'M31 36 v-6 a8 8 0 0 1 15 -3'], ['circle', 38, 46, 4]]),
};
