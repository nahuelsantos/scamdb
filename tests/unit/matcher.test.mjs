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
