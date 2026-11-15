// Pieces shared by several pages.
import { esc, L, monthYear } from './html.js';
import { t, prefix } from '../i18n.js';
import { iconFor, STEP_ICONS } from './icons.js';
import { pick } from '../../lib/text.js';
import { sketch } from '../../lib/sketch.js';

const ROUTE_LINE = sketch(501).path('M0 30 C 80 6, 170 54, 250 30 S 420 6, 500 30 S 670 54, 750 30 S 920 8, 1000 30', { dash: [2, 10] });

export const entryUrl = (e, lang = 'en') => `${prefix(lang)}/catalogue/${e.id}/`;

/** The script of a scam as drawn steps joined by a dotted line. */
export function steps(entry, signalsById, lang = 'es', ui = 'en') {
  const items = entry.steps.map((s, i) => {
    const last = i === entry.steps.length - 1;
    const icon = STEP_ICONS[s.signal] ?? STEP_ICONS[last ? 'end' : 'plain'];
    const label = s.signal ? signalsById.get(s.signal)?.label : null;
    const flag = label ? `<span class="flag">${esc(pick(label, ui))}</span>` : `<span class="flag out">${esc(t(ui, 'whatHappens'))}</span>`;
    return `<li class="step${last && !s.signal ? ' last' : ''}"><div class="sic">${icon}</div>${flag}${L(s.text, lang, 'p')}</li>`;
  }).join('');
  return `<div class="steps-wrap"><svg class="route-line" viewBox="0 0 1000 60" preserveAspectRatio="none" aria-hidden="true" focusable="false">${ROUTE_LINE}</svg><ol class="steps" style="--n:${entry.steps.length}">${items}</ol></div>`;
}

/** A catalogue card. `lang` is the entry's language; `ui` the interface language. */
export function card(e, lang = 'es', ui = 'en') {
  const ex = e.examples[0]?.text;
  const url = entryUrl(e, ui);
  return `<article class="sp">
  <div class="sp-top"><a class="id" href="${url}">${esc(e.id)}</a>${iconFor(e)}</div>
  <h3><a href="${url}">${L(e.name, lang)}</a></h3>
  ${ex ? `<blockquote>${L(ex, lang)}</blockquote>` : ''}
  <div class="chips">${e.channels.map((c) => `<span>${esc(c)}</span>`).join('')}</div>
  <div class="count">${esc(t(ui, 'cardCount', e.signals.length, e.sources.length, monthYear(e.updated, t(ui, 'months'))))}</div>
</article>`;
}
