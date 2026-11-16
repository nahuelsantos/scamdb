import { esc } from './html.js';
import { layout, REPO } from './layout.js';
import { t } from '../i18n.js';

export function contribute({ meta, lang = 'en' }) {
  const body = `<section class="page-head"><h1>${esc(t(lang, 'navContribute'))}</h1><p class="lede">${esc(t(lang, 'contribLede'))}</p></section>
<section aria-labelledby="a-h"><h2 id="a-h">${esc(t(lang, 'cAddH'))}</h2><ol class="list">
<li>${esc(t(lang, 'cAdd1a'))} <a href="${REPO}/blob/main/CONTRIBUTING.md">CONTRIBUTING.md</a>${esc(t(lang, 'cAdd1b'))}</li>
<li>${esc(t(lang, 'cAdd2a'))} <code>data/&lt;country&gt;/scams/&lt;slug&gt;.json</code>${esc(t(lang, 'cAdd2b'))}</li>
<li>${esc(t(lang, 'cAdd3a'))} <code>npm run validate</code>${esc(t(lang, 'cAdd3b'))}</li></ol>
<p>${esc(t(lang, 'cRules'))}</p>
<p>${esc(t(lang, 'cLicense'))}</p></section>
<section aria-labelledby="r-h"><h2 id="r-h">${esc(t(lang, 'cReportH'))}</h2><p>${esc(t(lang, 'cReportA'))} <a href="https://eschamuyo.com/#/avisar">${esc(t(lang, 'cReportLink'))}</a> ${esc(t(lang, 'cReportB'))} <code>${esc(t(lang, 'cReportBold'))}</code>${esc(t(lang, 'cReportC'))}</p></section>`;
  return layout({ title: t(lang, 'contribTitle'), description: t(lang, 'contribDesc'), body, path: '/contribute/', meta, lang });
}
