import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildSite, esc } from '../../tools/build-site.mjs';
import { ICONS, iconFor } from '../../site/templates/icons.js';
import { loadRepo } from '../../lib/load.js';

const OK = new URL('../fixtures/repo-ok/', import.meta.url).pathname;
const meta = { version: '2026-11-15.abc1234', builtAt: '2026-11-15T12:00:00Z' };
const XSS = '<script>alert(1)</script><img src=x onerror=alert(1)>';

function build() {
  const dir = mkdtempSync(join(tmpdir(), 'scamdb-site-'));
  cpSync(OK, dir, { recursive: true });
  const e = JSON.parse(readFileSync(join(dir, 'data/ar/scams/ejemplo.json')));
  writeFileSync(join(dir, 'data/ar/scams/xss.json'), JSON.stringify({ ...e, id: 'ar/xss', how: { es: XSS }, name: { es: `Nombre ${XSS}` } }));
  const out = join(dir, 'dist');
  const written = buildSite(loadRepo(dir), out, meta, dir);
  const page = (p) => readFileSync(join(out, p), 'utf8');
  return { dir, out, written, page };
}

test('esc escapes HTML', () => assert.equal(esc(`<a href="x">'&'</a>`), '&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;'));

test('writes every page and the playground assets', () => {
  const { dir, out, written } = build();
  const pages = written.filter((p) => p.endsWith('.html')).sort();
  const en = ['account/index.html', 'catalogue/ar/ejemplo/index.html', 'catalogue/ar/xss/index.html', 'catalogue/br/exemplo/index.html',
    'catalogue/index.html', 'contribute/index.html', 'docs/index.html', 'index.html'];
  assert.deepEqual(pages, ['404.html', ...en, ...en.map((p) => `es/${p}`)].sort());
  for (const a of ['assets/styles.css', 'assets/playground.js', 'assets/packages/matcher/index.js', 'assets/packages/matcher/signs.js',
    'assets/lib/text.js', 'assets/entries-ar.json', 'assets/account.js']) assert.ok(existsSync(join(out, a)), a);
  rmSync(dir, { recursive: true });
});

test('contributor HTML is shown as text, never run', () => {
  const { dir, written, page } = build();
  const html = page('catalogue/ar/xss/index.html');
  assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
  for (const p of written.filter((p) => p.endsWith('.html'))) {
    assert.equal(page(p).includes('<script>alert'), false, p);
    assert.equal(page(p).includes('<img src=x'), false, p);
  }
  rmSync(dir, { recursive: true });
});

test('a Portuguese-only entry renders its own text with lang="pt"', () => {
  const { dir, page } = build();
  const html = page('catalogue/br/exemplo/index.html');
  assert.ok(html.includes('Golpe do filho com número novo'));
  assert.match(html, /lang="pt"/);
  rmSync(dir, { recursive: true });
});

test('every page has one h1, a title and a canonical link', () => {
  const { dir, written, page } = build();
  for (const p of written.filter((p) => p.endsWith('.html'))) {
    const html = page(p);
    assert.equal((html.match(/<h1[\s>]/g) ?? []).length, 1, `${p} h1`);
    assert.match(html, /<title>[^<]+<\/title>/, `${p} title`);
    assert.match(html, /<link rel="canonical" href="https:\/\/scamdb\.dev\//, `${p} canonical`);
  }
  rmSync(dir, { recursive: true });
});

test('the entry page links to its JSON and to GitHub', () => {
  const { dir, page } = build();
  const html = page('catalogue/ar/ejemplo/index.html');
  assert.ok(html.includes('href="/v1/scams/ar/ejemplo.json"'));
  assert.ok(html.includes('href="https://github.com/nahuelsantos/scamdb/edit/main/data/ar/scams/ejemplo.json"'));
  assert.ok(html.includes('denunciasufeci@mpf.gov.ar'));
  rmSync(dir, { recursive: true });
});

test('the home page works without JavaScript: the sample result is pre-rendered', () => {
  const { dir, page } = build();
  assert.match(page('index.html'), /data-verdict="scam"/);
  rmSync(dir, { recursive: true });
});

test('iconFor picks a drawing by scam', () => {
  assert.equal(iconFor({ id: 'ar/falso-banco', channels: ['phone'] }), ICONS.bank);
  assert.equal(iconFor({ id: 'ar/cuento-del-tio', channels: ['phone'] }), ICONS.house);
  assert.equal(iconFor({ id: 'ar/whatsapp-codigo', channels: ['whatsapp'] }), ICONS.sms);
  assert.equal(iconFor({ id: 'xx/otra', channels: ['phone'] }), ICONS.phone);
});

test('no page uses the old displacement filter', () => {
  const { dir, written, page } = build();
  for (const p of written.filter((p) => p.endsWith('.html'))) assert.doesNotMatch(page(p), /id="rough"|#rough|filter:url/, p);
  rmSync(dir, { recursive: true });
});
test('every script step has a label; a step without a sign says What happens', () => {
  const { dir, page } = build();
  const html = page('catalogue/ar/ejemplo/index.html');
  const steps = (html.match(/<li class="step/g) ?? []).length;
  assert.equal((html.match(/class="flag/g) ?? []).length, steps);
  rmSync(dir, { recursive: true });
});
test('a step without a warning sign is labelled What happens, grey', async () => {
  const { steps } = await import('../../site/templates/parts.js');
  const html = steps({ steps: [{ text: { es: 'uno' }, signal: 'urgency' }, { text: { es: 'dos' } }] },
    new Map([['urgency', { label: { en: 'Rushes you', es: 'Te apura' } }]]), 'es');
  assert.match(html, /<span class="flag out">What happens<\/span>/);
  assert.match(html, /<span class="flag">Rushes you<\/span>/);
});
test('the home page stays under 250 kB', () => {
  const { dir, page } = build();
  assert.ok(Buffer.byteLength(page('index.html')) < 250_000);
  rmSync(dir, { recursive: true });
});
test('icons are pen-drawn', () => assert.match(ICONS.bank, /class="sk/));
test('the stylesheet no longer uses the displacement filter', () =>
  assert.doesNotMatch(readFileSync(new URL('../../site/assets/styles.css', import.meta.url), 'utf8'), /url\(#rough\)/));

// ---- Languages ----
const htmlPages = (written) => written.filter((p) => p.endsWith('.html'));
test('every page exists in English and in Spanish', () => {
  const { dir, written } = build();
  const en = htmlPages(written).filter((p) => !p.startsWith('es/') && p !== '404.html');
  for (const p of en) assert.ok(written.includes(`es/${p}`), `es/${p}`);
  rmSync(dir, { recursive: true });
});
test('Spanish pages say so and have a Spanish menu', () => {
  const { dir, page } = build();
  const html = page('es/index.html');
  assert.match(html, /<html lang="es">/);
  for (const w of ['Catálogo', 'Documentación', 'Contribuir']) assert.ok(html.includes(w), w);
  rmSync(dir, { recursive: true });
});
test('internal links on Spanish pages stay in Spanish', () => {
  const { dir, written, page } = build();
  for (const p of htmlPages(written).filter((p) => p.startsWith('es/'))) {
    for (const [tag, href] of page(p).matchAll(/<(?:a|link) [^>]*href="(\/[^"]*)"[^>]*>/g)) {
      if (/^\/(v1|assets|auth)\//.test(href)) continue; // API, files and sign-in endpoints have no language
      if (/hreflang=/.test(tag)) continue; // the language switch and alternates point at the other language on purpose
      assert.ok(href.startsWith('/es/') || href === '/es', `${p}: ${href}`);
    }
  }
  rmSync(dir, { recursive: true });
});
test('scam content is the same in both languages and keeps its own lang', () => {
  const { dir, page } = build();
  const pick = (h) => h.match(/<h1><span lang="es">([^<]+)<\/span><\/h1>/)?.[1];
  const en = page('catalogue/ar/ejemplo/index.html'), es = page('es/catalogue/ar/ejemplo/index.html');
  assert.equal(pick(en), 'Robo de WhatsApp con el código');
  assert.equal(pick(es), pick(en));
  rmSync(dir, { recursive: true });
});
test('hreflang alternates point at each other', () => {
  const { dir, page } = build();
  const en = page('docs/index.html'), es = page('es/docs/index.html');
  for (const h of [en, es]) {
    assert.ok(h.includes('<link rel="alternate" hreflang="en" href="https://scamdb.dev/docs/">'));
    assert.ok(h.includes('<link rel="alternate" hreflang="es" href="https://scamdb.dev/es/docs/">'));
    assert.ok(h.includes('<link rel="alternate" hreflang="x-default" href="https://scamdb.dev/docs/">'));
  }
  rmSync(dir, { recursive: true });
});
test('the language switch on an entry page points at the same entry', () => {
  const { dir, page } = build();
  assert.ok(page('catalogue/ar/ejemplo/index.html').includes('href="/es/catalogue/ar/ejemplo/" hreflang="es"'));
  assert.ok(page('es/catalogue/ar/ejemplo/index.html').includes('href="/catalogue/ar/ejemplo/" hreflang="en"'));
  rmSync(dir, { recursive: true });
});
test('signal labels follow the interface language', () => {
  const { dir, page } = build();
  assert.ok(page('es/catalogue/ar/ejemplo/index.html').includes('>Te pide un código<'));
  assert.ok(page('catalogue/ar/ejemplo/index.html').includes('>Asks for a code<'));
  rmSync(dir, { recursive: true });
});
test('both languages have every interface string', async () => {
  const { UI } = await import('../../site/i18n.js');
  assert.deepEqual(Object.keys(UI.es).sort(), Object.keys(UI.en).sort());
});

test('the 404 language switch goes to the Spanish home, not a missing page', () => {
  const { dir, page } = build();
  const html = page('404.html');
  assert.ok(html.includes('href="/es/" hreflang="es"'));
  assert.ok(!html.includes('/es/404.html'));
  rmSync(dir, { recursive: true });
});
test('channel names are translated on Spanish pages, ids stay in the API', () => {
  const { dir, page } = build();
  const es = page('es/catalogue/ar/ejemplo/index.html');
  assert.ok(!es.includes('por phone'));
  assert.ok(es.includes('por teléfono'));
  assert.ok(page('es/catalogue/index.html').includes('<span>teléfono</span>'));
  assert.ok(page('catalogue/ar/ejemplo/index.html').includes('via phone'));
  rmSync(dir, { recursive: true });
});
test('Spanish source line agrees in gender: revisada el', () => {
  const { dir, page } = build();
  assert.ok(page('es/catalogue/ar/ejemplo/index.html').includes('revisada el'));
  rmSync(dir, { recursive: true });
});

test('the language switch is announced by name', () => {
  const { dir, page } = build();
  const html = page('index.html');
  assert.ok(html.includes('aria-label="Español"'));
  assert.ok(html.includes('aria-label="English"'));
  rmSync(dir, { recursive: true });
});
test('the 404 page takes its link words from the string table', async () => {
  const { UI } = await import('../../site/i18n.js');
  const { dir, page } = build();
  const html = page('404.html');
  assert.ok(html.includes(`>${UI.en.nfCatalogue}</a>`));
  assert.ok(html.includes(`>${UI.en.nfDocs}</a>`));
  rmSync(dir, { recursive: true });
});
test('Spanish wording: descargar, están bajo', async () => {
  const { UI } = await import('../../site/i18n.js');
  assert.match(UI.es.catP, /podés descargar/);
  assert.equal(UI.es.dLicenseP1, 'Los datos están bajo');
});

// ---- Phase 2 pages ----
test('the account page exists in both languages with one h1 and the GitHub sign-in link', () => {
  const { dir, page } = build();
  for (const p of ['account/index.html', 'es/account/index.html']) {
    const html = page(p);
    assert.equal((html.match(/<h1[\s>]/g) ?? []).length, 1, p);
    assert.ok(html.includes('href="/auth/github"'), p);
    assert.ok(html.includes('src="/assets/account.js"'), p);
  }
  rmSync(dir, { recursive: true });
});
test('the docs describe reports and keys, in both languages', () => {
  const { dir, page } = build();
  assert.ok(page('docs/index.html').includes('POST /v1/reports'));
  assert.ok(page('docs/index.html').includes('Authorization: Bearer sk_'));
  assert.ok(page('es/docs/index.html').includes('POST /v1/reports'));
  rmSync(dir, { recursive: true });
});
test('the home page offers a free key and lists the reports endpoint', () => {
  const { dir, page } = build();
  assert.ok(page('index.html').includes('href="/account/"'));
  assert.ok(page('es/index.html').includes('href="/es/account/"'));
  assert.ok(page('index.html').includes('POST /v1/reports'));
  rmSync(dir, { recursive: true });
});
test('contribute points to the eschamuyo report form', () => {
  const { dir, page } = build();
  assert.ok(page('contribute/index.html').includes('href="https://eschamuyo.com/#/avisar"'));
  rmSync(dir, { recursive: true });
});

test('the hero bubble is a scribble with a big code, no Spanish sentence', () => {
  const { dir, page } = build();
  for (const p of ['index.html', 'es/index.html']) {
    const html = page(p);
    assert.ok(!html.includes('Le hablo de PAMI.'), p);
    assert.match(html, /class="t-code-big"[^>]*>482 913</, p);
  }
  rmSync(dir, { recursive: true });
});
