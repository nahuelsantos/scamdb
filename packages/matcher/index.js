// "Is this a scam?": reads the warning signs in a message and finds the catalogue entries it looks like.
// Ported from eschamuyo (site/js/matcher.js, analyze.js, checker.js). Runs in Node and in the browser.
import { normalize, tokens, editDistance } from '../../lib/text.js';
import { readSignsWithEvidence, isWarningAbout } from './signs.js';

export { SIGNS, readSigns, readSignsWithEvidence, isWarningAbout } from './signs.js';
export const VERSION = '1.16.0';
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
      .map((p) => ({ p: ` ${p} `, pw: tokens(p) })).filter((x) => x.pw.length));
    cache.set(entry, langs);
  }
  return langs;
}

function scoreLang(list, text, words) {
  const counted = new Set();
  let score = 0;
  for (const { p, pw } of list) {
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
export function matchMessage(input, entries, { country, limit = 3, elsewhere = false, elsewhereMin = ELSEWHERE_MIN, elsewhereMargin = ELSEWHERE_MARGIN } = {}) {
  const raw = String(input ?? '').slice(0, MAX_INPUT);
  const text = normalize(raw);
  // Unique words once: a Set for exact hits, and the 4+ letter ones for typo matching (long inputs repeat words).
  const set = new Set(tokens(text));
  const words = { set, fuzzy: [...set].filter((w) => w.length >= 4) };
  const padded = ` ${text} `;
  const rank = (pool, translated = false) => (!text ? [] : pool.map((e, i) => ({ id: e.id, score: scoreEntry(e, padded, words, translated), i }))
    .filter((r) => r.score >= MATCH_THRESHOLD)
    .sort((a, b) => b.score - a.score || a.i - b.i));
  const local = rank(country ? entries.filter((e) => e.country === country) : entries);
  const matches = local.filter((r, _, all) => r.score >= MATCH_RELATIVE * all[0].score)
    .slice(0, limit).map(({ id, score }) => ({ id, score }));
  const signals = readSignsWithEvidence(raw);
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
