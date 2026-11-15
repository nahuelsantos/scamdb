// HTML helpers. Every piece of data that reaches a page goes through esc().
import { pick, pickLang } from '../../lib/text.js';

const MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => MAP[c]);

/** A localized text as escaped HTML in an element carrying its real language. */
export function L(text, lang = 'es', tag = 'span', cls = '') {
  const l = pickLang(text, lang);
  const v = pick(text, lang);
  return `<${tag} lang="${esc(l)}"${cls ? ` class="${cls}"` : ''}>${esc(Array.isArray(v) ? v.join(', ') : v)}</${tag}>`;
}

/** A localized list as <li> items, each escaped. */
export function LI(list, lang = 'es') {
  const l = pickLang(list, lang);
  return (pick(list, lang) ?? []).map((s) => `<li lang="${esc(l)}">${esc(s)}</li>`).join('');
}

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const monthYear = (iso) => `${MONTHS[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;
export const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
