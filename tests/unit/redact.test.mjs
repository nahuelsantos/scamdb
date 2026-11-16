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
