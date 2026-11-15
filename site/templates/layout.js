// The page shell: head, nav, footer and the hidden SVG filter that makes lines look hand-drawn.
import { esc } from './html.js';
import { sketch } from '../../lib/sketch.js';

export const SITE = 'https://scamdb.dev';
export const REPO = 'https://github.com/nahuelsantos/scamdb';

const LS = sketch(801);
const LOGO = `<svg viewBox="0 0 30 30" aria-hidden="true" focusable="false">${LS.circle(13, 13, 17)}${LS.path('M19.5 19.5 L26 26')}${LS.path('M9.5 13.2 l2.4 2.4 4.4-5', { kind: 'acc' })}</svg>`;

export function layout({ title, description, body, path, meta, scripts = '' }) {
  const nav = [['/docs/', 'Docs'], ['/catalogue/', 'Catalogue'], ['/contribute/', 'Contribute']]
    .map(([href, label]) => `<a href="${href}"${path.startsWith(href) ? ' aria-current="page"' : ''}>${label}</a>`).join('');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${SITE}${esc(path)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${SITE}${esc(path)}">
<meta property="og:type" content="website">
<meta name="color-scheme" content="light dark">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/assets/styles.css">
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="wrap top">
  <a class="logo" href="/">${LOGO}<span>scamdb</span></a>
  <nav aria-label="Main">${nav}<a class="gh" href="${REPO}">GitHub</a></nav>
</header>
<main id="main" class="wrap">
${body}
</main>
<footer class="wrap foot">
  <div>Made by the people behind <a href="https://eschamuyo.com">eschamuyo.com</a></div>
  <div class="mono">data <a href="${REPO}/blob/main/LICENSE-DATA">CC BY 4.0</a> · code <a href="${REPO}/blob/main/LICENSE">MIT</a> · dataset ${esc(meta.version)}</div>
</footer>
${scripts}
</body>
</html>
`;
}
