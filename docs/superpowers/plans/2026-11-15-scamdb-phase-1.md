# scamdb Phase 1 (open data) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish the 20 Argentine scams as open data on scamdb.dev: validated files in a public repo, a static JSON API, the field-guide site, weekly link/contact checks, and an automatic pull request that keeps eschamuyo.com in sync.

**Architecture:** Data lives as one JSON file per scam under `data/<country>/scams/`. A Node build script validates it and writes static JSON (`dist/v1/…`) plus generated HTML pages (`dist/…`) into one folder that Cloudflare Workers serves as static assets only (no Worker code in phase 1, so no request counts against the free quota). The matcher is ported from eschamuyo into `packages/matcher` so the homepage playground runs it in the browser now and the phase 3 Worker can reuse it.

**Tech Stack:** Node 22 (ES modules, `node:test`), Ajv 8 (JSON Schema 2020-12, dev only), Playwright 1.63 + @axe-core/playwright 4.10 (dev only), Wrangler (deploy), GitHub Actions. No framework, no runtime dependencies in the site.

**Spec:** `docs/superpowers/specs/2026-11-15-scamdb-design.md` (read it first). Approved look: https://claude.ai/artifact/8Zprq3iVqrEf7zmVtiwPF3, "★ Your pick" option. Its source is in the repo at `docs/mockup.html`.

**Out of scope here (later plans):** reports, keys and limits (phase 2); `/isitascam` on a server and the Workers AI scorer (phase 3); screenshots and voice (phase 4); eschamuyo switching to `packages/matcher` and to scamdb contacts (phase 3 plan); payments.

## Global Constraints

- Data license CC BY 4.0 (`LICENSE-DATA`), code license MIT (`LICENSE`). Every API file and every page carries the attribution line: `scamdb.dev · CC BY 4.0`.
- Text fields are language-keyed objects (`{"es": "…"}`); keys match `^[a-z]{2}$`. Code never assumes `es` exists: it uses `pick(text, lang)` (Task 2), which falls back to the first key.
- **No source, no scam:** every entry has ≥ 1 source with `title`, `publisher`, an `https://` URL and an ISO date `YYYY-MM-DD`.
- Examples are invented; links in them are written `[enlace]`; no real URL or phone number.
- IDs are `<country>/<slug>`; slug matches `^[a-z0-9]+(-[a-z0-9]+)*$` and equals the file name without `.json`; country is a lowercase ISO 3166-1 alpha-2 code present in `data/countries.json`.
- Channels: `whatsapp`, `sms`, `phone`, `online`, `in-person`, `email`, `social`.
- Cloudflare Free plan: static assets only in this phase; nothing a visitor does may call a paid service.
- Site and docs in English; catalogue content shown in its own language with `lang` set on the element.
- Look: Space Grotesk (headings, 700), IBM Plex Sans (text), IBM Plex Mono (code), Patrick Hand (handwritten notes); colours from the mockup's "chosen" tokens, light and dark (copy them exactly from `docs/mockup.html`, `:root[data-look="chosen"]` blocks). Hand-drawn effect = SVG displacement filter on strokes only, never on text.
- Commit messages end with the session attribution lines from the repo's instructions.

## Review Focus

1. **Contributor HTML in entry text** (e.g. `<script>` in `how.es`) must render as text on every generated page. Test in Task 6.
2. **An entry in a language other than Spanish** (a future `br` entry with only `pt`) must validate, build and render with `pick()` fallback, not crash. Tests in Tasks 2, 5, 6.
3. **A sneaky real contact in an example** (`wa.me/54911…`, `bit.ly/x`, `11 5555-1234`, `+54 9 11…`) must fail validation with a message naming the entry and field. Test in Task 2.
4. **Odd matcher input** (empty string, only emoji, 50,000 characters) returns `not_recognised` without throwing, in under 200 ms. Test in Task 4.
5. **A shallow CI checkout** must not break `changes.json` (git history missing): build falls back to each entry's `updated` date. Test in Task 5; CI also checks out with `fetch-depth: 0`.

---

## File Structure

```
package.json · LICENSE · LICENSE-DATA · README.md · CONTRIBUTING.md · .gitignore
.github/pull_request_template.md
.github/workflows/ci.yml            validate + test on every push/PR
.github/workflows/weekly-check.yml  links + contacts, opens an issue
.github/workflows/sync-eschamuyo.yml  opens a PR on eschamuyo when data/ar changes
wrangler.jsonc                      static assets from dist/, scamdb.dev routes
data/countries.json · data/signals.json
data/ar/contacts.json · data/ar/scams/*.json
schema/text.schema.json · schema/entry.schema.json · schema/contacts.schema.json
schema/countries.schema.json · schema/signals.schema.json
lib/text.js          pick(), normalize(), tokens(), editDistance()  (shared by tools, matcher, site)
lib/load.js          loadRepo(root) → { countries, signals, contacts, entries }
tools/validate.mjs   validateRepo(root) → string[]; CLI
tools/migrate-eschamuyo.mjs  one-off: eschamuyo scams.json → data/ar/scams/*.json + overlay.json
tools/to-eschamuyo.mjs       scamdb entries + overlay → eschamuyo scams.json
tools/build-api.mjs  buildApi(repo, outDir, meta)
tools/build-site.mjs buildSite(repo, outDir, meta)
tools/build.mjs      CLI: validate, then API, then site → dist/
tools/check-links.mjs · tools/check-contacts.mjs
packages/matcher/index.js  matchMessage(); packages/matcher/signs.js  SIGNS, readSigns()
site/templates/*.js  page functions returning HTML strings
site/assets/styles.css · site/assets/playground.js · site/assets/fonts.css
tests/unit/*.test.mjs · tests/fixtures/** · tests/e2e/*.spec.mjs
docs/mockup.html
```

---

### Task 1: Repository scaffold and CI

**Files:**
- Create: `package.json`, `LICENSE`, `LICENSE-DATA`, `README.md`, `CONTRIBUTING.md`, `.gitignore`, `.github/pull_request_template.md`, `.github/workflows/ci.yml`, `tests/unit/smoke.test.mjs`

**Interfaces:**
- Produces: npm scripts used by all later tasks: `validate` (`node tools/validate.mjs`), `test` (`node --test tests/unit/`), `build` (`node tools/build.mjs`), `e2e` (`playwright test --trace off`), `serve` (`npx wrangler dev` or a static server on `dist/`).

- [ ] **Step 1:** `tests/unit/smoke.test.mjs`: `test('package is an ES module', …)` asserting `JSON.parse(readFileSync('package.json')).type === 'module'` and `engines.node === '>=22'`.
- [ ] **Step 2:** Run `node --test tests/unit/` → FAIL (no package.json).
- [ ] **Step 3:** Create `package.json` (`"private": true`, `"type": "module"`, `"engines": {"node": ">=22"}`, devDependencies `ajv@8`, `ajv-formats@3`, `@playwright/test@1.63.0`, `playwright@1.63.0`, `@axe-core/playwright@4.10.2`, `wrangler@4`), the scripts above, `LICENSE` (MIT, "Nahuel Santos"), `LICENSE-DATA` (CC BY 4.0 legal code link + one-paragraph summary + required attribution `scamdb.dev · CC BY 4.0`), `.gitignore` (`node_modules`, `dist`, `test-results`, `.wrangler`).
- [ ] **Step 4:** `README.md`: what scamdb is (spec Intent, 3 short paragraphs), the API table (spec "Static" table), how to run (`npm ci`, `npm run validate`, `npm test`, `npm run build`), licenses. `CONTRIBUTING.md`: how to add or edit an entry (file location, every field with one line, the rules from Global Constraints, `npm run validate`), and this exact statement: "By opening a pull request you agree that your contribution is published under CC BY 4.0 (data) or MIT (code)." PR template: checklist — sources dated and https, examples use `[enlace]`, `npm run validate` passes, "I agree to the licensing statement in CONTRIBUTING.md".
- [ ] **Step 5:** `ci.yml`: on push to `main` and pull_request; Node 22; `actions/checkout@v4` with `fetch-depth: 0`; `npm ci`; `npm run validate`; `npm test`; `npm run build`; install Chromium; `npm run e2e`; upload `test-results/` on failure (mirror eschamuyo's `ci.yml`). Steps that need later files are fine to fail until those tasks land; mark validate/build/e2e steps `if: hashFiles('tools/validate.mjs') != ''` etc. so CI is green now.
- [ ] **Step 6:** `npm install && npm test` → PASS.
- [ ] **Step 7:** Commit `chore: scaffold repo, licenses, CI`.

---

### Task 2: Schemas, shared text helpers, loader and validator

**Files:**
- Create: `schema/*.schema.json` (5), `data/countries.json`, `data/signals.json`, `lib/text.js`, `lib/load.js`, `tools/validate.mjs`
- Test: `tests/unit/text.test.mjs`, `tests/unit/validate.test.mjs`, `tests/fixtures/repo-ok/**`, `tests/fixtures/entries/*.json`

**Interfaces:**
- Produces:
  - `pick(text: Record<string,string|string[]>|undefined, lang?: string): string|string[]|undefined` — `text[lang]`, else first value, else `undefined`.
  - `normalize(s)`, `tokens(s)`, `editDistance(a, b, max=2)` — copied unchanged from eschamuyo `site/js/text.js` (with its STOP list).
  - `loadRepo(root: string): { countries: Country[], signals: Signal[], contacts: Map<string, Contact[]>, entries: Entry[] }` — entries sorted by `id`; each entry gets a non-enumerable `_path` (repo-relative file path).
  - `validateRepo(root: string): string[]` — empty when valid. Each error starts with the repo-relative path, e.g. `data/ar/scams/foo.json: examples[0].text.es has a real link; write [enlace]`.
  - CLI `node tools/validate.mjs [root]`: prints `data: ok (N entries, M countries)` or the errors and exits 1.

**Schema content (from the spec):**
- `text.schema.json`: `$defs.text` = object, `propertyNames` `^[a-z]{2}$`, `minProperties: 1`, values non-empty strings; `$defs.textList` = same with arrays of non-empty strings, `minItems: 1`.
- `entry.schema.json` — required: `id, country, status, channels, sender, name, how, steps, examples, phrases, signals, redFlags, whatToDo, reportTo, sources, updated`; optional: `story, media, related, firstSeen`; `additionalProperties: false`. `status` ∈ `active|fading|archived`. `steps` minItems 2, items `{text: text, signal?: string}`. `examples` minItems 1, items `{text: text, channel?: channel}`. `phrases` textList with ≥ 5 items per language (checked in code). `signals` minItems 1. `media` items `{type ∈ video|audio|image|article|post, url (https), title, publisher, date (ISO)}`. `reportTo` minItems 1, items match `^[a-z]{2}/[a-z0-9-]+$`. `firstSeen` `^\d{4}-\d{2}$`. `updated` ISO date.
- `contacts.schema.json`: `{ country, updated, contacts: [{ id, name: text, when: text, ways: [{type ∈ phone|email|web|whatsapp, value, label?: text}] (minItems 1), jurisdiction, hours?: text, source (https), checked (ISO) }] }`.
- `countries.schema.json`: `{ countries: [{ code, name: text, languages: [string], emergency: string }] }`. `data/countries.json`: Argentina, `languages: ["es"]`, `emergency: "911"`.
- `signals.schema.json`: `{ signals: [{ id (^[a-z_]+$), label: text (must include en and es), description: text }] }`. `data/signals.json` ships exactly these ids, each with `en` and `es` labels: `asks_for_code`, `remote_access`, `urgency`, `money_request`, `unknown_link`, `new_number`, `impersonation`, `secrecy`, `keep_on_line`, `too_good_to_be_true`.

**Checks in code (beyond the schema):** id = `<country>/<file name>`; `country` matches the folder and exists in countries.json; unique ids; every `signals[]` and `steps[].signal` exists in signals.json; every `related` id exists; every `reportTo` id exists in that country's contacts.json; ≥ 5 phrases per language and no phrase whose `tokens()` is empty or a single token from the STOP list; examples and phrases contain no link or phone (regex: `https?:|www\.|\b[a-z0-9-]+\.(com|ar|ly|me|net|org|io)\b|wa\.me|\+?\d[\d\s-]{7,}\d`); a country with entries must have a contacts.json.

- [ ] **Step 1: Failing tests.** `text.test.mjs`: `pick({es:'a'}, 'en') === 'a'`; `pick({pt:'b'}, 'es') === 'b'`; `pick(undefined) === undefined`; `normalize('¿Código?') === 'codigo'`. `validate.test.mjs` with fixture repo `tests/fixtures/repo-ok` (1 country, 1 contacts file, 2 valid entries — one Spanish, one `br` entry with only `pt`, and `br` in its countries.json) → `validateRepo` returns `[]`. Then one test per broken fixture in `tests/fixtures/entries/`, each copied into a temp repo, asserting the error text contains the given fragment:
  - `bad-slug.json` (file `Mi Estafa.json`) → `slug`
  - `id-mismatch.json` (id `ar/otra`) → `id must be ar/id-mismatch`
  - `no-source.json` → `sources`
  - `http-source.json` → `https://`
  - `undated-source.json` → `date`
  - `wa-link.json` (example `escribime a wa.me/5491155551234`) → `examples[0].text.es has a real link`
  - `short-link.json` (`bit.ly/premio`) → same
  - `phone.json` (`llamá al 11 5555-1234`) → `real phone`
  - `unknown-signal.json` (`"signals": ["vibes"]`) → `unknown signal "vibes"`
  - `few-phrases.json` (4 phrases) → `at least 5 phrases`
  - `bad-reportTo.json` (`ar/nadie`) → `unknown contact "ar/nadie"`
  - `extra-field.json` (`"isNew": true`) → `additional property "isNew"`
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implement schemas, `lib/text.js`, `lib/load.js`, `tools/validate.mjs` (Ajv 2020 with ajv-formats; map Ajv errors to the path-prefixed format).
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5:** Commit `feat: schemas, loader and validator`.

---

### Task 3: Migrate the 20 Argentine scams and write the contacts

**Files:**
- Create: `tools/migrate-eschamuyo.mjs`, `data/ar/scams/*.json` (20), `data/ar/contacts.json`, `migration/overlay.json` (handed to Task 8, then deleted from scamdb), `tests/fixtures/eschamuyo/{scams,overlay}.json`
- Test: `tests/unit/migrate.test.mjs`, `tests/unit/real-data.test.mjs`

**Interfaces:**
- Consumes: `validateRepo`, `loadRepo` (Task 2).
- Produces:
  - `migrateScam(s: EschamuyoScam, updated: string): Entry` — copies `name, sender, how, phrases, redFlags, whatToDo, story?, sources, channels`; `id = 'ar/' + s.id`; `country: 'ar'`; `status: 'active'`; `examples = [{ text: s.example }]`; `updated`; leaves `steps`, `signals`, `reportTo` as empty arrays for the author to fill.
  - `overlayFrom(data): { order: string[], isNew: Record<string, boolean> }` — eschamuyo's file order and `isNew` flags, keyed by short id.

- [ ] **Step 1: Failing tests.** `migrate.test.mjs`: `migrateScam` on eschamuyo's first scam (fixture copy) gives `id 'ar/whatsapp-codigo'`, `examples[0].text.es` equal to the old `example.es`, no `isNew`/`example` keys; `overlayFrom` keeps the 20 ids in order. `real-data.test.mjs`: `validateRepo('.')` returns `[]`; exactly 20 entries; every entry has ≥ 2 `steps` and ≥ 1 `signals` and ≥ 1 `reportTo`.
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implement the two functions; CLI `node tools/migrate-eschamuyo.mjs <path-to-eschamuyo>/site/data/scams.json` writes the 20 files (pretty-printed, 2 spaces, keys in schema order) and `migration/overlay.json`. Run it against `/home/user/eschamuyo/site/data/scams.json` (its `updated` is `2026-11-13`; use that as each entry's `updated`). Also copy that `scams.json` to `tests/fixtures/eschamuyo/scams.json` and the overlay to `tests/fixtures/eschamuyo/overlay.json`; Task 8's round-trip test uses them.
- [ ] **Step 4: Write `data/ar/contacts.json`** from eschamuyo `site/index.html` lines 244–262 and `tools/check-contacts.mjs`: one contact per card/line, ids `ar/emergencias`, `ar/tu-banco`, `ar/mpf-caba`, `ar/ufeci`, `ar/mp-pba`, `ar/denuncia-santa-fe`, `ar/denuncia-mendoza`, `ar/bcra-reclamo`, `ar/defensa-consumidor`, `ar/whatsapp-ayuda`, `ar/google-recuperar`, `ar/banco-nacion`, `ar/banco-provincia`, `ar/icbc`, `ar/supervielle`, `ar/naranja-x`. Copy values, `when` text and sources exactly as published there; `checked: "2026-11-14"` (eschamuyo's last check). "Tu banco o billetera" has `ways: [{type:"web", value:"https://www.bcra.gob.ar/", label:{es:"El número que está atrás de tu tarjeta o en su app oficial"}}]` and source BCRA.
- [ ] **Step 5: Fill `steps`, `signals`, `reportTo` for all 20 entries** from each entry's own `how`, `redFlags` and `whatToDo` text, in the same Rioplatense register: 3–5 steps, each a short sentence in second person ("Te llaman diciendo que…"), with `signal` on the steps where a warning sign appears; `signals` = the union of step signals plus any red flag that maps to one; `reportTo` = `ar/ufeci` for every online/phone scam, plus `ar/emergencias` for in-person (cuento del tío), `ar/tu-banco` for bank/wallet ones, `ar/whatsapp-ayuda` for WhatsApp takeover, `ar/bcra-reclamo` for bank fraud. Add `firstSeen` only where a source says when it started. This content is reviewed by the owner in the PR.
- [ ] **Step 6:** `npm test && npm run validate` → PASS, `data: ok (20 entries, 1 countries)`.
- [ ] **Step 7:** Commit `feat: migrate the 20 Argentine scams and contacts from eschamuyo`.

---

### Task 4: The matcher package

**Files:**
- Create: `packages/matcher/index.js`, `packages/matcher/signs.js`, `packages/matcher/package.json` (`"name": "@scamdb/matcher"`, `"type": "module"`, `"exports": "./index.js"`)
- Test: `tests/unit/matcher.test.mjs` (port eschamuyo's `tests/unit/matcher.test.mjs` and `verdict.test.mjs` cases to the new API)

**Interfaces:**
- Consumes: `normalize`, `tokens`, `editDistance` from `lib/text.js` — the package imports them via a relative path `../../lib/text.js`; the build copies both into `dist/assets/` for the browser.
- Produces:
  - `SIGNS: Record<signalId, RegExp>` (Spanish, matched against `normalize(text)`), `readSigns(text: string): string[]` — signal ids found, in `SIGNS` key order.
  - `matchMessage(text: string, entries: Entry[], opts?: { lang?: string, country?: string, limit?: number }): { verdict: 'scam'|'suspicious'|'not_recognised', score: null, signals: { id: string, evidence: string }[], matches: { id: string, score: number }[] }` — `evidence` is the matched substring of the original text (up to 60 chars). `score` is always `null` (spec: no made-up number). Default `lang 'es'`, `limit 3`; `country` filters entries.

**Sign regexes** (split from eschamuyo `analyze.js`, all on normalized text):
- `asks_for_code`: `\bcodigo|\bclave|\bpin\b|\btoken\b|contrasena`
- `remote_access`: `instal|descarg|anydesk|teamviewer|supremo|baj(a|e|ar|o) (esta|la|una|el|este) (app|aplicacion)|ver (tu|su|mi) pantalla|selfie|foto (de|del) (tu|su)? ?dni`
- `urgency`: eschamuyo `rush` regex minus `no corte`
- `money_request`: eschamuyo `money` regex
- `unknown_link`: `enlace|\blink\b|http|www|desconocid`
- `new_number`: `numero nuevo|nuevo numero|cambie de numero|agendalo|agenda este`
- `impersonation`: `le hablo de|te hablo de|somos de|\bpami\b|\banses\b|\barca\b|\bafip\b|\bbanco\b|correo argentino|mercado pago|soporte tecnico|area de seguridad`
- `secrecy`: `no le digas|no se lo digas|no le cuentes|entre nosotros|que no se entere`
- `keep_on_line`: `no corte|no cortes|quedese en linea|no cuelgue`
- `too_good_to_be_true`: `ganaste|ganador|premio|sorteo|gratis|rendimiento|ganancia|duplic`

**Verdict rules** (same results as eschamuyo's `verdictFor`): `scam` if any of `asks_for_code`, `remote_access`, `money_request`; else `suspicious` if any of `urgency`, `unknown_link`, `new_number`, `impersonation`, `secrecy`, `keep_on_line`, `too_good_to_be_true`, or any catalogue match; else `not_recognised`. Catalogue matching = eschamuyo `matcher.js` `scoreScam` algorithm unchanged (phrases of `lang` + `name`), threshold 2.

- [ ] **Step 1: Failing tests.** Port every case from eschamuyo `verdict.test.mjs` (map `code`→`asks_for_code`/`remote_access`, `rush`→`urgency`, `money`→`money_request`, `unknown`→`unknown_link`/`new_number`; `normal`→`not_recognised`) and `matcher.test.mjs`, running against `loadRepo('.').entries`. Add: the PAMI example → verdict `scam`, `matches[0].id === 'ar/whatsapp-codigo'`, signals include `asks_for_code` with evidence containing `código`; the dentist reminder `Hola Marta, te recuerdo el turno con la Dra. López mañana a las 10:30. Si no podés venir avisanos. Saludos!` → `not_recognised`, `matches` empty; `score === null` always; Review Focus 4: `''`, `'🙂🙂🙂'`, and `'hola '.repeat(10000)` each return `not_recognised` and the 50,000-char case finishes in < 200 ms (`performance.now()`).
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implement. Truncate input to the first 5,000 characters before matching (spec request limit) so long input stays fast.
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5:** Commit `feat: matcher package ported from eschamuyo`.

---

### Task 5: Static API build

**Files:**
- Create: `tools/build-api.mjs`, `tools/build.mjs`, `site/_headers`
- Test: `tests/unit/build-api.test.mjs`

**Interfaces:**
- Consumes: `loadRepo`, `validateRepo`, `pick`.
- Produces:
  - `datasetMeta(root): { version: string, builtAt: string }` — `version` = `YYYY-MM-DD.<7-char sha>` from `git log -1 --format=%cs.%h`; when git is unavailable or shallow-without-history, `<today>.local`.
  - `changesFromGit(root, entries): { id, change: 'added'|'edited', date }[]` — newest first, max 100, from `git log --name-status -- data/`; falls back to one `edited` row per entry dated `entry.updated` if git fails (Review Focus 5).
  - `buildApi(repo, outDir, meta): string[]` — returns the list of written paths. Writes exactly the spec's static table: `v1/index.json`, `v1/countries.json`, `v1/signals.json`, `v1/{cc}/scams.json`, `v1/{cc}/contacts.json`, `v1/scams/{cc}/{slug}.json`, `v1/scams.json`, `v1/changes.json`, `v1/scamdb.zip` (zip of the `data/` folder + both licenses; use `zip -r` via `child_process`, or a tiny store-only zip writer if `zip` is missing).
  - Every JSON file is `{ "license": "CC BY 4.0", "attribution": "scamdb.dev · CC BY 4.0", "version": meta.version, "data": … }`. `index.json` data = `{ countries: [{code, scams: n}], total, builtAt, docs: "https://scamdb.dev/docs/" }`.
  - `tools/build.mjs` CLI: `validateRepo` (exit 1 on errors) → empty `dist/` → `buildApi` → `buildSite` (Task 6; skip if the module is absent) → copy `site/_headers` to `dist/_headers`.
  - `site/_headers`: `/v1/*` → `Access-Control-Allow-Origin: *`, `Cache-Control: public, max-age=300`, `X-Scamdb-License: CC BY 4.0`; `/*` → the security headers from eschamuyo's `site/_headers` (`X-Content-Type-Options`, `Referrer-Policy`, `Content-Security-Policy` allowing Google Fonts only).

- [ ] **Step 1: Failing tests** on the `repo-ok` fixture into a temp dir: the file list equals the spec table for countries `ar` and `br`; `v1/scams/ar/<slug>.json` `data.id === 'ar/<slug>'`; every JSON has `license`, `attribution`, `version`; `v1/br/scams.json` builds although the entry has only `pt`; `changesFromGit` on a temp dir without `.git` returns rows dated from `updated`; `datasetMeta` without git → version ends with `.local`.
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** `npm test && npm run build` → PASS; `ls dist/v1` lists the files; `node -e "JSON.parse(require('fs').readFileSync('dist/v1/ar/scams.json')).data.length"` prints `20`.
- [ ] **Step 5:** Commit `feat: static API build`.

---

### Task 6: The scamdb.dev site

**Files:**
- Reference (already in the repo): `docs/mockup.html`
- Create: `tools/build-site.mjs`, `site/templates/{layout,home,catalogue,entry,docs,contribute,notfound}.js`, `site/templates/icons.js`, `site/assets/styles.css`, `site/assets/playground.js`
- Test: `tests/unit/build-site.test.mjs`, `tests/e2e/site.spec.mjs`, `playwright.config.mjs`

**Interfaces:**
- Consumes: `loadRepo`, `pick`, `buildApi` output paths, `matchMessage` (browser copy), `meta`.
- Produces:
  - `esc(s: string): string` — HTML-escapes `& < > " '`. **Every** data string goes through it (Review Focus 1).
  - `buildSite(repo, outDir, meta): string[]` — writes `index.html`, `catalogue/index.html`, `catalogue/{cc}/{slug}/index.html`, `docs/index.html`, `contribute/index.html`, `404.html`, `assets/*` (styles, playground.js, `matcher.js` + `text.js` copied from `packages/matcher` and `lib`, `entries-ar.json` = the slim list the playground needs: `id, name, phrases, signals`).
  - Each template is `(ctx) => string`, `ctx = { repo, meta, entry?, lang }`; `layout({ title, description, body, path })` adds nav (Docs, Catalogue, Contribute, GitHub ↗), footer (`Made by the people behind eschamuyo.com` · `data CC BY 4.0 · code MIT` · dataset version), canonical URL `https://scamdb.dev{path}`, Open Graph tags, and the hidden SVG `#rough` filter.
  - `icons.js`: `ICONS: Record<string, string>` with inline SVG strings for `phone, sms, house, bank, screen, card, heart, ticket, chart, gift, cart, briefcase` (mockup drawing style: 64×64, classes `d`/`d-thin`/`d-acc`), and `iconFor(entry): string` — first match of: id contains `banco|mercado-pago|transferencia|prestamo` → bank/card, `cuento|alquiler` → house, `remoto` → screen, `romantica` → heart, `entradas` → ticket, `inversion|trabajo` → chart, `premio` → gift, `tienda|mercado-libre|comprobante` → cart, `correo|anses|arca` → briefcase, channels has `whatsapp|sms` → sms, else phone.

**Pages (content from the spec, look from `docs/mockup.html`):**
- Home = the mockup, made real: headline "A field guide to scams.", lede, buttons (Browse the catalogue → `/catalogue/`, Read the docs → `/docs/`); drawn phone; playground; "Every scam follows a script" rendering `ar/whatsapp-codigo`'s `steps` with their signals; catalogue preview (exactly `ar/cuento-del-tio`, `ar/falso-banco`, `ar/acceso-remoto`, as in the mockup; constant `FEATURED` in `site/templates/home.js`); endpoints strip (static rows only, plus `/isitascam` labelled "coming soon"); counts in the eyebrow from `repo` (`20 scams · Argentina · open data`). No "Get a free key" or "Pricing" yet (phase 2).
- **Playground (phase 1):** runs `matchMessage` in the browser on `entries-ar.json`; heading says "Runs in your browser. Nothing is sent." The three sample buttons from the mockup; a textarea to paste your own; the response panel shows verdict, signals with evidence, matches linking to their catalogue pages, and `score: null` displayed as "no score yet (catalogue match only)". Without JS the panel shows the PAMI sample's precomputed result (rendered at build time).
- Catalogue index: one card per entry (icon, id, name, first example as a quote, channels, "N warning signs · N sources · updated <Mon YYYY>"), grouped by country.
- Entry page: name, sender, icon, `how`, drawn steps (same component as home), examples (styled as message bubbles), red flags, what to do, report to (contacts resolved from `reportTo`, with each way shown as selectable text), media links, sources (title, publisher, date, link), "JSON" link to `/v1/scams/{cc}/{slug}.json`, "Edit on GitHub" link to `https://github.com/nahuelsantos/scamdb/edit/main/data/{cc}/scams/{slug}.json`. Content elements carry `lang` from the language actually picked.
- Docs: quickstart (`curl https://scamdb.dev/v1/ar/scams.json`), the static endpoint table with one example response each (generated from the real build), the entry schema field list, the response envelope, attribution requirement, versioning (`version` field), limits ("static endpoints: no key, no limit"), privacy, "coming next" (reports, keys, `/isitascam`).
- Contribute: how to add a scam (link to CONTRIBUTING.md and the schema), "Report a scam: coming soon, meanwhile open an issue without personal data".

- [ ] **Step 1: Failing unit tests** (`build-site.test.mjs`, on `repo-ok` plus one fixture entry whose `how.es` is `<script>alert(1)</script><img src=x onerror=alert(1)>`): the written page list matches the interface; the entry page contains `&lt;script&gt;alert(1)&lt;/script&gt;` and no `<script>alert`; the `br` entry page renders its `pt` text with `lang="pt"`; every page has exactly one `<h1>`, a `<title>`, and a canonical link; `iconFor({id:'ar/falso-banco', channels:['phone']})` returns `ICONS.bank`.
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implement templates, CSS (tokens copied from the mockup's chosen look, light and dark via `prefers-color-scheme`, 16px minimum side gutter, works at 360px width) and `playground.js`.
- [ ] **Step 4:** `npm test && npm run build` → PASS.
- [ ] **Step 5: Failing e2e tests** (`site.spec.mjs`, served from `dist/` by `webServer` in `playwright.config.mjs`): home loads with no console errors; clicking "Dentist reminder" shows `not recognised`; pasting `Hola ma, cambié de número, agendalo y pasame plata` shows `scam` and a match link that opens a catalogue page returning 200; every page (home, catalogue, one entry, docs, contribute) passes axe with no serious/critical violations in light and dark; at 360×740 the body has no horizontal scroll; `/v1/ar/scams.json` responds with JSON.
- [ ] **Step 6:** `npm run e2e` → FAIL, then fix until PASS.
- [ ] **Step 7:** Take one screenshot each of home (desktop light, phone dark) with `deviceScaleFactor: 2` into `docs/screenshots/` and compare by eye with `docs/mockup.html`; fix visible differences once.
- [ ] **Step 8:** Commit `feat: scamdb.dev site`.

---

### Task 7: Deploy configuration and weekly checks

**Files:**
- Create: `wrangler.jsonc`, `tools/check-links.mjs`, `tools/check-contacts.mjs`, `.github/workflows/weekly-check.yml`
- Modify: `README.md` (Deploy section)
- Test: `tests/unit/checks.test.mjs`

**Interfaces:**
- Consumes: `loadRepo`.
- Produces:
  - `collectLinks(repo): { url: string, where: string }[]` — every source URL, media URL, contact `source` and `web` way.
  - `contactPattern(value: string): RegExp` — matches the value on a page tolerant of spaces, dots, hyphens and brackets between digits (e.g. `0810-666-4444` matches `0810 666 4444`), literal for emails/URLs.
  - CLIs: `node tools/check-links.mjs` (HEAD, then GET on 405/403; prints `ok`/`BROKEN`, exits 1 on any broken) and `node tools/check-contacts.mjs` (Playwright, same approach as eschamuyo's: each contact's `ways` values must appear on its `source` page; writes `docs/contacts-check.json`; exits 1 on any miss).

- [ ] **Step 1: Failing tests:** `collectLinks` on `repo-ok` returns every https URL once with its file as `where`; `contactPattern('0810-666-4444').test('Llamá al 0810 666 4444')`; `contactPattern('(011) 5071-0040').test('011 5071 0040')`; `contactPattern('denunciasufeci@mpf.gov.ar').test('x denunciasufeci@mpf.gov.ar y')`.
- [ ] **Step 2:** `npm test` → FAIL; implement; → PASS.
- [ ] **Step 3:** `wrangler.jsonc`: `name: "scamdb"`, `compatibility_date: "2026-11-01"`, `assets: { directory: "./dist", not_found_handling: "404-page" }`, routes `scamdb.dev` and `www.scamdb.dev` as `custom_domain: true`. No `main` (no Worker code).
- [ ] **Step 4:** `weekly-check.yml`: Mondays 12:17 UTC + manual run; runs both checks; on failure opens or comments on an issue labelled `weekly-check` (same pattern as eschamuyo's `weekly-check.yml`).
- [ ] **Step 5:** README "Deploy" section, written as owner steps: (1) Cloudflare → Workers & Pages → Create → Import `nahuelsantos/scamdb`, build command `npm ci && npm run build`, deploy command `npx wrangler deploy`; (2) the custom domains in `wrangler.jsonc` attach on first deploy; (3) scamdb.io: Rules → Redirect Rules → "Redirect from root to WWW"-style single redirect: hostname `scamdb.io` or `www.scamdb.io` → `https://scamdb.dev${path}` with status 301, preserve query string (dashboard, free plan); (4) check `https://scamdb.dev/v1/index.json`.
- [ ] **Step 6:** `npm run build && npx wrangler deploy --dry-run` → succeeds and lists `dist` assets.
- [ ] **Step 7:** Commit `feat: deploy config and weekly link/contact checks`.

---

### Task 8: Keep eschamuyo in sync

**Files:**
- Create: `tools/to-eschamuyo.mjs`, `.github/workflows/sync-eschamuyo.yml`
- Create in **eschamuyo** (same branch name `claude/kind-meitner-7jzcka`): `site/data/overlay.json` (moved from scamdb `migration/overlay.json`), `README.md` note that `scams.json` is generated from scamdb
- Delete: scamdb `migration/` (the round-trip test uses `tests/fixtures/eschamuyo/`)
- Test: `tests/unit/to-eschamuyo.test.mjs`

**Interfaces:**
- Consumes: `loadRepo`, `pick`, Task 3's overlay shape `{ order, isNew }`.
- Produces: `toEschamuyo(entries: Entry[], overlay: {order: string[], isNew: Record<string, boolean>}, updated: string): { updated: string, scams: EschamuyoScam[] }` — only `country === 'ar'` and `status !== 'archived'`; short id = slug; `example = examples[0].text`; `isNew` from overlay (default `false`); order: overlay `order` first, then any new ids alphabetically; drops scamdb-only fields (`steps`, `signals`, `reportTo`, `media`, `related`, `firstSeen`, `status`, `country`, `updated`, extra examples). CLI: `node tools/to-eschamuyo.mjs <eschamuyo-root>` reads `<root>/site/data/overlay.json`, writes `<root>/site/data/scams.json`.

- [ ] **Step 1: Failing test (round trip):** `toEschamuyo(loadRepo('.').entries, overlayFixture, '2026-11-13')` deep-equals `tests/fixtures/eschamuyo/scams.json` (the copy taken in Task 3; eschamuyo's keys are exactly `id, isNew, channels, name, sender, how, example, phrases, redFlags, whatToDo, story?, sources`). This proves eschamuyo is unchanged by the move. Plus: a new entry not in the overlay lands last with `isNew: false`; an `archived` entry is dropped.
- [ ] **Step 2:** `npm test` → FAIL; implement; → PASS.
- [ ] **Step 3:** `sync-eschamuyo.yml`: on push to `main` with `paths: ['data/ar/**']` and manual run; checks out scamdb and `nahuelsantos/eschamuyo` (token `secrets.ESCHAMUYO_TOKEN`); runs `node tools/to-eschamuyo.mjs ../eschamuyo`; opens or updates a PR on eschamuyo with `peter-evans/create-pull-request@v7` (branch `scamdb-sync`, title `Update scams from scamdb <version>`, body listing `changes.json` rows since the last sync). If `ESCHAMUYO_TOKEN` is missing, the job logs a clear message and succeeds.
- [ ] **Step 4:** In eschamuyo: add `site/data/overlay.json`; run its `npm run validate && npm test` → PASS (scams.json is byte-identical to before, so nothing else changes); README note: "`site/data/scams.json` is generated from scamdb. Edit scams at github.com/nahuelsantos/scamdb; edit `overlay.json` for order and `isNew`." Commit and push on eschamuyo's branch.
- [ ] **Step 5:** README in scamdb: owner step to create a fine-grained token (repo `nahuelsantos/eschamuyo`, permissions Contents + Pull requests: read and write) and save it as the scamdb Actions secret `ESCHAMUYO_TOKEN`.
- [ ] **Step 6:** Commit `feat: sync Argentine data to eschamuyo by pull request`.
