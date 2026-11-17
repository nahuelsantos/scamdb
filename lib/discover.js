// Discovery: turns news and official feeds into signals for the weekly importer. Pure functions (no network), so they
// can be tested; tools/discover.mjs does the fetching. Only metadata is kept: link, title, date, publisher, country.
import { normalize, tokens } from './text.js';
import { matchMessage } from '../packages/matcher/index.js';
import { brandsIn } from './brands.js';

const decode = (s) => String(s ?? '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]+>/g, ' ')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/\s+/g, ' ').trim();
const tag = (block, name) => block.match(new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)</${name}>`, 'i'))?.[1];

/** Items of an RSS or Atom document: [{ title, url, date }] (date as YYYY-MM-DD when parseable). */
export function parseFeed(xml) {
  const blocks = [...String(xml).matchAll(/<(item|entry)\b[\s\S]*?<\/\1>/gi)].map((m) => m[0]);
  return blocks.map((b) => {
    const atomLink = b.match(/<link\b[^>]*href="([^"]+)"/i)?.[1];
    const url = decode(atomLink ?? tag(b, 'link') ?? tag(b, 'guid'));
    const raw = decode(tag(b, 'pubDate') ?? tag(b, 'updated') ?? tag(b, 'published') ?? tag(b, 'dc:date'));
    const d = new Date(raw);
    return { title: decode(tag(b, 'title')), url, date: Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10) };
  }).filter((i) => i.title && /^https?:\/\//.test(i.url));
}

/** Items from a GDELT DOC 2.0 artlist JSON answer. */
export function parseGdelt(json, country) {
  return (json?.articles ?? []).map((a) => ({
    title: decode(a.title), url: a.url, country, lang: a.language ?? null,
    date: /^\d{8}/.test(a.seendate ?? '') ? `${a.seendate.slice(0, 4)}-${a.seendate.slice(4, 6)}-${a.seendate.slice(6, 8)}` : null,
    source: 'gdelt', type: 'news', domain: a.domain ?? null,
  })).filter((i) => i.title && /^https?:\/\//.test(i.url ?? ''));
}

/** URL without tracking parameters, fragments, "amp" and mobile hosts. */
export function canonicalUrl(u) {
  try {
    const url = new URL(u);
    url.hash = '';
    for (const k of [...url.searchParams.keys()]) if (/^(utm_|fbclid|gclid|ref$|amp$)/i.test(k)) url.searchParams.delete(k);
    url.hostname = url.hostname.replace(/^(m|amp|mobile)\./, '');
    url.pathname = url.pathname.replace(/\/amp\/?$/, '/');
    return url.toString();
  } catch { return u; }
}

const SCAM_WORDS = /scam|fraud|phish|smish|vish|impersonat|estafa|fraude|golpe|arnaque|escroquer|betrug|truffa|oszust|oplicht|huijaus|bedrägeri|svindel/i;
/** Keep only scam-related items (for general news feeds). */
export const scamRelated = (item) => SCAM_WORDS.test(item.title);

/** Removes duplicate links and near-duplicate titles (same words) within a country. */
export function dedupe(items) {
  const seen = new Set(), titles = new Map();
  const out = [];
  for (const it of items) {
    const url = canonicalUrl(it.url);
    if (seen.has(url)) continue;
    const key = `${it.country}|${tokens(it.title).sort().slice(0, 8).join(' ')}`;
    if (titles.has(key)) { titles.get(key).also = (titles.get(key).also ?? 0) + 1; continue; }
    seen.add(url);
    const kept = { ...it, url };
    titles.set(key, kept);
    out.push(kept);
  }
  return out;
}

/** Each item with the catalogue entry it most looks like (in its country, or abroad) and the brands it names. */
export function classify(items, entries, brands) {
  return items.map((it) => {
    const cc = entries.some((e) => e.country === it.country) ? it.country : undefined;
    const m = matchMessage(it.title, entries, { country: cc, elsewhere: Boolean(cc) });
    const match = m.matches[0]?.id ?? m.elsewhere?.[0]?.id ?? null;
    return { ...it, match, brands: brandsIn(it.title, brands, it.country) };
  });
}

/** Weekly signals: official items, per-entry counts, and clusters of unmatched items from several publishers. */
export function signals(items) {
  const agency = items.filter((i) => i.type === 'agency');
  const byEntry = {};
  for (const i of items) if (i.match) (byEntry[i.match] ??= []).push(i);
  const unmatched = items.filter((i) => !i.match && i.type === 'news');
  // Cluster unmatched news per country by word overlap (Jaccard over 4+ letter words); label = the shared words.
  const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u; } };
  const words = (i) => new Set(tokens(i.title).filter((w) => w.length >= 4));
  const jaccard = (a, b) => { let n = 0; for (const w of a) if (b.has(w)) n++; return n / (a.size + b.size - n || 1); };
  const clusters = [];
  for (const i of unmatched) {
    const w = words(i);
    const c = clusters.find((k) => k.country === i.country && jaccard(k.words, w) >= 0.3);
    if (c) { c.items.push(i); c.shared = new Set([...c.shared].filter((x) => w.has(x))); } else clusters.push({ country: i.country, words: w, shared: new Set(w), items: [i] });
  }
  const possiblyNew = clusters
    .map((c) => ({ key: `${c.country}|${[...c.shared].slice(0, 4).join(' ')}`, country: c.country, sources: [...new Set(c.items.map((i) => i.domain ?? host(i.url)))], items: c.items }))
    .filter((c) => c.sources.length >= 3)
    .sort((a, b) => b.sources.length - a.sources.length);
  const link = (i) => ({ url: i.url, publisher: i.domain ?? host(i.url), date: i.date });
  return {
    agency: agency.map((i) => ({ country: i.country, feed: i.feed, match: i.match, brands: i.brands, ...link(i) })),
    entries: Object.entries(byEntry).map(([id, list]) => ({ id, count: list.length, links: list.slice(0, 5).map(link) })).sort((a, b) => b.count - a.count),
    possiblyNew: possiblyNew.map((c) => ({ country: c.country, words: c.key.split('|')[1], sources: c.sources.length, links: c.items.slice(0, 5).map(link) })),
  };
}

/** A Markdown summary for the weekly GitHub issue: our own labels, counts and links only (no copied titles). */
export function toMarkdown(sig, { week, generatedAt } = {}) {
  const lines = [`# Scam signals ${week ?? ''}`.trim(), '', `Generated ${generatedAt ?? ''}. Leads only: the importer finds and cites official or reputable sources itself. News discovery via the [GDELT Project](https://www.gdeltproject.org/).`, ''];
  lines.push(`## Possibly new (${sig.possiblyNew.length})`, '', 'Unmatched stories from 3+ publishers. Shared words are ours, from the titles.', '');
  for (const c of sig.possiblyNew.slice(0, 20)) lines.push(`- **${c.country}**: "${c.words}" (${c.sources} publishers): ${c.links.map((l) => `[${l.publisher}](${l.url})`).join(', ')}`);
  lines.push('', `## Official warnings (${sig.agency.length})`, '');
  for (const a of sig.agency.slice(0, 40)) lines.push(`- **${a.country}** ${a.date ?? ''} [${a.publisher}](${a.url})${a.match ? `: looks like \`${a.match}\`` : ': no catalogue match'}`);
  lines.push('', '## Most reported catalogue scams', '', '| entry | items | example links |', '|---|---|---|');
  for (const e of sig.entries.slice(0, 20)) lines.push(`| \`${e.id}\` | ${e.count} | ${e.links.slice(0, 3).map((l) => `[${l.publisher}](${l.url})`).join(', ')} |`);
  return lines.join('\n') + '\n';
}
