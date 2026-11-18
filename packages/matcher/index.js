// "Is this a scam?": reads the warning signs in a message and finds the catalogue entries it looks like.
// Ported from eschamuyo (site/js/matcher.js, analyze.js, checker.js). Runs in Node and in the browser.
import { normalize, tokens, editDistance } from '../../lib/text.js';
import { readSignsWithEvidence, isWarningAbout } from './signs.js';

export { SIGNS, readSigns, readSignsWithEvidence, isWarningAbout } from './signs.js';
export const VERSION = '1.36.0';
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

// An entry's score is its best over every language list it has (its phrases plus its name in that language). With
// `translated`, the machine-translated phrases count too (only for finding scams documented in another country).

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
const DENSE = /[\u3040-\u30FF\u3400-\u9FFF]/u;
const UNSPACED = /[\u0E00-\u0EFF\u1000-\u109F\u1780-\u17FF\u3040-\u30FF\u3400-\u9FFF]/u;

/** Every two-character piece of the text (for the shared-stretch pre-check). */
function bigramSet(t) {
  const set = new Set();
  for (let i = 0; i + 1 < t.length; i++) set.add(t.slice(i, i + 2));
  return set;
}

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

/** True when some 4+ letter text word is one typo away from w, the same as words.fuzzy.some(t => editDistance(t, w, 1)
 * <= 1). Text words are looked up by their one-letter deletions first (two words one edit apart always share one), so
 * the full comparison runs only for real candidates, and each phrase word is answered once per check. */
function nearWord(w, words) {
  let near = words.near.get(w);
  if (near !== undefined) return near;
  const seen = new Set();
  const check = (key) => { for (const t of words.byDel.get(key) ?? []) if (!seen.has(t)) { seen.add(t); if (editDistance(t, w, 1) <= 1) return true; } return false; };
  near = check(w) || deletions(w).some(check);
  words.near.set(w, near);
  return near;
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
      const phrase = p.trim();
      const [hi, lo] = DENSE.test(phrase) ? [6, 4] : [10, 6];
      // A shared stretch of n characters needs n - 1 consecutive phrase bigrams in the text: skip the expensive
      // comparison when no such run exists (most phrases), using the text's bigram set built once per check.
      let streak = 0, bestStreak = 0;
      for (let k = 0; k + 1 < phrase.length; k++) { streak = words.bigrams.has(phrase.slice(k, k + 2)) ? streak + 1 : 0; if (streak > bestStreak) bestStreak = streak; }
      if (bestStreak + 1 < lo) continue;
      const run = longestShared(phrase, text.length > JOINED_WINDOW ? text.slice(0, JOINED_WINDOW) : text);
      // Kana and kanji carry more per character than Thai or Lao letters, so a shorter shared stretch counts (hi/lo above).
      if (run >= hi) score += 2; else if (run >= lo) score += 1;
      continue;
    }
    if (pw.length > 1 && text.includes(p)) { score += 3; pw.forEach((w) => counted.add(w)); continue; }
    const single = pw.length === 1;
    for (const w of pw) {
      if (counted.has(w)) continue;
      if (words.set.has(w)) { score += single ? 2 : 1; counted.add(w); }
      else if (w.length >= 5 && nearWord(w, words)) { score += single ? 1 : 0.5; counted.add(w); }
    }
  }
  return score;
}

// A word index over the catalogue, built once per entries array: which language lists of which entries can score at
// all for a text. A list scores only through (a) a phrase word that is in the text, or within one edit of a text word,
// (b) a Korean phrase when the text has Hangul, or (c) a phrase in an unspaced script when the text has one. Every other
// list scores 0, so skipping it changes no result; it only saves comparing the text with thousands of phrases.
// One-edit neighbours are found with deletions: two words one edit apart are equal, one is the other minus a
// character, or both minus one character are equal (the lookup can over-collect; scoring then decides exactly).
const INDEX = [new WeakMap(), new WeakMap()];
const LISTS = 256; // a list is coded as entry * LISTS + list number
const deletions = (w) => { const out = []; for (let i = 0; i < w.length; i++) out.push(w.slice(0, i) + w.slice(i + 1)); return out; };
function indexOf(entries, translated) {
  const cache = INDEX[translated ? 1 : 0];
  let index = cache.get(entries);
  if (index) return index;
  index = { exact: new Map(), dels: new Map(), hangul: [], joined: [] };
  const add = (map, key, code) => { let list = map.get(key); if (!list) map.set(key, (list = [])); if (list[list.length - 1] !== code) list.push(code); };
  entries.forEach((entry, i) => {
    prepared(entry, translated).slice(0, LISTS).forEach((list, j) => {
      const code = i * LISTS + j;
      let hangul = false, joined = false;
      for (const item of list) {
        if (item.hangul) { hangul = true; continue; }
        if (item.joined) { joined = true; continue; } // scored only by the unspaced-script rules
        for (const w of item.pw) {
          add(index.exact, w, code);
          if (w.length >= 5) for (const d of deletions(w)) add(index.dels, d, code);
        }
      }
      if (hangul) index.hangul.push(code);
      if (joined) index.joined.push(code);
    });
  });
  cache.set(entries, index);
  return index;
}

/** The entries that can score above 0 for these text words, ascending, each with the numbers of its lists to score. */
function candidates(entries, words, translated) {
  const index = indexOf(entries, translated);
  const found = new Set();
  const take = (list) => { if (list) for (const c of list) found.add(c); };
  for (const t of words.set) take(index.exact.get(t));
  for (const t of words.fuzzy) {
    take(index.dels.get(t));
    for (const d of deletions(t)) { take(index.exact.get(d)); take(index.dels.get(d)); }
  }
  if (words.hangul.size) take(index.hangul);
  if (words.unspaced) take(index.joined);
  const byEntry = new Map();
  for (const c of found) { const i = Math.floor(c / LISTS); let js = byEntry.get(i); if (!js) byEntry.set(i, (js = [])); js.push(c % LISTS); }
  return [...byEntry].sort((a, b) => a[0] - b[0]);
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
  const fuzzy = [...set].filter((w) => w.length >= 4);
  const byDel = new Map(); // each fuzzy word under itself and its one-letter deletions (see nearWord)
  for (const t of fuzzy) for (const k of [t, ...deletions(t)]) { const l = byDel.get(k); if (l) l.push(t); else byDel.set(k, [t]); }
  const words = { set, fuzzy, byDel, near: new Map(), unspaced: UNSPACED.test(text), bigrams: UNSPACED.test(text) ? bigramSet(text.slice(0, JOINED_WINDOW)) : new Set(), hangul: HANGUL.test(text) ? hangulSet(text) : new Set() };
  const padded = ` ${text} `;
  // Only entries that share a word with the text can score (see candidates()); the rest are never scored.
  const rank = (keep, translated = false) => {
    if (!text) return [];
    const out = [];
    for (const [i, js] of candidates(entries, words, translated)) {
      const e = entries[i];
      if (!keep(e)) continue;
      const langs = prepared(e, translated);
      let score = 0;
      for (const j of js) score = Math.max(score, scoreLang(langs[j], padded, words));
      if (score >= MATCH_THRESHOLD) out.push({ id: e.id, score, i });
    }
    return out.sort((a, b) => b.score - a.score || a.i - b.i);
  };
  const local = rank(country ? (e) => e.country === country : () => true);
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
    out.elsewhere = rank((e) => e.country !== country, true)
      .filter((r) => r.score >= Math.max(elsewhereMin, best + elsewhereMargin))
      .slice(0, 2).map(({ id, score }) => ({ id, score }));
  }
  return out;
}
