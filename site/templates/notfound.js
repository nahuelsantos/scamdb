import { esc } from './html.js';
import { layout } from './layout.js';
import { t } from '../i18n.js';

/** One 404 page for both languages: English, with a link to the Spanish home. */
export function notfound({ meta }) {
  const body = `<section class="page-head"><h1>${esc(t('en', 'nfH'))}</h1><p class="lede">${esc(t('en', 'nfA'))} <a href="/catalogue/">catalogue</a> ${esc(t('en', 'nfOr'))} <a href="/docs/">docs</a>. <a href="/es/" hreflang="es" lang="es">${esc(t('en', 'nfEs'))}</a>.</p></section>`;
  return layout({ title: t('en', 'nfTitle'), description: t('en', 'nfDesc'), body, path: '/404.html', meta, alternates: false, switchPath: '/' });
}
