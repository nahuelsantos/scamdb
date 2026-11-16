// "Is this a scam?": reads the warning signs in a message and finds the catalogue entries it looks like.
// Ported from eschamuyo (site/js/matcher.js, analyze.js, checker.js). Runs in Node and in the browser.
import { normalize, tokens, editDistance } from '../../lib/text.js';
import { readSignsWithEvidence } from './signs.js';

export { SIGNS, readSigns, readSignsWithEvidence } from './signs.js';
export const MATCH_THRESHOLD = 2;
export const MAX_INPUT = 5000;
const SCAM_SIGNS = new Set(['asks_for_code', 'remote_access', 'money_request']);

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
    .slice(0, limit).map(({ id, score }) => ({ id, score }));
  const signals = readSignsWithEvidence(raw);
  const verdict = signals.some((s) => SCAM_SIGNS.has(s.id)) ? 'scam'
    : signals.length || matches.length ? 'suspicious' : 'not_recognised';
  return { verdict, score: null, signals, matches };
}
