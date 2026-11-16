// Warning signs read from a message (Spanish and English). Spanish rules come from eschamuyo's analyze.js.
// Every regex runs on normalize(text): lowercase, no accents, no punctuation.
import { normalize } from '../../lib/text.js';

// English rules need context: bare "code", "pay" or "download" appear in ordinary messages.
const EN = {
  code: String.raw`(send|read|tell|give|share|forward|confirm|text)( \w+){0,4} (code|passcode|password|pin)\b|\b(code|passcode|pin) (we|i|they) (sent|texted)|(code|passcode)( \w+){0,3} (you (got|received|will receive|ll receive|ll get))|verification code|security code|one time (pass|code)|\botp\b`,
  remote: String.raw`(download|install) (this|the|our|an?) (app|application|program)|remote access|(let me|i need to|so i can) (see|access|control) your (screen|computer|phone)|photo of (your|my) (id|passport|licen)`,
  money: String.raw`send (me |us )?(the )?money|money (now|urgently|today|asap)|\bwire\b|gift ?cards?|bitcoin|crypto|pay (the|a|this|your) (fee|fine|bill|tax|toll|deposit|charge)|pay (with|by|in) (gift|bitcoin|crypto|voucher)|(release|redelivery|processing|customs|admin|unlock|withdrawal) fee|card (number|details)|bank details|safe account|pre ?approved|go to (the|an) atm`,
};
export const SIGNS = {
  asks_for_code: new RegExp(String.raw`\bcodigo|\bclave|\bpin\b|\btoken\b|contrasena|` + EN.code),
  remote_access: new RegExp(String.raw`instal(a|e|ar|o|en|ame|ate)\b|descarg|anydesk|teamviewer|supremo|baj(a|e|ar|o) (esta|la|una|el|este) (app|aplicacion)|ver (tu|su|mi) pantalla|selfie|foto (de|del) (tu |su )?dni|` + EN.remote),
  urgency: /urgent|\bhoy\b|vence|vencimiento|bloque|suspend|inmediat|ahora mismo|\b24 ?(h|hs|horas|hours)\b|ultimo aviso|rapido|\btoday\b|immediately|right (now|away)|expir|account (is |will be |has been )?locked|final (notice|warning)|last chance|\basap\b/,
  money_request: new RegExp(String.raw`transfer|\bplata\b|dinero|\bpag(a|ar|ue|ues|a)\b|abon|\bsena\b|\bcbu\b|\bcvu\b|\balias\b|\$|deposit|prestamo|cajero|devolv|(datos|numero) de (tu|la|su) tarjeta|` + EN.money),
  unknown_link: /enlace|\blink\b|http|www|desconocid|click (here|the|this|below)/,
  new_number: /numero nuevo|nuevo numero|cambie de numero|agendalo|agenda este|new number|changed my number|save (this|my) number/,
  impersonation: /le hablo de|te hablo de|somos de|\bpami\b|\banses\b|\barca\b|\bafip\b|\bbanco\b|correo argentino|mercado pago|soporte tecnico|area de seguridad|(calling|call|message) from (your|the) bank|your bank s|bank s (fraud|security)|tech(nical)? support|fraud (team|department)|security (team|department)|calling from|post office|customs (office|fee)|tax (office|agency)|from the (irs|hmrc|ato|cra)|royal mail|\busps\b/,
  secrecy: /no le digas|no se lo digas|no le cuentes|entre nosotros|que no se entere|don ?t tell (anyone|anybody|your)|do not tell (anyone|anybody|your)|between (us|you and me)|keep (this|it) (secret|quiet)/,
  keep_on_line: /no corte|no cortes|quedese en linea|no cuelgue|don ?t hang up|do not hang up|stay on the (line|phone)/,
  too_good_to_be_true: /ganaste|ganador|premio|sorteo|gratis|rendimiento|ganancia|duplic|congratulations,? you|you (ve |have )?won|winner|\bprize|lottery|guaranteed (return|profit|income|earning)|double your/,
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
