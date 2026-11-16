// /feed/: the organisation feed: what it is, what it never contains, how to get access, and the terms.
import { esc } from './html.js';
import { layout, REPO } from './layout.js';
import { t } from '../i18n.js';

export function feed({ meta, lang = 'en' }) {
  const li = (items) => items.map((x) => `<li>${esc(x)}</li>`).join('');
  const body = `<section class="page-head"><h1>${esc(t(lang, 'feedH'))}</h1><p class="lede">${esc(t(lang, 'feedLede'))}</p></section>
<section aria-labelledby="f-what"><h2 id="f-what">${esc(t(lang, 'feedWhatH'))}</h2><ul class="list">${li(t(lang, 'feedWhat'))}</ul>
<pre><code>GET https://scamdb.dev/v1/feed/trends?country=es&amp;weeks=8
GET https://scamdb.dev/v1/feed/brands?country=es&amp;brand=correos&amp;weeks=8
Authorization: Bearer sk_…</code></pre>
<p>${esc(t(lang, 'feedBrandsList'))} <a href="/v1/brands.json">/v1/brands.json</a></p></section>
<section aria-labelledby="f-never"><h2 id="f-never">${esc(t(lang, 'feedNeverH'))}</h2><ul class="list">${li(t(lang, 'feedNever'))}</ul></section>
<section aria-labelledby="f-how"><h2 id="f-how">${esc(t(lang, 'feedHowH'))}</h2><ol class="list">
<li>${esc(t(lang, 'feedHow1'))} <a href="/account/">${esc(t(lang, 'navAccount'))}</a>.</li>
<li>${esc(t(lang, 'feedHow2'))} <a href="${REPO}/issues/new?title=Feed%20access%3A%20">${esc(t(lang, 'feedHow2Link'))}</a>${esc(t(lang, 'feedHow2b'))}</li>
<li>${esc(t(lang, 'feedHow3'))}</li></ol></section>
<section aria-labelledby="f-terms"><h2 id="f-terms">${esc(t(lang, 'feedTermsH'))}</h2><ol class="list">${li(t(lang, 'feedTerms'))}</ol></section>`;
  return layout({ title: t(lang, 'feedTitle'), description: t(lang, 'feedDesc'), body, path: '/feed/', meta, lang });
}
