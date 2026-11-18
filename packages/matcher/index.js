// "Is this a scam?": reads the warning signs in a message and finds the catalogue entries it looks like.
// Ported from eschamuyo (site/js/matcher.js, analyze.js, checker.js). Runs in Node and in the browser.
import { normalize, tokens, editDistance } from '../../lib/text.js';
import { readSignsWithEvidence, isWarningAbout } from './signs.js';

export { SIGNS, readSigns, readSignsWithEvidence, isWarningAbout } from './signs.js';
export const VERSION = '1.30.0';
export const MATCH_THRESHOLD = 2;
// A runner-up must score at least this share of the best match; weaker ones were mostly one shared word (eval set).
export const MATCH_RELATIVE = 0.6;
// A scam from another country is shown only when it beats the best local match (and the threshold) by this much.
export const ELSEWHERE_MARGIN = 3;
// …and scores at least this on its own: a scam abroad must be a strong fit, not a few shared words.
export const ELSEWHERE_MIN = 6;
export const MAX_INPUT = 5000;
// Asking for money is only "scam" with a second sign that it isn't who it seems or isn't what it seems: a relative
// asking from their usual number, or a shop confirming a payment, stays "suspicious" at most.
const MONEY_PLUS = ['impersonation', 'new_number', 'secrecy', 'too_good_to_be_true', 'keep_on_line', 'unknown_link'];
// Pressure plus an action (pay, click, stay on the call) is the shape of a scam; ordinary urgent messages carry one alone.
const PRESSED = ['money_request', 'unknown_link', 'keep_on_line'];
const isScam = (ids) => ids.includes('asks_for_code') || ids.includes('remote_access')
  || (ids.includes('money_request') && MONEY_PLUS.some((id) => ids.includes(id)))
  || (ids.includes('urgency') && PRESSED.some((id) => ids.includes(id)));

/** The spec's hard rules: a code request, remote access, or money plus impersonation. A scorer can't go below suspicious. */
export function hardRules(ids) {
  const has = (id) => ids.includes(id);
  return has('asks_for_code') || has('remote_access') || (has('money_request') && has('impersonation'));
}

/** The best score over every language the entry has (its phrases plus its name in that language). With `translated`,
 * the machine-translated phrases count too (only for finding scams documented in another country). */
function scoreEntry(entry, text, words, translated = false) {
  const langs = prepared(entry, translated);
  let best = 0;
  for (const list of langs) best = Math.max(best, scoreLang(list, text, words));
  return best;
}

// Each entry's phrases, normalised and split into words once per entry (not on every check): checks run against
// hundreds of entries with dozens of phrases each, so re-normalising them was most of a check's time.
const PREPARED = [new WeakMap(), new WeakMap()];
function prepared(entry, translated) {
  const cache = PREPARED[translated ? 1 : 0];
  let langs = cache.get(entry);
  if (!langs) {
    const lists = { ...(translated ? entry.phrasesTranslated ?? {} : {}), ...(entry.phrases ?? {}) };
    langs = Object.keys(lists).map((l) => [...(lists[l] ?? []), entry.name?.[l] ?? ''].map(normalize).filter(Boolean)
      .map((p) => (HANGUL.test(p) ? { p: ` ${p} `, pw: hangulStems(p), hangul: true } : { p: ` ${p} `, pw: tokens(p), joined: UNSPACED.test(p) })).filter((x) => x.pw.length));
    cache.set(entry, langs);
  }
  return langs;
}

// Scripts written without spaces between words (Thai, Lao, Khmer, Burmese, Chinese, Japanese): a phrase or one of
// its space-separated chunks counts when it appears anywhere in the text, not only between spaces.
// Korean writes spaces between words but attaches particles to them (계좌가, 계좌를, 계좌에) and many key words are two
// syllables (계좌, 검찰), which tokens() drops. Hangul words are compared by stem: two syllables or more, without a
// trailing one-syllable particle.
const HANGUL = /[\uAC00-\uD7AF]/u;
const hangulStems = (s) => [...new Set(normalize(s).split(' ').filter((w) => HANGUL.test(w) && w.length >= 2).map((w) => (w.length >= 3 ? w.slice(0, -1) : w)))];
/** Every stem a text word could match: the word, and the word without one or two trailing syllables (particles). */
function hangulSet(text) {
  const set = new Set();
  for (const w of text.split(' ')) if (HANGUL.test(w) && w.length >= 2) { set.add(w); if (w.length >= 3) set.add(w.slice(0, -1)); if (w.length >= 4) set.add(w.slice(0, -2)); }
  return set;
}

// Messages are short; comparing the first 1,500 characters keeps a pasted wall of text fast.
const JOINED_WINDOW = 1500;
const UNSPACED = /[\u0E00-\u0EFF\u1000-\u109F\u1780-\u17FF\u3040-\u30FF\u3400-\u9FFF]/u;

/** Length of the longest substring a and b share (a is a short phrase; dynamic programming over two rows). */
function longestShared(a, b) {
  let best = 0, prev = new Int32Array(a.length + 1), cur = new Int32Array(a.length + 1);
  for (let j = 0; j < b.length; j++) {
    const c = b.charCodeAt(j);
    for (let i = 1; i <= a.length; i++) {
      const v = a.charCodeAt(i - 1) === c ? prev[i - 1] + 1 : 0;
      cur[i] = v;
      if (v > best) { best = v; if (best === a.length) return best; }
    }
    [prev, cur] = [cur, prev];
  }
  return best;
}

function scoreLang(list, text, words) {
  const counted = new Set();
  let score = 0;
  for (const { p, pw, joined, hangul } of list) {
    if (hangul) {
      if (pw.length > 1 && text.includes(p)) { score += 3; pw.forEach((w) => counted.add(w)); continue; }
      for (const w of pw) if (!counted.has(w) && words.hangul.has(w)) { score += pw.length === 1 ? 2 : 1; counted.add(w); }
      continue;
    }
    if (joined) {
      if (!words.unspaced) continue; // no such script in the text: nothing to share, and long texts stay fast
      if (text.includes(p.trim())) { score += 3; pw.forEach((w) => counted.add(w)); continue; }
      // No word boundaries to compare, so score the longest stretch the phrase shares with the text.
      const run = longestShared(p.trim(), text.length > JOINED_WINDOW ? text.slice(0, JOINED_WINDOW) : text);
      if (run >= 10) score += 2; else if (run >= 6) score += 1;
      continue;
    }
    if (pw.length > 1 && text.includes(p)) { score += 3; pw.forEach((w) => counted.add(w)); continue; }
    const single = pw.length === 1;
    for (const w of pw) {
      if (counted.has(w)) continue;
      if (words.set.has(w)) { score += single ? 2 : 1; counted.add(w); }
      else if (w.length >= 5 && words.fuzzy.some((t) => editDistance(t, w, 1) <= 1)) { score += single ? 1 : 0.5; counted.add(w); }
    }
  }
  return score;
}

/**
 * @returns {{ verdict: 'scam'|'suspicious'|'not_recognised', score: null, warning?: true,
 *             signals: {id: string, evidence: string}[], matches: {id: string, score: number}[],
 *             elsewhere?: {id: string, score: number}[] }}
 * With `elsewhere: true` (and a country), entries from other countries are scored too: a scam known only abroad (in
 * any language its phrases cover) is returned in `elsewhere` when it fits clearly better than every local entry.
 */
// The languages a country's messages arrive in, read from its entries: each entry's language and the languages its
// phrases are written in (Latvian entries carry Russian phrases, for instance). Cached per catalogue and country.
const LANGS = new WeakMap();
export function countryLangs(entries, country) {
  if (!country) return null;
  let byCountry = LANGS.get(entries);
  if (!byCountry) { byCountry = new Map(); LANGS.set(entries, byCountry); }
  let langs = byCountry.get(country);
  if (!langs) {
    const set = new Set();
    for (const e of entries) if (e.country === country) { if (e.lang) set.add(e.lang); for (const l of Object.keys(e.phrases ?? {})) set.add(l); }
    langs = set.size ? [...set] : null;
    byCountry.set(country, langs);
  }
  return langs;
}

export function matchMessage(input, entries, { country, limit = 3, elsewhere = false, elsewhereMin = ELSEWHERE_MIN, elsewhereMargin = ELSEWHERE_MARGIN } = {}) {
  const raw = String(input ?? '').slice(0, MAX_INPUT);
  const text = normalize(raw);
  // Unique words once: a Set for exact hits, and the 4+ letter ones for typo matching (long inputs repeat words).
  const set = new Set(tokens(text));
  const words = { set, fuzzy: [...set].filter((w) => w.length >= 4), unspaced: UNSPACED.test(text), hangul: HANGUL.test(text) ? hangulSet(text) : new Set() };
  const padded = ` ${text} `;
  const rank = (pool, translated = false) => (!text ? [] : pool.map((e, i) => ({ id: e.id, score: scoreEntry(e, padded, words, translated), i }))
    .filter((r) => r.score >= MATCH_THRESHOLD)
    .sort((a, b) => b.score - a.score || a.i - b.i));
  const local = rank(country ? entries.filter((e) => e.country === country) : entries);
  const matches = local.filter((r, _, all) => r.score >= MATCH_RELATIVE * all[0].score)
    .slice(0, limit).map(({ id, score }) => ({ id, score }));
  // Language blocks apply only for the country's languages; with no country, every block applies.
  const signals = readSignsWithEvidence(raw, countryLangs(entries, country));
  // A forwarded warning about a scam is never itself called a scam; its matches say which scam it warns about.
  const warning = isWarningAbout(raw, signals.map((s) => s.id));
  const verdict = isScam(signals.map((s) => s.id)) && !warning ? 'scam'
    : signals.length || matches.length ? 'suspicious' : 'not_recognised';
  const out = { verdict, score: null, signals, matches };
  if (warning) out.warning = true;
  if (elsewhere && country) {
    const best = local[0]?.score ?? 0;
    out.elsewhere = rank(entries.filter((e) => e.country !== country), true)
      .filter((r) => r.score >= Math.max(elsewhereMin, best + elsewhereMargin))
      .slice(0, 2).map(({ id, score }) => ({ id, score }));
  }
  return out;
}
