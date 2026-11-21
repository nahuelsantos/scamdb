import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseItems, plainText, score, candidates, sourcesFor, checkRegistry } from '../../lib/collect.js';

const registry = JSON.parse(readFileSync(new URL('../../sources/registry.json', import.meta.url), 'utf8'));
const REDDIT = `<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom"><entry><title>SMS ameli carte Vitale, arnaque ?</title>
<link href="https://www.reddit.com/r/arnaques/comments/abc/sms_ameli/?utm_source=x"/><updated>2026-11-20T09:12:00+00:00</updated>
<content type="html">&lt;!-- SC_OFF --&gt;&lt;div class="md"&gt;&lt;p&gt;J&amp;#39;ai reçu : « Votre carte Vitale expire »&lt;/p&gt;&lt;/div&gt;&lt;!-- SC_ON --&gt; &amp;#32; submitted by &amp;#32; &lt;a href="https://www.reddit.com/user/someone"&gt; /u/someone &lt;/a&gt;</content></entry></feed>`;
const NEWS = `<rss><channel><item><title><![CDATA[Le gouvernement présente son budget]]></title><link>https://news.example/budget</link><pubDate>Thu, 20 Nov 2026 08:00:00 GMT</pubDate><description>Rien à voir.</description></item>
<item><title>Arnaque au faux conseiller bancaire : la nouvelle méthode</title><link>https://news.example/arnaque</link><pubDate>Thu, 20 Nov 2026 09:00:00 GMT</pubDate><description><![CDATA[<p>Un SMS puis un appel.</p>]]></description></item></channel></rss>`;

test('the registry is valid and every source says why it is trusted', () => {
  assert.deepEqual(checkRegistry(registry), []);
  assert.ok(registry.sources.some((s) => s.country === 'fr' && s.kind === 'forum'));
});
test('the registry check catches the usual mistakes', () => {
  const bad = { sources: [{ id: 'fr-x', country: 'es', lang: 'fr', kind: 'blog', name: 'x', site: 'http://x', feed: null, runs: 'mars', allowed: true }] };
  const p = checkRegistry(bad).join('\n');
  for (const want of ['country', 'kind', 'https site', 'runs', 'use must', 'needs a feed', 'terms']) assert.match(p, new RegExp(want));
});
test('Reddit entries come out as plain text, without the author', () => {
  const [it] = parseItems(REDDIT);
  assert.equal(it.title, 'SMS ameli carte Vitale, arnaque ?');
  assert.equal(it.text, 'J\'ai reçu : « Votre carte Vitale expire »');
  assert.ok(!it.text.includes('someone'));
  assert.equal(it.date, '2026-11-20T09:12:00.000Z');
});
test('plainText handles CDATA, escaped HTML and numeric entities', () => {
  assert.equal(plainText('<![CDATA[<b>a</b> &amp; b]]>'), 'a & b');
  assert.equal(plainText('&lt;p&gt;x&lt;/p&gt;&lt;p&gt;y&lt;/p&gt;'), 'x\ny');
  assert.equal(plainText('caf&#233; &#x2014;'), 'café —');
});
test('a filtered source keeps only scam-related items; a scam forum keeps everything', () => {
  const news = registry.sources.find((s) => s.id === 'fr-lemonde-decodeurs');
  const kept = candidates(parseItems(NEWS), news, { now: new Date('2026-11-21T00:00:00Z') });
  assert.deepEqual(kept.map((c) => c.url), ['https://news.example/arnaque']);
  assert.equal(kept[0].country, 'fr'); assert.equal(kept[0].source, news.id);
  const forum = registry.sources.find((s) => s.id === 'fr-reddit-arnaques');
  const all = candidates(parseItems(REDDIT.replace('arnaque ?', 'question')), forum);
  assert.equal(all.length, 1);
  assert.equal(all[0].url, 'https://www.reddit.com/r/arnaques/comments/abc/sms_ameli/');
});
test('old items are left out', () => {
  const news = registry.sources.find((s) => s.id === 'fr-lemonde-decodeurs');
  assert.equal(candidates(parseItems(NEWS), news, { since: '2026-11-20T10:00:00Z' }).length, 0);
});
test('the score counts whole words only', () => {
  assert.equal(score({ title: 'Arnaque par SMS', text: '' }, 'fr'), 4);
  assert.equal(score({ title: 'smsfoo codex', text: '' }, 'fr'), 0);
});
test('home runs read home and any sources; disabled sources never run', () => {
  const home = sourcesFor(registry, 'home').map((s) => s.id);
  const cloud = sourcesFor(registry, 'cloud').map((s) => s.id);
  assert.ok(home.includes('fr-cybermalveillance-alertes') && home.includes('fr-franceinfo-vrai-ou-fake'));
  assert.ok(!cloud.includes('fr-cybermalveillance-alertes') && cloud.includes('fr-franceinfo-vrai-ou-fake'));
  assert.ok(!home.includes('fr-signal-arnaques') && !home.includes('fr-reddit-arnaques'));
});
test('the 2026-11-18 research list is in the registry, and only confirmed feeds are switched on', () => {
  const ids = new Set(registry.sources.map((s) => s.id));
  for (const id of ['ww-iosco-iscan', 'de-vz-phishingradar', 'es-incibe-avisos', 'nl-fraudehelpdesk', 'au-scamwatch', 'mx-condusef-sipres']) assert.ok(ids.has(id), id);
  for (const s of registry.sources.filter((x) => x.use === 'blacklist' || x.use === 'registry')) assert.equal(s.allowed, false, `${s.id}: lists of firms never go to the review queue`);
  for (const s of registry.sources.filter((x) => x.allowed)) assert.ok(s.feed, s.id);
});
test('relevance words exist for Italian, Dutch, German and Portuguese', () => {
  assert.ok(score({ title: 'FALSI SMS A NOME NEXI: NON FARTI INGANNARE', text: '' }, 'it') >= 3);
  assert.ok(score({ title: 'Valse sms uit naam van apotheek', text: '' }, 'nl') >= 3);
  assert.ok(score({ title: 'Phishing-Mail im Namen der Sparkasse', text: '' }, 'de') >= 3);
  assert.ok(score({ title: 'Golpe do falso funcionário do banco', text: '' }, 'pt') >= 3);
});
