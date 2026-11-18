import { esc } from './html.js';
import { layout } from './layout.js';
import { card } from './parts.js';
import { pick } from '../../lib/text.js';
import { t } from '../i18n.js';

export function catalogue({ repo, meta, lang = 'en' }) {
  const channels = [...new Set(repo.entries.flatMap((e) => e.channels))];
  const names = t(lang, 'channels');
  const item = (e) => card(e, lang).replace('<article class="sp">', `<article class="sp" data-channels="${esc(e.channels.join(' '))}">`);
  const groups = repo.countries.map((c) => ({ c, list: repo.entries.filter((e) => e.country === c.code) })).filter((g) => g.list.length);
  const body = `<section class="page-head"><h1>${esc(t(lang, 'navCatalogue'))}</h1>
<p class="lede">${esc(t(lang, 'catalogueLede', repo.entries.length))} <code>/v1/scams/{country}/{slug}.json</code>.</p></section>
<form class="filters" id="cat-filters" role="search" aria-label="${esc(t(lang, 'filterLabel'))}">
<div class="field"><label for="f-country">${esc(t(lang, 'filterCountry'))}</label><select id="f-country"><option value="">${esc(t(lang, 'filterAllCountries'))}</option>${groups.map(({ c, list }) => `<option value="${esc(c.code)}">${esc(pick(c.name, lang))} (${list.length})</option>`).join('')}</select></div>
<div class="field"><label for="f-channel">${esc(t(lang, 'filterChannel'))}</label><select id="f-channel"><option value="">${esc(t(lang, 'filterAllChannels'))}</option>${channels.map((c) => `<option value="${esc(c)}">${esc(names[c] ?? c)}</option>`).join('')}</select></div>
<p class="f-count" id="f-count" aria-live="polite" data-tpl="${esc(t(lang, 'filterCount', '{n}'))}"></p>
</form>
${groups.map(({ c, list }) => `<section class="cat-group" data-country="${esc(c.code)}" aria-labelledby="c-${esc(c.code)}"><div class="sh"><h2 id="c-${esc(c.code)}">${esc(pick(c.name, lang))}</h2><p><a href="/v1/${esc(c.code)}/scams.json">${esc(c.code)}/scams.json</a> · <a href="/v1/${esc(c.code)}/contacts.json">contacts.json</a></p></div>
<div class="specimens">${list.map(item).join('')}</div></section>`).join('')}`;
  return layout({ title: t(lang, 'catalogueTitle'), description: t(lang, 'catalogueDesc', repo.entries.length), body, path: '/catalogue/', meta, lang,
    scripts: '<script type="module" src="/assets/catalogue.js"></script>' });
}
