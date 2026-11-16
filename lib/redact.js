// Removes personal data from a reported message before it is stored. What stays is the scam's wording, which is
// what the catalogue and the feed need. `found` returns the link domains and phone digits for the private indicators
// (stored only as domains and salted hashes, never as text). Runs in Node and in the Worker.

const URL_RE = /\b(?:https?:\/\/|www\.)[^\s<>"')\]]+|\b(?:[a-z0-9-]+\.)+(?:com|net|org|info|biz|xyz|top|site|online|shop|store|app|io|co|link|click|live|vip|me|cc|ly|ar|mx|es|br|uk|au|nz|ca|us)(?:\.[a-z]{2})?(?:\/[^\s<>"')\]]*)?/gi;
const EMAIL_RE = /\b[\w.+-]+@[\w-]+(?:\.[\w-]+)+\b/g;
const IBAN_RE = /\b[A-Z]{2}\d{2}(?:[ ]?[A-Z0-9]{4}){3,7}(?:[ ]?[A-Z0-9]{1,3})?\b/g;
const CPF_RE = /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b|\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/g; // CPF, CNPJ
const LONG_DIGITS_RE = /(?<![\d$])\d(?:[ -]?\d){12,25}(?!\d)/g; // 13+ digits: cards, CBU (22), CLABE (18)
const CODE_RE = /\b(code|codigo|código|pin|senha|clave|token|otp)(\s+(?:is|es|é|e|:|de|da|do|verification|verificación|verificacao))*\s*:?\s*(\d{4,8})\b/gi;
const PHONE_RE = /(?<![\w$€£.,])(?:\+\s?)?\(?\d[\d\s().-]{6,18}\d(?![\d.,]?\d)/g;
const GREETING_RE = /\b(hola|hi|hello|hey|dear|querid[oa]|estimad[oa]|oi|olá|ola|bom dia|boa tarde|buenos días|buenos dias|buenas tardes|buen día)(,?\s+)([\p{L}][\p{Ll}'-]+)/giu;
const NOT_NAMES = new Set(['mum', 'mom', 'mam', 'ma', 'mami', 'mama', 'mamá', 'mãe', 'mae', 'dad', 'pa', 'papi', 'papa', 'papá', 'pai',
  'abuela', 'abuelo', 'abue', 'nana', 'grandma', 'grandpa', 'vó', 'vô', 'tía', 'tia', 'tío', 'tio', 'son', 'hijo', 'hija', 'filho', 'filha',
  'customer', 'cliente', 'client', 'sir', 'madam', 'señor', 'señora', 'senhor', 'senhora', 'amigo', 'amiga', 'friend', 'team', 'equipo',
  'there', 'all', 'everyone', 'todos', 'user', 'usuario', 'usuário', 'member', 'socio', 'neighbour', 'neighbor', 'vecino']);

function luhn(d) {
  let sum = 0;
  for (let i = 0; i < d.length; i++) {
    let n = Number(d[d.length - 1 - i]);
    if (i % 2) { n *= 2; if (n > 9) n -= 9; }
    sum += n;
  }
  return sum % 10 === 0;
}
const host = (u) => u.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split(/[/?#:]/)[0].toLowerCase();

/** { text, found: { domains: string[], phones: string[], counts: { link, email, card, account, code, number, name } } } */
export function redact(input) {
  let text = String(input ?? '');
  const domains = new Set(), phones = new Set();
  const counts = { link: 0, email: 0, card: 0, account: 0, code: 0, number: 0, name: 0 };
  const sub = (re, fn) => { text = text.replace(re, fn); };

  sub(EMAIL_RE, () => { counts.email++; return '[email]'; });
  sub(URL_RE, (m) => { if (/^\[/.test(m)) return m; domains.add(host(m)); counts.link++; return '[link]'; });
  sub(CPF_RE, () => { counts.account++; return '[account]'; });
  sub(IBAN_RE, (m) => { if (!/\d{6,}/.test(m.replace(/\s/g, ''))) return m; counts.account++; return '[account]'; });
  sub(LONG_DIGITS_RE, (m) => {
    const d = m.replace(/\D/g, '');
    if (d.length >= 13 && d.length <= 19 && luhn(d)) { counts.card++; return '[card]'; }
    if (d.length >= 16) { counts.account++; return '[account]'; }
    return m; // 13–15 digits that aren't a card: leave for the phone rule
  });
  sub(CODE_RE, (m, word, mid, digits) => { counts.code++; return m.slice(0, m.length - digits.length) + '[code]'; });
  sub(PHONE_RE, (m) => {
    const d = m.replace(/\D/g, '');
    if (d.length < 8 || d.length > 15) return m;
    if (/^\d{4}-\d{2}-\d{2}$/.test(m.trim()) || /^\d{1,2}[./-]\d{1,2}[./-]\d{2,4}$/.test(m.trim())) return m; // dates
    phones.add(d);
    counts.number++;
    return '[number]';
  });
  sub(GREETING_RE, (m, greet, space, name) => {
    if (name[0] !== name[0].toUpperCase() || name[0] === name[0].toLowerCase() || NOT_NAMES.has(name.toLowerCase())) return m; // names are capitalised
    counts.name++;
    return `${greet}${space}[name]`;
  });
  return { text, found: { domains: [...domains], phones: [...phones], counts } };
}
