// Writes the scamdb.dev pages and assets into outDir. Every page is a template function returning HTML.
import { mkdirSync, writeFileSync, copyFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { matchMessage } from '../packages/matcher/index.js';
import { home } from '../site/templates/home.js';
import { catalogue } from '../site/templates/catalogue.js';
import { entry } from '../site/templates/entry.js';
import { docs } from '../site/templates/docs.js';
import { contribute } from '../site/templates/contribute.js';
import { notfound } from '../site/templates/notfound.js';
import { account } from '../site/templates/account.js';

export { esc } from '../site/templates/html.js';

const CODE = new URL('..', import.meta.url).pathname;
const FONTS = [
  'space-grotesk/files/space-grotesk-latin-700-normal.woff2',
  'ibm-plex-sans/files/ibm-plex-sans-latin-400-normal.woff2',
  'ibm-plex-sans/files/ibm-plex-sans-latin-600-normal.woff2',
  'ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2',
  'ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2',
  'patrick-hand/files/patrick-hand-latin-400-normal.woff2',
];

/** Writes every page and asset; returns the written paths relative to outDir. */
export function buildSite(repo, outDir, meta, root) {
  const written = [];
  const put = (path, content) => {
    mkdirSync(dirname(join(outDir, path)), { recursive: true });
    writeFileSync(join(outDir, path), content);
    written.push(path);
  };
  const copy = (from, to) => {
    mkdirSync(dirname(join(outDir, to)), { recursive: true });
    copyFileSync(from, join(outDir, to));
    written.push(to);
  };
  const ctx = { repo, meta, matchMessage, root };

  const c = { ...ctx, lang: 'en' };
  put('index.html', home(c));
  put('catalogue/index.html', catalogue(c));
  for (const e of repo.entries) put(`catalogue/${e.id}/index.html`, entry({ ...c, entry: e }));
  put('docs/index.html', docs(c));
  put('contribute/index.html', contribute(c));
  put('account/index.html', account(c));
  put('404.html', notfound(ctx));

  for (const f of readdirSync(join(CODE, 'site/assets'))) copy(join(CODE, 'site/assets', f), `assets/${f}`);
  copy(join(CODE, 'packages/matcher/index.js'), 'assets/packages/matcher/index.js');
  copy(join(CODE, 'packages/matcher/signs.js'), 'assets/packages/matcher/signs.js');
  copy(join(CODE, 'lib/text.js'), 'assets/lib/text.js');
  for (const f of FONTS) copy(join(CODE, 'node_modules/@fontsource', f), `assets/fonts/${f.split('/').pop()}`);

  const signals = repo.signals.map(({ id, label }) => ({ id, label }));
  // Every country's entries for the playground, which matches phrases in every language.
  put('assets/entries.json', JSON.stringify({ version: meta.version, signals,
    entries: repo.entries.map(({ id, country, name, phrases, signals: s }) => ({ id, country, name, phrases, signals: s })) }));
  return written;
}
