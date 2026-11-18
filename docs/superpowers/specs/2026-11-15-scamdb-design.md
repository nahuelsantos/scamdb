# scamdb — design

> **Superseded where it disagrees with [docs/vision.md](../../vision.md) (2026-11-18):** patterns built from real,
> documented scams; English for the site, API and docs; countries added only when the owner asks and real scam
> messages can be found; written examples flagged; no Spanish-first or eschamuyo-first focus.

Date: 2026-11-15 · Status: draft for owner review (builder check done) · Domains: scamdb.dev (primary), scamdb.io (redirect) · Repo: github.com/nahuelsantos/scamdb (public)

Homepage mockup (approved look): https://claude.ai/artifact/8Zprq3iVqrEf7zmVtiwPF3, the "★ Your pick" option.

Marked **[call]**: decisions Claude made that the owner has not explicitly confirmed. Everything else was decided in conversation with the owner.

## Intent

eschamuyo.com teaches Argentines, older adults above all, to recognise scams before they fall for them. Its 20 scams live in a JSON file inside that site. scamdb takes that catalogue out of the site and makes it **an open database of scam patterns, country by country, that anyone can read, contribute to and build on**. eschamuyo.com becomes its first consumer.

**Why it is worth building:** the existing services (gacs.app, scamsearch.io) are blacklists. They answer "is this phone number, link or wallet a known scammer?". Nobody answers well **"what is this, and what do I do?"**, and almost nobody does it in Spanish. Phone numbers and links change weekly; the script of a scam ("Le hablo de PAMI… le va a llegar un código") lasts for years. A pattern database is cheaper to keep accurate and fills a real gap.

**Who it is for, in order:**
1. eschamuyo.com.
2. Other Spanish-language sites and apps.
3. Later, companies (banks, telcos, fintechs). Not built for in v1, but nothing in v1 should block them.

**Success for v1:** eschamuyo.com reads its catalogue from scamdb. The 20 Argentine scams are live on scamdb.dev as open data with a public API. Someone outside can contribute a scam through a pull request and see it published after review. `/isitascam` answers text messages.

## Goals

- An open catalogue of scam **patterns**. Each entry has how it works, how it unfolds step by step, sample messages, the phrases people use to describe it, warning signs, what to do, sources, links to media, and who to report it to in that country.
- Data licensed **CC BY 4.0**, so anyone, companies included, can use it with credit. Code licensed **MIT**.
- Contributions through **public pull requests** on GitHub, validated automatically and reviewed by the owner before going live.
- **Private reports** from anyone, through a form on eschamuyo.com and an API endpoint. They feed new entries and examples.
- **`/isitascam`**: send a message (text first, then screenshot or voice note) and get a verdict, a score, the reasons, and the matching catalogue entry with what to do.
- A minimal, developer-facing site at scamdb.dev in the approved look.
- Costs near zero on Cloudflare's free tier.

## Non-goals (v1)

- **A blacklist** of phone numbers, links, wallets or accounts. We may link to existing ones (GACS is CC BY 4.0) later.
- **Payments.** Rate limits exist from day one, but charging (Stripe) comes later, once real per-check costs are known.
- **GraphQL.** REST only. Revisit if someone asks for it.
- **Hosting other people's media.** Videos, audio, articles and screenshots from elsewhere are linked with credit, never copied.
- **Countries other than Argentina.** The schema supports any country from day one; content beyond Argentina comes from contributors later.
- **Arbitrary queries** over the catalogue (search, complex filters). Only the pre-built files listed below.

## Anti-goals (failure even if it works)

- **Sending eschamuyo.com visitors' messages to a server.** eschamuyo promises "the text never leaves your phone"; it keeps matching in the browser.
- **Publishing private data.** Reports contain real names, numbers and screenshots and must never reach the public repo or API.
- **A maintenance burden the owner can't carry.** The owner has a few hours a week and reviews everything alone. Anything that needs daily attention, servers to babysit, or manual work per request is wrong.
- **A surprise bill.** Nothing a stranger can trigger should cost the owner money without a cap.
- **Real phone numbers or links in examples.** Examples are invented in scammers' style, links are written `[enlace]` (same rule as eschamuyo today).
- **Presenting the score as a real probability** before it has been checked against labelled data.

## Constraints

- **One maintainer** with a few hours a week. Claude drafts entries from reports; the owner approves, edits or rejects.
- **Cloudflare Free plan** (confirmed by the owner; no payment method). Going over a quota stops the service instead of billing, which is the safety net. Free tier: Workers (100,000 dynamic requests a day), static assets (free, unlimited), D1 (database), R2 if ever needed, Workers AI (free daily allowance), rate-limiting binding. If a bill ever appears, the fallback is the owner's home lab behind a cloudflared tunnel.
- **Domains** scamdb.dev and scamdb.io are already in the owner's Cloudflare account. .dev requires HTTPS, which Cloudflare provides.
- **Text is language-keyed** (`{"es": "…"}`), as in eschamuyo today, so English and other languages can be added without changing the structure.
- **No source, no scam.** Every entry has dated `https://` sources (eschamuyo's rule).

## Approaches considered

| | How | Trade-off |
|---|---|---|
| **A. Static data plus a small Worker (chosen)** | On every merge, CI builds the catalogue into JSON files served as static assets on scamdb.dev. A small Worker handles only what needs a server: `/isitascam`, reports, keys, limits. D1 stores reports and keys. | Catalogue reads are free, unlimited and fast, and can't run up a bill. Filtering is limited to pre-built files. |
| B. Full API on Cloudflare | Worker serves everything from D1 with search, filters and per-key limits on all endpoints. | More flexible, but every read counts against the free quota and there is more code to maintain. A later move from A to B is possible. |
| C. Home lab | Server plus database behind a cloudflared tunnel. | Full control and a free GPU, but uptime depends on the owner's house, and upkeep eats the few hours. Kept as the place to run voice/image models if Workers AI ever costs money. |

**Why A:** with CC BY data that anyone can download, charging for catalogue reads makes no sense. What people would pay for is `/isitascam` and the fresh reports feed, which are exactly the Worker's endpoints. So A puts rate limits and future billing only where there is value, and keeps everything else free and static.

## The data

### Repository layout [call]

```
data/
  signals.json                 shared vocabulary of warning signs (see below)
  countries.json               ISO code, name, languages, emergency number
  ar/
    contacts.json              who to report to in Argentina (new schema, see Contacts)
    scams/
      whatsapp-codigo.json     one file per scam
      cuento-del-tio.json
      …
schema/                        JSON Schema for every file above
packages/matcher/              the catalogue matcher (ported from eschamuyo), shared by the Worker and eschamuyo
worker/                        the Worker: dynamic endpoints
site/                          scamdb.dev pages (static)
tools/                         validate, build, link/contact checks
docs/
```

### An entry

The eschamuyo schema, with additions. The ID is `<country>/<slug>`, e.g. `ar/whatsapp-codigo`; the slug is the file name.

```jsonc
{
  "id": "ar/whatsapp-codigo",
  "country": "ar",
  "status": "active",                         // active | fading | archived
  "channels": ["phone", "whatsapp", "sms"],   // whatsapp, sms, phone, online, in-person, email, social
  "sender": { "es": "“PAMI”" },               // who the message claims to be
  "name": { "es": "Robo de WhatsApp con el código de 6 números" },
  "how": { "es": "3–4 short sentences." },
  "steps": [                                   // NEW: the script, step by step (powers the route drawing)
    { "text": { "es": "Te llaman diciendo que son de PAMI." }, "signal": "impersonation" },
    { "text": { "es": "Te llega un código de 6 números." }, "signal": "asks_for_code" },
    { "text": { "es": "Te apuran para que lo leas." }, "signal": "urgency" },
    { "text": { "es": "Te roban el WhatsApp y piden plata a tus contactos." } }
  ],
  "examples": [                                // was a single "example"; now a list
    { "text": { "es": "Buenas tardes, le hablo de PAMI… Es para hoy." }, "channel": "phone" }
  ],
  "phrases": { "es": ["me pidieron un código", "…"] },   // ≥ 5; power the matcher
  "signals": ["asks_for_code", "urgency", "impersonation"],  // NEW: from signals.json
  "redFlags": { "es": ["Te piden un código que te llegó por mensaje."] },
  "whatToDo": { "es": ["No leas el código a nadie."] },
  "story": { "es": "Optional real, anonymous case." },
  "media": [                                   // NEW: links only, never copies
    { "type": "video", "url": "https://…", "title": "…", "publisher": "TN", "date": "2026-03-02" }
  ],
  "sources": [
    { "title": "…", "publisher": "Chequeado", "url": "https://…", "date": "2025-06-02" }
  ],
  "reportTo": ["ar/ufeci", "ar/whatsapp-soporte"],  // NEW: contact IDs from contacts.json
  "related": ["ar/falso-anses-pami"],          // NEW, optional
  "firstSeen": "2023-01", "updated": "2026-11-13"
}
```

Fields that only make sense on eschamuyo stay in eschamuyo, as an overlay keyed by ID: `isNew`, list order, the day game (`day.json`) and El Chamuyero (`chamuyero.json`).

### Signals

`data/signals.json` is a small shared list of warning signs with stable machine names and language-keyed labels, for example `asks_for_code`, `urgency`, `impersonation`, `money_request`, `unknown_link`, `remote_access`, `secrecy`, `keep_on_line`, `new_number`, `too_good_to_be_true`. Entries reference them in `signals` and `steps`; `/isitascam` returns them in its reasons. The initial list comes from eschamuyo's `analyze.js` sign groups (code, rush, money, unknown) split into finer names.

### Contacts [call]

eschamuyo's `docs/contacts.json` is a link-check log, not a dataset; the real "who to call" content is hand-written in eschamuyo's `index.html`. scamdb gets a proper contacts file per country, built from that page's content:

```jsonc
{ "id": "ar/ufeci", "name": { "es": "UFECI (Ministerio Público Fiscal)" },
  "when": { "es": "Para denunciar estafas por internet o teléfono." },
  "ways": [ { "type": "email", "value": "denunciasufeci@mpf.gov.ar" }, { "type": "web", "value": "https://…" } ],
  "jurisdiction": "national",           // national | province code | city
  "hours": { "es": "…" },               // optional
  "source": "https://www.mpf.gob.ar/ufeci/", "checked": "2026-11-14" }
```

Entries point at contacts through `reportTo`. The weekly contact check (every value must still be printed on its `source` page; failures are flagged, not published) moves to scamdb. **In v1, eschamuyo keeps its hand-written contact cards**; switching them to the downloaded file is a later, separate change.

### Validation

`tools/validate` (ported from eschamuyo's `validate-data.mjs`, extended with the JSON Schemas) runs on every pull request and fails the build if:
- required fields are missing, or IDs don't match file names;
- a source has no date or no `https://` link;
- an example contains a real-looking URL or phone number instead of `[enlace]`;
- a signal doesn't exist in `signals.json`, or a `related` ID doesn't exist;
- there are fewer than 5 phrases, or a phrase shrinks to a common word.

The weekly link and contact checks from eschamuyo move here too, opening an issue when something breaks.

## Contributions

1. A contributor adds or edits a file under `data/<country>/scams/` and opens a pull request. `CONTRIBUTING.md` explains the schema, the rules and the license: by contributing, they agree their contribution is CC BY 4.0. [call: a plain statement in CONTRIBUTING and the PR template; no CLA]
2. CI validates. A red check means no merge.
3. The owner reviews and merges.
4. On merge to `main`, CI builds the static API and site and deploys the Worker. Live in minutes.

A new country needs its `countries.json` entry and a `contacts.json` before its first scam is accepted.

## Reports

- **Who sends them:** anyone, through a "Report a scam" form on eschamuyo.com (and later other sites) and `POST /v1/reports`.
- **What they contain:** the message text and/or a screenshot or voice note, the channel, the country, an optional free-text "what happened", and an optional contact email.
- **Where they go:** D1 (text and metadata), **never** the public repo. R2 needs a payment method even for its free tier, so **reports are text-only at first** [call]; attachments come if the owner adds a card later. They are retained for 180 days and then deleted unless promoted. [call: 180 days]
- **Abuse:** Cloudflare Turnstile on the form, per-IP limits on the endpoint, size caps on attachments.
- **How they become entries:** on demand, the owner opens a Claude Code session that reads new reports, clusters them, strips personal data, and opens draft pull requests: a new entry, or a new example on an existing one. The owner approves or rejects them like any contribution. [call: on demand, not a scheduled job, so there is no recurring AI cost; it can become a weekly scheduled task later]
- Reports also become the **labelled set** used to check `/isitascam` scores (below).

## The API

Base URL `https://scamdb.dev/v1/`. JSON, UTF-8, CORS open.

### Static (free, no key, no limit)

| Path | Content |
|---|---|
| `GET /v1/index.json` | Dataset version, build date, countries, counts, license |
| `GET /v1/countries.json` | Countries and their languages |
| `GET /v1/signals.json` | The warning-sign vocabulary |
| `GET /v1/{country}/scams.json` | Every entry for a country |
| `GET /v1/{country}/contacts.json` | Who to report to |
| `GET /v1/scams/{country}/{slug}.json` | One entry |
| `GET /v1/scams.json` | Every entry, all countries |
| `GET /v1/scamdb.zip` | The full dataset as a download |
| `GET /v1/changes.json` | Recent additions and edits, newest first (from git history) |

Every response carries the dataset version (the commit date and short SHA) in a header and in `index.json`, and the attribution text CC BY requires.

### Dynamic (Worker)

| Path | Key | Limit |
|---|---|---|
| `POST /v1/isitascam` | optional | without key: 10/day per IP, **matcher only, no paid service ever** [call]; with free key: 50/day |
| `POST /v1/reports` | optional | per-IP abuse limit only |
| `POST /v1/keys` | — | create a free key by signing in with GitHub [call] |

Free tier limits as agreed: catalogue unlimited (it is static); 50 `/isitascam` checks a day with a free key. Paid tiers come later with Stripe.

### `/isitascam`

**Request:** `{ "text": "…", "country": "ar", "lang": "es", "report": false }`, or multipart with `image` or `audio`. Max 5,000 characters of text, 5 MB image, 60 s audio. [call]

**Pipeline:**
1. **To text.** Images: OCR with a Workers AI vision model. Audio: speech-to-text with Workers AI (Whisper). Text passes through. Files are processed in memory and never stored, so no R2 is needed. The model call sits behind an interface so it can move to the home lab.
2. **Match the catalogue** with `packages/matcher`, the port of eschamuyo's `matcher.js` and `analyze.js`: phrase matching against entries, plus the warning-sign rules. This always runs, costs nothing, and is the fallback.
3. **Score** with a scorer behind one interface, so engines can be swapped and compared [call, owner asked for free or local options first]:
   - **v1 scorer: free, on Cloudflare.** Workers AI embeddings (a multilingual model) compare the message with every catalogue example and phrase, giving the closest entries and a similarity. A small open model on Workers AI, asked for a typed answer (verdict plus which signs, with evidence quotes), adds the explanation. Both run inside the Free plan's daily allowance; when it runs out, the scorer is skipped and the matcher answers alone.
   - **Home-lab runner:** the same interface can call an open model (via Ollama or similar) on the owner's own machine through a cloudflared tunnel, if the free allowance proves too small.
   - **Jev** (typesafe.ai) is **not used in v1**. Once at least 200 labelled messages exist, Jev, the Workers AI scorer and the home-lab model are compared on them, and the owner decides whether paying for Jev is worth it. If adopted, it gets a daily spend cap and only serves requests with a key.
   - Keyless requests (including the site playground) never reach a paid service.

**Verdict and score rules** [call]:
- The matcher alone gives the verdict from the sign rules and phrase matches (as eschamuyo's `analyze.js` does) and returns `"score": null`. No made-up number.
- With a scorer, `score` is its output and it may move the verdict between `scam`, `suspicious` and `not_recognised`, with one floor: if the hard rules fire (asks for a code, remote access, or money plus impersonation), the verdict is never lower than `suspicious`.
- `engine.scorer` says which path answered (`"matcher"`, `"workers-ai"`, `"homelab"`, later maybe `"jev"`). The playground shows the score only when there is one.
4. **Answer.**

**Response:**
```json
{
  "verdict": "scam",                       // scam | suspicious | not_recognised
  "score": 0.94,
  "signals": [{ "id": "asks_for_code", "label": "Asks you to read out a code", "evidence": "¿me lo lee?" }],
  "matches": [{ "id": "ar/whatsapp-codigo", "name": "Robo de WhatsApp con el código de 6 números", "url": "https://scamdb.dev/v1/scams/ar/whatsapp-codigo.json" }],
  "whatToDo": ["No leas el código a nadie."],
  "reportTo": "https://scamdb.dev/v1/ar/contacts.json",
  "engine": { "matcher": "1.0.0", "scorer": "jev" },
  "datasetVersion": "2026-11-15.a1b2c3d"
}
```

**Privacy:** nothing is stored unless `report: true`, in which case the input becomes a report. Processing stays on Cloudflare (or the owner's home lab); if a third-party scorer is ever adopted, the docs say so.

**The score:** documented as a score, not a probability, until it has been checked against at least 200 labelled messages from reports (scam and not scam) for a country. [call: 200] Until then the docs say so plainly.

## eschamuyo.com as a consumer

- When scamdb's `main` changes data for Argentina, a scamdb GitHub Action opens (or updates) a pull request on eschamuyo that replaces `site/data/scams.json` with the new data in eschamuyo's shape (scamdb entries plus eschamuyo's overlay). eschamuyo's own CI then validates and runs its browser tests on the exact data that will ship, and the owner merges it. eschamuyo stays static with no runtime calls. [call] This needs a fine-grained GitHub token with pull-request access to eschamuyo, stored as a scamdb secret (owner creates it once).
- It keeps matching pasted messages in the browser, now using `packages/matcher` (copied or vendored, since eschamuyo has no build step).
- Its own overlay (`isNew`, order, `day.json`, `chamuyero.json`) stays in eschamuyo and refers to scamdb IDs. eschamuyo keeps its short IDs and `#scam-<id>` links; the sync maps `ar/<slug>` to `<slug>`.
- The "Report a scam" form on eschamuyo posts to `/v1/reports`. That is the one place where text leaves the phone, and only when the visitor chooses to send a report; the form says so.
- Migration: the 20 entries in eschamuyo's `site/data/scams.json` become the first files in `data/ar/scams/`, with `country`, `signals` and `steps` added and `example` turned into `examples`. `steps` and `signals` are drafted by Claude from each entry's existing text and reviewed by the owner.

## scamdb.dev, the site

- **Look:** the approved mockup, "A field guide to scams". Space Grotesk for headings, IBM Plex Sans for text, IBM Plex Mono for code, Patrick Hand for handwritten notes. Sage paper, deep green ink, pink accent, lime highlighter (the "Herbarium" colours), with a dark version. Hand-drawn line illustrations (an SVG displacement filter on strokes only; text stays crisp).
- **Language:** English for the site and docs, since it is aimed at developers anywhere; catalogue content shows in its own language. [call]
- **Pages:**
  - Home, as in the mockup: headline and drawn phone; the `/isitascam` playground (live, calling the real endpoint without a key and within the keyless limit); "Every scam follows a script" (drawn steps, from an entry's `steps`); catalogue preview; endpoints; footer.
  - **Catalogue:** one page per entry, generated at build time from the data, with its drawn steps, examples, signs, what to do, sources, media links, the JSON link and an "Edit on GitHub" link.
  - **Docs:** quickstart, endpoint reference, schema, limits, license and attribution, privacy.
  - **Contribute:** how to add a scam, how to report one.
  - **Get a key:** sign in with GitHub, see the key and today's usage.
- **Built** by the same CI step that builds the static API, as plain HTML/CSS with a little JS (same no-framework approach as eschamuyo). [call]
- **scamdb.io** redirects permanently to scamdb.dev.
- Illustrations per entry: a small set of drawn icons (phone, SMS, house, bank, screen, card, heart, ticket, chart…) picked per entry, not one drawing per scam. [call]

## Phases

1. **Open data.** Repo setup, schemas, validator, migration of the 20 entries, static API, scamdb.dev (home, catalogue, docs, contribute), domains, CI and deploy. eschamuyo switches to reading from scamdb.
2. **Reports and keys.** D1, the reports endpoint and the eschamuyo form, Turnstile, GitHub sign-in, keys and limits.
3. **`/isitascam` for text.** Matcher in the Worker, Workers AI scorer with fallback, live playground.
4. **Screenshots and voice notes.** Workers AI OCR and speech-to-text.
5. **Later:** the scorer comparison (Workers AI vs home lab vs Jev) once 200 labelled messages exist, report attachments, paid tiers with Stripe, a reports feed for companies, other countries, English text.

## Left to the builder

- Worker framework and internal structure, test setup, how the build script is organised.
- D1 table design, how limits are counted (rate-limiting binding or counters).
- Exact JSON Schemas within the field list above.
- Which Workers AI models to use for OCR and speech-to-text.
- Exact page layouts beyond the home mockup, within the approved look.
- How `packages/matcher` is shared with eschamuyo (vendored copy or published package), as long as eschamuyo keeps no build step.

## Addendum (2026-11-15): drawings and languages — approved by the owner

**Approaches considered.** (1) Keep the SVG displacement filter on hand-written shapes: rejected, the owner found it doesn't read as hand-drawn. (2) Draw every shape with a sketching library (rough.js) in the browser: rejected, adds a runtime script. (3) **Chosen:** draw with rough.js **at build time** and ship static SVG paths: hand-drawn look, nothing extra loaded, identical output on every build (fixed seeds).

**Drawings.** Every drawing on scamdb.dev (hero phone, note arrows, stamp, step circles and icons, the dotted script line, catalogue icons, logo, the underline under "scams.") uses one style, the owner's pick from the options page: **pen** (thin line traced twice: roughness ≈ 1.1, bowing ≈ 1, stroke ≈ 1.8) **with hatched shading** on one side (from option C). Colours come from CSS tokens so light and dark both work. The old `#rough` displacement filter is removed.

**Script steps.** The label sits as far from the circle as from the text below it. Every step gets a label: a warning-sign step shows that sign's label (pink); a step without a sign shows "What happens" / "Qué pasa" (grey, dashed).

**Languages.** The site interface is in English at `/…` (default) and Spanish at `/es/…`, with an EN / ES switch in the header and `hreflang` alternates. **Scam content is never translated:** entries always show in their original language on both versions (`lang` set on the element); only interface strings and signal labels (already in `en`/`es` in `data/signals.json`) change. The API is unchanged. Not for now: translating entries, more interface languages.

## Addendum (2026-11-16): API keys can be viewed again — owner request

The owner asked for keys to behave like a password: masked, with a show/hide eye and a copy button, viewable again when
signed in. Keys are still looked up by SHA-256 hash; they are now **also stored encrypted** (AES-GCM, key derived from
`SESSION_SECRET` with HKDF) in `keys.key_enc`, decrypted only for the signed-in owner via `GET /v1/keys/me/reveal`
(same-origin, `X-Requested-With` required, `no-store`). Rotating `SESSION_SECRET` makes stored keys unviewable (owners
replace them). Keys created before this change can't be revealed and say so. Supersedes "shown once".
