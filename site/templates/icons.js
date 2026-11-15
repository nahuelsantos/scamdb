// Hand-drawn icons (64×64). Strokes use the .d / .d-thin / .d-acc classes; the #rough filter makes them wobble.
const svg = (inner) => `<svg class="ic" viewBox="0 0 64 64" aria-hidden="true" focusable="false">${inner}</svg>`;

export const ICONS = {
  phone: svg('<path class="d" d="M20 14 c-6 3-8 12-2 22 s16 18 23 18 c4 0 7-3 8-6 l-9-7 c-3 1-4 3-7 1 s-8-8-9-11 c0-3 2-4 3-6 z"/><path class="d-acc" d="M40 12 c6 1 10 5 12 11 M38 20 c3 1 5 3 6 6"/>'),
  sms: svg('<rect class="d f-card" x="10" y="14" width="44" height="30" rx="6"/><path class="d" d="M18 44 l-4 10 12-10"/><path class="d-thin" d="M18 24 h28 M18 32 h18"/><text x="44" y="38" class="t-code">6</text>'),
  house: svg('<path class="d" d="M10 30 L32 12 54 30"/><path class="d f-card" d="M16 26 v26 h32 v-26"/><rect class="d" x="27" y="36" width="10" height="16"/><path class="d-acc" d="M46 6 v8 M46 18 v.5"/>'),
  bank: svg('<path class="d" d="M8 24 L32 10 56 24 z"/><path class="d" d="M14 28 v20 M24 28 v20 M40 28 v20 M50 28 v20"/><path class="d" d="M8 52 h48"/><circle class="d-acc" cx="32" cy="38" r="5"/>'),
  screen: svg('<rect class="d f-card" x="10" y="14" width="44" height="30" rx="3"/><path class="d" d="M24 52 h16 M32 44 v8"/><path class="d-acc" d="M26 26 l6 6 -6 6 M34 38 h6"/>'),
  card: svg('<rect class="d f-card" x="8" y="18" width="48" height="30" rx="4"/><path class="d" d="M8 26 h48"/><path class="d-acc" d="M16 38 h12"/>'),
  heart: svg('<path class="d f-card" d="M32 52 C 14 40, 8 30, 14 20 c5-7 14-6 18 2 c4-8 13-9 18-2 c6 10 0 20-18 32 z"/><path class="d-acc" d="M44 14 l6-6 M48 20 l8-2"/>'),
  ticket: svg('<path class="d f-card" d="M10 20 h44 v8 a4 4 0 0 0 0 8 v8 h-44 v-8 a4 4 0 0 0 0-8 z"/><path class="d-thin" d="M40 20 v24" stroke-dasharray="3 3"/><path class="d-acc" d="M18 28 l12 8 M30 28 l-12 8"/>'),
  chart: svg('<path class="d" d="M10 52 h46 M12 52 V12"/><path class="d-acc" d="M14 44 L26 32 34 38 52 16"/><path class="d" d="M44 16 h8 v8"/>'),
  gift: svg('<rect class="d f-card" x="12" y="26" width="40" height="26" rx="2"/><path class="d" d="M10 20 h44 v6 h-44 z M32 20 v32"/><path class="d-acc" d="M32 20 c-4-10-16-8-10 0 M32 20 c4-10 16-8 10 0"/>'),
  cart: svg('<path class="d" d="M8 12 h8 l6 28 h28 l4-18 H20"/><circle class="d" cx="26" cy="50" r="3"/><circle class="d" cx="46" cy="50" r="3"/><path class="d-acc" d="M30 28 h14"/>'),
  briefcase: svg('<rect class="d f-card" x="10" y="20" width="44" height="30" rx="3"/><path class="d" d="M24 20 v-6 h16 v6 M10 32 h44"/><circle class="d-acc" cx="32" cy="32" r="3"/>'),
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

/** Small drawings for the steps of a script, by warning sign. */
const step = (inner) => `<svg viewBox="0 0 76 76" aria-hidden="true" focusable="false"><circle class="d f-card" cx="38" cy="38" r="34"/>${inner}</svg>`;
export const STEP_ICONS = {
  impersonation: step('<path class="d" d="M27 24 c-4 2-5 8-1 15 s11 13 16 13 c3 0 5-2 6-4 l-6-5 c-2 1-3 2-5 1 s-6-6-7-8 c0-2 1-3 2-4 z"/><path class="d-thin" d="M46 22 c4 1 7 4 8 8"/>'),
  asks_for_code: step('<rect class="d" x="22" y="27" width="32" height="23" rx="3"/><path class="d" d="M22 29 l16 12 16-12"/><text x="56" y="26" class="t-code">6</text>'),
  remote_access: step('<rect class="d" x="21" y="24" width="34" height="23" rx="2"/><path class="d" d="M31 54 h14 M38 47 v7"/><path class="d-acc" d="M30 32 l5 4 -5 4"/>'),
  urgency: step('<circle class="d" cx="38" cy="40" r="15"/><path class="d" d="M38 32 v9 l6 4"/><path class="d-thin" d="M33 20 h10 M38 20 v5"/>'),
  money_request: step('<rect class="d" x="18" y="28" width="40" height="22" rx="3"/><circle class="d" cx="38" cy="39" r="5"/><path class="d-thin" d="M24 34 v10 M52 34 v10"/>'),
  unknown_link: step('<path class="d" d="M33 43 l-5 5 a6 6 0 0 1 -9 -9 l7 -7 a6 6 0 0 1 9 0"/><path class="d" d="M43 33 l5 -5 a6 6 0 0 1 9 9 l-7 7 a6 6 0 0 1 -9 0"/><path class="d-acc" d="M33 43 l10 -10"/>'),
  new_number: step('<rect class="d" x="28" y="18" width="20" height="38" rx="4"/><path class="d-acc" d="M34 50 h8"/><text x="50" y="26" class="t-code">+</text>'),
  secrecy: step('<path class="d" d="M24 40 c6-8 22-8 28 0 c-6 8-22 8-28 0 z"/><path class="d-acc" d="M22 52 L54 26"/>'),
  keep_on_line: step('<path class="d" d="M24 30 c8-6 20-6 28 0"/><path class="d" d="M28 36 c6-4 14-4 20 0"/><circle class="d-acc" cx="38" cy="46" r="3"/>'),
  too_good_to_be_true: step('<path class="d" d="M38 20 l5 11 12 1 -9 8 3 12 -11-6 -11 6 3-12 -9-8 12-1 z"/>'),
  plain: step('<path class="d" d="M24 40 h24"/><path class="d" d="M42 33 l8 7 -8 7"/>'),
  end: step('<rect class="d" x="25" y="36" width="26" height="20" rx="3"/><path class="d" d="M31 36 v-6 a8 8 0 0 1 15 -3"/><circle class="f-ink" cx="38" cy="46" r="2.4"/>'),
};
