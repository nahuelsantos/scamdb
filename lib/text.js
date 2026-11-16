// Text helpers shared by the validator, the matcher and the site.
// normalize/tokens/editDistance come from eschamuyo (site/js/text.js); STOP adds English filler words.
export const STOP = new Set(['que', 'por', 'los', 'las', 'una', 'uno', 'del', 'con', 'para', 'como', 'mas', 'pero', 'esta', 'este', 'eso', 'esa', 'les', 'sus', 'muy', 'todo', 'hay',
  // English filler
  'the', 'and', 'you', 'your', 'for', 'with', 'this', 'that', 'are', 'was', 'have', 'has', 'from', 'not', 'but', 'they', 'them', 'its', 'our', 'can', 'will', 'just', 'all', 'any', 'who', 'what', 'when', 'how', 'she', 'his', 'her', 'him', 'been', 'were', 'there', 'then', 'about', 'let', 'make', 'know', 'like', 'get', 'got', 'just', 'yes', 'thanks']);

/** The text in `lang`, else the first language present, else undefined. */
export function pick(text, lang) {
  if (!text || typeof text !== 'object') return undefined;
  if (lang && text[lang] !== undefined) return text[lang];
  const first = Object.keys(text)[0];
  return first === undefined ? undefined : text[first];
}

/** The language key pick() would use. */
export function pickLang(text, lang) {
  if (!text || typeof text !== 'object') return undefined;
  return lang && text[lang] !== undefined ? lang : Object.keys(text)[0];
}

/** Lowercase, strip accents, keep letters/digits/$, collapse spaces. */
export function normalize(s) {
  return String(s ?? '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9$ñ\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Meaningful words (3+ letters, not filler). */
export function tokens(s) {
  return normalize(s).split(' ').filter((w) => w.length >= 3 && !STOP.has(w));
}

/** Levenshtein distance, stopping early once it exceeds max. */
export function editDistance(a, b, max = 2) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      best = Math.min(best, cur[j]);
    }
    if (best > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}
