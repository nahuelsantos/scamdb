import { esc } from './html.js';
import { layout } from './layout.js';
import { card } from './parts.js';
import { pick } from '../../lib/text.js';

export function catalogue({ repo, meta }) {
  const groups = repo.countries.map((c) => ({ c, list: repo.entries.filter((e) => e.country === c.code) })).filter((g) => g.list.length);
  const body = `<section class="page-head"><h1>The catalogue</h1>
<p class="lede">${repo.entries.length} scams, each with its script, sample messages, warning signs, what to do and sources. Every entry is also JSON at <code>/v1/scams/{country}/{slug}.json</code>.</p></section>
${groups.map(({ c, list }) => `<section aria-labelledby="c-${esc(c.code)}"><div class="sh"><h2 id="c-${esc(c.code)}">${esc(pick(c.name, 'en'))}</h2><p><a href="/v1/${esc(c.code)}/scams.json">${esc(c.code)}/scams.json</a> · <a href="/v1/${esc(c.code)}/contacts.json">contacts.json</a></p></div>
<div class="specimens">${list.map((e) => card(e, c.languages[0])).join('')}</div></section>`).join('')}`;
  return layout({ title: 'Catalogue · scamdb', description: `All ${repo.entries.length} scams in scamdb, by country.`, body, path: '/catalogue/', meta });
}
