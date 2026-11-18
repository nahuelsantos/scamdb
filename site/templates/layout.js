// The page shell: head, nav, footer. The interface is English only.
import { esc } from './html.js';
import { sketch } from '../../lib/sketch.js';
import { t } from '../i18n.js';

export const SITE = 'https://scamdb.dev';
export const REPO = 'https://github.com/nahuelsantos/scamdb';

const LS = sketch(801);
const LOGO = `<svg viewBox="0 0 30 30" aria-hidden="true" focusable="false">${LS.circle(13, 13, 17)}${LS.path('M19.5 19.5 L26 26')}${LS.path('M9.5 13.2 l2.4 2.4 4.4-5', { kind: 'acc' })}</svg>`;

/** `path` is where the page lives ('/docs/'). */
// The trends page needs reports to show anything; it stays built (so /trends/ works) but out of the menu until then.
export const SHOW_TRENDS = false;

export function layout({ title, description, body, path, meta, lang = 'en', scripts = '' }) {
  const P = '';
  const here = path;
  const nav = [['/catalogue/', t(lang, 'navCatalogue')], ['/report/', t(lang, 'navReport')], ...(SHOW_TRENDS ? [['/trends/', t(lang, 'navTrends')]] : []), ['/docs/', t(lang, 'navDocs')], ['/contribute/', t(lang, 'navContribute')], ['/account/', t(lang, 'navAccount')]]
    .map(([href, label]) => `<a href="${P}${href}"${path.startsWith(href) ? ' aria-current="page"' : ''}>${label}</a>`).join('');
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${SITE}${esc(here)}">
<link rel="alternate" type="application/atom+xml" title="scamdb: new and updated scams" href="/v1/changes.atom">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${SITE}${esc(here)}">
<meta property="og:type" content="website">
<meta property="og:locale" content="en_US">
<meta name="color-scheme" content="light dark">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/assets/styles.css">
</head>
<body>
<a class="skip" href="#main">${t(lang, 'skip')}</a>
<header class="wrap top">
  <a class="logo" href="${P}/">${LOGO}<span>scamdb</span></a>
  <nav aria-label="${t(lang, 'mainNav')}">${nav}<a class="gh" href="${REPO}">GitHub</a></nav>
</header>
<main id="main" class="wrap">
${body}
</main>
<footer class="wrap foot">
  <div class="mono">${t(lang, 'footData')} <a href="${REPO}/blob/main/LICENSE-DATA">CC BY 4.0</a> · ${t(lang, 'footCode')} <a href="${REPO}/blob/main/LICENSE">MIT</a> · ${t(lang, 'footDataset')} ${esc(meta.version)}</div>
</footer>
${scripts}
</body>
</html>
`;
}
