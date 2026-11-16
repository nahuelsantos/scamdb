# Progress log

A running record of what was built, what was measured and what we learned. Newest first.

## 2026-11-16: report attachments, redaction and the organisation feed (in progress)

Plan: `docs/superpowers/plans/2026-11-16-reports-feed.md`.

### PR 1: redaction and screenshot reports

**Built:**
- `lib/redact.js` replaces links, emails, cards (Luhn-checked), account numbers (CBU, CLABE, IBAN, CPF/CNPJ),
  one-time codes, phone numbers (8 to 15 digits) and names after a greeting with placeholders.
- `/v1/reports` stores only redacted `text` and `whatHappened`.
- With a key, a report can be a screenshot: Workers AI reads it, the text is redacted and stored, and the image is
  never kept.

**Findings:**
- **The matcher still works on redacted text.** Redacting all 450 labelled messages changed the matcher's verdict
  0 times and its top match 0 times. The scam's wording survives; only identifiers go.
- **On the labelled set,** redaction replaced 29 names after a greeting and 6 links. The messages already use
  `[link]` and `[number]`, so the real-world rate will be higher.
- **Names are the weak spot.** Only names right after a greeting ("Hola Laura") are caught. A name elsewhere in the
  text ("soy Lucía", a signature) stays. That's usually the scammer's alias, not the victim's, so I accepted it.
- **Family words aren't names:** "Hi Mum", "Oi mãe" and "Hola ma" stay as written, because they are part of the
  scam pattern.
- **Amounts, dates, times and order numbers aren't phone numbers,** and tests check that.

## 2026-11-16: earlier today (summary)

- **Labelled set:** 450 public messages (50 per country) plus 54 private ones (encrypted).
  `npm run eval` scores the engines. CI holds floors.
- **Matcher 1.2.0:** fewer false alarms from genuine one-time codes, payment confirmations, "never share" warnings,
  login instructions and "nothing to pay". On 450: 96.8% of scams caught, 7.1% of safe messages called "scam".
- **Score fusion:** a logistic regression joins the matcher and the Workers AI scorer into one probability (held
  out by country: safe flagged 68% → 17%). Weights are in `worker/fusion-weights.js`.
- **Faster AI checks:** the catalogue vectors are kept in D1, and answers are shorter (about 25% faster).
  qwen3-30b was 3× faster but missed 6 more scams, so gemma-4 stays.
- **Probe detection:** the 6th near-identical check in a day per key or IP gets 429. Only a SimHash fingerprint is
  kept, for 2 days.
  - Finding: without a key, detection is per IP, so rotating IPs evades it. That's acceptable: keyless checks only
    use the public keyword matcher, which anyone can run locally.
- **Playground:** signed-in users with a key get the AI score on the home page.
