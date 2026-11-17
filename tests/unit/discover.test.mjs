import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseFeed, parseGdelt, canonicalUrl, dedupe, classify, signals, toMarkdown, scamRelated } from '../../lib/discover.js';

const RSS = `<rss><channel><item><title><![CDATA[Scam alert: fake toll texts]]></title><link>https://agency.gov/a?utm_source=x</link><pubDate>Mon, 16 Nov 2026 10:00:00 GMT</pubDate></item>
<item><title>Opening hours change</title><link>https://agency.gov/b</link></item></channel></rss>`;
const ATOM = `<feed><entry><title>Arnaque aux faux votes WhatsApp</title><link href="https://cyber.fr/x"/><updated>2026-10-27T08:00:00Z</updated></entry></feed>`;

test('parses RSS and Atom items with dates', () => {
  assert.deepEqual(parseFeed(RSS)[0], { title: 'Scam alert: fake toll texts', url: 'https://agency.gov/a?utm_source=x', date: '2026-11-16' });
  assert.equal(parseFeed(RSS)[1].date, null);
  assert.deepEqual(parseFeed(ATOM)[0], { title: 'Arnaque aux faux votes WhatsApp', url: 'https://cyber.fr/x', date: '2026-10-27' });
});
test('parses GDELT artlist JSON', () => {
  const items = parseGdelt({ articles: [{ url: 'https://news.ar/n1', title: 'Alertan por estafa de venta de dólares', seendate: '20261116T101500Z', domain: 'news.ar', language: 'Spanish' }] }, 'ar');
  assert.deepEqual(items[0], { title: 'Alertan por estafa de venta de dólares', url: 'https://news.ar/n1', country: 'ar', lang: 'Spanish', date: '2026-11-16', source: 'gdelt', type: 'news', domain: 'news.ar' });
});
test('canonical URLs drop tracking, fragments, amp and mobile hosts', () => {
  assert.equal(canonicalUrl('https://m.site.com/story/amp/?utm_source=t&id=3#top'), 'https://site.com/story/?id=3');
});
test('dedupe removes the same link and near-identical titles', () => {
  const a = { title: 'Fake toll text scam spreads', url: 'https://a.com/1?utm_medium=x', country: 'us' };
  const out = dedupe([a, { ...a, url: 'https://a.com/1' }, { ...a, url: 'https://b.com/2', title: 'Scam spreads: fake toll text' }]);
  assert.equal(out.length, 1);
  assert.equal(out[0].also, 1);
});
test('only scam-related titles pass the general-news filter', () => {
  assert.ok(scamRelated({ title: 'Nueva estafa por WhatsApp' }));
  assert.ok(!scamRelated({ title: 'Weather warning for Sunday' }));
});

const entries = [{ id: 'ar/venta-de-dolares', country: 'ar', name: { es: 'Venta falsa de dólares' }, phrases: { es: ['venta de dolares', 'dolares para vender', 'estafa venta de dolares'] } }];
test('classify links items to catalogue entries; possibly-new needs 3 publishers', () => {
  const news = (i, d, t) => ({ title: t, url: `https://${d}/n${i}`, domain: d, country: 'ar', type: 'news', date: '2026-11-16' });
  const items = classify([
    news(1, 'a.ar', 'Alertan por estafa de venta de dólares por WhatsApp'),
    news(2, 'a.ar', 'Nueva modalidad: falsos turnos médicos piden seña'),
    news(3, 'b.ar', 'Advierten por falsos turnos médicos que piden seña'),
    news(4, 'c.ar', 'Cuidado con los falsos turnos médicos que piden seña'),
    { title: 'Aviso oficial sobre turnos', url: 'https://gob.ar/x', country: 'ar', type: 'agency', feed: 'ar-x' },
  ], entries, []);
  assert.equal(items[0].match, 'ar/venta-de-dolares');
  const sig = signals(items);
  assert.equal(sig.entries[0].id, 'ar/venta-de-dolares');
  assert.equal(sig.possiblyNew.length, 1);
  assert.equal(sig.possiblyNew[0].sources, 3);
  assert.equal(sig.agency.length, 1);
  const md = toMarkdown(sig, { week: '2026-W47' });
  assert.match(md, /Possibly new \(1\)/);
  assert.ok(!md.includes('Advierten por falsos turnos'), 'titles are not copied into the issue');
  assert.match(md, /GDELT Project/);
});
test('every source has terms, and no forbidden source is enabled', () => {
  const cfg = JSON.parse(readFileSync(new URL('../../tools/discover/feeds.json', import.meta.url), 'utf8'));
  for (const f of cfg.feeds) {
    assert.ok(f.terms && f.url.startsWith('https://'), f.id);
    assert.ok(!/reddit\.com|twitter\.com|x\.com\/|t\.me|telegram|youtube\.com|openphish/i.test(f.url), `${f.id}: source not allowed by our terms review`);
  }
  const wf = readFileSync(new URL('../../.github/workflows/discover.yml', import.meta.url), 'utf8');
  assert.match(wf, /issues: write/);
  assert.match(wf, /contents: read/);
});
