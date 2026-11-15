// Warning signs read from a message (Spanish). Split from eschamuyo's analyze.js into scamdb signal ids.
// Every regex runs on normalize(text): lowercase, no accents, no punctuation.
import { normalize } from '../../lib/text.js';

export const SIGNS = {
  asks_for_code: /\bcodigo|\bclave|\bpin\b|\btoken\b|contrasena/,
  remote_access: /instal|descarg|anydesk|teamviewer|supremo|baj(a|e|ar|o) (esta|la|una|el|este) (app|aplicacion)|ver (tu|su|mi) pantalla|selfie|foto (de|del) (tu |su )?dni/,
  urgency: /urgent|\bhoy\b|vence|vencimiento|bloque|suspend|inmediat|ahora mismo|\b24 ?(h|hs|horas)\b|ultimo aviso|rapido/,
  money_request: /transfer|\bplata\b|dinero|\bpag(a|ar|ue|ues|a)\b|abon|\bsena\b|\bcbu\b|\bcvu\b|\balias\b|\$|deposit|prestamo|cajero|devolv|(datos|numero) de (tu|la|su) tarjeta/,
  unknown_link: /enlace|\blink\b|http|www|desconocid/,
  new_number: /numero nuevo|nuevo numero|cambie de numero|agendalo|agenda este/,
  impersonation: /le hablo de|te hablo de|somos de|\bpami\b|\banses\b|\barca\b|\bafip\b|\bbanco\b|correo argentino|mercado pago|soporte tecnico|area de seguridad/,
  secrecy: /no le digas|no se lo digas|no le cuentes|entre nosotros|que no se entere/,
  keep_on_line: /no corte|no cortes|quedese en linea|no cuelgue/,
  too_good_to_be_true: /ganaste|ganador|premio|sorteo|gratis|rendimiento|ganancia|duplic/,
};

/** normalize(text) plus, for each of its characters, the index of the original character it came from. */
export function normalizeWithMap(text) {
  const src = String(text ?? '');
  let out = '';
  const map = [];
  for (let i = 0; i < src.length; i++) {
    const c = src[i].toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9$ñ\s]/g, ' ');
    for (const ch of c) {
      const ws = /\s/.test(ch);
      if (ws && (out === '' || out.endsWith(' '))) continue;
      out += ws ? ' ' : ch;
      map.push(i);
    }
  }
  if (out.endsWith(' ')) { out = out.slice(0, -1); map.pop(); }
  return { text: out, map };
}

/** Signal ids found in the text, in SIGNS order. */
export function readSigns(text) {
  const t = normalize(text);
  return Object.keys(SIGNS).filter((k) => SIGNS[k].test(t));
}

/** Like readSigns, with the words that triggered each sign (from the original text, up to 60 characters). */
export function readSignsWithEvidence(text) {
  const { text: t, map } = normalizeWithMap(text);
  const src = String(text ?? '');
  const out = [];
  for (const [id, re] of Object.entries(SIGNS)) {
    const m = re.exec(t);
    if (!m) continue;
    // widen to whole words around the match
    let a = m.index, b = m.index + m[0].length;
    while (a > 0 && t[a - 1] !== ' ') a--;
    while (b < t.length && t[b] !== ' ') b++;
    const from = map[a], to = map[b - 1] + 1;
    out.push({ id, evidence: src.slice(from, to).slice(0, 60) });
  }
  return out;
}
