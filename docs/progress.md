# Progress log

A running record of what was built, what was measured and what we learned. Newest first.

## 2026-11-17: the normaliser speaks every European alphabet

Part A of the Europe plan, before Polish, Greek, Cyrillic and Turkish:
- **`foldChar` in `lib/text.js`** is now shared by `normalize` and the evidence map:
  - special letters are spelled out (ß→ss, ł→l, ø→o, æ→ae, œ→oe, đ/ð→d, þ→th, ı→i, final ς→σ);
  - letters of every alphabet are kept;
  - the `$`, `€` and `£` signs are kept.
- **No change for existing languages:** every number on the 450 labelled messages stayed identical.
- **€ and £ now count as money signs,** like `$` already did. UK scams called "scam" rose from 25% to 57%, and
  all scams called "scam" from 42.5% to 46% (floor raised). Safe messages called "scam" stayed at 7.1%.

## 2026-11-17: scams known abroad, in any language ("seen elsewhere")

**Owner's request:** a scam documented in one country and language must still be recognised when it arrives in
another language elsewhere. For example, a US scam received in Spanish in Argentina.

**Built:**
- **New answer field:** `/v1/isitascam` answers carry `seenElsewhere`: scams from other countries that fit clearly
  better than anything local. `whatToDo` and `reportTo` stay those of the caller's country. The report country is
  now the caller's when one is given.
- **Matcher:** with `elsewhere: true`, it also scores other countries' entries using **`phrasesTranslated`**.
  These are machine-translated search phrases (es/en/pt, 272 lists, from `tools/translate-phrases.mjs` via Workers
  AI), kept apart from the human-written `phrases` and never shown.
- **AI scorer:** it keeps strong cross-country embedding matches (bge-m3 is multilingual) instead of filtering them
  out by country.
- **Test set:** `eval/crosslingual.json` has 90 labelled scam messages, translated by hand into another language
  and checked against another country. `node tools/eval.mjs --cross` scores it.

**Findings:**
- **Before:** a Spanish version of a US-only scam got the right verdict from the warning signs, but matched
  unrelated Argentine entries. Only 4 of 90 cross-language messages found their scam.
- **Translated phrases alone:** 21 of 90 found, but 34 of 198 safe messages then showed an unrelated foreign scam.
  Mixing translations into normal matching also broke local matching (a Spanish text with no country matched UK
  entries), which is why they live in their own field.
- **Keyword matching can't separate signal from noise across languages.** At settings with little noise (8 of 198
  safe), it finds only 7 of 90. The strict setting is kept for free checks. **Meaning-based matching (the AI
  embeddings, keyed checks) is the right tool.** It's measured on the same set after the Workers AI allowance
  resets.
- **Workers AI daily limit:** generating 540 translations used the account's free allocation for 17 Nov ("used up
  your daily free allocation of 10,000 neurons"). **The account is on the Free plan, so nothing is billed.** On a
  day the limit is hit, keyed checks fall back to the keyword matcher. **Rule from now on:** big AI jobs run right
  after the UTC reset, one per day.

## 2026-11-17: Europe and worldwide discovery research; real screenshots

**Research:**
- `docs/research/europe-sources-2026-11-16.md`: every European country's official warning sources, where to
  report, feeds and licences, plus a rollout in 9 waves.
- `docs/research/discovery-sources-2026-11-16.md`: free sources for spotting new scams worldwide and their terms.
- Plan: `docs/superpowers/plans/2026-11-16-europe-and-discovery.md`.

**Findings:**
- **The matcher's normaliser drops Greek and Cyrillic entirely**, plus ß, ł, ø and €. It must be fixed before wave
  4 (Polish) and wave 5 (Greek, Cyrillic, Turkish).
- **Few European sources are openly licensed:** Cybermalveillance (Etalab), NCSC.nl (CC0), UK NCSC (OGL),
  CSIRT.CZ (CC BY-SA). We cite and write our own text everywhere.
- **For worldwide discovery, GDELT** (free, global, 65 languages, commercial use allowed with credit) **plus
  official agency RSS feeds are the clean backbone.**
  - **Reddit's terms cover even its RSS feeds**, and robots.txt says `Disallow: /`, so no automated Reddit
    ingestion.
  - **YouTube's API forbids "gaining insights" from aggregated data.** Telegram bans scraping. OpenPhish is
    personal use only.
- **Workers Free can't run the fetcher** (10 ms CPU per cron run), so the discovery pipeline runs in GitHub
  Actions.

**Real screenshots from the owner (3):**
- **Two show a fake dollar sale** ("tengo 5.000 dólares para vender… necesito los pesos por transferencia") from a
  hijacked WhatsApp. Argentina had no entry for it: before, the checker only said "suspicious" and matched unrelated
  scams. New entry `ar/venta-de-dolares` drafted, with 2026 sources; now the top match (score 14).
- **One shows a fake daughter with a new number** ("Hola pa soy …, agendame este número alternativo, se me cayó el
  cel"). Argentina had no "Hi Mum" entry, and the keyword rules missed "agendame" and "número alternativo". New entry
  `ar/hijo-numero-nuevo` drafted (score 15.5), and the `new_number` rule now knows the Argentine phrasing.
- **All three messages were added, redacted, to the encrypted private test set** (now 57 messages). No phone number,
  name or image is stored anywhere.

## 2026-11-16 (night): open data, feeds, corrections

From the competitor review (`docs/research/competitors-2026-11-16.md`), approved by the owner:
- **Homepage message:** "Scam patterns, not people… in the language it arrives in". That's the gap no competitor
  fills.
- **Downloads:** the existing `/v1/scamdb.zip` and JSON, plus **`/v1/scams.csv`** (one row per scam, with a UTF-8
  BOM so spreadsheets read accents right) and **`/v1/changes.atom`** (new and updated scams for feed readers,
  linked from every page's `<head>`).
- **Docs:** a "Download and reuse" section with the licence and the credit line "Source: scamdb.dev (CC BY 4.0)".
- **Corrections channel:** a GitHub issue form (`.github/ISSUE_TEMPLATE/correction.yml`) for anyone, including
  brands and agencies named in an entry, plus a "Request a correction" link on every catalogue page.
- **Public trends:** `GET /v1/trends?country=` needs no key and is cached for an hour. It gives 12 weeks of
  scam counts only: no examples, no brands, and counts under **5** withheld (stricter than the feed's 3). The
  `/trends/` page (in the nav) shows the top 10 per country, with an honest empty state while there are no
  reports.

## 2026-11-16 (evening): reporting on scamdb.dev, competitor research

**Built:**
- **`/report/` on scamdb.dev:** a short form, no longer a redirect to eschamuyo. It's in the main nav.
  - Required: country and the message (or a screenshot, or "what happened"). Optional: channel, what happened,
    contact.
  - Signed in with a key, there's no anti-bot check and a screenshot can be attached. Signed out, a Cloudflare
    Turnstile check runs. That page has its own CSP allowing `challenges.cloudflare.com`.
  - Personal data is redacted before storage, as before.
- **"Report this message"** after a check on the home page. The message is handed over in `sessionStorage`, never
  in the URL.
- **"Did you get one like this? Report it"** on every catalogue entry, with the country preselected.
- **Worker:** `/v1/reports` accepts the signed-in session from our own pages (`X-Requested-With: scamdb`, like
  `/v1/isitascam`).

**Update:** the owner created a separate Turnstile widget for scamdb.dev (site key `0x4AAAAAAGEPmIAcW1_PP5dE`). The
Worker checks tokens from the scamdb.dev form (`source: "scamdb.dev"`) with the new secret `TURNSTILE_SECRET_SITE`.
eschamuyo's form keeps `TURNSTILE_SECRET`.

**Findings:**
- **Turnstile site key (superseded by the update above):** the form first reused eschamuyo's widget. The owner must add `scamdb.dev` and `www.scamdb.dev`
  to its hostnames in the Cloudflare dashboard (Turnstile → widget → Hostnames). Until then, anonymous reports
  from scamdb.dev fail the check; signed-in reports work.
- **Competitors** (`docs/research/competitors-2026-11-16.md`):
  - All five reviewed sites are lookups of people and entities, English-only, and none catalogues patterns by
    country.
  - None of their data can be imported without permission. GACS claims CC BY 4.0, but its terms conflict, so we'd
    have to ask first.
  - Ideas worth taking: an open-data download, a public trends view, keyless feeds and RSS, an appeals channel.

## 2026-11-16: report attachments, redaction and the organisation feed

Plan: `docs/superpowers/plans/2026-11-16-reports-feed.md`.

### PR 3: the organisation feed

**Built:**
- `GET /v1/feed/trends?country=&weeks=`: weekly report counts per catalogue scam and per channel, plus rising
  scams (at least 3 and at least twice the previous 4 weeks' average).
- `GET /v1/feed/brands?brand=&country=&weeks=`: weekly counts of reports naming the brand, the scams that use it,
  and up to 5 redacted example texts.
- **Safety rules:**
  - Counts under 3 are withheld (`kMin` in the answer).
  - Examples come only from scams with 3 or more look-alike reports.
  - `contact` and `whatHappened` are never read.
  - Rejected reports are left out.
- **Access:** approved keys only (`keys.feed`). The owner approves with `node tools/orgs.mjs approve <login>
  "<Organisation>"`. 500 feed calls per key per day.
- **Public page** `/feed/`: what the feed contains, what it never contains, how to get access, and the terms. The
  docs link to it.
- Migration 0006, applied to production and UAT.

**Findings:**
- **Production has 0 reports today.** The feed works and is tested, but it will return empty weeks until reports
  arrive. Getting reports flowing comes first: eschamuyo's form, the API, screenshot reports.
- **Tagging only covers new reports.** `scam_id` and `brands` are filled from now on. Older reports (none yet)
  would need a backfill.
- **Withholding small counts matters.** With only a few reports per week, most cells will be withheld at first.
  That's intended: early on, the feed is honest about having little data.

**Next:**
- Get reports flowing.
- Talk to 2 or 3 possible users (a CERT, a consumer agency, a bank's fraud team) before adding the indicator list
  or paid tiers.
- Have someone qualified review the privacy policy and terms before charging anyone.

### PR 2: private indicators and tagging

**Built:**
- Each report stores its top catalogue match (`scam_id`, from the matcher on the redacted text) and the brands it
  names (`brands`).
- Brands come from a curated `data/brands.json`: 77 brands and agencies across the 9 countries, also published as
  `/v1/brands.json`.
- **Private indicators** (`report_indicators`) hold link domains and phone numbers as an HMAC-SHA256 with
  `IP_SALT`. The same number always gives the same value, so repeats can be counted, but the number can't be read
  back.
- At most 10 of each per report. They're deleted together with the report by the daily clean-up (180 days).

**Findings:**
- **150 of the 450 labelled messages (33%) name a listed brand.** Most named: WhatsApp, Interac, Mercado Pago,
  ATO, Correios, Bizum, BBVA, IRD and Zelle. That's enough for brand alerts to mean something.
- **Short brand names collide with ordinary words.** "SAT" (Mexico) and "ATO" are matched as whole words only, and
  only for their country. The tests check that "satellite" doesn't count as SAT, and that HMRC isn't counted in
  Australia.
- **Phone hashes depend on `IP_SALT`.** Changing that secret means old and new hashes no longer match. Keep the
  salt stable.

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
