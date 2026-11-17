// Text helpers shared by the validator, the matcher and the site.
// normalize/tokens/editDistance come from eschamuyo (site/js/text.js); STOP adds filler words for English and the European languages we cover.
export const STOP = new Set(['que', 'por', 'los', 'las', 'una', 'uno', 'del', 'con', 'para', 'como', 'mas', 'pero', 'esta', 'este', 'eso', 'esa', 'les', 'sus', 'muy', 'todo', 'hay',
  // English filler
  'the', 'and', 'you', 'your', 'for', 'with', 'this', 'that', 'are', 'was', 'have', 'has', 'from', 'not', 'but', 'they', 'them', 'its', 'our', 'can', 'will', 'just', 'all', 'any', 'who', 'what', 'when', 'how', 'she', 'his', 'her', 'him', 'been', 'were', 'there', 'then', 'about', 'let', 'make', 'know', 'like', 'get', 'got', 'just', 'yes', 'thanks',
  // Portuguese, French and Dutch filler (words that are also meaningful in English, like "son" or "door", stay out)
  'nao', 'com', 'dos', 'das', 'seu', 'sua', 'seus', 'voce', 'esse', 'essa', 'isso', 'pelo', 'pela', 'sao', 'mais',
  'des', 'une', 'est', 'pour', 'dans', 'par', 'sur', 'vous', 'votre', 'vos', 'nous', 'qui', 'pas', 'avec', 'ses', 'mon', 'mes', 'ton', 'tes', 'aux', 'cette', 'ces', 'elle', 'ils', 'mais', 'tout',
  'van', 'een', 'het', 'dat', 'voor', 'niet', 'zijn', 'jouw', 'wij', 'ons', 'onze', 'aan', 'bij', 'ook', 'als', 'maar', 'naar', 'dit', 'deze', 'wordt', 'heeft', 'hebben', 'kan', 'zal', 'nog', 'wel', 'uit', 'dan', 'tot', 'omdat',
  'der', 'und', 'ist', 'sie', 'ihr', 'ihre', 'ihren', 'ihnen', 'ein', 'eine', 'einen', 'einem', 'einer', 'nicht', 'mit', 'von', 'auf', 'fur', 'den', 'dem', 'des', 'sich', 'auch', 'wie', 'oder', 'aber', 'bei', 'aus', 'nach', 'noch', 'nur', 'wenn', 'wird', 'werden', 'haben', 'kann', 'sind', 'diese', 'dieser', 'dieses', 'bitte', 'zum', 'zur', 'ich', 'mich', 'mir', 'dir', 'dich', 'das', 'dass',
  'che', 'per', 'non', 'della', 'dei', 'delle', 'gli', 'sono', 'hai', 'suo', 'tuo', 'tua', 'questo', 'questa', 'anche', 'alla', 'alle', 'dal', 'dalla', 'nel', 'nella', 'sul', 'sulla', 'piu', 'gia', 'molto', 'loro',
  'nie', 'sie', 'jest', 'jak', 'ale', 'czy', 'ten', 'tak', 'dla', 'tego', 'jej', 'jego', 'moj', 'twoj', 'oraz', 'lub', 'przez', 'juz', 'tylko', 'jeszcze', 'bardzo',
  'sau', 'sunt', 'este', 'pentru', 'care', 'acest', 'aceasta', 'din', 'prin', 'foarte', 'nostru', 'dumneavoastra', 'lui', 'tau',
  'що', 'або', 'для', 'від', 'вас', 'ваш', 'ваша', 'ваші', 'про', 'при', 'цеи', 'це', 'так', 'вже', 'ще', 'але', 'щоб', 'иого', 'вона', 'мені', 'тобі', 'буде', 'було', 'має', 'можна',
  'что', 'или', 'это', 'этот', 'как', 'уже', 'еще', 'чтобы', 'его', 'она', 'они', 'мне', 'меня', 'тебе', 'будет', 'было', 'есть', 'можно', 'надо',
  'това', 'този', 'тази', 'така', 'вече', 'още', 'него', 'нея', 'мен', 'има', 'може', 'трябва', 'със', 'към',
  'και', 'του', 'τησ', 'των', 'τον', 'την', 'για', 'απο', 'στο', 'στη', 'στην', 'στον', 'στα', 'οτι', 'ειναι', 'μου', 'σου', 'σασ', 'μασ', 'αυτο', 'αυτη', 'αλλα', 'ενα', 'μια',
  'bir', 'icin', 'ile', 'gibi', 'daha', 'cok', 'olan', 'olarak', 'sizin', 'bizim', 'sonra', 'once', 'ama', 'veya', 'kadar', 'her', 'hem',
  'och', 'att', 'det', 'som', 'med', 'inte', 'ett', 'till', 'jag', 'eller', 'ditt', 'din', 'dina', 'mig', 'dig', 'sig', 'hon', 'vara', 'varit', 'ska', 'skulle', 'nagon', 'bara', 'fran', 'oss', 'era',
  'ikke', 'til', 'jeg', 'dit', 'dine', 'hun', 'vaere', 'skal', 'nogen', 'bare', 'fra', 'jer', 'der', 'ditt', 'meg', 'deg', 'seg', 'noen', 'dere']);

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
