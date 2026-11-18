import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchMessage, readSigns, SIGNS } from '../../packages/matcher/index.js';
import { loadRepo } from '../../lib/load.js';

const entries = loadRepo(new URL('../../', import.meta.url).pathname).entries;
const m = (t, o) => matchMessage(t, entries, o);
// These examples are Argentine; a real check is always scoped to the user's country, so scope them to Argentina
// (other Spanish-speaking countries have their own parcel, bank and WhatsApp entries that may score as high).
const top = (t) => m(t, { country: 'ar' }).matches[0]?.id;

// Catalogue matching (ported from eschamuyo matcher.test.mjs)
test('delivery call asking for a code matches WhatsApp code theft', () =>
  assert.equal(top('me llamaron del correo por un paquete y me pidieron un codigo'), 'ar/whatsapp-codigo'));
test('a parcel SMS matches the fake Correo', () => assert.equal(top('me llegó un SMS: su paquete esta retenido, pague el envío'), 'ar/falso-correo'));
test('the bank call matches the fake bank employee', () => assert.equal(top('Le hablo del banco, área de seguridad, vaya al cajero'), 'ar/falso-banco'));
test('remote access app', () => assert.equal(top('me pidieron instalar anydesk para ver mi pantalla'), 'ar/acceso-remoto'));
test('a one-letter typo still matches', () => assert.equal(top('me robaron el whatsapp, me pidieron un codgo'), 'ar/whatsapp-codigo'));
test('ordinary chat matches nothing', () => assert.deepEqual(m('hola como estas, venis el domingo?').matches, []));
test('at most 3 matches, best first', () => {
  const r = m('anses bono paquete correo codigo banco likes anydesk').matches;
  assert.ok(r.length <= 3);
  for (let i = 1; i < r.length; i++) assert.ok(r[i - 1].score >= r[i].score);
});
test('country filters the catalogue', () => assert.deepEqual(m('me pidieron un codigo de whatsapp', { country: 'gb' }).matches, []));

// Signs (ported from eschamuyo verdict.test.mjs)
test('signs come in a fixed order', () => assert.deepEqual(Object.keys(SIGNS),
  ['asks_for_code', 'remote_access', 'urgency', 'money_request', 'unknown_link', 'new_number', 'impersonation', 'secrecy', 'keep_on_line', 'too_good_to_be_true']));
test('reads a code request', () => assert.ok(readSigns('Te va a llegar un código, pasámelo').includes('asks_for_code')));
test('reads an app install', () => assert.ok(readSigns('Descargá AnyDesk así lo vemos').includes('remote_access')));
test('reads "bajá esta app"', () => assert.ok(readSigns('Bajá esta app así lo vemos').includes('remote_access')));
test('reads urgency', () => assert.ok(readSigns('Tu cuenta se bloquea HOY, es urgente').includes('urgency')));
test('reads money', () => assert.ok(readSigns('Transferime $50.000 al alias').includes('money_request')));
test('asking for card details counts as money', () => assert.ok(readSigns('Ingresá los datos de tu tarjeta para recibir el envío').includes('money_request')));
test('reads a link', () => assert.ok(readSigns('Seguí el envío: [enlace]').includes('unknown_link')));
test('reads a new number', () => assert.ok(readSigns('Hola ma, cambié de número').includes('new_number')));
test('reads secrecy and keep on line', () => assert.deepEqual(readSigns('No le digas a nadie y no cortes'), ['secrecy', 'keep_on_line']));
test('ordinary family message has no signs', () => assert.deepEqual(readSigns('Hola pa, ¿venís a comer el domingo?'), []));
test('a normal card statement notice has no signs', () =>
  assert.deepEqual(readSigns('Tu resumen de tarjeta de noviembre ya está disponible en la app.'), []));

// Verdicts
const PAMI = 'Buenas tardes, le hablo de PAMI. ¿Usted tiene un trámite iniciado? Le va a llegar un código por mensaje, ¿me lo lee así lo confirmamos? Es para hoy.';
test('the PAMI call is a scam matching WhatsApp code theft, with evidence', () => {
  const r = m(PAMI);
  assert.equal(r.verdict, 'scam');
  assert.equal(r.matches[0].id, 'ar/whatsapp-codigo');
  const code = r.signals.find((s) => s.id === 'asks_for_code');
  assert.match(code.evidence, /código/);
});
test('a legit message is not recognised', () => assert.equal(m('Hola pa, ¿venís a comer el domingo?').verdict, 'not_recognised'));
test('the dentist reminder is not recognised and matches nothing', () => {
  const r = m('Hola Marta, te recuerdo el turno con la Dra. López mañana a las 10:30. Si no podés venir avisanos. Saludos!');
  assert.equal(r.verdict, 'not_recognised');
  assert.deepEqual(r.matches, []);
});
test('a link alone is suspicious', () => assert.equal(m('Tenés una encomienda en camino, seguí el envío: [enlace]').verdict, 'suspicious'));
test('a catalogue match lifts to suspicious', () => {
  const r = m('Me ofrecieron trabajo desde casa dando likes');
  assert.equal(r.verdict, 'suspicious');
  assert.equal(r.matches[0].id, 'ar/trabajo-likes');
});
test('the score is always null (no made-up number)', () => {
  for (const t of [PAMI, 'hola', '']) assert.equal(m(t).score, null);
});

// Review Focus 4: odd input
test('empty, emoji-only and huge input are not recognised and fast', () => {
  // The first check prepares every entry's phrases once (the Worker keeps the catalogue per isolate); time real checks.
  const cold = performance.now();
  m('warm up');
  assert.ok(performance.now() - cold < 2000, 'preparing the catalogue took too long');
  for (const t of ['', '🙂🙂🙂', 'hola '.repeat(10000), 'สวัสดีครับ '.repeat(2000), '안녕하세요 반갑습니다 '.repeat(1000), 'こんにちは、お元気ですか。'.repeat(500)]) {
    const t0 = performance.now();
    const r = m(t);
    assert.equal(r.verdict, 'not_recognised');
    assert.ok(performance.now() - t0 < 200, 'took too long');
  }
});

// English (every language an entry has is matched; warning signs read English too)
test('an English code request reads asks_for_code', () =>
  assert.ok(readSigns("They'll send you a 6-digit code, read it to me").includes('asks_for_code')));
test('English urgency', () => assert.ok(readSigns('Your account will be suspended today, act immediately').includes('urgency')));
test('English money request', () => assert.ok(readSigns('Pay the fee with a gift card').includes('money_request')));
test('English link', () => assert.ok(readSigns('Click here to track your parcel: [link]').includes('unknown_link')));
test('English secrecy and keep on line', () => assert.deepEqual(readSigns("Don't tell anyone and don't hang up"), ['secrecy', 'keep_on_line']));
test('English too good to be true', () => assert.ok(readSigns('Congratulations, you won a prize!').includes('too_good_to_be_true')));
test('English remote access', () => assert.ok(readSigns('Download this app so I can see your screen').includes('remote_access')));
test('English new number', () => assert.ok(readSigns('Hi mum, this is my new number').includes('new_number')));
test('English impersonation', () => assert.ok(readSigns('Hello, this is the fraud department of your bank').includes('impersonation')));
test('an ordinary English message has no signs', () => assert.deepEqual(readSigns('Hi, are we still on for dinner on Sunday?'), []));
test('matches an English phrase of an Argentine entry', () => assert.equal(top('they asked me for a WhatsApp code'), 'ar/whatsapp-codigo'));
test('an English bank call matches the fake bank employee', () => assert.equal(top('the bank called me, security department, go to the ATM'), 'ar/falso-banco'));
test('an English appointment reminder matches nothing', () =>
  assert.deepEqual(m("Hi Sarah, a reminder of your appointment with Dr Lee tomorrow at 10:30. Let us know if you can't make it. Thanks!").matches, []));
test('ordinary English chat matches nothing', () => assert.deepEqual(m('hey, how are you doing, see you on sunday').matches, []));
test('ordinary English messages are never called a scam', () => {
  for (const t of ['The wifi password is on the fridge', 'Use code SUMMER10 at checkout', "What's your zip code?",
    "Hi Mum, I'll pay you back for dinner tomorrow", "I'm downloading the photos now", 'Can you share your screen in the meeting?',
    'Congratulations on the new job!', "I'll be at the bank"])
    assert.notEqual(m(t).verdict, 'scam', t);
});
test('ordinary English messages match no scam entry', () => {
  for (const t of ['Look at this photo of the dog', 'Mum, can you scan the school form?', 'Mum, are you coming to the school fair?'])
    assert.deepEqual(m(t).matches, [], t);
});
test('apostrophes typed by people still match English phrases', () => assert.equal(top("I can't get into my WhatsApp"), 'ar/whatsapp-codigo'));

// Portuguese (Brazil)
test('Portuguese code request', () => assert.ok(readSigns('Vai chegar um código por SMS, me passa o código por favor').includes('asks_for_code')));
test('Portuguese money request (Pix)', () => assert.ok(readSigns('Faz um Pix de 800 reais pra mim agora').includes('money_request')));
test('Portuguese urgency', () => assert.ok(readSigns('Sua conta será bloqueada hoje, é urgente').includes('urgency')));
test('Portuguese new number', () => assert.ok(readSigns('Oi mãe, troquei de número, salva esse').includes('new_number')));
test('Portuguese impersonation', () => assert.ok(readSigns('Aqui é da central de atendimento do seu banco').includes('impersonation')));
test('Portuguese secrecy and keep on line', () => assert.deepEqual(readSigns('Não conta pra ninguém e não desliga'), ['secrecy', 'keep_on_line']));
test('Portuguese remote access', () => assert.ok(readSigns('Baixe este aplicativo para eu ver sua tela').includes('remote_access')));
test('Portuguese too good to be true', () => assert.ok(readSigns('Parabéns, você ganhou um prêmio').includes('too_good_to_be_true')));
test('an ordinary Portuguese message has no signs', () => assert.deepEqual(readSigns('Oi, tudo bem? Vamos almoçar no domingo?'), []));
test('money evidence quotes the whole amount', async () => {
  const { readSignsWithEvidence } = await import('../../packages/matcher/index.js');
  assert.equal(readSignsWithEvidence('We stopped a payment of $1,480 today').find((s) => s.id === 'money_request').evidence, '$1,480');
  assert.equal(readSignsWithEvidence('Transferime $50.000 al alias').find((s) => s.id === 'money_request').evidence, 'Transferime');
});

import { readSigns as signsOf } from '../../packages/matcher/index.js';
test('1.2.0: "we will never ask you to tell us your PIN" is not a code request; asking for it still is', () => {
  assert.ok(!signsOf('Card blocked. Check the alert in your app. We will never ask you to tell us your PIN.').includes('asks_for_code'));
  assert.ok(!signsOf('Banco: bloqueamos tu tarjeta. Nunca te vamos a pedir claves por teléfono.').includes('asks_for_code'));
  assert.ok(signsOf('This is the bank, please tell us your PIN to unblock the card').includes('asks_for_code'));
});
test('1.2.0: "log in with your password" is an instruction, not a code request', () => {
  assert.ok(!signsOf('Recordatorio: vence la declaración. Ingresá con tu clave fiscal desde el sitio oficial.').includes('asks_for_code'));
  assert.ok(!signsOf('Your tax return is due. Sign in with your password on the official app.').includes('asks_for_code'));
  assert.ok(signsOf('Pasame la clave que te llegó').includes('asks_for_code'));
});
test('1.2.0: "nothing to pay" cancels the money sign', () => {
  assert.ok(!signsOf('Correo Argentino: tu paquete llega mañana. No tenés nada que pagar.').includes('money_request'));
  assert.ok(!signsOf('Your parcel arrives tomorrow, nothing to pay on delivery.').includes('money_request'));
  assert.ok(signsOf('Pay the redelivery fee today').includes('money_request'));
});
test('Argentine "new number" phrasing: agendame, número alternativo, se me cayó el cel', () => {
  for (const t of ['Hola pa soy yo, agendame este número', 'este es un número alternativo', 'se me cayó el cel y quedó pantalla negra', 'se me rompió el celular']) assert.ok(signsOf(t).includes('new_number'), t);
  assert.ok(!signsOf('mañana te paso el número del plomero').includes('new_number'));
});

import { matchMessage as mm } from '../../packages/matcher/index.js';
const fakeEntries = [
  { id: 'ar/local', country: 'ar', name: { es: 'Premio falso' }, phrases: { es: ['ganaste un premio', 'premio de navidad'] } },
  { id: 'us/jury', country: 'us', name: { en: 'Jury duty warrant' }, phrases: { en: ['missed jury duty', 'warrant for your arrest'] }, phrasesTranslated: { es: ['no se presento al jurado', 'orden de arresto pendiente', 'tarjetas de regalo'] } },
];
test('elsewhere: a scam known only abroad is found from another language when it beats the local matches', () => {
  const r = mm('Usted no se presentó al jurado y tiene una orden de arresto pendiente, pague con tarjetas de regalo', fakeEntries, { country: 'ar', elsewhere: true });
  assert.deepEqual(r.elsewhere.map((x) => x.id), ['us/jury']);
});
test('elsewhere: nothing foreign is shown when a local entry fits as well', () => {
  const r = mm('Ganaste un premio de navidad', fakeEntries, { country: 'ar', elsewhere: true });
  assert.deepEqual(r.elsewhere, []);
  assert.equal(r.matches[0].id, 'ar/local');
});
test('elsewhere is only computed when asked and a country is given', () => {
  assert.equal(mm('orden de arresto pendiente', fakeEntries, { country: 'ar' }).elsewhere, undefined);
  assert.equal(mm('orden de arresto pendiente', fakeEntries, { elsewhere: true }).elsewhere, undefined);
});
test('translated phrases are used only for the search abroad, never for local matching', () => {
  const r = mm('orden de arresto pendiente', fakeEntries, {});
  assert.deepEqual(r.matches, [], 'without elsewhere, machine translations do not match');
});
test('1.3.0: European Portuguese signs (MB WAY, Multibanco, telemóvel, não partilhe)', () => {
  assert.ok(signsOf('Envie o pagamento por MB WAY hoje').includes('money_request'));
  assert.ok(signsOf('Use a referência Multibanco para regularizar a dívida').includes('money_request'));
  assert.ok(signsOf('Olá mãe, mudei de número, o meu telemóvel avariou').includes('new_number'));
  assert.ok(signsOf('Aviso das Finanças: regularize hoje').includes('impersonation'));
  assert.ok(!signsOf('O seu código é 123456. Não partilhe este código com ninguém.').includes('asks_for_code'));
  assert.ok(!signsOf('Vamos jantar hoje às oito?').includes('money_request'));
});
test('1.3.1: "we will never ask for your bank details" cancels the money sign; a real request next to it does not', () => {
  assert.ok(!signsOf('Log in to myAccount yourself. Revenue will never ask for your bank details by email or text.').includes('money_request'));
  assert.ok(!signsOf('O banco nunca lhe vai pedir os seus dados bancários por SMS.').includes('money_request'));
  assert.ok(signsOf('We never ask for bank details, but pay the release fee here today').includes('money_request'));
  assert.ok(signsOf('Please confirm your bank details to receive the refund').includes('money_request'));
});
test('1.4.0: French and Dutch signs, and their "never share" and "nothing to pay" context rules', () => {
  const has = (t, id) => signsOf(t).includes(id);
  assert.ok(has('Ne raccrochez pas, je suis votre conseiller, donnez-moi le code reçu par SMS', 'keep_on_line'));
  assert.ok(has('Donnez-moi le code reçu par SMS', 'asks_for_code'));
  assert.ok(has('Colissimo : réglez les frais de livraison de 1,99 € via ce lien', 'money_request'));
  assert.ok(has('Coucou maman, c’est mon nouveau numéro, mon téléphone est cassé', 'new_number'));
  assert.ok(has('Hoi mam, dit is mijn nieuwe nummer, mijn telefoon is kapot', 'new_number'));
  assert.ok(has('Blijf aan de lijn, wij zetten uw geld op een veilige rekening', 'keep_on_line'));
  assert.ok(has('Kunt u dit betaalverzoek vandaag nog betalen?', 'money_request'));
  assert.ok(!has('Votre code de connexion est 482913. Ne le communiquez jamais, même à un conseiller.', 'asks_for_code'));
  assert.ok(!has('Uw verificatiecode is 482913. Deel deze code nooit met iemand.', 'asks_for_code'));
  assert.ok(!has('Votre colis arrive demain, rien à payer à la livraison.', 'money_request'));
  assert.ok(!has('Uw pakket komt morgen, u hoeft niets te betalen.', 'money_request'));
  assert.ok(!has('Connectez-vous avec votre mot de passe sur impots.gouv.fr', 'asks_for_code'));
});
test('1.4.2: "this message contains no link" cancels the link sign; a real link still counts', () => {
  assert.ok(!signsOf('Ce SMS ne contient pas de lien. Consultez votre compte sur le site officiel.').includes('unknown_link'));
  assert.ok(!signsOf('This message contains no links. Log in through the app.').includes('unknown_link'));
  assert.ok(!signsOf('Deze sms bevat geen link.').includes('unknown_link'));
  assert.ok(signsOf('Click here to pay: [link]').includes('unknown_link'));
});
test('1.5.0: German signs and context rules', () => {
  const has = (t, id) => signsOf(t).includes(id);
  assert.ok(has('Legen Sie nicht auf, ich bin von der Kriminalpolizei', 'keep_on_line'));
  assert.ok(has('Legen Sie nicht auf, ich bin von der Kriminalpolizei', 'impersonation'));
  assert.ok(has('Nennen Sie mir bitte den Code aus der SMS', 'asks_for_code'));
  assert.ok(has('Hallo Mama, das ist meine neue Nummer, mein Handy ist kaputt', 'new_number'));
  assert.ok(has('Bitte überweisen Sie heute die Kaution', 'money_request'));
  assert.ok(!has('Ihre TAN lautet 482913. Geben Sie diesen Code niemals weiter.', 'asks_for_code'));
  assert.ok(!has('Ihr Paket kommt morgen, es ist nichts zu bezahlen.', 'money_request'));
  assert.ok(!has('Melden Sie sich mit Ihrem Passwort bei ELSTER an.', 'asks_for_code'));
  assert.ok(!has('Diese SMS enthält keinen Link.', 'unknown_link'));
});
test('1.5.1: "keine Zahlung erforderlich" cancels the money sign', () => {
  assert.ok(!signsOf('Ihr Paket wird heute zugestellt. Es ist keine Zahlung erforderlich.').includes('money_request'));
  assert.ok(!signsOf('Uw pakket komt vandaag, geen betaling nodig.').includes('money_request'));
  assert.ok(signsOf('Zahlung erforderlich: bitte heute 2,99 € Zollgebühr bezahlen').includes('money_request'));
});
test('1.5.1: "the PIN comes in a separate letter" is not a code request', () => {
  assert.ok(!signsOf('Ihre neue Karte kommt per Post. Die PIN erhalten Sie in einem separaten Brief.').includes('asks_for_code'));
  assert.ok(!signsOf('Your new card is on its way; the PIN will be sent separately by post.').includes('asks_for_code'));
  assert.ok(signsOf('Nennen Sie mir die PIN Ihrer Karte').includes('asks_for_code'));
});
test('1.6.0: a forwarded warning about a scam is not itself called a scam, and still names the scam', () => {
  const warning = 'Ojo: están llamando haciéndose pasar por un correo, ya tienen tu DNI y dirección y después te piden el código de WhatsApp para robarte la cuenta. Avisen a los mayores.';
  const r = m(warning, { country: 'ar' });
  assert.equal(r.warning, true);
  assert.notEqual(r.verdict, 'scam');
  assert.equal(r.matches[0]?.id, 'ar/whatsapp-codigo');
  assert.ok(m('Beware: scammers call pretending to be your bank and ask for the code. Warn your family!', { country: 'gb' }).warning);
});
test('1.6.0: a scam that opens with "scammers are impersonating us" is still a scam', () => {
  const scam = 'Cuidado: hay estafadores haciéndose pasar por el banco. Para proteger tus ahorros pasame el código que te llegó y no cortes la llamada.';
  const r = m(scam, { country: 'ar' });
  assert.ok(!r.warning);
  assert.equal(r.verdict, 'scam');
  assert.ok(!m('Alerta: estafadores usan nuestro nombre. Verificá tu cuenta acá [enlace] hoy mismo', { country: 'ar' }).warning);
});
test('1.7.0: Italian, Polish and Romanian signs and context rules', () => {
  const has = (t, id) => signsOf(t).includes(id);
  assert.ok(has('Sono della Polizia Postale, non riattacchi e mi dica il codice di sicurezza', 'keep_on_line'));
  assert.ok(has('Tu pracownik banku, proszę się nie rozłączać i podać kod BLIK', 'asks_for_code'));
  assert.ok(has('Sunt de la departamentul de securitate al băncii, nu închideți și spuneți-mi codul', 'keep_on_line'));
  assert.ok(has('Ciao mamma, questo è il mio nuovo numero, il telefono è rotto', 'new_number'));
  assert.ok(has('Cześć mamo, to mój nowy numer', 'new_number'));
  assert.ok(has('Paczka czeka, dopłata 1,99 zł: kliknij w link', 'money_request'));
  assert.ok(!has('Il tuo codice è 482913. Non condividere questo codice con nessuno.', 'asks_for_code'));
  assert.ok(!has('Twój kod BLIK: 482913. Nie udostępniaj nikomu tego kodu.', 'asks_for_code'));
  assert.ok(!has('Codul tău este 482913. Nu comunica nimănui acest cod.', 'asks_for_code'));
  assert.ok(!has('La spedizione arriva domani, nulla da pagare alla consegna.', 'money_request'));
});
test('1.7.1: "la poste" needs word boundaries; a blocked-payment alert is not a payment request', () => {
  assert.ok(!signsOf('Mi fai una ricarica sulla Postepay?').includes('impersonation'));
  assert.ok(signsOf('La Poste : votre colis est en attente').includes('impersonation'));
  assert.ok(!signsOf('Abbiamo bloccato un pagamento online di 499 EUR. Non ti chiederemo mai codici, PIN o bonifici.').includes('money_request'));
  assert.ok(signsOf('Effettua il pagamento di 1,99 euro per la consegna').includes('money_request'));
  assert.ok(signsOf('Efetue o pagamento da taxa hoje').includes('money_request'));
});
test('1.7.1: Romanian "nothing to pay" and "the PIN is in the app" are genuine', () => {
  assert.ok(!signsOf('Coletul va fi livrat azi. Plata a fost făcută online, nu ai nimic de achitat.').includes('money_request'));
  assert.ok(!signsOf('Cardul tău nou a fost expediat. PIN-ul îl găsești în aplicația băncii.').includes('asks_for_code'));
  assert.ok(signsOf('Spune-mi PIN-ul cardului ca să deblocăm contul').includes('asks_for_code'));
});
test('1.7.1: a greeting is not a new number; a BLIK is a payment; "PIN w aplikacji" is genuine', () => {
  assert.ok(!signsOf('Cześć mamo, możesz mi wysłać BLIK-a na 80 zł? Możesz też zadzwonić.').includes('new_number'));
  assert.ok(!signsOf('Cześć mamo, możesz mi wysłać BLIK-a na 80 zł?').includes('asks_for_code'));
  assert.ok(signsOf('Cześć mamo, możesz mi wysłać BLIK-a na 80 zł?').includes('money_request'));
  assert.ok(signsOf('Pilnie potrzebuję pożyczki, podaj mi kod BLIK').includes('asks_for_code'));
  assert.ok(!signsOf('Nowa karta wysłana. PIN ustawisz samodzielnie w aplikacji.').includes('asks_for_code'));
  assert.ok(!signsOf('Hallo Mama, wie geht es dir?').includes('new_number'));
});
test('1.8.0: Ukrainian, Russian, Bulgarian, Greek and Turkish signs and genuine-code warnings', () => {
  const has = (t, id) => signsOf(t).includes(id);
  assert.ok(has('Служба безпеки банку. Не кладіть слухавку, назвіть код з СМС', 'keep_on_line'));
  assert.ok(has('Служба безпеки банку. Не кладіть слухавку, назвіть код з СМС', 'asks_for_code'));
  assert.ok(has('Мамо, це мій новий номер, телефон розбився', 'new_number'));
  assert.ok(has('Служител на банка: не затваряйте, кажете ми кода за потвърждение', 'asks_for_code'));
  assert.ok(has('Τμήμα ασφαλείας της τράπεζας. Μην κλείσετε, πείτε μου τον κωδικό επιβεβαίωσης', 'keep_on_line'));
  assert.ok(has('Banka güvenlik birimi: telefonu kapatmayın, doğrulama kodunu bana söyleyin', 'asks_for_code'));
  for (const t of ['Ваш код підтвердження 482913. Нікому не повідомляйте цей код.', 'Ваш код подтверждения 482913. Никому не сообщайте этот код.',
    'Вашият код е 482913. Не го споделяйте с никого.', 'Ο κωδικός σας είναι 482913. Μην τον γνωστοποιήσετε σε κανέναν.', 'Doğrulama kodunuz 482913. Bu kodu kimseyle paylaşmayın.'])
    assert.ok(!has(t, 'asks_for_code'), t);
});
test('1.8.1: Ukrainian scam wording from real messages; "we never call", "set the PIN yourself" are genuine', () => {
  const has = (t, id) => signsOf(t).includes(id);
  assert.ok(has('Вас турбує відділ безпеки вашого банку', 'impersonation'));
  assert.ok(has('Тобі мав прийти код з шести цифр, скинь його мені', 'asks_for_code'));
  assert.ok(has('Квартира вільна, потрібна передоплата за місяць', 'money_request'));
  assert.ok(!has('Ваш банк нагадує: ми ніколи не телефонуємо з проханням назвати PIN, CVV чи код із SMS.', 'asks_for_code'));
  assert.ok(!has('Yeni kartınız kuryeyle gelecek; şifrenizi ATM’den veya mobil uygulamadan kendiniz oluşturabilirsiniz.', 'asks_for_code'));
});
test('1.8.1: "the PIN is in the app" in Greek, Ukrainian and Turkish is genuine', () => {
  assert.ok(!signsOf('Η νέα σας κάρτα στάλθηκε. Το PIN θα το δείτε στην εφαρμογή.').includes('asks_for_code'));
  assert.ok(!signsOf('Нова картка вже в дорозі, PIN побачите у застосунку банку.').includes('asks_for_code'));
  assert.ok(!signsOf('Yeni kartınız yolda, PIN kodunu uygulamadan görebilirsiniz.').includes('asks_for_code'));
  assert.ok(signsOf('Πείτε μου το PIN της κάρτας σας').includes('asks_for_code'));
});
test('1.9.0: Swedish signs from real-style messages, and genuine Swedish notices', () => {
  const has = (t, id) => signsOf(t).includes(id);
  assert.ok(has('Vi har stoppat en betalning. Legitimera dig i BankID-appen nu medan vi pratar. Lägg inte på.', 'asks_for_code'));
  assert.ok(has('Vi har stoppat en betalning. Legitimera dig i BankID-appen nu medan vi pratar. Lägg inte på.', 'keep_on_line'));
  assert.ok(has('Hej mamma, har fått nytt nummer, telefonen hamnade i poolen', 'new_number'));
  assert.ok(has('Det är viktigt att ni inte pratar med någon om det här, inte ens med banken.', 'secrecy'));
  assert.ok(!has('Din engångskod är 482 917. Lämna aldrig ut koden till någon.', 'asks_for_code'));
  assert.ok(!has('Påminnelse: logga in själv med BankID på Skatteverkets webbplats. Vi skickar aldrig länkar.', 'unknown_link'));
});
test('1.9.0: Danish, Norwegian, Finnish and Icelandic signs, and their genuine notices', () => {
  const has = (t, id) => signsOf(t).includes(id);
  assert.ok(has('Godaften, det er politiassistent Jensen fra Københavns Politi', 'impersonation'));
  assert.ok(has('Hej far, min gamle telefon er gået i stykker så det her er mit nye nr.', 'new_number'));
  assert.ok(has('Du har fått en SMS med en kode nå, bare send den hit', 'asks_for_code'));
  assert.ok(has('Tunnuksillasi on yritetty kirjautua. Tässä Mikko asiakasturvasta.', 'impersonation'));
  assert.ok(has('Til að fá endurgreiðsluna þarftu að auðkenna þig með rafrænum skilríkjum', 'asks_for_code'));
  assert.ok(!has('Skattestyrelsen sender aldrig links og spørger aldrig efter kortoplysninger.', 'money_request'));
  assert.ok(!has('Tak for din ordre. Vi har modtaget din betaling på 389 kr.', 'money_request'));
  assert.ok(!has('OP: vahvistuskoodisi on 482913. Älä koskaan kerro koodia kenellekään.', 'asks_for_code'));
  assert.ok(!has('Pósturinn: pakkinn þinn er kominn, ekkert að greiða.', 'money_request'));
  assert.ok(!has('Del aldri koden med noen. Vi ber aldri om BankID.', 'asks_for_code'));
});
test('1.10.0: Slovenian and Slovak signs from labelled messages, and their genuine notices', () => {
  const has = (t, id) => signsOf(t).includes(id);
  assert.ok(has('Tukaj varnostna služba banke. Sredstva bomo premaknili na rezervni račun.', 'impersonation'));
  assert.ok(has('Če plačate varščino, ga izpustimo. Ne prekinjajte zveze.', 'keep_on_line'));
  assert.ok(has('Z bezpečnostného útvaru vašej banky: prostriedky musíme presunúť na technický účet.', 'money_request'));
  assert.ok(has('Zadaj svoje číslo a ten kód čo ti príde mi prepošli', 'asks_for_code'));
  assert.ok(!has('Vaša enkratna koda je 551 204. Kode ne posredujte nikomur.', 'asks_for_code'));
  assert.ok(!has('Overovací kód 518 204. Kód nikomu neposkytujte.', 'asks_for_code'));
  assert.ok(!has('Zásielku vám dnes doručí kuriér, dobierka 34,90 € sa platí pri prevzatí.', 'money_request'));
  assert.ok(!has('Tento e-mail neobsahuje odkazy.', 'unknown_link'));
});
test('1.10.0: Czech and Croatian signs, and their genuine notices', () => {
  const has = (t, id) => signsOf(t).includes(id);
  assert.ok(has('Dobrý den, oddělení bezpečnosti České spořitelny, peníze je nutné vybrat', 'impersonation'));
  assert.ok(has('Omylem jsem ti poslal šestimístný kód, můžeš mi ho přeposlat?', 'asks_for_code'));
  assert.ok(has('Zovem iz policijske uprave, imate li kod kuće ušteđevinu ili zlato?', 'money_request'));
  assert.ok(has('Bok tata, ovo je privremeni broj jer mi je stari mob pao u more', 'new_number'));
  assert.ok(!has('Kód nikomu nesdělujte, pracovníci banky jej po vás nikdy nebudou chtít.', 'asks_for_code'));
  assert.ok(!has('Jednokratni kod je 583 214. Kod nikome ne dajte.', 'asks_for_code'));
  assert.ok(!has('PIN ćete vidjeti u mobilnoj aplikaciji. Djelatnici banke nikad ne traže PIN ni CVV.', 'asks_for_code'));
  assert.ok(!has('Porezna uprava ne šalje poveznice za prijavu niti traži podatke kartice.', 'money_request'));
});
test('1.10.0: Hungarian signs from labelled messages, and genuine Hungarian notices', () => {
  const has = (t, id) => signsOf(t).includes(id);
  assert.ok(has('Az OTP biztonsági csoportjától: a pénzét át kell vezetnünk egy védett technikai számlára', 'money_request'));
  assert.ok(has('Szia apu, ez az új számom, mentsd el légyszi', 'new_number'));
  assert.ok(has('Fontos, hogy a bankfióknak ne mondja el', 'secrecy'));
  assert.ok(!has('Egyszer használatos kódja 518 204. A kódot senkinek ne adja meg.', 'asks_for_code'));
  assert.ok(!has('Az új kártyát bármely ATM-nél PIN-kóddal tudja aktiválni.', 'asks_for_code'));
  assert.ok(!has('A küldemény átvehető, nem kell fizetnie semmit.', 'money_request'));
});
test('1.12.0: Lithuanian signs (and Russian wording seen in Lithuania), and genuine notices', () => {
  const has = (t, id) => signsOf(t).includes(id);
  assert.ok(has('Čia jūsų banko klientų saugumo tarnyba, įveskite PIN2 programėlėje', 'asks_for_code'));
  assert.ok(has('Sumokėkite 0,89 EUR, kitaip siuntinys bus sunaikintas', 'money_request'));
  assert.ok(has('Tik nesakyk mamai, prašau', 'secrecy'));
  assert.ok(has('Сейчас придёт SMS с цифрами, назовите их', 'asks_for_code'));
  assert.ok(!has('Mokėjimo kodas 517 204. Niekam neatskleiskite kodo, banko darbuotojai jo niekada neprašo.', 'asks_for_code'));
  assert.ok(!has('Banko darbuotojai niekada neprašo Smart-ID PIN kodų.', 'asks_for_code'));
  assert.ok(!has('Siunta jau paštomate, mokėti nieko nereikia.', 'money_request'));
});
test('1.12.0: Estonian signs, and Estonian tax wording is not Finnish "maksu" (payment)', () => {
  const has = (t, id) => signsOf(t).includes(id);
  assert.ok(has('Teile tuleb teavitus telefoni, palun sisestage seal PIN1', 'asks_for_code'));
  assert.ok(has('Broneeringu kinnitamiseks tuleb teile Smart-ID teade, palun kinnitage', 'asks_for_code'));
  assert.ok(has('Swedbanki pettuste ennetuse osakond, suunan teid uurija juurde', 'impersonation'));
  assert.ok(!has('LHV: sinu kinnituskood on 482913. Ära anna koodi kellelegi.', 'asks_for_code'));
  assert.ok(!has('Meie töötajad ei küsi kunagi PIN-koode ega palu Smart-ID-ga midagi kinnitada.', 'asks_for_code'));
  assert.ok(!has('Maksu- ja Tolliamet: palun logige e-maksuametisse sisse ise.', 'money_request'));
  assert.ok(has('Pysäköintimaksu on maksamatta, maksu 3,20 €', 'money_request'));
});
test('1.12.0: Latvian signs (and Russian wording seen in Latvia), and genuine Latvian notices', () => {
  const has = (t, id) => signsOf(t).includes(id);
  assert.ok(has('Valsts policijas Ekonomisko noziegumu pārvalde. Cik aptuveni jums ir uzkrājumu?', 'money_request'));
  assert.ok(has('Sveika, mamm, saglabā šo numuru, manējais saplīsa', 'new_number'));
  assert.ok(has('Если сегодня внести залог, дело оформим как несчастный случай', 'money_request'));
  assert.ok(!has('Smart-ID kontroles kods 4821. Nevienam neizpaudiet kodu.', 'asks_for_code'));
  assert.ok(!has('Karti aktivizējiet ar pirmo PIN darījumu. Banka nekad neprasa PIN.', 'asks_for_code'));
  assert.ok(!has('Mamm, vari lūdzu pārskaitīt 50 eiro, aizmirsu, ka šodien jāmaksā par ekskursiju', 'urgency'));
});
test('1.13.0: Serbian, Bosnian and Montenegrin signs (Latin and Cyrillic), and genuine notices', () => {
  const has = (t, id) => signsOf(t).includes(id);
  assert.ok(has('Treba mi šestocifreni broj koji vam sada stiže u poruci', 'asks_for_code'));
  assert.ok(has('Ovo je moj novi Viber, stari mi je hakovan', 'new_number'));
  assert.ok(has('Колико имате код куће у готовини?', 'money_request'));
  assert.ok(has('Ако казну измирите данас, умањује се за половину', 'urgency'));
  assert.ok(has('Nemojte prekidati vezu dok ne završimo', 'keep_on_line'));
  assert.ok(!has('Nova debitna kartica je poslana. PIN stiže posebnom pošiljkom. Nikome ne otkrivajte PIN.', 'asks_for_code'));
  assert.ok(!has('Banka nikada ne traži PIN, CVC ni jednokratne kodove. Nemojte otvarati link.', 'money_request'));
  assert.ok(!has('Mama, možeš li mi prebaciti 100 KM? Nazvaću te večeras kad izađem s posla.', 'urgency'));
  assert.ok(!has('Sutra ću ti se spojiti preko AnyDeska, kako smo se dogovorili na sastanku.', 'remote_access'));
});
test('1.13.0: Albanian signs (Albania and Kosovo), and genuine notices', () => {
  const has = (t, id) => signsOf(t).includes(id);
  assert.ok(has('Të kam dërguar padashur një kod me SMS, ma kthe këtu', 'asks_for_code'));
  assert.ok(has('Dërgoji përmes Western Union, ua kthej javën tjetër', 'money_request'));
  assert.ok(has('Kjo mbetet mes nesh', 'secrecy'));
  assert.ok(has('Paguani tarifën e magazinimit 120 Lekë deri sot', 'urgency'));
  assert.ok(!has('Kodi juaj OTP është 482913. Mos ia jepni kodin askujt, as punonjësve të bankës.', 'asks_for_code'));
  assert.ok(!has("Karta juaj është dërguar në degë. PIN-i do t'ju vijë me SMS të veçantë.", 'asks_for_code'));
  assert.ok(!has('Posta e Kosovës: dërgesa është në zyrë. Nuk kërkohet asnjë pagesë.', 'money_request'));
});
test('1.13.0: Macedonian signs, and genuine Macedonian notices', () => {
  const has = (t, id) => signsOf(t).includes(id);
  assert.ok(has('Ве молиме испратете ни го кодот за потврда што ќе пристигне по СМС', 'asks_for_code'));
  assert.ok(has('Може да префрлиш 250 евра на сметката на газдарицата?', 'money_request'));
  assert.ok(has('Тато, ова ми е новиот број', 'new_number'));
  assert.ok(!has('Еднократна лозинка: 482913. Никому не го споделувајте овој код.', 'asks_for_code'));
  assert.ok(!has('СВР Скопје: во недела ќе биде затворен сообраќајот на кејот.', 'urgency'));
  assert.ok(!has('Нема износ за плаќање. Подигнете ја пратката со лична карта.', 'money_request'));
});
test('1.13.0: Finnish "varat" (funds) is a whole word, not part of other languages\' words', () => {
  const has = (t, id) => signsOf(t).includes(id);
  assert.ok(!has('Nemojte otvarati link iz poruke.', 'money_request'));
  assert.ok(has('Siirrä varat turvatilille heti', 'money_request'));
});
test('1.14.0: Russian wording from Russia, Belarus and Armenia, and genuine Russian notices', () => {
  const has = (t, id) => signsOf(t).includes(id);
  assert.ok(has('Нужно срочно переместить ваши средства на защищённый счёт', 'money_request'));
  assert.ok(has('Сейчас придёт сообщение с кодом записи, продиктуйте его', 'asks_for_code'));
  assert.ok(has('Это тайна следствия, в банке никому ничего не говорите', 'secrecy'));
  assert.ok(has('Выручи, переведи по номеру, завтра верну', 'money_request'));
  assert.ok(!has('Почта России: посылка прибыла. Для получения назовите код из приложения или предъявите паспорт.', 'asks_for_code'));
  assert.ok(!has('Код для входа в Telegram: 58204. Не давайте код никому!', 'asks_for_code'));
});
test('1.14.0: Armenian signs (script and Latin transliteration), and genuine notices', () => {
  const has = (t, id) => signsOf(t).includes(id);
  assert.ok(has('Ձեր հեռախոսին թվեր կգան, կարդացեք ինձ', 'asks_for_code'));
  assert.ok(has('Խնդրում եմ մի անջատեք', 'keep_on_line'));
  assert.ok(has('Mtir hxumov, gri hamard u hastati ekac kodov', 'asks_for_code'));
  assert.ok(!has('Կոդը ոչ մեկին մի հայտնեք, այդ թվում՝ բանկի աշխատակցին:', 'asks_for_code'));
  assert.ok(!has('PIN կոդը կստանաք բանկի հավելվածում:', 'asks_for_code'));
  assert.ok(!has('Լրացուցիչ վճար չի պահանջվում:', 'money_request'));
});
test('1.14.0: Georgian signs, and genuine Georgian notices', () => {
  const has = (t, id) => signsOf(t).includes(id);
  assert.ok(has('ტელეფონზე მოსულ შეტყობინებას რომ წაიკითხავთ, ის კარნახით უთხარით', 'asks_for_code'));
  assert.ok(has('ოპერატორის თანდასწრებით გაგვიზიარეთ ეკრანი', 'remote_access'));
  assert.ok(has('ჩემს მეზობელს ჩაურიცხე, საღამოს დაგიბრუნებ', 'money_request'));
  assert.ok(!has('TBC: თქვენი ერთჯერადი კოდია 482913. კოდი არავის გაუზიაროთ.', 'asks_for_code'));
  assert.ok(!has('საქართველოს ფოსტა: გთხოვთ, მიბრძანდეთ 10 დღის განმავლობაში.', 'urgency'));
});
test('1.14.0: Azerbaijani signs (ə or e), and genuine Azerbaijani notices', () => {
  const has = (t, id) => signsOf(t).includes(id);
  assert.ok(has('Telefonunuza göndərdiyimiz təsdiq kodunu deyin', 'asks_for_code'));
  assert.ok(has('Telefonunuza gelen kodu bura yazin', 'asks_for_code'));
  assert.ok(has('Bu nömrəyə köçür, sabah qaytararam', 'money_request'));
  assert.ok(!has('Tesdiq kodu: 518 362. Bu kodu hec kime demeyin.', 'asks_for_code'));
  assert.ok(!has('PIN kodu mobil tetbiqde ozunuz teyin edin.', 'asks_for_code'));
  assert.ok(!has('Hech bir odenis teleb olunmur.', 'money_request'));
});
test('1.15.0: Latin American Spanish signs (South America), and genuine notices', () => {
  const has = (t, id) => signsOf(t).includes(id);
  assert.ok(has('¿Me confirma el número que le acaba de llegar por mensaje?', 'asks_for_code'));
  assert.ok(has('Cuando le salga el mensaje para autorizar, me avisa', 'asks_for_code'));
  assert.ok(has('Le va a llegar un mensaje con un número, léamelo', 'asks_for_code'));
  assert.ok(has('Hay otra persona que ya me quiere hacer el depósito, si usted me adelanta se la guardo', 'urgency'));
  assert.ok(has('Su solicitud ya salió aprobada, sin garante', 'too_good_to_be_true'));
  assert.ok(has('Habla el teniente Mamani de la FELCC', 'impersonation'));
  assert.ok(has('Te escribo de este número porque el mío está sin saldo', 'new_number'));
  assert.ok(has('¿Me podés girar a la cuenta de mi compañero?', 'money_request'));
  assert.ok(!has('Equipo, la junta con el cliente se adelanta a mañana a las 8 am', 'money_request'));
  assert.ok(!has('Davivienda: tu nueva tarjeta fue despachada. No te pediremos claves por este medio.', 'asks_for_code'));
  assert.ok(!has('SRI recuerda: ingrese con su clave a SRI en línea escribiendo la dirección oficial.', 'asks_for_code'));
  assert.ok(!has('BCP: Tu clave digital es 4821. Nunca la compartas con nadie, ni con personal del banco.', 'asks_for_code'));
  assert.ok(!has('Te mando la ubicación y la clave del portón el día antes.', 'asks_for_code'));
  assert.ok(!has('Recuerda activarla en el cajero con tu PIN.', 'asks_for_code'));
  assert.ok(has('BPS: valida tu identidad con tu usuario y contraseña en [enlace]', 'asks_for_code'));
});
test('1.16.0: Central American Spanish and Belizean English signs, and genuine notices', () => {
  const has = (t, id) => signsOf(t).includes(id);
  assert.ok(has('Le va a llegar un mensajito con unos números. Me los dicta para terminar', 'asks_for_code'));
  assert.ok(has('Te acaba de caer un mensajito con números, ¿me lo reenviás?', 'asks_for_code'));
  assert.ok(has('Ocupo que me diga el usuario con que entra al banco', 'asks_for_code'));
  assert.ok(has('Para emitir el cheque debe consignar B/. 310 en timbres', 'money_request'));
  assert.ok(has('Ya me están preguntando bastante, si no se lo doy al siguiente', 'urgency'));
  assert.ok(has('A verification number was sent to your phone, please forward it here', 'asks_for_code'));
  assert.ok(has('Only requirement is a $150 activation fee', 'money_request'));
  assert.ok(!has('BAC: Su codigo es 4821. Nunca lo comparta con nadie.', 'asks_for_code'));
  assert.ok(!has('El BCR nunca le solicitara su PIN ni claves por llamada o mensaje.', 'asks_for_code'));
  assert.ok(!has('Hacienda: ingrese directamente al portal del Ministerio con su usuario y contraseña.', 'asks_for_code'));
  assert.ok(!has('Claro: tu factura ya está disponible. Monto a pagar C$650, vence el 25.', 'urgency'));
  assert.ok(has('Su factura vence el 25. Pague hoy mismo o se suspende el servicio', 'urgency'));
});
test('1.17.0: language blocks apply only for the check country\'s languages', async () => {
  const { readSigns, compileSigns } = await import('../../packages/matcher/signs.js');
  const { countryLangs } = await import('../../packages/matcher/index.js');
  // German "TAN" no longer fires on Spanish "tan" ("so") in a Spanish-speaking country.
  assert.ok(readSigns('hacía tiempo que no leía algo tan dulce').includes('asks_for_code'), 'unscoped: every block applies');
  assert.ok(!readSigns('hacía tiempo que no leía algo tan dulce', ['es', 'en']).includes('asks_for_code'));
  // A country's languages come from its entries, including the languages of their phrases.
  const lv = countryLangs(entries, 'lv');
  assert.ok(lv.includes('lv') && lv.includes('ru'));
  assert.equal(countryLangs(entries, undefined), null);
  // Related languages share blocks: Turkish rules for Azerbaijani, Bulgarian/Russian rules for Macedonian.
  assert.ok(readSigns('sms ile gelen parola nedir', ['az', 'en']).includes('asks_for_code'));
  assert.ok(!readSigns('sms ile gelen parola nedir', ['es', 'en']).includes('asks_for_code'));
  assert.ok(compileSigns(['mk', 'en']).unknown_link.test(' линк '));
  // Language-neutral patterns stay on everywhere.
  assert.ok(compileSigns(['es', 'en']).money_request.test('envia al iban de la cuenta'));
  // A scoped check still reads the country's own language.
  // Latvia's entries carry Russian phrases, so Russian rules still apply there.
  assert.ok(m('никому не говорите об этом звонке', { country: 'lv' }).signals.some((s) => s.id === 'secrecy'));
});
test('1.18.0: code deliveries, back-of-card alerts and official warnings are not scams (real-message set)', async () => {
  const { readSigns, isWarningAbout } = await import('../../packages/matcher/signs.js');
  // A text that only delivers a code asks for nothing...
  assert.ok(!readSigns('Your Medibank verification code is: 730968', ['en']).includes('asks_for_code'));
  assert.ok(!readSigns('Codice di sicurezza 123456 per completare la creazione della carta virtuale', ['it']).includes('asks_for_code'));
  // ...unless it also asks you to pass the code on.
  assert.ok(readSigns('Your verification code is 730968. Please read me the code to confirm it is you', ['en']).includes('asks_for_code'));
  // A bank alert that sends you to the number on the back of your card mentions an amount to check, not to pay.
  assert.ok(!readSigns('Possible unauthorised payment of £250. Please call the number on the back of your card.', ['en']).includes('money_request'));
  assert.ok(readSigns('Possible unauthorised payment of £250. Pay the fee here [link] or call the number on the back of your card.', ['en']).includes('money_request'));
  // An official warning post is a warning even when it mentions links and transfers, if it carries no link itself.
  assert.ok(isWarningAbout('¿Te llegó ese mensaje? Déjalo en visto. Es un fraude. Nunca compartas tus claves ni aceptes transferencias por enlace'));
  assert.ok(!isWarningAbout('Es un fraude que tu cuenta esté bloqueada, entra aquí para resolverlo: [enlace]'));
});
test('1.18.0: penalty threats are urgency, refund bait asking for payment details is a money request', async () => {
  const { readSigns } = await import('../../packages/matcher/signs.js');
  assert.ok(readSigns('Su sanción pasó a cobro jurídico. Cancela ahora y evita el decomiso de tus bienes', ['es']).includes('urgency'));
  assert.ok(readSigns('NOTIFICAÇÃO EXTRAJUDICIAL. Suspensão da sua CNH em andamento. Evite sua restrição', ['pt']).includes('urgency'));
  assert.ok(readSigns('È richiesto un suo contatto per evitare aggravamenti', ['it']).includes('urgency'));
  assert.ok(readSigns('Reciba su devolución registrando una cuenta bancaria a su nombre', ['es']).includes('money_request'));
  assert.ok(readSigns('Your refund was approved. Please provide accurate payment information', ['en']).includes('money_request'));
  assert.ok(!readSigns('Te recomendamos evitar las horas pico para hacer tu trámite en la sucursal', ['es']).includes('urgency'));
});
test('1.19.0: Tagalog / Taglish signs (Philippines) and more English call scripts', async () => {
  const { readSigns } = await import('../../packages/matcher/signs.js');
  assert.ok(readSigns("I've sent a reference code to your mobile, can you read the 6 digits", ['en']).includes('asks_for_code'));
  assert.ok(readSigns("Please don't end the call or the block won't go through", ['en']).includes('keep_on_line'));
  assert.ok(readSigns('Pay the P35.00 redelivery charge here [link]', ['en']).includes('money_request'));
  assert.ok(readSigns('Tita si Bea to, bagong sim ko kasi nawala yung phone ko', ['en', 'tl']).includes('new_number'));
  assert.ok(readSigns('may darating po na code sa inyo, pakisend na lang', ['en', 'tl']).includes('asks_for_code'));
  // Tagalog rules apply only where Tagalog is spoken.
  assert.ok(!readSigns('bagong sim ko', ['es', 'en']).includes('new_number'));
});
test('1.20.0: English threats, fees and genuine OTP texts (Nigeria)', async () => {
  const { readSigns } = await import('../../packages/matcher/signs.js');
  assert.ok(readSigns('If payment is not made by 2pm, we will contact everyone in your phonebook', ['en']).includes('urgency'));
  assert.ok(readSigns('Send 300,000 naira in the next one hour or I will tag your wife', ['en']).includes('money_request'));
  assert.ok(readSigns('We sent a 6-digit number to your phone, please call it out for me', ['en']).includes('asks_for_code'));
  assert.ok(readSigns('This is the EFCC Lagos zonal command. Do not discuss this with anyone', ['en']).includes('secrecy'));
  const otp = readSigns('Your OTP for the transfer of NGN 25,000.00 to ADEBAYO is [number]. It expires in 5 minutes. Do not disclose this code to anyone.', ['en']);
  assert.ok(!otp.includes('asks_for_code') && !otp.includes('money_request'));
});
test('1.21.0: India: APK downloads, fake officers on calls, Hindi urgency', async () => {
  const { readSigns } = await import('../../packages/matcher/signs.js');
  assert.ok(readSigns('Download and install SBI_Aadhaar_Update.apk to continue services', ['en']).includes('remote_access'));
  assert.ok(readSigns('This is Sub-Inspector Rathore from CBI Delhi. You will remain on this video call', ['en']).includes('keep_on_line'));
  assert.ok(readSigns('Press 9 to talk to the officer', ['en']).includes('keep_on_line'));
  assert.ok(readSigns('Update within 24 hrs or it will be sent back', ['en']).includes('urgency'));
  assert.ok(readSigns('आपका बिजली कनेक्शन आज रात काट दिया जायेगा', ['en', 'hi']).includes('urgency'));
  assert.ok(!readSigns('आपका बिजली कनेक्शन आज रात काट दिया जायेगा', ['en']).includes('urgency'), 'Hindi rules only where Hindi is spoken');
});
test('1.22.0: public-safety alerts are urgent by nature, not pressure', async () => {
  const { readSigns } = await import('../../packages/matcher/signs.js');
  const alert = readSigns('EMERGENCY ALERT: wildfire. Evacuate immediately if you are in the area north of the river. More information: [link]', ['en']);
  assert.ok(!alert.includes('urgency') && alert.includes('unknown_link'), 'the link still counts');
  assert.ok(!readSigns('Alerta de emergencia: por tsunami, evacúe inmediatamente el borde costero', ['es']).includes('urgency'));
  // A fake alert that asks for money or a code keeps its urgency.
  assert.ok(readSigns('Emergency alert: evacuate now. Pay the $25 shelter registration fee immediately at [link]', ['en']).includes('urgency'));
  assert.ok(readSigns('Your account will be locked immediately unless you verify at [link]', ['en']).includes('urgency'));
});
test('1.23.0: Indonesian rules, only where Indonesian is spoken', async () => {
  const { readSigns } = await import('../../packages/matcher/signs.js');
  const etle = readSigns('Denda Rp250.000 wajib dilunasi dalam 2x24 jam, jika tidak STNK akan diblokir. Bayar di [tautan]', ['id']);
  for (const s of ['urgency', 'money_request', 'unknown_link']) assert.ok(etle.includes(s), s);
  assert.ok(readSigns('nanti ada kode 6 angka masuk lewat SMS, mohon dibacakan ke saya', ['id']).includes('asks_for_code'));
  assert.ok(readSigns('silakan buka file ini ya bu: Cek_Resi_Paket.apk', ['id']).includes('remote_access'));
  assert.ok(readSigns('Bapak wajib ikut pemeriksaan lewat video call sekarang juga, jangan pergi ke mana-mana', ['id']).includes('keep_on_line'));
  // A genuine OTP that says not to share the code asks for nothing.
  assert.ok(!readSigns('JANGAN BERIKAN KODE INI KEPADA SIAPAPUN. Kode OTP Anda 482931, tolong jangan dikirim', ['id']).includes('asks_for_code'));
  assert.ok(!readSigns('Bayar di [tautan] hari ini', ['es', 'en']).includes('urgency'), 'Indonesian rules only where Indonesian is spoken');
});
test('1.25.0: Arabic rules, only where Arabic is spoken', async () => {
  const { readSigns } = await import('../../packages/matcher/signs.js');
  const fine = readSigns('لديك مخالفة غير مسددة بقيمة 50 درهماً. سيتم إضافة 500 درهم إذا لم يتم السداد اليوم. ادفع الآن: [رابط]', ['ar', 'en']);
  for (const s of ['urgency', 'money_request', 'unknown_link']) assert.ok(fine.includes(s), s);
  assert.ok(readSigns('بيوصلك رمز على جوالك، قوله لي عشان نكمل التحديث', ['ar', 'en']).includes('asks_for_code'));
  assert.ok(!readSigns('رمز التحقق 482915. لا تشارك هذا الرمز مع أي شخص، البنك لن يطلبه منك أبداً', ['ar', 'en']).includes('asks_for_code'));
  assert.ok(!readSigns('شحنتك في طريقها إليك اليوم. لا توجد أي رسوم مطلوبة', ['ar', 'en']).includes('money_request'), 'no fees due');
  assert.ok(!readSigns('ادفع الآن اليوم [رابط]', ['en']).includes('urgency'), 'Arabic rules only where Arabic is spoken');
});
test('1.26.0: Saudi Arabic: Nafath number requests, IBAN and "send me the code"', async () => {
  const { readSigns } = await import('../../packages/matcher/signs.js');
  assert.ok(readSigns('افتح تطبيق نفاذ ووافق على الطلب واختر الرقم 47', ['ar', 'en']).includes('asks_for_code'));
  assert.ok(readSigns('أرسلي رقم الآيبان والرمز اللي بيوصلك من البنك', ['ar', 'en']).includes('asks_for_code'));
  assert.ok(readSigns('أرسلي رقم الآيبان والرمز اللي بيوصلك من البنك', ['ar', 'en']).includes('money_request'));
  assert.ok(readSigns('تم حظر بطاقة الصراف الآلي الخاصة بك', ['ar', 'en']).includes('urgency'));
  assert.ok(!readSigns('سنرسل لك رمز التحقق. لا تشارك الرمز مع أي شخص', ['ar', 'en']).includes('asks_for_code'));
});
test('1.27.0: Egyptian Arabic: "قولهولي", wallet transfers, "النهارده"', async () => {
  const { readSigns } = await import('../../packages/matcher/signs.js');
  const call = readSigns('معاك خدمة عملاء البنك. الكارت هيتوقف النهارده. هيوصلك دلوقتي كود من البنك، قولهولي', ['ar']);
  for (const s of ['asks_for_code', 'urgency', 'impersonation']) assert.ok(call.includes(s), s);
  assert.ok(readSigns('بعتلك 800 جنيه بالغلط، ممكن ترجعهم على الرقم ده', ['ar']).includes('money_request'));
  assert.ok(!readSigns('كود التحقق 482915. لا تشارك هذا الكود مع أي شخص، البنك لن يطلبه منك أبداً', ['ar']).includes('asks_for_code'));
  assert.ok(!readSigns('ماما أنا وصلت الشغل، هعدي عليكي بالليل', ['ar']).length, 'a family message has no signs');
});
test('1.29.0: Thai: phrases match without spaces, signs survive tone-mark folding', async () => {
  const { readSigns } = await import('../../packages/matcher/signs.js');
  const entry = { id: 'th/x', country: 'th', lang: 'th', phrases: { th: ['การไฟฟ้าโทรมาบอกจะคืนเงินประกันมิเตอร์'] } };
  const r = matchMessage('ติดต่อจากการไฟฟ้า จะเปลี่ยนให้ฟรีและคืนเงินประกันมิเตอร์ 2,500 บาท', [entry], { country: 'th' });
  assert.equal(r.matches[0]?.id, 'th/x', 'a long shared stretch matches though Thai has no word spaces');
  const sms = readSigns('[KBank] แอปพลิเคชันของท่านหมดอายุ กรุณาอัปเดตภายใน 24 ชั่วโมง มิฉะนั้นบัญชีจะถูกระงับ [ลิงก์]', ['th']);
  for (const s of ['urgency', 'unknown_link']) assert.ok(sms.includes(s), s);
  assert.ok(!readSigns('รหัส OTP ของคุณคือ 482913 ห้ามบอกรหัสนี้แก่ผู้อื่น', ['th']).includes('asks_for_code'));
  assert.ok(!readSigns('ด่วน ลิงก์', ['es', 'en']).includes('urgency'), 'Thai rules only where Thai is spoken');
});
test('1.30.0: Korean: stems match across particles, two-syllable words count, Korean signs', async () => {
  const { readSigns } = await import('../../packages/matcher/signs.js');
  const entry = { id: 'kr/x', country: 'kr', lang: 'ko', phrases: { ko: ['검사라며 계좌가 범죄에 쓰였다고 함'] } };
  const r = matchMessage('본인 명의 계좌를 범죄에 악용했다고 검사가 전화했어요', [entry], { country: 'kr' });
  assert.equal(r.matches[0]?.id, 'kr/x', '계좌가 / 계좌를 and 범죄에 match by stem');
  const call = readSigns('수사관입니다. 조용한 곳으로 혼자 이동해 주세요. 가족분께도 말씀하시면 안 됩니다', ['ko']);
  for (const s of ['impersonation', 'keep_on_line', 'secrecy']) assert.ok(call.includes(s), s);
  assert.ok(!readSigns('인증번호 [482913]를 입력해 주세요. 타인에게 절대 알려주지 마세요.', ['ko']).includes('asks_for_code'));
  assert.ok(!readSigns('링크 즉시', ['es', 'en']).includes('urgency'), 'Korean rules only where Korean is spoken');
});
test('1.31.0: Japanese: dense-script phrase matching and Japanese signs', async () => {
  const { readSigns } = await import('../../packages/matcher/signs.js');
  const entry = { id: 'jp/x', country: 'jp', lang: 'ja', phrases: { ja: ['医療費の還付金があるとATMに行かされた'] } };
  const r = matchMessage('○○市役所の保険年金課です。医療費の還付金がございます。', [entry], { country: 'jp' });
  assert.equal(r.matches[0]?.id, 'jp/x', 'a 6+ character shared stretch (医療費の還付金が) matches though Japanese has no spaces');
  const tax = readSigns('【国税庁】未払いの税金があります。本日中にお支払いがない場合、財産の差押えを行います。お支払いはこちら[リンク]', ['ja']);
  for (const s of ['urgency', 'money_request', 'unknown_link']) assert.ok(tax.includes(s), s);
  assert.ok(!readSigns('認証番号は482913です。このコードを他人に教えないでください。', ['ja']).includes('asks_for_code'));
  assert.ok(!readSigns('至急 リンク', ['es', 'en']).includes('urgency'), 'Japanese rules only where Japanese is spoken');
});
test('1.32.0: Chinese (Taiwan) rules, only where Chinese is spoken', async () => {
  const { readSigns } = await import('../../packages/matcher/signs.js');
  const fine = readSigns('【監理服務網】您有一筆交通違規罰鍰逾期未繳，請於今日內完成線上繳納：[連結]', ['zh']);
  for (const s of ['urgency', 'money_request', 'unknown_link', 'impersonation']) assert.ok(fine.includes(s), s);
  assert.ok(readSigns('媽，是我啦，猜猜我是誰？我手機掉了，這是新的號碼', ['zh']).includes('new_number'));
  assert.ok(!readSigns('您的簡訊驗證碼為582917。請勿將驗證碼告知他人，本行人員不會向您索取。', ['zh']).includes('asks_for_code'));
  assert.ok(!readSigns('台電：電費尚未繳納，請儘速繳費，如已繳費請忽略。', ['zh']).includes('money_request'), 'a genuine bill reminder is not a money request');
  assert.ok(!readSigns('今日內 連結', ['es', 'en']).includes('urgency'), 'Chinese rules only where Chinese is spoken');
});
