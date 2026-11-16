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
    'catalogue/index.html', 'contribute/index.html', 'docs/index.html', 'feed/index.html', 'index.html', 'report/index.html', 'trends/index.html'];
  assert.deepEqual(pages, ['404.html', ...en].sort());
  for (const a of ['assets/styles.css', 'assets/playground.js', 'assets/packages/matcher/index.js', 'assets/packages/matcher/signs.js',
    'assets/lib/text.js', 'assets/entries.json', 'assets/account.js']) assert.ok(existsSync(join(out, a)), a);
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

test('a Portuguese entry is explained in English and keeps its Portuguese original', () => {
  const { dir, page } = build();
  const html = page('catalogue/br/exemplo/index.html');
  assert.ok(html.includes('The son with a new number'));
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
test('no /es/ pages are built', () => {
  const { dir, written } = build();
  assert.deepEqual(htmlPages(written).filter((p) => p.startsWith('es/')), []);
  rmSync(dir, { recursive: true });
});
test('_redirects sends old /es/ links to the same English page with 301', () => {
  const r = readFileSync(new URL('../../site/_redirects', import.meta.url), 'utf8');
  assert.match(r, /^\/es \/ 301$/m);
  assert.match(r, /^\/es\/\* \/:splat 301$/m);
});
test('every page is English, with no language switch or Spanish alternates', () => {
  const { dir, written, page } = build();
  for (const p of htmlPages(written)) {
    const html = page(p);
    assert.match(html, /<html lang="en">/, p);
    assert.ok(!html.includes('hreflang="es"'), p);
    assert.ok(!html.includes('aria-label="Español"'), p);
    assert.ok(!/href="\/es[/"]/.test(html), p);
  }
  rmSync(dir, { recursive: true });
});
test('entry page explains in English and shows the sample message as it arrives with its translation', () => {
  const { dir, page } = build();
  const html = page('catalogue/ar/ejemplo/index.html');
  assert.ok(html.includes('<h1><span lang="en">WhatsApp theft with the code</span></h1>'));
  assert.ok(html.includes('<p lang="en" class="lede">They call saying they are from PAMI and ask you for a code.</p>'));
  assert.ok(html.includes('<blockquote class="bubble"><span lang="es">Le hablo de PAMI, ¿me lee el código? Es para hoy.</span></blockquote>'));
  assert.ok(html.includes('<p class="translation"><span lang="en">This is PAMI, can you read me the code? It has to be today.</span></p>'));
  assert.ok(html.includes('>Asks for a code<'));
  rmSync(dir, { recursive: true });
});
test('entry page keeps the whole original behind a Show original control', () => {
  const { dir, page } = build();
  const html = page('catalogue/ar/ejemplo/index.html');
  const orig = html.match(/<details class="original">([\s\S]*?)<\/details>/)?.[1];
  assert.ok(orig, 'original block');
  assert.match(orig, /<summary>.*Original \(Spanish\)/);
  assert.match(orig, /<div lang="es"><h2>Robo de WhatsApp con el código<\/h2><p>Te llaman diciendo que son de PAMI y te piden un código.<\/p>/);
  rmSync(dir, { recursive: true });
});
test('an English-original entry has no original block and no duplicate translation', () => {
  const dir = mkdtempSync(join(tmpdir(), 'scamdb-site-'));
  cpSync(OK, dir, { recursive: true });
  const e = JSON.parse(readFileSync(join(dir, 'data/ar/scams/ejemplo.json')));
  const enOnly = (o) => (o && typeof o === 'object' && !Array.isArray(o) && 'en' in o ? { en: o.en } : o);
  const walk = (v) => (Array.isArray(v) ? v.map(walk) : v && typeof v === 'object' ? enOnly(Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)]))) : v);
  writeFileSync(join(dir, 'data/ar/scams/ingles.json'), JSON.stringify({ ...walk(e), id: 'ar/ingles', lang: 'en' }));
  buildSite(loadRepo(dir), join(dir, 'dist'), meta, dir);
  const html = readFileSync(join(dir, 'dist/catalogue/ar/ingles/index.html'), 'utf8');
  assert.ok(!html.includes('class="original"'));
  assert.ok(!html.includes('class="translation"'));
  assert.ok(html.includes('<blockquote class="bubble"><span lang="en">This is PAMI, can you read me the code? It has to be today.</span></blockquote>'));
  rmSync(dir, { recursive: true });
});
test('catalogue cards show the English name and the message as it arrives', () => {
  const { dir, page } = build();
  const html = page('catalogue/index.html');
  assert.ok(html.includes('<span lang="en">WhatsApp theft with the code</span>'));
  assert.ok(html.includes('<blockquote><span lang="es">Le hablo de PAMI'));
  assert.ok(html.includes('<blockquote><span lang="pt">'));
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
test('the interface has only English strings', async () => {
  const { UI } = await import('../../site/i18n.js');
  assert.deepEqual(Object.keys(UI), ['en']);
});

// ---- Phase 2 pages ----
test('the account page has one h1 and the GitHub sign-in link', () => {
  const { dir, page } = build();
  for (const p of ['account/index.html']) {
    const html = page(p);
    assert.equal((html.match(/<h1[\s>]/g) ?? []).length, 1, p);
    assert.ok(html.includes('href="/auth/github"'), p);
    assert.ok(html.includes('src="/assets/account.js"'), p);
  }
  rmSync(dir, { recursive: true });
});
test('the docs describe reports and keys', () => {
  const { dir, page } = build();
  assert.ok(page('docs/index.html').includes('POST /v1/reports'));
  assert.ok(page('docs/index.html').includes('Authorization: Bearer sk_'));
  rmSync(dir, { recursive: true });
});
test('the home page offers a free key and lists the reports endpoint', () => {
  const { dir, page } = build();
  assert.ok(page('index.html').includes('href="/account/"'));
  assert.ok(page('index.html').includes('POST /v1/reports'));
  rmSync(dir, { recursive: true });
});
test('contribute points to our own report form, not a redirect', () => {
  const { dir, page } = build();
  assert.ok(page('contribute/index.html').includes('href="/report/"'));
  assert.ok(!page('contribute/index.html').includes('eschamuyo.com/#/avisar'));
  rmSync(dir, { recursive: true });
});

test('the hero bubble is a scribble with a big code, no Spanish sentence', () => {
  const { dir, page } = build();
  for (const p of ['index.html']) {
    const html = page(p);
    assert.ok(!html.includes('Le hablo de PAMI.'), p);
    assert.match(html, /class="t-code-big"[^>]*>482 913</, p);
  }
  rmSync(dir, { recursive: true });
});
test('the playground gets one entries.json with every country', () => {
  const { dir, page } = build();
  const j = JSON.parse(page('assets/entries.json'));
  assert.deepEqual([...new Set(j.entries.map((e) => e.country))].sort(), ['ar', 'br']);
  assert.ok(j.entries[0].phrases.en);
  rmSync(dir, { recursive: true });
});
test('a fading scam says so on its page and card; an active one does not', () => {
  const dir = mkdtempSync(join(tmpdir(), 'scamdb-site-'));
  cpSync(OK, dir, { recursive: true });
  const e = JSON.parse(readFileSync(join(dir, 'data/ar/scams/ejemplo.json')));
  writeFileSync(join(dir, 'data/ar/scams/vieja.json'), JSON.stringify({ ...e, id: 'ar/vieja', status: 'fading', sources: [{ ...e.sources[0], date: '2023-08-08' }] }));
  buildSite(loadRepo(dir), join(dir, 'dist'), meta, dir);
  const page = (p) => readFileSync(join(dir, 'dist', p), 'utf8');
  assert.ok(page('catalogue/ar/vieja/index.html').includes('Seen less now · newest source Aug 2023'));
  assert.ok(!page('catalogue/ar/ejemplo/index.html').includes('status-note'));
  assert.match(page('catalogue/index.html'), /data-status="fading"/);
  rmSync(dir, { recursive: true });
});
test('docs show POST /v1/isitascam, its limits and that the score is a fitted probability', () => {
  const { dir, page } = build();
  const html = page('docs/index.html');
  for (const s of ['POST /v1/isitascam', '10 per IP', '50', 'probability (0 to 1)', 'fitted on 198 labelled messages', 'report', 'image=@screenshot.png', 'never stored']) assert.ok(html.includes(s), s);
  assert.ok(!html.includes('currently ar'));
  rmSync(dir, { recursive: true });
});
test('home no longer says isitascam is coming soon and has the API button', () => {
  const { dir, page } = build();
  const html = page('index.html');
  assert.ok(!/coming soon/i.test(html));
  assert.match(html, /<button[^>]+id="pg-api"[^>]+aria-label="Check with the API"/);
  assert.match(html, /<pre class="api-out"[^>]*hidden/);
  rmSync(dir, { recursive: true });
});
test('the feed page explains what it never contains and the terms, and the docs link to it', () => {
  const { dir, page } = build();
  const html = page('feed/index.html');
  for (const s of ['Feed for organisations', 'never contains', 'Counts under 3 are withheld', '/v1/feed/trends', 'Don’t publicly name', 'scamdb.dev']) assert.ok(html.includes(s), s);
  assert.ok(page('docs/index.html').includes('href="/feed/"'));
  rmSync(dir, { recursive: true });
});

test('the report page has the form, the privacy note, Turnstile and its own CSP', () => {
  const { dir, page } = build();
  const html = page('report/index.html');
  for (const s of ['id="rep-form"', 'name="country"', 'name="text"', 'name="image"', 'Phone numbers, emails', 'data-sitekey="0x4', '/assets/report.js']) assert.ok(html.includes(s), s);
  assert.ok(page('index.html').includes('href="/report/"'), 'the nav links to the report page');
  const headers = readFileSync(new URL('../../site/_headers', import.meta.url), 'utf8');
  assert.match(headers, /\/report\/\*\n\s+! Content-Security-Policy\n\s+Content-Security-Policy: [^\n]*script-src 'self' https:\/\/challenges\.cloudflare\.com[^\n]*frame-src https:\/\/challenges\.cloudflare\.com/);
  rmSync(dir, { recursive: true });
});
