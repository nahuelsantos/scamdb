import { esc } from './html.js';
import { layout } from './layout.js';
import { card } from './parts.js';
import { pick } from '../../lib/text.js';
import { t } from '../i18n.js';

export function catalogue({ repo, meta, lang = 'en' }) {
  const groups = repo.countries.map((c) => ({ c, list: repo.entries.filter((e) => e.country === c.code) })).filter((g) => g.list.length);
  const body = `<section class="page-head"><h1>${esc(t(lang, 'navCatalogue'))}</h1>
<p class="lede">${esc(t(lang, 'catalogueLede', repo.entries.length))} <code>/v1/scams/{country}/{slug}.json</code>.</p></section>
${groups.map(({ c, list }) => `<section aria-labelledby="c-${esc(c.code)}"><div class="sh"><h2 id="c-${esc(c.code)}">${esc(pick(c.name, lang))}</h2><p><a href="/v1/${esc(c.code)}/scams.json">${esc(c.code)}/scams.json</a> · <a href="/v1/${esc(c.code)}/contacts.json">contacts.json</a></p></div>
<div class="specimens">${list.map((e) => card(e, c.languages[0], lang)).join('')}</div></section>`).join('')}`;
  return layout({ title: t(lang, 'catalogueTitle'), description: t(lang, 'catalogueDesc', repo.entries.length), body, path: '/catalogue/', meta, lang });
}
