import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchMessage, readSigns, SIGNS } from '../../packages/matcher/index.js';
import { loadRepo } from '../../lib/load.js';

const entries = loadRepo(new URL('../../', import.meta.url).pathname).entries;
const m = (t, o) => matchMessage(t, entries, o);
const top = (t) => m(t).matches[0]?.id;

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
  for (const t of ['', '🙂🙂🙂', 'hola '.repeat(10000)]) {
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
