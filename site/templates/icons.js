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
    ['path', 'M18 24 h28 M18 32 h18', { kind: 'acc' }],
  ]),
  house: icon(121, [
    ['path', 'M16 26 v26 h32 v-26', { fill: 'card', shade: true }],
    ['path', 'M10 30 L32 12 L54 30'],
    ['rect', 27, 36, 10, 16],
    ['path', 'M46 6 v8 M46 18 v1', { kind: 'acc' }],
  ]),
  bank: icon(131, [
    ['rect', 10, 26, 44, 26, { fill: 'card', shade: true }],
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
    ['path', 'M14 44 L26 32 L34 38 L52 16 V52 H14 Z', { fill: 'card', shade: true }],
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
  parcel: icon(221, [
    ['path', 'M10 22 L32 12 L54 22 L54 46 L32 56 L10 46 Z', { fill: 'card', shade: true }],
    ['path', 'M10 22 L32 32 L54 22 M32 32 V56'],
    ['path', 'M21 17 L43 27', { kind: 'acc' }],
  ]),
  official: icon(231, [
    ['path', 'M32 8 L52 16 V30 c0 13-9 21-20 26 c-11-5-20-13-20-26 V16 Z', { fill: 'card', shade: true }],
    ['path', 'M24 31 l6 6 11-12', { kind: 'acc' }],
  ]),
  family: icon(241, [
    ['circle', 22, 20, 11, { fill: 'card', shade: true }],
    ['circle', 43, 26, 8, { fill: 'card' }],
    ['path', 'M6 54 c0-13 7-20 16-20 s16 7 16 20 Z', { fill: 'card', shade: true }],
    ['path', 'M34 54 c1-10 4-15 9-15 s11 5 11 15'],
    ['path', 'M50 6 v10 M45 11 h10', { kind: 'acc' }],
  ]),
  briefcase: icon(211, [
    ['rect', 10, 20, 44, 30, { fill: 'card', shade: true }],
    ['path', 'M24 20 v-6 h16 v6 M10 32 h44'],
    ['circle', 32, 32, 6, { kind: 'acc' }],
  ]),
};

// The kind of scam, read from the entry's English name (then its id), decides the drawing. First match wins, so
// the more specific kinds come first.
const KINDS = [
  ['screen', /remote|screen.?shar|anydesk|teamviewer|tech(nical)? support|computer|virus|microsoft|apple support/],
  ['family', /family|relative|grandparent|\bchild\b|\bson\b|daughter|\bmum\b|\bmom\b|\bdad\b|friend|contact|grandchild|kidnap|new number|hi mum|hey mum|cuento del t[ií]o/],
  ['heart', /romance|romantic|dating|love|sextortion|pig.?butcher|lonely/],
  ['sms', /takeover|taken over|hijack|\bvote\b|(whatsapp|line|viber|telegram|messaging|signal|instagram|facebook)\b.*\b(account|code)\b/],
  ['chart', /invest|crypto|bitcoin|trading|forex|stock|recovery|\bjob\b|\bjobs\b|employment|task|work from home|recruit|\bboss\b|\bceo\b|ponzi|pyramid|trabajo|inversion/],
  ['parcel', /parcel|package|deliver|courier|shipping|customs|post(al)? |postal|\bpost\b|dhl|fedex|ups\b|correo/],
  ['ticket', /ticket|concert|event|travel|holiday|flight|booking|hotel|entradas/],
  ['house', /rent|rental|landlord|property|apartment|housing|real estate|accommodation|alquiler|utility|electric|power bill|water bill|energy/],
  ['gift', /prize|lottery|lotto|winner|giveaway|reward|gift|inheritance|sweepstake|premio|you have won|loyalty points/],
  ['cart', /shop|store|marketplace|buyer|seller|purchase|online sale|fake website|classified|order|refund|overpay|cheap|\bsale\b|goods|luggage|receipt|boleto|olx|second.?hand|mercado libre|tienda/],
  ['official', /police|tax|government|court|immigration|visa|bonus|subsid|social security|medicare|clinic|health|doctor|hospital|charity|pension|benefit|fine|toll|traffic|customs|official|ministry|authority|bureau|agency|embassy|anses|arca|identity|\bid\b|license|licence/],
  ['card', /\bcard\b|loan|credit|wallet|e-?wallet|payment app|mercado pago|paypal|subscription|prestamo/],
  ['bank', /bank|banco|account|fraud (team|department|alert)|transfer|otp|verification code|one.?time/],
];

/** The kind of scam an entry is (an ICONS key), or null when no rule fits. */
export function kindOf(entry) {
  const name = String(entry.name?.en ?? (typeof entry.name === 'string' ? entry.name : '')).toLowerCase();
  const id = String(entry.id ?? '').split('/').pop().replace(/-/g, ' ');
  for (const text of [name, id]) for (const [kind, re] of KINDS) if (re.test(text)) return kind;
  return null;
}

/** The drawing for an entry: by its kind, then by channel. */
export function iconFor(entry) {
  const kind = kindOf(entry);
  if (kind) return ICONS[kind];
  if ((entry.channels ?? []).some((c) => c === 'whatsapp' || c === 'sms' || c === 'telegram' || c === 'social')) return ICONS.sms;
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

const GH_MARK = 'M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z';

/** Small hand-drawn UI icons (24×24) for icon buttons. Each button also carries aria-label and title. */
const ui = (seed, parts) => {
  const s = sketch(seed);
  return `<svg class="uic" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${parts.map(([shape, ...args]) => s[shape](...args)).join('')}</svg>`;
};
export const UI_ICONS = {
  eye: ui(901, [['path', 'M2 12 C 6 5, 18 5, 22 12 C 18 19, 6 19, 2 12 Z'], ['circle', 12, 12, 7]]),
  eyeOff: ui(911, [['path', 'M2 12 C 6 5, 18 5, 22 12 C 18 19, 6 19, 2 12 Z'], ['path', 'M4 20 L20 4', { kind: 'acc' }]]),
  copy: ui(921, [['rect', 8, 8, 12, 13, { fill: 'card' }], ['path', 'M5 16 V4 h11']]),
  replace: ui(931, [['path', 'M19 9 A8 8 0 1 0 20 14'], ['path', 'M20 4 v5 h-5']]),
  trash: ui(941, [['path', 'M4 6 h16 M9 6 V3 h6 v3'], ['path', 'M6 6 l1 15 h10 l1 -15']]),
  check: ui(1001, [['path', 'M4 13 l5 5 L20 6', { kind: 'acc' }]]),
  skip: ui(1011, [['path', 'M6 6 L18 18 M18 6 L6 18']]),
  external: ui(1021, [['path', 'M14 4 h6 v6 M20 4 l-9 9'], ['path', 'M18 14 v6 H4 V6 h6']]),
  signOut: ui(951, [['path', 'M14 4 H5 v16 h9'], ['path', 'M10 12 h11 M17 8 l4 4 -4 4']]),
  instagram: ui(971, [['rect', 3, 3, 18, 18, { fill: 'card' }], ['circle', 12, 12, 8], ['circle', 17.3, 6.7, 1.4, { kind: 'acc' }]]),
  x: ui(981, [['path', 'M4 4 L20 20'], ['path', 'M20 4 L4 20', { kind: 'acc' }]]),
  // GitHub's mark (github.com/logos): the shape is never redrawn. Plain for sign-in buttons; in the top bar the cat
  // is drawn in the accent colour inside a hand-drawn ring (option D, the owner's choice, 2026-11-24).
  github: '<svg class="uic" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>',
  githubNav: `<svg class="uic" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${sketch(1301).circle(12, 12, 21)}<mask id="gh-nav-cat"><circle cx="12" cy="12" r="7.6" fill="#fff"/><path transform="translate(4 4)" fill="#000" d="${GH_MARK}"/></mask><circle cx="12" cy="12" r="7.6" fill="var(--accent)" mask="url(#gh-nav-cat)"/></svg>`,
  globe: ui(981, [['circle', 12, 12, 19], ['path', 'M3 12 h18'], ['path', 'M12 2.5 C 7 7, 7 17, 12 21.5 C 17 17, 17 7, 12 2.5']]),
  send: ui(991, [['path', 'M3 12 L21 4 L15 20 L11 13 Z'], ['path', 'M11 13 L21 4', { kind: 'acc' }]]),
  key: ui(971, [['circle', 7, 12, 8], ['path', 'M11 12 h11 M18 12 v4 M21 12 v3']]),
  person: ui(1201, [['circle', 12, 7.5, 7, { kind: 'acc' }], ['path', 'M4.5 21 C 5.5 14.5, 18.5 14.5, 19.5 21']]),
};
