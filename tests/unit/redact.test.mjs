import { test } from 'node:test';
import assert from 'node:assert/strict';
import { redact } from '../../lib/redact.js';

const r = (s) => redact(s).text;

test('links become [link] and their domain is kept for the private indicators', () => {
  const out = redact('Pay the fee at https://auspost-redelivery.top/pay?id=9 or www.correos-envio.com today');
  assert.equal(out.text, 'Pay the fee at [link] or [link] today');
  assert.deepEqual(out.found.domains.sort(), ['auspost-redelivery.top', 'correos-envio.com']);
  assert.equal(r('entrá a mercadopago-seguro.com.ar/login ya'), 'entrá a [link] ya');
});
test('phone numbers in many formats become [number]; digits are kept for hashing', () => {
  const out = redact('Llamá al +54 9 11 4567-8901 o al (011) 4567-8901. WhatsApp 0412 345 678. Ligue (11) 98765-4321');
  assert.equal(out.text, 'Llamá al [number] o al [number]. WhatsApp [number]. Ligue [number]');
  assert.ok(out.found.phones.includes('5491145678901'));
});
test('amounts, dates, times and short numbers are left alone', () => {
  for (const s of ['Total R$ 1.247,90 no cartão', 'Son $35.000 del campamento', 'Due 31/01/2027 at 10:30', 'el 2026-11-18', 'order 4821 shipped', 'a $1,480 payment']) assert.equal(r(s), s, s);
});
test('cards (Luhn), CBU/CLABE, IBAN and CPF become [card] / [account]', () => {
  assert.equal(r('card 4111 1111 1111 1111 exp 12/29'), 'card [card] exp 12/29');
  assert.equal(r('CBU 0110599520000001234567'), 'CBU [account]');
  assert.equal(r('CLABE 012180001234567897'), 'CLABE [account]');
  assert.equal(r('IBAN ES91 2100 0418 4502 0005 1332'), 'IBAN [account]');
  assert.equal(r('meu CPF 123.456.789-09'), 'meu CPF [account]');
});
test('emails and one-time codes are removed', () => {
  assert.equal(r('write to ana.lopez@gmail.com'), 'write to [email]');
  assert.equal(r('Your verification code is 482913'), 'Your verification code is [code]');
  assert.equal(r('el código es 1234'), 'el código es [code]');
});
test('a name after a greeting becomes [name]; family words and generic greetings stay', () => {
  assert.equal(r('Hola Laura, tu paquete llega mañana'), 'Hola [name], tu paquete llega mañana');
  assert.equal(r('Hi Mum, new number'), 'Hi Mum, new number');
  assert.equal(r('Oi mãe, troquei de número'), 'Oi mãe, troquei de número');
  assert.equal(r('Dear Customer, your account'), 'Dear Customer, your account');
  assert.equal(r('Dear John, your account'), 'Dear [name], your account');
});
test('the scam wording survives, so the matcher still recognises it', async () => {
  const { matchMessage } = await import('../../packages/matcher/index.js');
  const { loadRepo } = await import('../../lib/load.js');
  const repo = loadRepo(new URL('../..', import.meta.url).pathname);
  const raw = 'Hola Laura! Te va a llegar un código de WhatsApp por error, me lo pasás? Escribime al +54 9 11 4567-8901';
  const before = matchMessage(raw, repo.entries, { country: 'ar' });
  const after = matchMessage(r(raw), repo.entries, { country: 'ar' });
  assert.equal(after.verdict, before.verdict);
  assert.equal(after.matches[0]?.id, before.matches[0]?.id);
});

test('a link split after "https://" (as screenshots are often read) is still replaced, with its domain kept', () => {
  const r = redact('La Agencia Tributaria ha emitido una comunicación. https://\nsede.agenciatributariacz.help/es');
  assert.ok(!r.text.includes('agenciatributariacz'), r.text);
  assert.match(r.text, /\[link\]$/);
  assert.deepEqual(r.found.domains, ['sede.agenciatributariacz.help']);
});
test('bare domains with endings scams use (.help, .cfd, .sbs…) are replaced; ordinary dotted text is not', () => {
  assert.equal(redact('entre en correos-envio.cfd hoy').text, 'entre en [link] hoy');
  assert.equal(redact('soporte en banco-ayuda.help').text, 'soporte en [link]');
  assert.equal(redact('Gracias, S.A. y e.g. versión 1.2').text, 'Gracias, S.A. y e.g. versión 1.2');
});
test('a code written first ("010613 is your verification code") is replaced; other numbers before "is your" are not', () => {
  assert.equal(redact('010613 is your verification code for Cobee by Pluxee.').text, '[code] is your verification code for Cobee by Pluxee.');
  assert.equal(redact('123456 es tu código de acceso').text, '[code] es tu código de acceso');
  assert.equal(redact('Llame al 2025 es su año').text, 'Llame al 2025 es su año');
});
test('a number with a 00 dialling prefix is a phone number, not a card', () => {
  const r = redact('Atencion al Cliente desde numeros DIGI: 0034919120120.');
  assert.equal(r.text, 'Atencion al Cliente desde numeros DIGI: [number].');
  assert.deepEqual(r.found.phones, ['0034919120120']);
});
test('a second name or surname after a greeting goes too; the rest of the sentence stays', () => {
  assert.equal(redact('Hola, Ana ALEJANDRA, has rebut una notificació').text, 'Hola, [name], has rebut una notificació');
  assert.equal(redact('Hello John Smith how are you').text, 'Hello [name] how are you');
  assert.equal(redact('Hi Sarah, a reminder').text, 'Hi [name], a reminder');
});
test('in a message about a code, a code with words in between is replaced; amounts and order numbers elsewhere are not', () => {
  assert.equal(redact('The activation code requested for the APP is 236231 #236231').text, 'The activation code requested for the APP is [code] #[code]');
  assert.equal(redact("Never share this code. It's 293658").text, "Never share this code. It's [code]");
  assert.equal(redact('Pedido 12345 enviado').text, 'Pedido 12345 enviado');
});
test('a masked card with its first and last digits showing is replaced', () => {
  assert.equal(redact('con su tarjeta 487159******7099').text, 'con su tarjeta [card]');
});
