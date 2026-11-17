// Warning signs read from a message (Spanish and English). Spanish rules come from eschamuyo's analyze.js.
// Every regex runs on normalize(text): lowercase, no accents, no punctuation.
import { normalize, foldChar } from '../../lib/text.js';

// Portuguese rules are folded into the same ids (Brazil). English rules need context: bare "code", "pay" or "download" appear in ordinary messages.
const EN = {
  code: String.raw`(send|read|tell|give|share|forward|confirm|text)( \w+){0,4} (code|passcode|password|pin)\b|\b(code|passcode|pin) (we|i|they) (sent|texted)|(code|passcode)( \w+){0,3} (you (got|received|will receive|ll receive|ll get))|verification code|security code|one time (pass|code)|\botp\b`,
  remote: String.raw`(download|install) (this|the|our|an?) (app|application|program)|remote access|(let me|i need to|so i can) (see|access|control) your (screen|computer|phone)|photo of (your|my) (id|passport|licen)|baix(e|a|ar) (o|este|esse|um|nosso) (app|aplicativo)|ver (a )?sua tela|acesso remoto`,
  money: String.raw`send (me |us )?(the )?money|money (now|urgently|today|asap)|\bwire\b|gift ?cards?|bitcoin|crypto|pay (the|a|this|your) (fee|fine|bill|tax|toll|deposit|charge)|pay (with|by|in) (gift|bitcoin|crypto|voucher)|(release|redelivery|processing|customs|admin|unlock|withdrawal) fee|card (number|details)|bank details|safe account|pre ?approved|go to (the|an) atm|\bpix\b|\breais\b|\bboleto\b|dinheiro|mb ?way|multibanco|referencia (de )?pagamento|pagamento|penhora`,
};
export const SIGNS = {
  asks_for_code: new RegExp(String.raw`\bcodigo|\bclave|\bpin\b|\btoken\b|contrasena|` + EN.code),
  remote_access: new RegExp(String.raw`instal(a|e|ar|o|en|ame|ate)\b|descarg|anydesk|teamviewer|supremo|baj(a|e|ar|o) (esta|la|una|el|este) (app|aplicacion)|ver (tu|su|mi) pantalla|selfie|foto (de|del) (tu |su )?dni|` + EN.remote),
  urgency: /urgent|\bhoy\b|vence|vencimiento|bloque|suspend|inmediat|ahora mismo|\b24 ?(h|hs|horas|hours)\b|ultimo aviso|rapido|\btoday\b|immediately|right (now|away)|expir|account (is |will be |has been )?locked|final (notice|warning)|last chance|\basap\b|\bhoje\b|imediatamente/,
  money_request: new RegExp(String.raw`transfer|\bplata\b|dinero|\bpag(a|ar|ue|ues|a)\b|abon|\bsena\b|\bcbu\b|\bcvu\b|\balias\b|\$|€|£|deposit|prestamo|cajero|devolv|(datos|numero) de (tu|la|su) tarjeta|` + EN.money),
  unknown_link: /enlace|\blink\b|http|www|desconocid|click (here|the|this|below)/,
  new_number: /troquei de numero|numero novo|novo numero|salva (esse|este|meu) numero|numero nuevo|nuevo numero|cambie de numero|agendalo|agenda este|agendame|numero alternativo|se me (cayo|rompio|mojo) el (cel|celu|celular|telefono)|new number|changed my number|save (this|my) number|mudei de numero|guarda (este|esse|o meu) numero|telemovel (caiu|partiu|avariou|estragou)/,
  impersonation: /le hablo de|te hablo de|somos de|\bpami\b|\banses\b|\barca\b|\bafip\b|\bbanco\b|correo argentino|mercado pago|soporte tecnico|area de seguridad|(calling|call|message) from (your|the) bank|your bank s|bank s (fraud|security)|tech(nical)? support|fraud (team|department)|security (team|department)|calling from|post office|customs (office|fee)|tax (office|agency)|from the (irs|hmrc|ato|cra)|royal mail|\busps\b|\bctt\b|financas|autoridade tributaria|seguranca social|seg social|an post|\brevenue\b|\bgarda\b|\bbov\b|maltapost|\bmtca\b/,
  secrecy: /nao (conta|fala|diga|conte|fale) (pra|para|a) ninguem|no le digas|no se lo digas|no le cuentes|entre nosotros|que no se entere|don ?t tell (anyone|anybody|your)|do not tell (anyone|anybody|your)|between (us|you and me)|keep (this|it) (secret|quiet)/,
  keep_on_line: /nao (desligue|desliga)|fique na linha|no corte|no cortes|quedese en linea|no cuelgue|don ?t hang up|do not hang up|stay on the (line|phone)/,
  too_good_to_be_true: /ganaste|ganador|premio|sorteo|gratis|rendimiento|ganancia|duplic|congratulations,? you|you (ve |have )?won|winner|\bprize|lottery|guaranteed (return|profit|income|earning)|double your/,
};

// A genuine one-time-code text warns you not to share the code ("no lo compartas", "never share", "we will never ask").
// That warning cancels asks_for_code unless the message also asks you to hand the code over.
const CODE_WARNING = /no (lo|la|los|las) compartas|no compartas|nunca (te|le|se) (lo|la) (va a |vamos a |van a )?(pedir|pedira|solicit)|nunca te (pedira|pediremos|solicitara)|nao (compartilhe|partilhe|passe|informe|divulgue)|nunca (pede|solicita|pedimos)|(don t|do not|never) share|will never (call|text|ask|message)|never ask(s)? (you )?for|nunca (te |le )?(vamos a |va a |van a )?(pedir|pediremos|pedira|solicitaremos)|nao pedimos|nunca pedimos|nor (lo|la) (compartas|des)/;
const CODE_HANDOVER = new RegExp(String.raw`(pasa|manda|envia|dicta|deci|reenvia|da|comparti)(me|nos)\b( \w+){0,3} (el |la |ese |esa )?(codigo|clave|pin)|me (pasas|mandas|envias|dictas|decis|das|reenvias|compartis) (el |la |ese |esa )?(codigo|clave|pin)|(me |nos )?(manda|passa|envia|informa)( \w+){0,2} (o |esse |este )?codigo|(send|read|tell|give|forward|text)( \w+){0,4} (code|passcode|password|pin)\b|\b(code|passcode|pin) (we|i|they) (sent|texted)`);

// Words that cancel the code warning's exception: a request is still a request when it sits next to "don't share".
// Negated clauses ("we'll never ask you to tell us your PIN") are removed before looking for a handover request.
const NEGATED = /\b(never|nunca|nao|no|don t|do not|won t|will not)( \w+){0,7} (code|codes|pin|password|passcode|clave|claves|codigo|codigos|contrasena|senha)\b/g;
// "Ingresá con tu clave fiscal", "sign in with your password": where to log in, not a request to hand it over.
const LOGIN_WITH = /\b(ingresa|ingresando|entra|entrando|accede|accediendo|inicia sesion|inicie sesion|log in|login|sign in|acesse|entre)( \w+){0,4} (con|with|com|using|usando) (tu|su|your|sua|seu) (clave|contrasena|password|senha|usuario)/;
// "No tenés nada que pagar", "nothing to pay": the message says there is no payment.
const NO_PAYMENT = /nada que pagar|nothing to pay|no (payment|fee|charge)s? (is |are )?(needed|required|due)|nao (precisa|e preciso|tem que) pagar|sin (costo|cargo)( alguno)?|free of charge|you don t need to pay|no hace falta pagar/;

/** The sign ids that apply, after context rules (genuine-code warnings, login instructions, "nothing to pay"). */
function applyContext(t, ids) {
  let out = ids;
  if (out.includes('asks_for_code')) {
    const handover = CODE_HANDOVER.test(t.replace(NEGATED, ' '));
    if (!handover && (CODE_WARNING.test(t) || LOGIN_WITH.test(t))) out = out.filter((id) => id !== 'asks_for_code');
  }
  if (out.includes('money_request') && NO_PAYMENT.test(t)) out = out.filter((id) => id !== 'money_request');
  return out;
}

/** normalize(text) plus, for each of its characters, the index of the original character it came from. */
export function normalizeWithMap(text) {
  const src = String(text ?? '');
  let out = '';
  const map = [];
  for (let i = 0; i < src.length; i++) {
    // Keep thousands separators inside numbers ("$1,480", "$50.000") so evidence quotes the whole amount.
    if ((src[i] === ',' || src[i] === '.') && /\d/.test(src[i - 1] ?? '') && /\d/.test(src[i + 1] ?? '')) continue;
    const c = foldChar(src[i]);
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
  return applyContext(t, Object.keys(SIGNS).filter((k) => SIGNS[k].test(t)));
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
  const keep = applyContext(t, out.map((s) => s.id));
  return out.filter((s) => keep.includes(s.id));
}
