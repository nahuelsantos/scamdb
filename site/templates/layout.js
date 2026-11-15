// The page shell: head (with language alternates), nav with the EN / ES switch, footer.
import { esc } from './html.js';
import { sketch } from '../../lib/sketch.js';
import { t, prefix } from '../i18n.js';

export const SITE = 'https://scamdb.dev';
export const REPO = 'https://github.com/nahuelsantos/scamdb';

const LS = sketch(801);
const LOGO = `<svg viewBox="0 0 30 30" aria-hidden="true" focusable="false">${LS.circle(13, 13, 17)}${LS.path('M19.5 19.5 L26 26')}${LS.path('M9.5 13.2 l2.4 2.4 4.4-5', { kind: 'acc' })}</svg>`;

/** `path` is the language-neutral path ('/docs/'); the page lives at prefix(lang) + path. */
export function layout({ title, description, body, path, meta, lang = 'en', scripts = '', alternates = true }) {
  const P = prefix(lang);
  const here = `${P}${path}`;
  const nav = [['/docs/', t(lang, 'navDocs')], ['/catalogue/', t(lang, 'navCatalogue')], ['/contribute/', t(lang, 'navContribute')]]
    .map(([href, label]) => `<a href="${P}${href}"${path.startsWith(href) ? ' aria-current="page"' : ''}>${label}</a>`).join('');
  const sw = ['en', 'es'].map((l) => (l === lang
    ? `<span aria-current="true" lang="${l}">${l.toUpperCase()}</span>`
    : `<a href="${prefix(l)}${path}" hreflang="${l}" lang="${l}">${l.toUpperCase()}</a>`)).join('<span aria-hidden="true">/</span>');
  const alt = alternates ? `<link rel="alternate" hreflang="en" href="${SITE}${esc(path)}">
<link rel="alternate" hreflang="es" href="${SITE}/es${esc(path)}">
<link rel="alternate" hreflang="x-default" href="${SITE}${esc(path)}">
` : '';
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${SITE}${esc(here)}">
${alt}<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${SITE}${esc(here)}">
<meta property="og:type" content="website">
<meta property="og:locale" content="${lang === 'es' ? 'es_AR' : 'en_US'}">
<meta name="color-scheme" content="light dark">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/assets/styles.css">
</head>
<body>
<a class="skip" href="#main">${t(lang, 'skip')}</a>
<header class="wrap top">
  <a class="logo" href="${P}/">${LOGO}<span>scamdb</span></a>
  <nav aria-label="${t(lang, 'mainNav')}">${nav}<a class="gh" href="${REPO}">GitHub</a><span class="lang" role="group" aria-label="${t(lang, 'langSwitch')}">${sw}</span></nav>
</header>
<main id="main" class="wrap">
${body}
</main>
<footer class="wrap foot">
  <div>${t(lang, 'footMade')} <a href="https://eschamuyo.com">eschamuyo.com</a></div>
  <div class="mono">${t(lang, 'footData')} <a href="${REPO}/blob/main/LICENSE-DATA">CC BY 4.0</a> · ${t(lang, 'footCode')} <a href="${REPO}/blob/main/LICENSE">MIT</a> · ${t(lang, 'footDataset')} ${esc(meta.version)}</div>
</footer>
${scripts}
</body>
</html>
`;
}
