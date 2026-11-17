// Text helpers shared by the validator, the matcher and the site.
// normalize/tokens/editDistance come from eschamuyo (site/js/text.js); STOP adds English, Portuguese, French and Dutch filler words.
export const STOP = new Set(['que', 'por', 'los', 'las', 'una', 'uno', 'del', 'con', 'para', 'como', 'mas', 'pero', 'esta', 'este', 'eso', 'esa', 'les', 'sus', 'muy', 'todo', 'hay',
  // English filler
  'the', 'and', 'you', 'your', 'for', 'with', 'this', 'that', 'are', 'was', 'have', 'has', 'from', 'not', 'but', 'they', 'them', 'its', 'our', 'can', 'will', 'just', 'all', 'any', 'who', 'what', 'when', 'how', 'she', 'his', 'her', 'him', 'been', 'were', 'there', 'then', 'about', 'let', 'make', 'know', 'like', 'get', 'got', 'just', 'yes', 'thanks',
  // Portuguese, French and Dutch filler (words that are also meaningful in English, like "son" or "door", stay out)
  'nao', 'com', 'dos', 'das', 'seu', 'sua', 'seus', 'voce', 'esse', 'essa', 'isso', 'pelo', 'pela', 'sao', 'mais',
  'des', 'une', 'est', 'pour', 'dans', 'par', 'sur', 'vous', 'votre', 'vos', 'nous', 'qui', 'pas', 'avec', 'ses', 'mon', 'mes', 'ton', 'tes', 'aux', 'cette', 'ces', 'elle', 'ils', 'mais', 'tout',
  'van', 'een', 'het', 'dat', 'voor', 'niet', 'zijn', 'jouw', 'wij', 'ons', 'onze', 'aan', 'bij', 'ook', 'als', 'maar', 'naar', 'dit', 'deze', 'wordt', 'heeft', 'hebben', 'kan', 'zal', 'nog', 'wel', 'uit', 'dan', 'tot', 'omdat']);

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

// Letters that don't decompose into a base letter plus an accent.
const FOLD = { ς: 'σ', ß: 'ss', ẞ: 'ss', ø: 'o', æ: 'ae', œ: 'oe', ł: 'l', đ: 'd', ð: 'd', þ: 'th', ı: 'i', ħ: 'h', ŧ: 't' };
const KEEP = /[\p{L}\p{N}$€£]/u;

/** One character, folded for matching: lowercase, no accents, special letters spelled out; anything that isn't a
 * letter (any alphabet), digit or currency sign becomes a space. May return more than one character ("ß" → "ss"). */
export function foldChar(c) {
  const low = c.toLowerCase();
  const f = FOLD[low] ?? low.normalize('NFD').replace(/\p{Diacritic}/gu, '');
  let out = '';
  for (const ch of f) out += KEEP.test(ch) ? ch : ' ';
  return out;
}

/** Lowercase, strip accents, keep letters of any alphabet, digits and $ € £, collapse spaces. */
export function normalize(s) {
  let out = '';
  for (const c of String(s ?? '')) out += foldChar(c);
  return out.replace(/\s+/g, ' ').trim();
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
