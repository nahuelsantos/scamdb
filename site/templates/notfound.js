import { layout } from './layout.js';

export function notfound({ meta }) {
  const body = `<section class="page-head"><h1>Not found</h1><p class="lede">That page doesn’t exist. Try the <a href="/catalogue/">catalogue</a> or the <a href="/docs/">docs</a>.</p></section>`;
  return layout({ title: 'Not found · scamdb', description: 'Page not found.', body, path: '/404.html', meta });
}
