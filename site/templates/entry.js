import { esc, L, LI, monthYear } from './html.js';
import { layout, REPO } from './layout.js';
import { steps } from './parts.js';
import { iconFor, UI_ICONS } from './icons.js';
import { pick } from '../../lib/text.js';
import { t } from '../i18n.js';

/** The original-language version of the explanation, folded away (works without JS). Empty for English originals. */
function original(e, orig, ui) {
  if (orig === 'en' || !e.how?.[orig]) return '';
  return `<details class="original"><summary title="${esc(t(ui, 'showOriginal'))}">${UI_ICONS.globe}<span>${esc(t(ui, 'original'))} · <span lang="${esc(orig)}">${esc(orig.toUpperCase())}</span></span></summary>
<div lang="${esc(orig)}"><h2>${esc(pick(e.name, orig))}</h2><p>${esc(pick(e.how, orig))}</p>
<h3 lang="en">${esc(t(ui, 'sScript'))}</h3><ol class="list">${e.steps.map((st) => `<li>${esc(pick(st.text, orig))}</li>`).join('')}</ol>
<h3 lang="en">${esc(t(ui, 'sSigns'))}</h3><ul class="list">${LI(e.redFlags, orig)}</ul>
<h3 lang="en">${esc(t(ui, 'sDo'))}</h3><ul class="list do">${LI(e.whatToDo, orig)}</ul>
${e.story ? `<h3 lang="en">${esc(t(ui, 'sStory'))}</h3><p>${esc(pick(e.story, orig))}</p>` : ''}</div></details>`;
}

/** A sample message as it arrives (original language) with the English underneath. */
function example(x, orig) {
  const both = orig !== 'en' && x.text[orig] !== undefined && x.text.en !== undefined;
  return `<blockquote class="bubble">${L(x.text, orig)}</blockquote>${both ? `<p class="translation">${L(x.text, 'en')}</p>` : ''}`;
}

/** One scam: explained in English, sample messages in the original language with English, the original on demand. */
export function entry({ repo, meta, entry: e, lang: ui = 'en' }) {
  const country = repo.countries.find((c) => c.code === e.country);
  const orig = e.lang ?? country?.languages[0] ?? 'en';
  const lang = 'en';
  const P = '';
  const signalsById = new Map(repo.signals.map((s) => [s.id, s]));
  const contacts = (repo.contacts.get(e.country) ?? []).filter((k) => e.reportTo.includes(k.id));
  const [cc, slug] = e.id.split('/');
  const ways = t(ui, 'ways');
  const body = `<article class="entry">
<header class="entry-head">
  <div><p class="eyebrow"><a href="${P}/catalogue/">${esc(t(ui, 'navCatalogue'))}</a> · ${esc(pick(country?.name, ui) ?? e.country)} · <span class="mono">${esc(e.id)}</span></p>
  <h1>${L(e.name, lang)}</h1>
  <p class="sender">${esc(t(ui, 'claims'))} ${L(e.sender, lang, 'b')} · ${esc(t(ui, 'via'))} ${e.channels.map((c) => esc(t(ui, 'channels')[c] ?? c)).join(', ')}</p></div>
  ${iconFor(e)}
</header>
${L(e.how, lang, 'p', 'lede')}
${original(e, orig, ui)}

<section aria-labelledby="s-h"><h2 id="s-h">${esc(t(ui, 'sScript'))}</h2>${steps(e, signalsById, lang, ui)}</section>

<div class="two">
<section aria-labelledby="x-h"><h2 id="x-h">${esc(t(ui, 'sLooks'))}</h2>${e.examples.map((x) => example(x, orig)).join('')}
<p class="small">${esc(t(ui, 'sLooksNote'))}</p></section>
<section aria-labelledby="r-h"><h2 id="r-h">${esc(t(ui, 'sSigns'))}</h2><ul class="list">${LI(e.redFlags, lang)}</ul>
<div class="chips">${e.signals.map((s) => `<span>${esc(pick(signalsById.get(s)?.label, ui) ?? s)}</span>`).join('')}</div></section>
</div>

<section aria-labelledby="w-h"><h2 id="w-h">${esc(t(ui, 'sDo'))}</h2><ul class="list do">${LI(e.whatToDo, lang)}</ul></section>
${e.story ? `<section aria-labelledby="st-h"><h2 id="st-h">${esc(t(ui, 'sStory'))}</h2>${L(e.story, lang, 'p')}</section>` : ''}

<section aria-labelledby="c-h"><h2 id="c-h">${esc(t(ui, 'sReport'))}</h2><div class="contacts">${contacts.map((k) => `<div class="contact"><h3>${L(k.name, lang)}</h3>${L(k.when, lang, 'p', 'small')}
<ul>${k.ways.map((w) => `<li><span class="mono small">${esc(ways[w.type])}</span> ${w.label ? `${L(w.label, lang)}: ` : ''}${w.type === 'web' ? `<a href="${esc(w.value)}">${esc(w.value)}</a>` : `<span class="sel">${esc(w.value)}</span>`}</li>`).join('')}</ul>
${k.hours ? L(k.hours, lang, 'p', 'small') : ''}<p class="small">${esc(t(ui, 'source'))}: <a href="${esc(k.source)}">${esc(k.source.replace(/^https:\/\/([^/]+).*$/, '$1'))}</a>, ${esc(t(ui, 'checked'))} ${esc(k.checked)}</p></div>`).join('')}</div></section>

${e.media?.length ? `<section aria-labelledby="m-h"><h2 id="m-h">${esc(t(ui, 'sMedia'))}</h2><ul class="list">${e.media.map((m) => `<li><span class="mono small">${esc(m.type)}</span> <a href="${esc(m.url)}">${esc(m.title)}</a>, ${esc(m.publisher)}, ${esc(m.date)}</li>`).join('')}</ul></section>` : ''}

<section aria-labelledby="so-h"><h2 id="so-h">${esc(t(ui, 'sSources'))}</h2><ol class="list">${e.sources.map((s) => `<li><a href="${esc(s.url)}">${esc(s.title)}</a>, ${esc(s.publisher)}, ${esc(s.date)}</li>`).join('')}</ol></section>

<p class="entry-foot mono">${esc(t(ui, 'updated'))} ${esc(monthYear(e.updated, t(ui, 'months')))} · <a href="/v1/scams/${esc(cc)}/${esc(slug)}.json">JSON</a> · <a href="${REPO}/edit/main/data/${esc(cc)}/scams/${esc(slug)}.json">${esc(t(ui, 'editGithub'))}</a></p>
</article>`;
  return layout({ title: `${pick(e.name, lang)} · scamdb`, description: String(pick(e.how, lang)).slice(0, 160), body, path: `/catalogue/${e.id}/`, meta, lang: ui });
}
