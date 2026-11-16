// /trends/: which scams people are reporting, per country, over the last 12 weeks. Aggregated and k-anonymous
// (counts under 5 hidden); filled by trends.js from GET /v1/trends.
import { esc } from './html.js';
import { layout } from './layout.js';
import { t } from '../i18n.js';

export function trends({ repo, meta, lang = 'en' }) {
  const s = (k) => t(lang, k);
  const options = repo.countries.map((c) => `<option value="${esc(c.code)}">${esc(c.name.en)}</option>`).join('');
  const strings = { loading: s('trLoading'), empty: s('trEmpty'), fail: s('trFail'), reports: s('trReports'), withheld: s('trWithheld') };
  const body = `<section class="page-head"><h1>${esc(s('trH'))}</h1><p class="lede">${esc(s('trLede'))}</p></section>
<section class="trends" id="tr" data-strings="${esc(JSON.stringify(strings))}">
  <div class="field"><label for="tr-country">${esc(s('repCountry'))}</label><select id="tr-country">${options}</select></div>
  <p id="tr-status" aria-live="polite"></p>
  <ol class="tr-list" id="tr-list"></ol>
  <p class="small">${esc(s('trHow'))} <a href="/report/">${esc(s('navReport'))}</a> · <a href="/feed/">${esc(s('feedH'))}</a></p>
</section>`;
  return layout({ title: s('trTitle'), description: s('trDesc'), body, path: '/trends/', meta, lang, scripts: '<script type="module" src="/assets/trends.js"></script>' });
}
