// "Is this a scam?": reads the warning signs in a message and finds the catalogue entries it looks like.
// Ported from eschamuyo (site/js/matcher.js, analyze.js, checker.js). Runs in Node and in the browser.
import { normalize, tokens, editDistance } from '../../lib/text.js';
import { readSignsWithEvidence } from './signs.js';

export { SIGNS, readSigns, readSignsWithEvidence } from './signs.js';
export const VERSION = '1.1.0';
export const MATCH_THRESHOLD = 2;
// A runner-up must score at least this share of the best match; weaker ones were mostly one shared word (eval set).
export const MATCH_RELATIVE = 0.6;
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

/** The best score over every language the entry has (its phrases plus its name in that language). */
function scoreEntry(entry, text, words) {
  const langs = Object.keys(entry.phrases ?? {});
  return Math.max(0, ...langs.map((l) => scoreLang([...(entry.phrases[l] ?? []), entry.name?.[l] ?? ''], text, words)));
}

function scoreLang(list, text, words) {
  const phrases = list.map(normalize).filter(Boolean);
  const counted = new Set();
  let score = 0;
  for (const p of phrases) {
    const pw = tokens(p);
    if (!pw.length) continue;
    if (pw.length > 1 && (` ${text} `).includes(` ${p} `)) { score += 3; pw.forEach((w) => counted.add(w)); continue; }
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
 * @returns {{ verdict: 'scam'|'suspicious'|'not_recognised', score: null,
 *             signals: {id: string, evidence: string}[], matches: {id: string, score: number}[] }}
 */
export function matchMessage(input, entries, { country, limit = 3 } = {}) {
  const raw = String(input ?? '').slice(0, MAX_INPUT);
  const text = normalize(raw);
  // Unique words once: a Set for exact hits, and the 4+ letter ones for typo matching (long inputs repeat words).
  const set = new Set(tokens(text));
  const words = { set, fuzzy: [...set].filter((w) => w.length >= 4) };
  const pool = country ? entries.filter((e) => e.country === country) : entries;
  const matches = !text ? [] : pool.map((e, i) => ({ id: e.id, score: scoreEntry(e, text, words), i }))
    .filter((r) => r.score >= MATCH_THRESHOLD)
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .filter((r, _, all) => r.score >= MATCH_RELATIVE * all[0].score)
    .slice(0, limit).map(({ id, score }) => ({ id, score }));
  const signals = readSignsWithEvidence(raw);
  const verdict = isScam(signals.map((s) => s.id)) ? 'scam'
    : signals.length || matches.length ? 'suspicious' : 'not_recognised';
  return { verdict, score: null, signals, matches };
}
