// Source collector: turns feeds from the sources registry (sources/registry.json) into candidates for the private
// review queue. Pure functions (no network), so they can be tested; tools/collect.mjs does the fetching and sending.
// Nothing here touches the catalogue, the API or the detection data: a candidate only becomes useful after the owner
// reviews it, and even then it only feeds research (importer drafts), never the matcher or the fusion weights directly.
import { canonicalUrl } from './discover.js';

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'" };
const unescape = (s) => s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+|#39);/gi, (m, e) => {
  if (e[0] === '#') { const n = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : Number(e.slice(1)); return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : ' '; }
  return ENTITIES[e.toLowerCase()] ?? m;
});
/** Plain text from a feed field that may hold CDATA, escaped HTML (Reddit) or both. */
export function plainText(s) {
  let t = String(s ?? '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
  t = unescape(t).replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, ' ').replace(/<br\s*\/?>|<\/p>|<\/li>/gi, '\n').replace(/<[^>]+>/g, ' ');
  t = unescape(t);
  return t.replace(/[ \t\f\v\r]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}
const tag = (block, name) => block.match(new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)</${name}>`, 'i'))?.[1];

export const MAX_TEXT = 4000;
export const MAX_TITLE = 300;

/** Items of an RSS or Atom document with their text: [{ title, url, date, text }]. */
export function parseItems(xml) {
  const blocks = [...String(xml).matchAll(/<(item|entry)\b[\s\S]*?<\/\1>/gi)].map((m) => m[0]);
  return blocks.map((b) => {
    const href = b.match(/<link\b[^>]*href="([^"]+)"/i)?.[1];
    const url = plainText(href ?? tag(b, 'link') ?? tag(b, 'guid'));
    const raw = plainText(tag(b, 'pubDate') ?? tag(b, 'published') ?? tag(b, 'updated') ?? tag(b, 'dc:date'));
    const d = new Date(raw);
    const text = plainText(tag(b, 'content:encoded') ?? tag(b, 'content') ?? tag(b, 'description') ?? tag(b, 'summary'))
      .replace(/\s*submitted by\s+\/u\/\S+[\s\S]*$/i, ''); // Reddit's footer: the author's name and comment links
    return { title: plainText(tag(b, 'title')).slice(0, MAX_TITLE), url, date: Number.isNaN(d.getTime()) ? null : d.toISOString(), text: text.slice(0, MAX_TEXT) };
  }).filter((i) => i.title && /^https?:\/\//.test(i.url));
}

// Words that make an item worth a look, per language. A source with `filter: false` (a forum about scams) keeps
// everything; the others keep an item only when its title or text scores at least `minScore`.
const WORDS = {
  fr: { strong: ['arnaque', 'arnaques', 'arnaqueur', 'escroquerie', 'escroc', 'hameçonnage', 'hameconnage', 'phishing', 'smishing', 'faux conseiller', 'fraude', 'usurpation', 'faux sms', 'sms frauduleux', 'mail frauduleux', 'tentative'],
    weak: ['sms', 'message', 'reçu', 'recu', 'lien', 'colis', 'code', 'compte', 'carte vitale', 'cpf', 'amende', 'antai', 'impots', 'impôts', 'ameli', 'la poste', 'chronopost', 'banque', 'virement', 'whatsapp', 'appel', 'numéro', 'numero', 'faux', 'fausse', 'alerte', 'vigilance'] },
  en: { strong: ['scam', 'scammer', 'fraud', 'phishing', 'smishing', 'impersonat*'], weak: ['text', 'sms', 'message', 'link', 'parcel', 'code', 'account', 'bank', 'call', 'fake', 'alert'] },
  it: { strong: ['truffa', 'truffe', 'truffatori', 'frode', 'phishing', 'smishing', 'vishing', 'raggiro', 'falso sms', 'falsi sms', 'falsa email', 'false email', 'falsi profili', 'finti operatori', 'finto operatore'],
    weak: ['sms', 'messaggio', 'messaggi', 'link', 'pacco', 'codice', 'conto', 'banca', 'carta', 'chiamata', 'falso', 'falsi', 'falsa', 'attenzione', 'whatsapp', 'pagamento'] },
  nl: { strong: ['oplichting', 'oplichters', 'fraude', 'phishing', 'valse', 'vals', 'nep', 'neppe', 'spoofing', 'helpdeskfraude'],
    weak: ['sms', 'bericht', 'berichten', 'link', 'pakket', 'code', 'rekening', 'bank', 'telefoontje', 'whatsapp', 'betaling', 'melding', 'meldingen'] },
  de: { strong: ['betrug', 'betrüger', 'phishing', 'smishing', 'abzocke', 'gefälscht', 'gefälschte', 'falsche', 'enkeltrick', 'schockanruf'],
    weak: ['sms', 'nachricht', 'e-mail', 'link', 'paket', 'code', 'konto', 'bank', 'anruf', 'whatsapp', 'zahlung', 'warnung'] },
  pt: { strong: ['golpe', 'golpes', 'burla', 'burlas', 'fraude', 'phishing', 'smishing', 'falso', 'falsa', 'esquema'],
    weak: ['sms', 'mensagem', 'link', 'encomenda', 'código', 'codigo', 'conta', 'banco', 'pix', 'mb way', 'chamada', 'whatsapp', 'alerta'] },
  es: { strong: ['estafa', 'estafador', 'fraude', 'timo', 'phishing', 'smishing', 'suplantación', 'suplantacion'], weak: ['sms', 'mensaje', 'enlace', 'paquete', 'código', 'codigo', 'cuenta', 'banco', 'llamada', 'falso', 'alerta'] },
};
const norm = (s) => s.toLowerCase().normalize('NFC');
/** Relevance score: 3 per strong word, 1 per weak word (each counted once), title and text together. */
export function score(item, lang) {
  const w = WORDS[lang] ?? WORDS.en;
  const hay = norm(`${item.title} ${item.text ?? ''}`);
  // Whole words; a word ending in * also matches longer forms (impersonat* → impersonation, impersonating).
  const has = (word) => {
    const stem = word.endsWith('*');
    const w = (stem ? word.slice(0, -1) : word).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|[^\\p{L}\\p{N}])${w}${stem ? '' : '(?![\\p{L}\\p{N}])'}`, 'u').test(hay);
  };
  return w.strong.filter(has).length * 3 + w.weak.filter(has).length;
}

/** The registry's sources that this run should read: allowed, with a feed, and meant for `where` (home or cloud). */
export function sourcesFor(registry, where, only = null) {
  return registry.sources.filter((s) => s.allowed && s.feed && (s.runs === where || s.runs === 'any') && (!only || only.includes(s.id)));
}

/** Candidates for the review queue from one source's parsed items, newest first, newer than `since` (ISO). */
export function candidates(items, source, { since = null, now = new Date() } = {}) {
  const min = source.filter === false ? -Infinity : (source.minScore ?? 3);
  return items
    // Page readers give each entry its own anchor (#date-title), which canonicalUrl would strip.
    .map((i) => ({ ...i, url: source.reader ? i.url : canonicalUrl(i.url), score: score(i, source.lang) }))
    .filter((i) => i.score >= min && (!since || !i.date || i.date >= since))
    .map((i) => ({ source: source.id, url: i.url, title: i.title, text: i.text || null, lang: source.lang, country: source.country,
      publishedAt: i.date, collectedAt: now.toISOString(), score: Number.isFinite(i.score) ? i.score : 0 }));
}

const ID = /^[a-z]{2}-[a-z0-9-]{2,60}$/;
const KINDS = ['forum', 'agency', 'regulator', 'police', 'ngo', 'industry', 'news', 'fact-check', 'company'];
const USES = ['messages', 'alerts', 'warnings', 'blacklist', 'registry', 'reports', 'reporting', 'statistics'];
/** Problems in the registry (empty when it is valid). CI runs this. */
export function checkRegistry(registry, readers = null) {
  const problems = [];
  const seen = new Set();
  for (const s of registry?.sources ?? []) {
    const p = (m) => problems.push(`${s.id ?? '?'}: ${m}`);
    if (!ID.test(s.id ?? '')) p('id must look like "fr-name"');
    if (seen.has(s.id)) p('duplicate id');
    seen.add(s.id);
    // Two letters: a country code, eu (EU bodies) or ww (worldwide).
    if (!/^[a-z]{2}$/.test(s.country ?? '') || s.id?.slice(0, 2) !== s.country) p('country must be two letters (or eu, ww) and start the id');
    if (!/^[a-z]{2}$/.test(s.lang ?? '')) p('lang must be two letters');
    if (!KINDS.includes(s.kind)) p(`kind must be one of ${KINDS.join(', ')}`);
    if (!s.name || !/^https:\/\//.test(s.site ?? '')) p('needs a name and an https site');
    if (s.feed !== null && !/^https:\/\//.test(s.feed ?? '')) p('feed must be an https URL or null');
    if (!['home', 'cloud', 'any'].includes(s.runs)) p('runs must be home, cloud or any');
    if (!USES.includes(s.use)) p(`use must be one of ${USES.join(', ')}`);
    if (typeof s.allowed !== 'boolean') p('allowed must be true or false');
    if (s.allowed && !s.feed) p('an allowed source needs a feed (or, with a page reader, the page address)');
    if (s.days !== undefined && !(Number.isInteger(s.days) && s.days >= 1 && s.days <= 90)) p('days must be a whole number from 1 to 90');
    if (readers && s.reader !== undefined && !(s.reader in readers)) p(`reader must be one of ${Object.keys(readers).join(', ')}`);
    if (!s.terms || !s.why) p('needs terms (what we may keep) and why (why it is trustworthy)');
  }
  if (!problems.length && !seen.size) problems.push('no sources');
  return problems;
}
