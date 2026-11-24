// Light patterns (docs/light-patterns.md): the shapes of genuine messages that use a scam's words for an honest reason.
// Every pattern has written examples it must calm and counter-examples it must not (a scam using the same words). All
// examples here are written by scamdb as illustrations; the owner's reports never reach this repo.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readSigns, lightPatternsIn, LIGHT_PATTERNS, SIGNS } from '../../packages/matcher/index.js';
import { loadRepo } from '../../lib/load.js';
import { loadMessages, loadRealMessages } from '../../lib/eval.js';
import { loadPrivateMessages } from '../../lib/private-eval.js';
import { measure } from '../../tools/light-patterns.mjs';

// id → { calmed: messages the pattern must calm, kept: messages that still carry the sign (the pattern must not excuse) }
const EXAMPLES = {
  code_warning: { calmed: ['Tu código de verificación es 482913. No lo compartas con nadie.'],
    kept: ['Tu código es 482913, no lo compartas con nadie salvo conmigo: pasámelo por acá'] },
  login_with: { calmed: ['Ingresá con tu clave fiscal a la web de ARCA para ver tu declaración.'],
    kept: ['Hola, soy de soporte. Pasame la clave que te llegó por SMS'] },
  code_delivery: { calmed: ['Your verification code is 730968'],
    kept: ['Your verification code is 730968. Read me the code so I can confirm your account'] },
  code_requested: { calmed: ['El PIN solicitado es: JFC'],
    kept: ['Mandame el PIN que te llegó para terminar el trámite'] },
  own_app: { calmed: ['Descargá nuestra app y gestioná tus cuentas desde el celular'],
    kept: ['Descargá nuestra app AnyDesk así vemos tu pantalla'] },
  own_app_feature: { calmed: ['Descargá nuestra app y pagá tus servicios sin moverte de tu casa'],
    kept: ['Descargá nuestra app y pagá la multa de tránsito por transferencia'] },
  own_app_invite: { calmed: ['Descargá nuestra app y empezá hoy mismo'],
    kept: ['Descargá nuestra app y actualizá tus datos dentro de las 24 horas o se bloquea tu cuenta'] },
  official_store: { calmed: ['Descarga la app en Google Play o App Store y consulta tus movimientos'],
    kept: ['Instale AnyDesk para que podamos ayudarle'] },
  document_download: { calmed: ['Ya podés descargar tu factura de noviembre desde Mi Cuenta', 'Al finalizar podrá descargar su tarjeta virtual y su certificado'],
    kept: ['Descargue la aplicación de soporte remoto para que veamos su pantalla'] },
  due_date: { calmed: ['Tu factura vence el 25. Podés pagarla en la app o en cualquier sucursal.'],
    kept: ['Su factura vence el 25 y su cuenta será suspendida de inmediato'] },
  public_alert: { calmed: ['Alerta de emergencia: evacuen inmediatamente la zona costera.'],
    kept: ['Alerta de emergencia: evacuen inmediatamente y pague la tasa de traslado en este enlace'] },
  agreed_session: { calmed: ['Kako smo se dogovorili, instalirajte AnyDesk u 10 sati.'],
    kept: ['Instalá AnyDesk ya para que revisemos tu cuenta del banco'] },
  no_link: { calmed: ['Este SMS no contiene enlaces. Para consultar su envío llame al número de su contrato.'],
    kept: ['Consulte su envío en este enlace: [link]'] },
  nothing_to_pay: { calmed: ['Tu pedido ya está pago, no tenés nada que pagar al recibirlo.'],
    kept: ['Your item has been paid for by the buyer. To release the funds, confirm your card details: [link]'] },
  never_ask_bank_details: { calmed: ['Nunca le pediremos los datos de su tarjeta por SMS.'],
    kept: ['Nunca le pediremos los datos de su tarjeta, pero para cobrar el reintegro transfiera el depósito a esta cuenta'] },
  back_of_card: { calmed: ['Alerta de seguridad: se registró un consumo de Q1,240 en tu tarjeta. Si no lo reconocés, llamá al número al reverso de tu tarjeta.'],
    kept: ['Se registró un consumo en tu tarjeta. Si no lo reconocés, llamá al número al reverso de tu tarjeta o pagá la anulación en [link]'] },
  own_password: { calmed: ['Si no recuerda su contraseña, pida una nueva en el sistema y se la enviaremos por correo.'],
    kept: ['Si no recuerda su contraseña, dígame el código que le llegó por SMS y se la cambio'] },
  renewal_date: { calmed: ['El próximo 16 de diciembre vence su seguro anual. Puede renovarlo en nuestra web.'],
    kept: ['El próximo 16 de diciembre vence su seguro: renuévelo hoy o perderá la cobertura de inmediato'] },
  cashback: { calmed: ['Con la tarjeta Oro recuperás parte del dinero de tus compras en comercios adheridos.'],
    kept: ['Recupere el dinero que perdió con su inversión: transfiera la comisión a esta cuenta'] },
};

test('every light pattern is documented, names a real sign and has examples and counter-examples', () => {
  const ids = LIGHT_PATTERNS.map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length, 'ids are unique');
  for (const p of LIGHT_PATTERNS) {
    assert.ok(p.about?.length > 20, `${p.id}: about`);
    assert.ok(p.calms in SIGNS, `${p.id}: calms ${p.calms}`);
    assert.ok(EXAMPLES[p.id]?.calmed.length && EXAMPLES[p.id]?.kept.length, `${p.id}: needs examples here`);
  }
  assert.deepEqual(Object.keys(EXAMPLES).sort(), [...ids].sort(), 'no examples for a pattern that no longer exists');
});

for (const p of LIGHT_PATTERNS) {
  test(`${p.id}: calms ${p.calms} in its examples, not in its counter-examples`, () => {
    for (const t of EXAMPLES[p.id].calmed) {
      assert.ok(lightPatternsIn(t).includes(p.id), `should apply: ${t}`);
      assert.ok(!readSigns(t).includes(p.calms), `${p.calms} should be calmed: ${t}`);
    }
    for (const t of EXAMPLES[p.id].kept) assert.ok(readSigns(t).includes(p.calms), `${p.calms} should stay: ${t}`);
  });
}

test('no light pattern weakens a scam in the real, written or private sets', () => {
  const root = new URL('../../', import.meta.url).pathname;
  const entries = loadRepo(root).entries;
  const sets = { real: loadRealMessages(root), written: loadMessages(root), private: loadPrivateMessages(root) ?? [] };
  for (const [name, msgs] of Object.entries(sets)) {
    for (const r of measure(msgs, entries)) assert.deepEqual(r.weakened.map((m) => m.id ?? m.text.slice(0, 60)), [], `${r.id} weakens a scam in ${name}`);
  }
});
