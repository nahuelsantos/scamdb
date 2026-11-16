import { esc } from './html.js';
import { layout } from './layout.js';
import { t } from '../i18n.js';

/** The 404 page. */
export function notfound({ meta }) {
  const body = `<section class="page-head"><h1>${esc(t('en', 'nfH'))}</h1><p class="lede">${esc(t('en', 'nfA'))} <a href="/catalogue/">${esc(t('en', 'nfCatalogue'))}</a> ${esc(t('en', 'nfOr'))} <a href="/docs/">${esc(t('en', 'nfDocs'))}</a>.</p></section>`;
  return layout({ title: t('en', 'nfTitle'), description: t('en', 'nfDesc'), body, path: '/404.html', meta });
}
