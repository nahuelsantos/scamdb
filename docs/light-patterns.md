# Light patterns

Internal: these are not published on the site or in the API. They exist to cut false positives.

The scam catalogue describes the **dark patterns** of scams. Light patterns are the opposite: the shapes of genuine
messages that use a scam's words for an honest reason. A bank promo says "download our app", an insurer says "if you
forgot your password, ask for a new one", and a card offer says "get back part of the money you spend". Read word by
word, these look like a remote-access app, a code request or a money request, so the keyword check used to call them
scams.

They live in `packages/matcher/signs.js` (`LIGHT_PATTERNS`). Each one has an id, the one warning sign it calms, a plain
description, and the check.

## The rules

1. **A light pattern calms one sign. It never marks a message as safe.** The other signs stay. "Download our app" calms
   remote access, but a code request in the same message still counts.
2. **It calms the sign only when nothing else in the message carries it.** The matched words are removed and the sign
   is read again on what is left. "Download our app and install AnyDesk" keeps remote access.
3. **It describes what genuine messages do, never who sends them.** A brand name alone never calms anything: scammers
   copy brands.
4. **It must not weaken a single scam** on the real, written or private sets. The test
   `tests/unit/light-patterns.test.mjs` checks this on every run.
5. **Every pattern has written examples it must calm, and counter-examples it must not.** A counter-example is a scam
   that uses the same words, and the tests check both. Examples are written by scamdb: the owner's reports never reach
   the repo.

## Measuring

```bash
node tools/light-patterns.mjs
```

For each pattern, the tool counts the genuine messages it helps (their verdict is lower with the pattern than without)
and the scams it weakens. A pattern earns its place by helping genuine messages and weakening no scam.

- `--private`: add the encrypted private set (needs `EVAL_PRIVATE_KEY`).
- `--file <reports.json>`: add a local, never-committed list of the owner's labelled reports
  (`[{ "text", "country", "label": "scam" | "safe" }]`).

## Adding one, from a false positive

1. **Find the cause.** A genuine report is called "scam" or flagged. Find which sign misread it with
   `readSignsWithEvidence` and see the evidence words.
2. **Choose the fix.** If an existing pattern almost covers it, widen that one. Otherwise add a pattern: one sign, a
   matching regex, and the remainder check.
3. **Add examples.** Put written examples and counter-examples in the test.
4. **Measure.** Run `node tools/light-patterns.mjs --private --file <reports>` and the before/after on every set. Ship
   only if no scam is weakened.

## The patterns

| pattern | calms | what it recognises |
|---|---|---|
| `code_warning` | asks_for_code | A genuine code text warns you not to share the code ("no lo compartas", "we will never ask"). |
| `login_with` | asks_for_code | Where to log in with your own password ("ingresá con tu clave fiscal"), not a request to hand it over. |
| `code_delivery` | asks_for_code | A text that only delivers a code ("Your verification code is 730968"). |
| `code_requested` | asks_for_code | The code you asked for, delivered ("El PIN solicitado es", "introduzca la clave 708098 para"). |
| `own_app` | remote_access | A company inviting you to its own app ("Descargá nuestra app") is a promotion, not a stranger's remote-access app. |
| `own_app_feature` | money_request | In an own-app promo, what the app lets you do ("pagá los servicios") is a feature, not a request for money. |
| `own_app_invite` | urgency | In an own-app promo, "empezá hoy mismo" is an invitation, not pressure. |
| `official_store` | remote_access | "Descargá la app en Google Play o App Store": an official store, not a stranger's app. |
| `document_download` | remote_access | "Descargá tu factura", "download your statement": a document, not an app. |
| `own_password` | asks_for_code | Getting a new password for your own account ("si no recuerda su contraseña, pida una nueva"), not handing one over. |
| `renewal_date` | urgency | A renewal date ("el próximo 16 de diciembre vence su seguro"), like a bill's due date, is not pressure. |
| `cashback` | money_request | Cashback on purchases ("recuperá parte del dinero de tus compras"), not a request for money. Not "recupere su dinero" alone (the recovery scam). |
| `due_date` | urgency | A bill's fixed or long due date ("vence el 25", "vencen en 180 días") is not pressure. |
| `public_alert` | urgency | A public-safety alert (evacuate, shelter in place) is urgent by nature, unless it asks for money, a code or an app. |
| `agreed_session` | remote_access | A remote session the person arranged themselves ("como acordamos"). |
| `no_link` | unknown_link | The message says it has no link ("este SMS no contiene enlaces"). |
| `nothing_to_pay` | money_request | The message says there is nothing to pay ("no tenés nada que pagar", "already paid"). |
| `never_ask_bank_details` | money_request | "We will never ask for your bank details": a warning, not a request. |
| `back_of_card` | money_request | A bank alert that sends you to the number on the back of your card, with no link. |

Related, but working differently: a forwarded **warning about** a scam is never itself called a scam (`isWarningAbout`
in `signs.js`). It caps the verdict instead of calming a sign.
