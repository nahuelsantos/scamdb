// Pieces shared by several pages.
import { esc, L, monthYear, plural } from './html.js';
import { iconFor, STEP_ICONS } from './icons.js';
import { pick } from '../../lib/text.js';

export const entryUrl = (e) => `/catalogue/${e.id}/`;

/** The script of a scam as drawn steps joined by a dotted line. */
export function steps(entry, signalsById, lang = 'es') {
  const items = entry.steps.map((s, i) => {
    const last = i === entry.steps.length - 1;
    const icon = STEP_ICONS[s.signal] ?? STEP_ICONS[last ? 'end' : 'plain'];
    const label = s.signal ? signalsById.get(s.signal)?.label : null;
    return `<li class="step${last && !s.signal ? ' last' : ''}"><div class="sic">${icon}</div>${label ? `<span class="flag">${esc(pick(label, 'en'))}</span>` : ''}${L(s.text, lang, 'p')}</li>`;
  }).join('');
  return `<div class="steps-wrap"><svg class="route-line" viewBox="0 0 1000 60" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path class="d" d="M0 30 C 80 6, 170 54, 250 30 S 420 6, 500 30 S 670 54, 750 30 S 920 8, 1000 30" stroke-dasharray="2 9"/></svg><ol class="steps" style="--n:${entry.steps.length}">${items}</ol></div>`;
}

/** A catalogue card. */
export function card(e, lang = 'es') {
  const ex = e.examples[0]?.text;
  return `<article class="sp">
  <div class="sp-top"><a class="id" href="${entryUrl(e)}">${esc(e.id)}</a>${iconFor(e)}</div>
  <h3><a href="${entryUrl(e)}">${L(e.name, lang)}</a></h3>
  ${ex ? `<blockquote>${L(ex, lang)}</blockquote>` : ''}
  <div class="chips">${e.channels.map((c) => `<span>${esc(c)}</span>`).join('')}</div>
  <div class="count">${plural(e.signals.length, 'warning sign')} · ${plural(e.sources.length, 'source')} · updated ${esc(monthYear(e.updated))}</div>
</article>`;
}
