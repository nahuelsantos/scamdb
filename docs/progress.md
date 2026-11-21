# Progress log

A running record of what was built, what was measured and what we learned. Newest first.

## 2026-11-21: Faster cold start for checks

- After the AI moved off the waiting path, a check still took 1.3–2.7 s whenever Cloudflare started a fresh Worker
  (frequent with little traffic); a warm one answers in ~0.3 s from outside. The cold cost is the matcher building its
  word index over all 1,199 entries: 550–680 ms, 200 ms of it folding the same characters again and again.
- `foldChar` now remembers each character's result (pure, so no result changes: the real-set eval is identical).
  First check: ~370 ms instead of ~550–680 ms in Node; the eval runs in 0.6 s instead of 1.0 s. The home page's
  in-browser check gets the same gain.
- A prebuilt index was measured and rejected: 4 MB of JSON that takes ~200 ms to load.

## 2026-11-21: Checks with a key answer at once; the AI score follows

- A signed-in check took ~9 s: it waited for Workers AI (embedding + a 26B chat model, 8 s timeout). Now the answer
  comes back at once with the catalogue check and `ai: { status: "pending", id, poll }`; the AI runs after the
  response (`ctx.waitUntil`) and its answer is ready at `GET /v1/isitascam/{id}` for the same key, for 10 minutes
  (kept in the Cache API, never in the database). `wait: true` keeps the single, slower call. The home page shows
  the first answer at once (~60 ms in a mocked test) and updates it when the AI score arrives.

## 2026-11-21: Per-minute limits for keys; the API limits documented

- On top of the daily limits, a key now gets at most 10 checks, 20 reports and 60 feed requests a minute (429
  `too_fast` with Retry-After). Keyless senders need none: their daily limit (10) is already smaller.
- The docs page lists every Worker endpoint's limits in a table, what 429 and 503 mean, and how to ask for more
  (an issue on GitHub). A test keeps the table in step with the numbers in the Worker.
- Payments: not now (no API users yet). If someone needs more, limits can be raised by hand.

## 2026-11-21: New fusion weights, fitted on real messages

- Refit on the 343 real messages (plus the 197 written ones), with the saved Workers AI answers; `hard` and `signs`
  now weigh 0, and the `scam` cut-off is 0.85 (was 0.70). Report: `eval/report-fusion-refit-2026-11-21.md`.
- Real set: genuine called "scam" 13.3% (14/105) → 1.0% in-sample, 1.9% cross-validated, 2.9% one country held out.
  Scams flagged 95.0% → 95.8%. Scams called "scam" 83.6% → about 55%: the rest show as "suspicious", still flagged.
  The owner chose this trade-off (fewer false alarms first).
- Written set: genuine called "scam" stays 0/90; scams called "scam" 93.5% → 72.0%. Private set: genuine called
  "scam" stays 0/27.

## 2026-11-21: Collector sends retry; Reddit off again

- The first full home run read every source (Phishing-Radar 5 of 5, Safeonweb and INCIBE answered) but sending to
  scamdb failed with a network error after ~3 minutes of reading. Sending now retries 3 times on a fresh connection
  and logs the network cause.
- Reddit answered 404 to r/arnaques and to every search feed, then 429: it no longer serves feeds to readers without
  an account. All Reddit sources are off until there is a Reddit app (OAuth).

## 2026-11-21: Page readers for Phishing-Radar and INCIBE; On/Off switches on the review page

- Phishing-Radar (Verbraucherzentrale, DE) and INCIBE's citizen alerts (ES) have no feed, so the collector now reads
  their pages (`lib/readers.js`, tested on saved copies). Phishing-Radar: each dated warning with a link to the
  screenshot of the real message. INCIBE: the alerts list (its alert pages answered "not found" from outside Spain).
  Text stays in the original language. Both look back 30 days, so the first run brings their recent items.
- The Sources tab is ordered by country (A to Z), switched-on first, and each source has an On/Off switch (behind
  Access and the GitHub check). Switches live in a new table (migration `0010`) and the collector applies them before
  each run; the registry stays the default. Sources with nothing to read, and lists of firms, cannot be switched on.

## 2026-11-21: Reddit back on: r/arnaques and five searches

- r/arnaques is on again (the owner confirmed it exists), plus Reddit searches for "estafas", "estafa sms",
  "arnaque sms", "golpe whatsapp" and "scam text": new posts from every community, often a pasted message and "is this
  a scam?". Reddit refuses cloud servers, so the first home run (Runs tab) is the check. Every item waits for the
  owner's review; the author's name is dropped.

## 2026-11-21: Review page: Sources and Runs tabs, behind Cloudflare Access

- The review page now has three tabs: Queue (as before), Sources (every source in the registry, on or off and why,
  with its last result and a Failing filter) and Runs (the last 14 runs, per source). No need to read plunder's log.
- The collector reports each run to `POST /v1/collect/run`; summaries live in a new table (migration `0009`), 60 days.
- `/review/*` and `/v1/review/*` are behind Cloudflare Access (owner only), on top of the GitHub check.

## 2026-11-21: 47 more sources checked; five message feeds switched on

- The owner's research list (47 sources, 101 scams, 18 Nov 2026) is saved as `data/sources.csv` and
  `data/scams.csv`, and every source is now in `sources/registry.json` with what it is good for (`use`).
- Switched on (confirmed feeds that describe scam messages): Commissariato di P.S. (IT), Fraudehelpdesk alerts (NL),
  Scamwatch (AU), FBI IC3 announcements (US); Safeonweb (BE) from home, to confirm on the first run.
- Most others are regulator blacklists of firms (kept off: they name firms, not messages) or have no feed. The best
  two, Verbraucherzentrale's Phishing-Radar (DE) and INCIBE alerts (ES), need a page reader.
- The collector filters Italian, Dutch, German and Portuguese items too.

## 2026-11-21: Sources registry, home-lab collector and a review page

- `sources/registry.json` lists trustworthy places that publish real scam messages, French first: r/arnaques,
  Cybermalveillance.gouv.fr (alerts and news), franceinfo Vrai ou Fake, Le Monde Les Décodeurs and ameli.fr. Signal
  Arnaques is listed but off (no feed; its terms need reading first).
- `tools/collect.mjs` reads them daily from the home lab (plunder), because Reddit and Cybermalveillance refuse cloud
  servers, and sends scam-related items to a private review queue (new D1 table `source_items`).
- `/review/` lets the owner mark each item useful or skip on the phone, after signing in with GitHub. The queue is
  separate from reports, the API and training. See `docs/sources.md`.

## 2026-11-21: Matcher 1.39.0: an amount is a weak sign

- A bare price or sum ("30€", "$74.167", "R$ 86") is no longer "asks for money". It is a new weak sign, `amount`: it
  can make a message suspicious, but never "scam" by itself. Asking for money (pay, transfer, a fee) is unchanged.
- A long expiry ("vencen en 180 días", "vence en 3 meses") is a date, not pressure; "vence en 24 horas" still is.
- "pay the $25 … fee" (words between) is still a money request.
- Real set: genuine called "scam" 8 → 3 of 105, scams caught unchanged (92.4%); 6 scams move from "scam" to
  "suspicious". Labelled set: genuine called "scam" 11 → 9. Private set: 3 → 2. Owner's genuine messages: 7 → 3
  (the three left are "Descarga nuestra App Supervielle y empezá hoy mismo").

## 2026-11-21: Faster reports: one field, everything else optional

- "Report this message" now sits under the check result and carries the message to the report form.
- The form shows only the message (or a screenshot) and Send. Country, channel, outcome, story and email are under
  "Add details (optional)".
- Country: guessed from the browser language ("fr-FR" → France) and shown next to "Add details"; if none is chosen,
  the server uses the country the request comes from (Cloudflare), or `xx` when we don't cover it. `xx` reports stay
  out of the private test set, which is per country.

## 2026-11-19: The AI on all real messages, including the six new countries

- All 343 real messages now have saved Workers AI answers (128 scored today, within the free allowance).
- Matcher + AI on the real set: 95% of scams caught, 83.6% called "scam"; but 16 of 105 genuine messages called
  "scam" (matcher alone: 8). Almost all are genuine bank, card and delivery alerts that look like scams.
- New countries (id, ae, th, kr, jp, tw): the AI lifts "called scam" from 1–5 per country to 6–11; it adds two genuine
  false alarms in Indonesia and one in Japan, and loses two Indonesian scams. Details in `eval/report-ai-fusion.md`.
- Next: refit the fusion on real messages only, held out by country, with the false-alarm target the owner sets.

## 2026-11-18: The owner's first real reports (Spain)

- **Four scams the owner received**, sent through the report form: a fake Correos "2/2 delivery attempts", a fake
  Agencia Tributaria notice, a card "limited for security, call [number]", and a missing-house-number parcel text.
  All four matched the right catalogue scam.
- **Redactor fix:** a link the screenshot reader split after `https://` (and bare domains ending in .help, .cfd,
  .sbs and similar) was not replaced. The stored Agencia Tributaria report was corrected, with its domain kept as a
  private indicator.
- **Matcher 1.36.0 (Spanish):**
  - "…o su artículo será devuelto" (a return threat) and "ha sido limitada temporalmente" count as pressure;
  - the Agencia Tributaria, AEAT, Guardia Civil, Policía Nacional, Seguridad Social and DGT count as impersonation.
  - The Correos text is now "scam" (pressure plus a link); the bank and tax texts stay "suspicious".
  - The real and labelled sets are unchanged: no genuine message newly flagged.
- **Report form:** screenshots are shrunk in the browser before upload; a server failure now says so.
- **22 genuine messages from the owner** (Spain, Italy, New Zealand): Sanitas appointments, DIGI renewals and tips,
  Google, Amazon, Ticketmaster and KuCoin codes, an ASB device alert, a Prime fee notice. Two were called "scam" by
  the matcher, and matcher 1.37.0 fixes both without changing any test-set number:
  - "descarga la app en Google Play o App Store" is not remote access (an official store); a stranger's app still is;
  - "el PIN / la clave solicitada es…" delivers a code; "pásamelo / dictámelo" after it is still a handover request.
- **More genuine messages: 60 in all** (Spain, Argentina, Italy, the UK, New Zealand, Australia, the US): DIGI,
  Sanitas, Cobee, Apple, Google, Amazon, PECUNIA, Ticketmaster, Tuenti, BBVA, San Cristóbal, Jira alerts and more.
  - Matcher 1.38.0 fixes three more false alarms: a code written first ("010613 is your verification code"), a code to
    type in ("Introduzca la clave … para validar su compra", 3-D Secure), and a shop discount ("-4€ … 50% en vales
    dto"). A code stays a delivery after redaction ("Your verification code is [code]").
  - Redactor: codes written first or with words in between, Italian "codice", masked cards (487159******7099), a
    second name after a greeting, numbers with a 00 dialling prefix (not cards), and short link endings (mov.is).
  - Real, labelled and private sets unchanged.
  - Downloading a document ("descarga tu factura") is not remote access.
  - **On the owner's own messages** (80 genuine, 4 scams): genuine called "scam" went from 25 to 7 (main 1.36.0 →
    1.38.0), with the 4 scams detected exactly as before. The 7 left: 4 offers with a price, and 3 bank texts
    "Descarga nuestra App Supervielle y empeza hoy mismo" (a scammer can write the same sentence; the AI step judges).
  - Open question for the owner: a bare price (30€, $74.167) still counts as a money request, so a genuine offer
    with a price and a link reads "scam" (3 of the owner's genuine messages). Not counting prices at all: on the real
    set 5 fewer genuine called "scam" (8 → 3 of 105), but 3 scams no longer flagged and 6 fewer called "scam".

## 2026-11-18: A faster matcher; how detection works, and a review of the weights

- **Matcher 1.35.0, same answers, about 12 times faster.** A check against the whole catalogue (1,199 scams) took
  about 95 ms in Node, and the API's check (the country plus every other country) about 116 ms. That is over
  Cloudflare's 10 ms of CPU per request on the free plan, and slow on cheap phones. Two indexes fix it:
  - a word index over the catalogue's phrases, per language list, so only the lists that share a word (or a
    one-typo word) with the message are scored;
  - the message's words looked up by their one-letter deletions, so the typo check no longer compares every phrase
    word with every message word.
  Now about 5 ms for the whole catalogue and 9 ms for the API's check. Every answer is identical to 1.34.0 on every
  labelled, real, private and catalogue example message (checked old against new). A new test keeps a check under 15 ms.
  - Why not Rust or Go: the same matcher runs in the browser (nothing is sent), on Workers and in the Node build.
    JavaScript is the one language native to all three, and the slowness was the algorithm, not the language.
- **`docs/detection.md`**: the whole pipeline (matcher, Workers AI, fusion, floors), what each weight means, and how
  accuracy is measured. The docs page now has a short "How the verdict is made".
- **Review of the fusion weights.**
  - They were fitted on 197 messages we wrote, which are easier than real ones.
  - On the 215 real messages with AI answers they still hold up (AUC 0.92; 7 of 43 genuine called "scam").
  - No refit was clearly better, and the AI score alone ranks as well as the fusion. The fusion's value is caution.
  - With 43 genuine messages, one message is 2.3 points of the false-alarm rate, so the next step is scoring all 343
    real messages and fitting on real ones only. The plan is in `docs/detection.md`.

## 2026-11-18: Site polish and the retention decision

- **Hero:** the eyebrow is "1199 scams · open data". The phone asks for a key (also shown in "never share it"), with
  no avatar or home-button circles.
- **Playground:** "Report this message" sits under the message box.
- **Catalogue:** one hand-drawn icon per kind of scam, read from the English name (`kindOf` in
  `site/templates/icons.js`), with new parcel, official and family drawings. Filters by country and channel are kept
  in the URL.
  - Known limit: a few names land on an odd kind (the Czech "Bank iD" text shows the government icon).
- **Trends:** out of the menu until there is data (`SHOW_TRENDS`).
- **Report form:** roomier select chevrons and a drag-and-drop zone for screenshots.
- **Retention (owner decision):** after 180 days a report loses its contact details, the reporter's story, the link
  to their key and the extracted indicators. The redacted text, country, channel, outcome and matched pattern are
  kept as labelled data. Copies in the private test set no longer expire. The privacy copy is updated.

## 2026-11-18: The AI on real messages; reports in the private set

- **16 more real genuine messages (vision point 4).** Japan (municipal tax and insurance SMS), South Korea (exam-day
  alerts), Taiwan (111 government short-code texts rated real by Cofacts), Thailand, the UAE, Indonesia (an ETLE fine
  confirmation) and Canada (Desjardins fraud-alert samples, names replaced by `[name]`). Genuine messages: 89 → 105;
  called "scam": 8/105 (7.6%). The one new false alarm is Desjardins's real debit-card fraud alert, the same known
  limit as the Australian bank templates scammers copy. Left out: a possibly paraphrased Taiwanese alert, a partial UAE
  quote, a loudspeaker (not phone) alert, and a Thai alert whose date reads as a phone number.

- **Automated research (vision point 6).** A weekly scheduled task ("scamdb weekly research", Tuesdays) replaces the
  paused weekly import. For up to 3 existing countries (oldest real messages, or fewest genuine ones) it finds new real
  messages quoted from reliable sources, scams and genuine alike, links scams to their entry or leaves them unmatched
  for the unknown-pattern queue, refreshes entries listed in the freshness issue, checks the real-set numbers and opens
  one `Research:` PR. It never adds a country and never invents messages.

- **Free detection that learns (vision point 5).** The scamdb.dev check already hands a message to the private report
  form inside the browser; the form and `POST /v1/reports` now take `outcome` (scam, genuine, unsure): what the
  message turned out to be. Stored privately (migration `0007_report_outcome.sql`), deleted after 180 days like every
  report. Before the owner reviews a report, its outcome labels the private-set copy (`genuine` → safe, `scam` →
  scam; `unsure` is not used), so checked genuine messages, the data accuracy needs most, flow into measurement.
  Owner step: `npx wrangler d1 migrations apply scamdb --remote` (and `scamdb-uat`). Until then reports are stored
  without their outcome; nothing breaks.

- **Unknown scams go to a human (vision point 3).** `tools/unmatched.mjs` lists the real, documented scams that follow
  no known pattern (real messages with `scam: null`, 38 today) and groups similar ones as candidate new patterns
  (first run: expiring reward points in Argentina and Mexico, and in Australia and Canada; fake DMV final notices in
  the US). The weekly check keeps one issue labelled `unknown-pattern` and comments when new ones appear, so the owner
  is notified. `/v1/isitascam` answers `pattern: "unknown"` when a message reads as a scam but follows no known
  pattern (here or abroad), `"known"` when it does, `null` when it is not recognised.

- **Real examples first, written ones flagged (vision points 1–2).** All 1,321 examples in the data files were
  written by us; each is now marked `"synthetic": true`, and the validator rejects a written example without it. At
  build time the 238 real scam messages in `eval/real` are joined to their entries (121 entries) ahead of the written
  ones, each with its source (`lib/real-examples.js`). The site labels them "Real message · publisher, date" and
  "Written example (illustration)"; the API carries `source` or `synthetic`. English-only copy: the eschamuyo footer
  and "examples are invented" wording are gone, and quoted real messages are stated as not covered by CC BY.

- **Vision and clean-up.** `docs/vision.md` records the owner-confirmed vision: patterns built from real, documented
  scams; English for the site, API and docs; written examples flagged; accuracy measured on real messages; unknown
  scams notified to a human; free detection that improves with use. Contradictions removed: the weekly import and the
  Spanish/English translation scheduled tasks are paused; the import skill runs only on the owner's request and stops
  without 8 real messages; README, CONTRIBUTING, the PR template, the eval README and the two old specs now point to
  the vision.

- **Removed: Egypt, Vietnam, Malaysia, Saudi Arabia and Pakistan.** These five were imported without the owner
  asking, and each has only 2–4 real scam texts, too few to measure them. They go with their contacts, brands, test
  messages and the Malay, Vietnamese and Urdu rule blocks (Matcher 1.34.0); every remaining country's numbers are
  unchanged. Indonesia, the UAE, Thailand, South Korea, Japan and Taiwan stay (8–15 real scam texts each). Rule from
  now on: a country is added only on the owner's request and only where real scam messages can be found online.

- **Pakistan:** 15 entries (4 Urdu, 11 English, Roman Urdu in examples and phrases), 6 contacts (police 15, NCCIA
  1799, PTA, Banking Mohtasib, BISP, your bank), 24 brands, 22 labelled and 5 real messages (most Pakistani news
  paraphrases scam texts). Matcher 1.33.0 adds an Urdu block covering Urdu script and Roman Urdu ("code aaya hoga,
  bata dein", "aaj raat block ho jayega", "bank ki helpline se", "شناختی کارڈ نمبر ... واٹس ایپ کریں", "lucky draw")
  with "کسی کو کوڈ ... نہ دیں" as a genuine sign. Pakistan: 17% → 83% of labelled scams called "scam", 0 false
  alarms; every other country and the private set unchanged.

- **Taiwan:** 19 entries in Traditional Chinese, 6 contacts (165 anti-fraud line, police 110, FSC 1998, consumer
  1950, NHIA, your bank), 27 brands, 22 labelled and 13 real messages (two subject-line quotes left out). Matcher
  1.32.0 adds a Chinese block with Simplified variants (fake traffic fines and Taipower cut-offs, "今日內", "停卡",
  cancel-instalment "ATM解除設定", "新的號碼", "穩賺", fake officials) and "請勿將驗證碼告知他人" as a genuine-code
  sign; a genuine Taipower reminder ("請儘速繳費") is not a money request. Taiwan: 0% → 75% of labelled scams called
  "scam", 0 false alarms; real 7 → 12 of 13 caught, 5 called "scam"; every other country and the private set unchanged.

- **Japan:** 20 entries in Japanese, 7 contacts (police 110 and #9110, consumer hotline 188, FSA, NPA cyber reporting,
  Anti-Phishing Council), 30 brands, 22 labelled and 15 real messages (NPA, MPD, JC3 and Anti-Phishing Council
  published texts and scripts). Kana and kanji carry more per character, so their shared-stretch thresholds are
  lower (4 and 6 instead of 6 and 10); Matcher 1.31.0 adds a Japanese block (fake police and "LINE video call",
  "press 1" recorded voices, ATM refunds, "本日中", "差押え", "暗証番号をメモ") with "このコードを他人に教えないで"
  as a genuine-code sign. Japan: 58% → 100% of labelled scams caught, 50% called "scam", 0 false alarms; real 5 → 13
  of 15 caught; every other country and the private set unchanged.

- **South Korea:** 18 entries in Korean, 7 contacts (police 112, the 1394 voice-phishing line, ECRM, FSS 1332, KISA
  118, Korea Consumer Agency 1372), 29 brands, 22 labelled and 13 real messages (KISA, police and FSS published
  texts and scripts). Three engine changes: `normalize()` keeps Hangul, kana and CJK whole (NFD had split Hangul
  into jamo and dropped kana voicing marks); Korean catalogue phrases are compared by word stem (particles such as
  가/를/에 attach to words, and two-syllable words like 계좌 were dropped as too short); and Matcher 1.30.0 adds a
  Korean block (fake prosecutors, "go somewhere quiet alone", "don't tell your family", security-app installs,
  "temporary phone, add me on KakaoTalk") with "타인에게 절대 알려주지 마세요" as a genuine-code sign. Korea: 33% →
  100% of labelled scams caught (right entry first for all), 58% called "scam", 0 false alarms; real 1 → 13 of 13
  caught; every other country and the private set unchanged.

- **Thailand:** 18 entries in Thai, 7 contacts (police 191, AOC 1441, thaipoliceonline, Bank of Thailand 1213, NBTC
  1200, OCPB 1166), 22 brands, 22 labelled and 8 real messages. Two engine changes, both needed for any script
  written without spaces between words: catalogue phrases in Thai, Lao, Khmer, Burmese, Chinese or Japanese now
  match as substrings, scored by the longest stretch they share with the message (they never matched before:
  phrase matching needed spaces around a phrase); and Matcher 1.29.0 adds a Thai block whose patterns are folded the
  way `normalize()` folds Thai (tone marks stripped). Thailand: 0% → 100% of labelled scams caught and 83% called
  "scam", 1 → 0 false alarms; real 0 → 7 of 8 caught; every other country and the private set unchanged.

- **Vietnam:** 17 entries in Vietnamese, 7 contacts (police 113, the C02 fraud line, VNeID reporting, NCSC, 5656
  spam, consumer 1800 6838), 25 brands, 22 labelled and 4 real messages. Matcher 1.28.0 adds a Vietnamese block
  (on diacritic-folded text: "đọc lại cho em" code requests, "cài ứng dụng", "cho anh mượn", "chuyển khoản trước",
  "đường dẫn", "điều tra viên", "làm việc qua video") and "tuyệt đối không cung cấp mã" as a genuine-code sign.
  Vietnam: 0% → 75% of labelled scams called "scam", 1 → 0 false alarms; real 0 → 2 of 4 called "scam"; every other
  country and the private set unchanged. Most Vietnamese warnings show messages as screenshots, so the real set is small.

- **Egypt:** 18 entries in Arabic (mostly Egyptian colloquial examples), 10 contacts (MOI cybercrime 108, police
  122, CBE, NTRA 155, Consumer Protection 19588, FRA, Social Solidarity, Labour, Egypt Post), 26 brands, 22 labelled
  and 10 real messages. Matcher 1.27.0 adds Egyptian wording to the Arabic block ("قولهولي", "الكود اللي هيوصلك",
  "النهارده", "هيتوقف", "على المحفظة", "ترجعهم", "بمقدم", "معاك خدمة عملاء البنك"). Egypt: 17% → 75% of labelled
  scams called "scam", 0 false alarms; every other country (UAE and Saudi Arabia included) and the real and private
  sets unchanged. The 4 real Egyptian scams ("your account is suspended, call us") stay "suspicious".

- **Saudi Arabia:** 17 entries (16 Arabic, 1 English), 7 contacts (Kollona Amn, CST 330330, SAMA Cares, Ministry
  of Commerce 1900, Musaned, SPL), 30 brands, 22 labelled and 9 real messages (2 scam texts, 7 official warning
  posts). Matcher 1.26.0 adds Saudi Arabic to the Arabic block (Nafath "اختر الرقم 47", "الرمز اللي بيوصلك",
  "الآيبان", "تم حظر بطاقة"). Saudi Arabia: 50% → 67% of labelled scams called "scam", 0 false alarms; every other
  country, including the UAE, and the real and private sets unchanged. The 2 real Saudi scams stay "suspicious".

- **The UAE:** 19 entries (10 Arabic, 9 English), 7 contacts (Dubai Police eCrime, Abu Dhabi Police Aman, MOI,
  TDRA, CBUAE Sanadak, Ministry of Economy), 31 brands, 22 labelled and 9 real messages. Matcher 1.25.0 adds an
  Arabic block ("[رابط]", "قوله لي" code requests, "سيتم إيقاف", "ادفع", "عربون") with "لا تشارك هذا الرمز" and
  "لا توجد أي رسوم" as genuine signs, and `normalize()` now folds Arabic hamza forms (أ إ آ → ا, ى → ي): NFD had
  split them into a letter plus a kept mark, so no pattern with hamza could match. UAE: 8% → 67% of labelled scams
  called "scam", 0 false alarms; every other country and the real and private sets unchanged. Real UAE scams are
  mostly link-only parcel texts (1 of 9 called "scam"), the known gap the AI step covers.

- **Malaysia:** 17 entries (16 Malay, 1 English), 7 contacts (NSRC 997, PDRM Semak Mule, BNMTELELINK, SC, MCMC,
  KPDN), 33 brands, 22 labelled and 3 real messages. Matcher 1.24.0 applies the Indonesian block to Malay too and
  adds Malay words ("[pautan]", "hantar balik kod", "jangan beritahu sesiapa", "yuran", "caj") and a "jangan kongsi
  TAC" genuine-code warning. Malaysia: 17% → 75% of labelled scams called "scam", 0 false alarms; every other country
  and the real and private sets unchanged. Six "genuine" real messages were sentence fragments from articles and two
  were headline titles, so they were left out.

- **Indonesia:** 16 entries in Indonesian, 9 contacts (Polri, Patroli Siber, IASC, OJK 157, Satgas PASTI, Komdigi
  number reports, cekrekening.id, BPKN), 22 labelled and 9 real messages. Matcher 1.23.0 adds an Indonesian block
  (APK files, "[tautan]" links, "mohon dibacakan" code requests, "2x24 jam", "video call sekarang") and a "jangan
  berikan kode ini" genuine-OTP warning. Indonesia: 8% → 92% of labelled scams called "scam", 1 → 0 false alarms;
  every other country, the real and private sets unchanged. Real Indonesian messages: 8 of 8 caught, only 1
  called "scam" (mostly social-media prize and fake-aid posts).

- **Matcher + AI on the 215 real messages:** 95.9% of scams caught (matcher alone: 91.9%), 84.9% called "scam" (32%),
  but 6 of 43 genuine messages called "scam" (3). All six are genuine bank, courier or agency notices that read like
  the scam. A refit on the real set, held out by country, called 11 genuine messages "scam", so it was rejected and
  the weights are unchanged (`eval/report-ai-fusion.md`). `tools/fit-fusion.mjs --real` fits on the real set.
- **Reports in the private set (#101):** reviewed reports can be added to the encrypted private set and are deleted
  after the same 180 days (`tools/private-eval.mjs import-reports`, `prune`, weekly workflow). Production has no
  reports yet.
- **40 more genuine real messages (#103):** 43 → 83, from banks' own SMS templates, official emergency alerts and
  fact-checks rating a message genuine. The false-alarm figure was optimistic: the matcher calls 9 of 83 genuine
  messages "scam" (10.8%), not 3 of 43 (7%).
- **Matcher 1.22.0 (#104):** public-safety alerts (evacuate, shelter in place, weather warnings) are urgent by
  nature, so urgency is dropped there unless the message also asks for money, a code or remote access. Real set:
  9 → 7 of 83 genuine called "scam"; scams and the other two sets unchanged.
- **Left to the AI:** genuine bank fraud-alert templates ("card restricted, reply yes or no"). Scammers copy them
  closely, so no keyword rule can separate a real one from a fake.
- **Next:** a second pass for genuine messages in Colombia, Argentina, Portugal and France (the first found almost none).

## 2026-11-17: Detection quality first: language scoping, real messages, freshness; the Philippines

**Built:**
- **Language scoping (#92):** each language block applies only for the check country's languages (read from its
  entries), so short words no longer fire across languages (German "TAN" in Spanish "tan"). Every test-set number
  unchanged or better.
- **Real-message set (#93, #95):** 178 messages quoted verbatim in official warnings, fact-checks and genuine
  notices (15 countries), each with its source: `node tools/eval.mjs --real`. Rules are judged on it, never fitted
  to it one message at a time.
- **Freshness (#94):** `tools/freshness.mjs` compares sources against today; a weekly "freshness" issue.
- **Matcher 1.18.0 (#96):** code deliveries, back-of-card bank alerts and official warning posts are not scams;
  penalty threats are urgency; refund bait asking for payment details is a money request.
- **The Philippines:** 16 entries (English and Taglish), 8 contacts, 22 labelled and 8 real messages; Matcher
  1.19.0 adds a Tagalog block and English call-script rules ("read the 6 digits", "don't end the call").
- **Nigeria:** 15 entries, 8 contacts, 22 labelled and 16 real messages (scams aimed at people in Nigeria only, not
  those run from it); Matcher 1.20.0 adds English threats and fees ("we will contact everyone in your phonebook",
  "pay ₦10,000 for your application form") and a genuine "do not disclose this code" OTP. Nigeria: 33% → 83% called
  "scam", 1 → 0 false alarms; other countries and the real and private sets unchanged.
- **India:** 15 entries (14 English, 1 Hindi), 5 contacts, 22 labelled and 13 real messages. `normalize()` now keeps
  Devanagari vowel signs (they were turned into spaces, splitting Hindi words). Matcher 1.21.0: APK downloads are remote
  access, fake officers on calls ("Sub-Inspector … from CBI Delhi", "remain on this video call", "press 9 to talk to
  the officer"), "within 24 hrs", "before midnight", and a Hindi block. India 8% → 75% called "scam", Nigeria 83% →
  92%, real UK messages 23% → 31%; no new false alarm anywhere.

**Measured:**

| | Real messages | Agent-written set | Private set |
|---|---|---|---|
| Scams caught | 87.4% → 90.9% | 99.3% | 93.3% |
| Scams called "scam" | 30.8% → 31.5% | 71.1% → 71.3% | 43.3% → 40% (one accidental hit removed) |
| Genuine called "scam" | 20% → 8.6% | 1.8% → 1.4% | 10.7% |

**Learned:**
- The agent-written set flatters the matcher: on real messages it calls 31% of scams "scam", not 71%, and
  genuine messages were wrongly called "scam" ten times as often. Measure on real text before trusting a number.
- Many "language" patterns were really language-neutral (IBAN, bank names, the Cyrillic "линк"), and some
  countries were only protected by another language's words. Scoping exposed both.
- Most real scams still missed are short link-phishing texts with no other sign; keyword rules can't separate them
  from genuine notices safely. That is the AI scorer's job.

## 2026-11-17: Central America wave 12 (Guatemala, El Salvador, Honduras, Nicaragua, Costa Rica, Panama, Belize)

**Built:**
- **Groundwork (#89):** seven countries in `countries.json` and reports (Belize: English, then Spanish); 34 brands
  (BAC Credomatic, Ficohsa, Banco Industrial, Banrural, Chivo, SINPE Móvil, OIJ, Banco General, Yappy, Belize Bank...).
- **Matcher 1.16.0 (#90):** more Latin American Spanish ("me los dicta", "me lo reenviás", "debe consignar", "se lo
  doy al siguiente", "retenido en aduana", quetzal and dollar amounts), more English from Belize ("activation
  fee", "forward it here"), and a context rule: a bill's fixed due date ("vence el 25") is not urgency on its own.
- **Import:** 94 entries, 38 contacts, 154 labelled messages. Panama's emergency number is 104 (police); 911 there
  is the medical-emergency system.

**Measured (eval, 1,726 messages):** 99.3% of scams caught, 71.1% called "scam", 1.8% of safe messages called
"scam" (was 2.3%). Each new country: 0/10 false alarms; 83–100% called "scam". The due-date rule also removed
old false alarms in Argentina and Spain.

**Learned:**
- Genuine bills are the most common false alarm in Spanish: "monto a pagar … vence el 25" looked like pressure
  plus a payment. Context rules beat removing the word "vence" everywhere.

## 2026-11-17: Latin America wave 11 (Chile, Colombia, Peru, Uruguay, Paraguay, Bolivia, Ecuador, Venezuela)

**Built:**
- **Import rules (#86):** every entry now needs local evidence (a local authority, bank, company or regulator, a
  local case, or a local outlet with specifics); agents re-read each source before validating.
- **Groundwork (#86):** eight countries in `countries.json` and reports; 50 brands (BancoEstado, ClaveÚnica, Nequi,
  DIAN, Yape, SUNAT, BROU, Tigo Money, Banco Pichincha, SRI, Banesco, Pago Móvil...).
- **Matcher 1.15.0 (#87):** a Latin American Spanish block ("el número que le acaba de llegar", "léamelo", "el
  mensaje para autorizar", "hay otra persona que ya me quiere hacer el depósito", "salió aprobado, sin garante",
  "girar"); genuine notices ("no te pediremos claves", "ingrese con su clave", "la clave del portón"). The
  Argentine matcher examples are scoped to Argentina.
- **Import:** 112 entries, 63 contacts, 176 labelled messages.

**Measured (eval, 1,572 messages):** 99.2% of scams caught, 68.8% called "scam", 2.3% of safe messages called
"scam" (was 2.5%). Each new country: 0/10 false alarms; 67–100% called "scam". Argentina and Mexico improved.

**Learned:**
- With the local-evidence rule, agents dropped "hola mamá, número nuevo" in six of eight countries, and "trabajo
  por likes" and fake-receipt scams in several: common worldwide, but no local source.
- Matcher tests that ran Argentine examples against every country broke as soon as Colombia arrived; tests of
  catalogue matches must be scoped to a country, as real checks are.

## 2026-11-17: Source re-check of single-source entries

**Done:** every entry resting on one source (273) plus five flagged multi-source entries were re-read page by
page: does the page describe this scam, and show it targets people in this country, on the cited date?
270 hold, 0 fail, 0 unverifiable, 6 generic (the scam is real but nothing ties it to the country).

**Removed (generic):** rs/oglas-lazni-kupac-link (Croatian police cases only), mk/mamo-new-number (general AI
voice-cloning article), tr/hello-mom-new-number (translated ESET explainer), gr/whatsapp-code-hijack (unnamed
experts only), it/falso-supporto-tecnico (translated Malwarebytes post pointing to the US FTC). Their four
labelled messages were replaced by new ones for existing entries.
**Kept (borderline):** pt/romance-scam: RTP, Portugal's public broadcaster, says the scam is among the most
lucrative in Portugal.
**Fixed:** me/lazni-smjestaj-booking keeps only its Raskrinkavanje source (it quotes the Montenegrin police);
ge/parcel-sms-link points to imedi.ge (the old domain redirects).

**Learned:**
- Research agents sometimes accept a local outlet's translated global explainer as a local source; the import
  prompt should ask for a local authority, company or case, not just a local outlet.

## 2026-11-17: Europe wave 10 (Russia, Belarus, Georgia, Armenia, Azerbaijan)

**Built:**
- **Groundwork (#82):** ru, by (Russian first, then Belarusian), ge, am and az in `countries.json` and reports;
  41 brands (Госуслуги, Сбербанк, Почта России, Белпочта, ЕРИП, Georgian Post, TBC, HayPost, Idram, Azərpoçt, ASAN...).
- **Matcher 1.14.0 (#83):** more Russian (protected accounts, investigators, loan fees, "dictate the code"), Armenian
  and Georgian (each in its script and in the Latin transliteration SMS use), Azerbaijani (ə or e); genuine
  notices in each language; a post office pickup code "из приложения" is not a code handover.
- **Import:** 72 entries (ru 16, by 15, am 13, ge 13, az 13), 19 contacts, 110 labelled messages.

**Measured (eval, 1,396 messages):** 99% of scams caught, 2.5% of safe messages called "scam" (was 2.8%).
Each new country: 0/10 false alarms; 67–100% of scams called "scam". No other country's numbers changed.

**Learned:**
- Georgian and Armenian SMS often come in Latin letters; rules and phrases need both spellings.
- A rule that says "never mind the warning, this is a handover" (CODE_HANDOVER) can override a genuine notice;
  exemptions belong in the handover rule itself.

## 2026-11-17: Europe wave 9 (Serbia, Bosnia and Herzegovina, Montenegro, North Macedonia, Albania, Kosovo)

**Built:**
- **Groundwork (#79):** rs, ba, me, mk, al and xk in `countries.json` and reports; 29 brands (Pošta Srbije,
  KupujemProdajem, OLX.ba, BH Pošta, Pošta CG, Стопанска банка, УЈП, Posta Shqiptare, e-Albania, Posta e Kosovës...).
- **Matcher 1.13.0 (#80):** a Serbo-Croatian block in Latin and Serbian Cyrillic, an Albanian block and a Macedonian
  block, all from the drafts' labelled messages; genuine warnings in each language; a remote session the person
  arranged is not remote access; "večeras" alone is not urgency; Finnish "varat" must be a whole word.
- **Import:** 79 entries (rs 16, mk 14, ba 14, al 12, me 12, xk 11), 28 contacts, 132 labelled messages.
  Emergency numbers: Bosnia 122 (no confirmed nationwide 112), Albania 129 (112 works only in Tirana).

**Measured (eval, 1,286 messages):** 98.9% of scams caught, 2.8% of safe messages called "scam" (was 3.1%).
Each new country: 0/10 false alarms; 83–100% of scams called "scam". No other country's numbers changed.

**Learned:**
- Short words still collide across languages: Finnish "varat" (funds) matched inside Bosnian "otvarati" (to open).
- Agents sharing a scratchpad must each keep their scripts in their own folder (one ran another's generator).
- Sources for smaller countries often reach us only through news reports; official sites block automated
  readers (gov.me, fup.gov.ba, nbrm.mk, bqk-kos.org).

## 2026-11-17: Europe wave 8 (Estonia, Latvia, Lithuania)

**Built:**
- **Groundwork (#76):** ee, lv and lt (each with Russian as a second language) in `countries.json`, reports, feed
  and trends; 21 brands (Smart-ID, Omniva, Swedbank, SEB, Luminor, EMTA, VID, VMI...).
- **Matcher 1.12.0 (#77):** Lithuanian, Estonian and Latvian rules from the drafts' labelled messages (Smart-ID PIN
  prompts during a call, "saugi sąskaita", "cik uzkrājumu"), Russian wording seen in the Baltics, and two fixes:
  the Finnish "maksu" no longer matches the Estonian tax board; "kohe"/"šodien" alone are not urgency.
- **Import:** 48 entries (16 each), 16 contacts, 66 labelled messages; all 112 source links load.

**Measured (eval, 1,154 messages):** 98.7% of scams caught, 3.1% of safe messages called "scam". Each Baltic
country: 0/10 false alarms; 75–100% of scams called "scam".

**Learned:**
- Short words collide across languages ("maksu" is payment in Finnish and tax in Estonian); test new rules
  against every country's safe messages, not only the new country's.

## 2026-11-17: Europe wave 7 (Czechia, Slovakia, Hungary, Slovenia, Croatia), speed fix

**Built:**
- **Speed (#71):** the matcher prepares each entry's phrases once (WeakMap; the Worker keeps the catalogue per
  isolate), pads the text once, and reuses the signs for the warning check. Huge input: 127 ms -> 28 ms per check;
  a typical message ~5 ms. CI's speed test had started failing as the catalogue grew to 565 entries.
- **Groundwork (#72):** cz, sk, hu, si and hr in `countries.json`, reports, feed and trends; 38 brands.
- **Matcher 1.10–1.11 (#73, #74):** a shared Slavic block (Slovenian, Slovak, Czech, Croatian) and Hungarian rules,
  all written from the drafts' labelled messages; card details count as money, not as a code request; paying the
  courier on delivery means nothing to pay.
- **Import:** 80 entries (hr 17, cz 16, sk 16, si 16, hu 15), 34 contacts, 110 labelled messages.

**Measured (eval, 1,088 messages):** 98.7% of scams caught, 3.3% of safe messages called "scam". Every wave-7
country has 0/10 false alarms; 83–100% of their scams are called "scam".

**Learned:**
- Watch for agents tuning phrases against their own eval messages: two Czech romance phrases echoed cz-12 and
  were replaced; cz-12 (a romance opener that asks for nothing yet) is now an honest miss.
- Never stash the drafts folder while agents are writing to it.

## 2026-11-17: Europe wave 6 (Sweden, Denmark, Norway, Finland, Iceland), rules from data

**Built:**
- **Groundwork (#69):** se, dk, no, fi and is in `countries.json`, reports, feed and trends; 36 brands.
- **Matcher 1.9.0 (#70):** Swedish, Danish, Norwegian, Finnish and Icelandic rules written *after* the labelled
  messages, from them: BankID/MitID approvals during a call, electronic-ID authentication, "lägg inte på",
  "nytt nummer", gift-card codes, and the genuine "lämna aldrig ut koden" / "älä koskaan kerro koodia".
- **Import:** 82 entries (se 17, no 17, fi 17, dk 16, is 15), 34 contacts, 110 labelled messages; all 196 source
  links load.

**Measured (eval, 978 messages):** 98.7% of scams caught, 3.7% of safe messages called "scam". The Nordic
countries call 75–92% of their scams "scam" with 0/10 false alarms each, the best wave so far.

**Learned:**
- Data first, rules second, works: the rules hit the wording real messages use ("legitimera dig i BankID-appen nu
  medan vi pratar") instead of guesses, and false alarms are caught before the PR.
- The 5-hour usage limit stopped all five agents at once; resuming them with SendMessage kept their progress.

## 2026-11-17: Europe wave 5 (Ukraine, Türkiye, Greece, Cyprus, Bulgaria) and matcher 1.8.x

**Built:**
- **Groundwork (#66):** ua, tr, gr, cy and bg in `countries.json`, reports, feed and trends; 45 brands; Ukrainian,
  Russian, Bulgarian, Greek and Turkish rules with genuine-code warnings and filler words.
- **Matcher 1.8.1 (#67):** rules tuned on the drafts' labelled messages (Ukrainian scam wording, "we never call",
  PIN set or shown in the app).
- **Import:** 80 entries (gr 17, ua 16, tr 16, bg 16, cy 15), 26 contacts, 110 labelled messages. Owner asked to
  keep merging when green while away; review points are listed in the PR.

**Measured (eval, 868 messages):** 98.5% of scams caught, 4.1% of safe messages called "scam". Each new country
catches 12 of 12 scams with no false "scam".

**Learned:**
- Without the `u` flag, `\b` and `\w` are ASCII-only: `\bкод` never matches. Non-Latin rules use spaces as
  boundaries. Patterns must be written in the normaliser's folded form (й → и), or they silently never match; a
  test now checks the stop list.
- Tuning rules on real labelled messages (data first) worked better than writing them ahead: Ukraine went from 17%
  to 33% of scams called "scam" with no new false alarms.

## 2026-11-17: Europe wave 4 (Italy, Poland, Romania, Moldova), forwarded warnings, matcher 1.7.x

**Built:**
- **Forwarded warnings (#63):** a message that warns about a scam (asks you to warn others, or describes what
  scammers do) and asks for nothing is never called "scam"; the API returns `warning: true` and names the scam.
  Found through a real chain message the owner received; it joins the private set.
- **Groundwork (#63):** it, pl, ro and md in `countries.json`, reports, feed and trends; 39 brands; Italian, Polish
  and Romanian rules in every sign with context rules and filler words.
- **Matcher 1.7.1 (#64):** "la poste" word boundary; bare payment nouns aren't requests; greetings aren't a new
  number; a BLIK is a payment; "the PIN is in the app" is genuine.
- **Import (for owner review):** 64 entries (it 17, pl 17, ro 16, md 14), 20 contacts, 88 labelled messages; and
  `ar/whatsapp-codigo` gains the fake Andreani call (iProfesional, Chequeado).

**Measured (eval, 758 messages):** 98.3% of scams caught, 4.7% of safe messages called "scam". Each new country
catches 12 of 12 scams with no false "scam".

**Learned:**
- Rules written per language before the data exists produce false alarms that only show up on real hard negatives
  (seven this wave). Drafting the labelled messages first, then the rules, would catch them earlier.
- Russian (Moldova, and wave 5) needs filler words and rules before Cyrillic countries go live.

## 2026-11-17: Europe wave 3 (Germany, Austria, Switzerland) and matcher 1.5.x

**Built:**
- **Groundwork (#60):** de, at and ch in `countries.json`, reports, feed and trends; 27 brands; German rules in
  every sign and German context rules; German filler words in STOP. Also: "this message contains no link"
  cancels the link sign.
- **Matcher 1.5.1 (#61):** "keine Zahlung erforderlich" (and nl/fr/en equivalents) means nothing to pay; "the
  PIN comes in a separate letter" is not a code request.
- **Import (for owner review):** 50 entries (de 17, at 17, ch 16), 19 contacts and 66 labelled messages,
  researched and drafted by one agent per country.

**Measured (eval, 670 messages):** 98.1% of scams caught, 5.4% of safe messages called "scam". Each new country
catches 12 of 12 scams with no false "scam".

**Learned:**
- German police press releases on presseportal.de are dated, open and plentiful; Polizei-Beratung objects to
  scraping, and fma.gv.at and watchlist-internet.at block automated reading.
- An agent tuning phrases against its own eval messages can overfit (copying the message's words into phrases).
  Reviewed and generalised for de-11; worth a check in every import.

## 2026-11-17: Europe wave 2 (France, Belgium, Luxembourg, Netherlands) and matcher 1.4.x

**Built:**
- **Groundwork (#57):** fr, be, lu and nl in `countries.json`, reports, feed and trends; 35 brands; French and
  Dutch rules in every sign, with "never share" / "nothing to pay" / log-in-yourself context rules.
- **Matcher 1.4.1 (#58):** "uw bank" / "votre banque" no longer count as impersonation; pt, fr and nl filler words
  in STOP (wrong matches 241 → 219).
- **Import (for owner review):** 65 entries (fr 17, nl 17, be 16, lu 15), 32 contacts and 88 labelled messages,
  researched and drafted by one agent per country.

**Measured (eval, 604 messages):** 97.9% of scams caught, 6.3% of safe messages called "scam"; each new country catches 12 of 12 scams; one false "scam" each in fr, lu and nl
(a genuine ameli refund, a CNS notice that says it has no link, a Tikkie between friends).

**Learned:**
- Many French and Belgian official sites (Cybermalveillance, ameli, police.be, Safeonweb) and big newspapers block
  automated reading or opt out of crawling, so entries lean on ICI (Radio France), VRT, RTBF, FSMA and the
  Luxembourg police, which publish dated warnings openly.
- Next matcher fix: "ne contient pas de lien" / "no link" should cancel the link sign.

## 2026-11-17: Europe wave 1 (Portugal, Ireland, Malta) and matcher 1.3.x

**Built:**
- **Groundwork (#54):** pt, ie and mt in `countries.json` and in reports, the feed and trends; 39 brands; European
  Portuguese signs (MB WAY, Multibanco, "mudei de número", "telemóvel avariou", "não partilhe").
- **Matcher 1.3.1 (#55):** "we will never ask for your bank details" no longer counts as a money request.
- **Import (for owner review):** 48 entries (pt 17, ie 16, mt 15), 23 contacts and 66 labelled messages, drafted
  by one agent per country from `docs/research/wave1-pt-ie-mt-2026-11-17.md`.

**Measured (eval, 516 messages):** 97.6% of scams caught, 6.1% of safe messages called "scam". Each new country
catches 12 of 12 scams; one false "scam" left in pt (a genuine MB WAY receipt that mentions the bank).

**Learned:**
- Many official sites (mfsa.mt, Banco de Portugal, rr.pt, gnr.pt) block automated reading, so several entries cite
  news reports of the official warning instead.
- The new entries still need `phrasesTranslated` (cross-language matching) once the Workers AI allowance resets.

## 2026-11-17: worldwide discovery pipeline (daily)

**Built:**
- **`tools/discover.mjs` and `lib/discover.js`** read only the sources allowed in `tools/discover/feeds.json`:
  - 16 official feeds: Scamwatch, IC3, CFPB, CFTC, NCSC, FCA, RCMP, the Competition Bureau, NZ Police, Europol,
    Cybermalveillance, Safeonweb, Fraudehelpdesk, CERT Polska, NCSC-FI, and BBC technology (filtered);
  - GDELT news metadata for 12 countries.
- **What it does:** keeps only links, dates and publishers, de-duplicates, classifies each item against the
  catalogue (matcher plus brands), and builds signals: official warnings, possibly-new clusters (3 or more
  publishers, grouped by word overlap) and per-entry counts.
- **`.github/workflows/discover.yml`:** runs daily at 05:23 UTC and keeps results as an artifact for 15 days (the repository default since 2026-11-21; the weekly issue is the lasting record). On Mondays
  (or by hand) it opens a "Scam signals <week>" issue, with links, counts and our own labels, never copied titles.
- **The import skill** now reads the latest signals issue first, as leads only. It still cites only sources it
  reads itself.
- **Tests:** feed parsing, URL clean-up, de-duplication, clustering, no copied titles, every source has terms,
  and the forbidden sources can't be added.

**Findings from the first run** (from this session, 30-day window):
- All 16 feeds were reachable.
- 7 official scam items, including Scamwatch's holiday-scam alert, two IC3 notices, a Europol investment-scam
  takedown and Cybermalveillance's "faux votes WhatsApp" bulletin. That's a scam our future French catalogue needs.
- Title-only classification is rough (the Europol takedown "looked like" a US election scam), so matches are hints.
- GDELT was unreachable through this session's proxy. It runs in GitHub Actions.

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
