# /isitascam (text) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `POST /v1/isitascam` answers a text message with a verdict, warning signs, matching catalogue entries and what to do; keyed requests also get a free Workers AI score; the homepage playground can call it.

**Architecture:** A new Worker route reads the catalogue from its own static assets (`/assets/entries.json`, `/v1/scams/<id>.json`, `/v1/index.json`) through `env.ASSETS` (no storage, cached per isolate by dataset version), runs `packages/matcher`, and for keyed requests calls a scorer behind one interface (`worker/scorer.js`: Workers AI embeddings + a small instruct model). Any scorer failure falls back to the matcher answer. Limits reuse the `hits` counters.

**Tech Stack:** Cloudflare Workers + Workers AI binding (`AI`), D1, Miniflare tests, node:test, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-15-scamdb-design.md` (sections "Dynamic (Worker)", "/isitascam", "Phases" item 3).

## Global Constraints

- Request: `{ "text": "…", "country": "ar", "lang": "es", "report": false }`. Max **5,000** characters of text. Images/audio are Phase 4: non-JSON → 415 (existing `readJson`).
- Limits: without key **10/day per IP, matcher only, never any AI or paid service**; with a free key **50/day** per GitHub account.
- Verdict rules: matcher alone → `"score": null`, never a made-up number. With a scorer, `score` is its output and may move the verdict, with one floor: if the hard rules fire (asks for a code, remote access, or money **plus** impersonation) the verdict is never lower than `suspicious`.
- `engine.scorer` is `"matcher"` or `"workers-ai"`.
- Privacy: nothing is stored unless `report: true` (then the input becomes a report).
- The score is documented as a score, not a probability, until checked against 200 labelled messages.
- IPs are never stored (salted daily hash, as in `worker/limits.js`). Secrets never in the repo.

## Review Focus

1. **Workers AI throws, times out or returns malformed JSON** → 200 with the matcher answer and `engine.scorer: "matcher"`, never a 500. (Task 2)
2. **The model invents evidence** (a quote not in the message) → that sign is dropped. (Task 2)
3. **A keyless request when `env.AI` exists** → `env.AI` is never called. (Task 2)
4. **Whitespace-only, non-string or 5,001-character text; unknown country** → 400 naming the field. (Task 1)
5. **`report: true` without a key** → 400 telling the caller to use `POST /v1/reports` (keyless reports need Turnstile). (Task 1)

---

### Task 1: The endpoint with the matcher (keyless and keyed)

**Files:**
- Create: `worker/catalogue.js`, `worker/isitascam.js`, `tests/worker/isitascam.test.mjs`
- Modify: `worker/index.js` (routes, OPTIONS, CORS like reports, `NEEDS.isitascam = [['IP_SALT', 16]]`), `wrangler.jsonc` (`run_worker_first` += `"/v1/isitascam"`), `packages/matcher/index.js` (exports), `worker/reports.js` (`COUNTRIES` = all 9: `ar au nz us ca gb mx es br`), `tests/worker/harness.mjs` (write fixture assets), existing report tests if they pin `ar` only.

**Interfaces — Produces:**
- `packages/matcher/index.js`: `export const VERSION = '1.0.0'`; `export function hardRules(signalIds: string[]): boolean` (true if `asks_for_code` or `remote_access`, or both `money_request` and `impersonation`).
- `worker/catalogue.js`: `loadCatalogue(env) -> Promise<{ version: string, signals: Map<id,{label}>, entries: Entry[], countries: Set<string> }>` (from `/v1/index.json` for `version`, `/assets/entries.json` for the rest; cached in module scope, refreshed when `/v1/index.json`'s version changes — fetch index at most once per 60 s); `loadEntry(env, id) -> Promise<FullEntry|null>` (from `/v1/scams/<id>.json` `.data`).
- `worker/isitascam.js`: `validateCheck(body) -> { text, country|null, lang, report }` (throws `HttpError(400, 'invalid_check', '<field>: …')`); `LIMITS = { keyless: 10, keyed: 50, global: 20000, ai: 1000 }`; `handleIsItAScam(request, env) -> Response`; `buildAnswer({ result, catalogue, top, lang, country, scorer }) -> object` (pure; the response body).
- Response body: `{ verdict, score, signals: [{ id, label, evidence }], matches: [{ id, name, url, page }], whatToDo: string[], reportTo: string|null, engine: { matcher, scorer }, datasetVersion }`. `label`/`name`/`whatToDo` in `lang`, else `en`, else the first language. `url` = `https://scamdb.dev/v1/scams/<id>.json`, `page` = `https://scamdb.dev/catalogue/<id>/`. `reportTo` = `https://scamdb.dev/v1/<cc>/contacts.json` for the top match's country, else the request's country, else null. `whatToDo` = the top match's, else `[]`.

- [ ] **Step 1: Tests first** in `tests/worker/isitascam.test.mjs` (harness writes `/v1/index.json` with `version: 't.1'`, `/assets/entries.json` with two entries `ar/whatsapp-codigo` (phrases `es`+`en`) and `au/x`, and `/v1/scams/ar/whatsapp-codigo.json` with `whatToDo: { es: ['No leas el código'], en: ['Never read out the code'] }`):
  - `keyless: a code request is a scam, matched, score null, scorer matcher` → POST `{ text: 'Te va a llegar un código de WhatsApp, me lo pasás?', lang: 'en' }` ⇒ 200, `verdict: 'scam'`, `score: null`, `matches[0].id === 'ar/whatsapp-codigo'`, `whatToDo[0] === 'Never read out the code'`, `reportTo` ends `/v1/ar/contacts.json`, `engine.scorer === 'matcher'`, `datasetVersion === 't.1'`, signals include `{ id: 'asks_for_code' }` with non-empty `evidence`, CORS header `*`.
  - `ordinary text is not_recognised with no matches` → `'Hola, ¿venís el domingo?'` ⇒ `not_recognised`, `matches: []`, `whatToDo: []`, `reportTo: null`.
  - `country filters matches` → same code text with `country: 'au'` ⇒ no `ar/` match; `reportTo` ends `/v1/au/contacts.json`.
  - `rejects bad input` (one assert each): missing text, `'   '`, `123`, 5,001 chars, `country: 'zz'`, `lang: 5` ⇒ 400 `invalid_check` with the field name in `message`; non-JSON ⇒ 415.
  - `report without a key is refused` → `report: true` ⇒ 400 `invalid_check`, message mentions `POST /v1/reports`.
  - `report with a key stores one report` → keyed (insert a key like `keys.test.mjs` does) ⇒ 200 and one `reports` row with `source = 'isitascam'`, `text` equal to the input; without `report`, zero rows.
  - `keyless limit is 10 a day per IP` → 10 × 200 then 429 `too_many_checks` with `retry-after`.
  - `keyed limit is 50 a day per account` → set the `hits` row to 50 for `isitascam:gh:42` today, next ⇒ 429.
  - `OPTIONS returns CORS 204`.
- [ ] **Step 2:** `node --test tests/worker/isitascam.test.mjs` → FAIL (404/route missing).
- [ ] **Step 3: Implement** the files above. Limit order (like reports): per-sender bucket (`isitascam:ip:<hash>` or `isitascam:gh:<githubId>`), then `isitascam:global` (`LIMITS.global` → 503 `checks_paused`). Keyed calls `recordUsage(db, key.id, 'isitascam')`. `report: true` requires a key and a country (top match's or request's; else 400) and inserts like `handleReport` with `source: 'isitascam'`. Matching: `matchMessage(text, entries, { country })`.
- [ ] **Step 4:** `npm test` → all pass (including the existing report tests after `COUNTRIES` grows).
- [ ] **Step 5:** Commit `feat(worker): POST /v1/isitascam with the matcher`.

### Task 2: Workers AI scorer for keyed requests

**Files:**
- Create: `worker/scorer.js`, `tests/unit/scorer.test.mjs`
- Modify: `worker/isitascam.js` (use the scorer), `wrangler.jsonc` (`"ai": { "binding": "AI" }`), `tests/worker/isitascam.test.mjs`

**Interfaces:**
- Consumes: `hardRules`, `loadCatalogue`, `buildAnswer` (Task 1).
- Produces: `worker/scorer.js`: `MODELS = { embed: '@cf/baai/bge-m3', chat: '@cf/meta/llama-3.1-8b-instruct' }` (check both ids in Cloudflare's Workers AI model list when implementing; swap for the current equivalent if renamed); `TIMEOUT_MS = 4000`; `scoreWithWorkersAI(ai, { text, catalogue, matcherSignals }) -> Promise<{ score: number, verdict, signals: [{ id, evidence }], matches: [{ id, similarity }] } | null>` — `null` on any error, timeout or invalid output; `combine(matcherResult, scorerResult, text) -> { verdict, score, signals, matches }`.
- Algorithm (not determined by the tests):
  - Embeddings: one text per entry (`name` + `phrases`, every language, joined with ` · `), embedded in batches of 50 and cached in module scope per `catalogue.version`; the message is embedded once per call; cosine similarity; matches = top 3 with similarity ≥ `0.6`.
  - Chat: system prompt lists the signal ids with English labels and the top 5 similar entry names; asks for JSON only `{ "verdict": "scam|suspicious|not_recognised", "score": 0..1, "signals": [{ "id", "evidence" }] }` (use the model's JSON mode / `response_format` if available; otherwise parse the first `{…}` block). Reject: unknown verdict, score outside 0–1, unknown signal id.
  - `combine`: drop scorer signals whose `evidence` is not a case-insensitive substring of `text`; signals = matcher's ∪ scorer's (matcher's evidence wins on the same id); matches = matcher's then scorer's, deduped, top 3; `score` = scorer's; verdict = scorer's, raised to `suspicious` if `hardRules(all signal ids)` and the scorer said `not_recognised`.

- [ ] **Step 1: Tests first** in `tests/unit/scorer.test.mjs` with a fake `ai = { run: async (model, input) => … }`:
  - `uses embeddings and the chat answer` → fake returns vectors making `ar/whatsapp-codigo` most similar (0.9) and chat `{ verdict: 'scam', score: 0.93, signals: [{ id: 'asks_for_code', evidence: 'código' }] }` ⇒ result `score 0.93`, `matches[0].id === 'ar/whatsapp-codigo'`.
  - `returns null when the model throws`, `…when it times out` (fake never resolves; `TIMEOUT_MS` overridable via an options arg), `…when the JSON is malformed`, `…when the verdict or score is invalid`.
  - `combine drops invented evidence` → scorer signal evidence `'transfer now'` not in text ⇒ absent.
  - `combine floors the verdict` → scorer `not_recognised`, matcher signals `money_request` + `impersonation` ⇒ `suspicious`.
  - `combine keeps matcher evidence for the same id`.
  - `catalogue embeddings are computed once per version` → two calls, same version ⇒ entry batch embedded once.
- [ ] **Step 2: Worker tests** added to `tests/worker/isitascam.test.mjs`: `keyed without the AI binding answers with the matcher` (`engine.scorer === 'matcher'`, `score === null`). (Miniflare can't run Workers AI; the scorer's own behaviour is covered by the unit tests.)
- [ ] **Step 3: Implement.** In `handleIsItAScam`: keyless ⇒ never touch `env.AI`; keyed and `env.AI` present and `hit(db, 'isitascam:ai', LIMITS.ai)` ok ⇒ `scoreWithWorkersAI`; if it returns null or the AI cap is reached ⇒ matcher answer, `scorer: 'matcher'`; otherwise `combine` and `scorer: 'workers-ai'`.
- [ ] **Step 4:** `npm test` → pass.
- [ ] **Step 5:** Commit `feat(worker): Workers AI scorer for keyed checks, matcher fallback`.

### Task 3: Docs and the playground

**Files:**
- Modify: `site/templates/docs.js`, `site/templates/home.js`, `site/i18n.js`, `site/assets/playground.js`, `site/assets/styles.css`, `tests/unit/build-site.test.mjs`, `tests/e2e/site.spec.mjs`, `README.md`.

- Docs: a "Check a message" section with the request/response (the Task 1 shape), limits (10/day per IP without a key, matcher only; 50/day with a key, plus a Workers AI score), "score is not a probability yet", privacy (nothing stored unless `report: true`, which needs a key). Endpoints table gains `POST /v1/isitascam`. Home endpoints card: tier `free · 10/day, 50 with a key` instead of "coming soon".
- Playground: keeps the instant in-browser matcher while typing; adds an icon button (DESIGN.md: icon with `aria-label`/`title` "Check with the API") that POSTs the textarea to `/v1/isitascam` and shows the raw JSON response in a `<pre class="api-out">` under the result (429 → the API's message). No call on keystrokes.

- [ ] **Step 1: Tests first:** unit `docs show POST /v1/isitascam and its limits` (asserts the strings `POST /v1/isitascam`, `10`, `50`, `not a probability`); `home no longer says isitascam is coming soon`; e2e `the API button shows the endpoint's JSON` (Playwright `page.route('**/v1/isitascam', …)` fulfils `{ verdict: 'scam', … }`; click; `.api-out` contains `"verdict": "scam"`), and `a 429 shows the API message`.
- [ ] **Step 2:** Implement; `npm test && npx playwright test --trace off` → pass.
- [ ] **Step 3:** Commit `feat(site): document /v1/isitascam; playground can call it`.

### After merge (owner-visible)

- The Workers AI binding needs no secret; it uses the account's free daily allowance. Check live: `curl -s -X POST https://scamdb.dev/v1/isitascam -H 'content-type: application/json' -d '{"text":"Hi mum, new number, send money"}'` → `verdict` and `engine.scorer: "matcher"`.
