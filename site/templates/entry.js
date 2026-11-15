import { esc, L, LI, monthYear } from './html.js';
import { layout, REPO } from './layout.js';
import { steps } from './parts.js';
import { iconFor } from './icons.js';
import { pick } from '../../lib/text.js';

const WAY = { phone: 'Phone', email: 'Email', web: 'Web', whatsapp: 'WhatsApp' };

export function entry({ repo, meta, entry: e }) {
  const country = repo.countries.find((c) => c.code === e.country);
  const lang = country?.languages[0] ?? 'es';
  const signalsById = new Map(repo.signals.map((s) => [s.id, s]));
  const contacts = (repo.contacts.get(e.country) ?? []).filter((k) => e.reportTo.includes(k.id));
  const [cc, slug] = e.id.split('/');
  const body = `<article class="entry">
<header class="entry-head">
  <div><p class="eyebrow"><a href="/catalogue/">Catalogue</a> · ${esc(pick(country?.name, 'en') ?? e.country)} · <span class="mono">${esc(e.id)}</span></p>
  <h1>${L(e.name, lang)}</h1>
  <p class="sender">Claims to be ${L(e.sender, lang, 'b')} · via ${e.channels.map(esc).join(', ')}</p></div>
  ${iconFor(e)}
</header>
${L(e.how, lang, 'p', 'lede')}

<section aria-labelledby="s-h"><h2 id="s-h">The script</h2>${steps(e, signalsById, lang)}</section>

<div class="two">
<section aria-labelledby="x-h"><h2 id="x-h">What it looks like</h2>${e.examples.map((x) => `<p class="bubble">${L(x.text, lang)}</p>`).join('')}
<p class="small">Examples are invented, written the way scammers write.</p></section>
<section aria-labelledby="r-h"><h2 id="r-h">Warning signs</h2><ul class="list">${LI(e.redFlags, lang)}</ul>
<div class="chips">${e.signals.map((s) => `<span title="${esc(pick(signalsById.get(s)?.description, 'en'))}">${esc(s)}</span>`).join('')}</div></section>
</div>

<section aria-labelledby="w-h"><h2 id="w-h">What to do</h2><ul class="list do">${LI(e.whatToDo, lang)}</ul></section>
${e.story ? `<section aria-labelledby="st-h"><h2 id="st-h">A real case</h2>${L(e.story, lang, 'p')}</section>` : ''}

<section aria-labelledby="c-h"><h2 id="c-h">Who to report it to</h2><div class="contacts">${contacts.map((k) => `<div class="contact"><h3>${L(k.name, lang)}</h3>${L(k.when, lang, 'p', 'small')}
<ul>${k.ways.map((w) => `<li><span class="mono small">${WAY[w.type]}</span> ${w.label ? `${L(w.label, lang)}: ` : ''}${w.type === 'web' ? `<a href="${esc(w.value)}">${esc(w.value)}</a>` : `<span class="sel">${esc(w.value)}</span>`}</li>`).join('')}</ul>
${k.hours ? L(k.hours, lang, 'p', 'small') : ''}<p class="small">Source: <a href="${esc(k.source)}">${esc(new URL(k.source).hostname)}</a>, checked ${esc(k.checked)}</p></div>`).join('')}</div></section>

${e.media?.length ? `<section aria-labelledby="m-h"><h2 id="m-h">Media</h2><ul class="list">${e.media.map((m) => `<li><span class="mono small">${esc(m.type)}</span> <a href="${esc(m.url)}">${esc(m.title)}</a>, ${esc(m.publisher)}, ${esc(m.date)}</li>`).join('')}</ul></section>` : ''}

<section aria-labelledby="so-h"><h2 id="so-h">Sources</h2><ol class="list">${e.sources.map((s) => `<li><a href="${esc(s.url)}">${esc(s.title)}</a>, ${esc(s.publisher)}, ${esc(s.date)}</li>`).join('')}</ol></section>

<p class="entry-foot mono">Updated ${esc(monthYear(e.updated))} · <a href="/v1/scams/${esc(cc)}/${esc(slug)}.json">JSON</a> · <a href="${REPO}/edit/main/data/${esc(cc)}/scams/${esc(slug)}.json">Edit on GitHub</a></p>
</article>`;
  return layout({ title: `${pick(e.name, lang)} · scamdb`, description: String(pick(e.how, lang)).slice(0, 160), body, path: `/catalogue/${e.id}/`, meta });
}
