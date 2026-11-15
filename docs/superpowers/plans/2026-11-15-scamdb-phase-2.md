# scamdb Phase 2 (reports and keys) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let anyone send a private scam report (from a form on eschamuyo.com or `POST /v1/reports`), let developers get a free API key by signing in with GitHub, and give the owner a simple way to read reports in a Claude session.

**Architecture:** The first Worker code. `worker/index.js` runs **only** on the dynamic paths listed in `assets.run_worker_first` (`/v1/reports`, `/v1/keys*`, `/auth/*`); everything else stays a free static asset. Reports, keys, usage and abuse counters live in one D1 database. A daily cron deletes expired rows. eschamuyo gets an "Avisanos" screen that posts to scamdb and loads Cloudflare Turnstile only when that screen is opened.

**Tech Stack:** Cloudflare Workers + D1 + Cron Triggers (Free plan), Miniflare 4 for tests under `node:test`, Web Crypto (SHA-256, HMAC), GitHub OAuth (web flow), Cloudflare Turnstile.

**Spec:** `docs/superpowers/specs/2026-11-15-scamdb-design.md` (sections "Reports", "The API → Dynamic", "eschamuyo.com as a consumer", "Phases"). Phase 1 plan for conventions: `docs/superpowers/plans/2026-11-15-scamdb-phase-1.md`.

**Out of scope (phase 3+):** `POST /v1/isitascam`, the scorer, the playground calling a server, report attachments (R2 needs a card on file), paid tiers.

## Global Constraints

- Cloudflare **Free plan**: Worker only on `run_worker_first` paths; static reads never invoke it. D1 free limits (100k writes/day): a global cap of **2,000 reports/day** protects them.
- **Reports are private.** Never in the repo, never in any API response other than `{ id, received }`, never in logs (`console.log` of request bodies is forbidden). Text only, no attachments.
- **No raw IP stored.** Abuse counters key on `SHA-256(IP_SALT + ':' + YYYY-MM-DD + ':' + ip)`, so the hash changes daily and can't be reversed into an IP.
- **API keys are stored hashed** (SHA-256 hex). The full key is shown once, at creation. Format: `sk_` + 32 random bytes in base64url (43 chars).
- Retention: reports **180 days** unless `status = 'promoted'`; abuse counters 2 days; usage rows 400 days.
- Limits: `POST /v1/reports` without key **10/day per IP**; with key **200/day per key**; global **2,000/day**. Requests without a valid key must carry a valid Turnstile token.
- Secrets only via `wrangler secret put` / dashboard: `IP_SALT`, `SESSION_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `TURNSTILE_SECRET`. Never in the repo.
- CORS: `/v1/reports` allows any origin (`*`) for `POST` and `OPTIONS`, header `Content-Type, Authorization`. `/v1/keys*` and `/auth/*` are same-origin only (no CORS headers), cookies `HttpOnly; Secure; SameSite=Lax; Path=/`.
- scamdb.dev copy in English; eschamuyo copy in Rioplatense Spanish, following eschamuyo's `DESIGN.md`.
- Errors are JSON `{ "error": "<code>", "message": "<plain words>" }` with the right status.

## Review Focus

1. **Static requests must never wake the Worker.** A test parses `wrangler.jsonc` and asserts `run_worker_first` is exactly the three patterns; another asserts a non-matching path handled by the Worker falls through to `env.ASSETS.fetch`. (Task 1)
2. **Junk report bodies** (not JSON, wrong content type, 1 MB of text, `text` as a number, unknown country) return 400/413/415 JSON errors, never a 500. (Task 3)
3. **The 11th keyless report from one IP on the same day** returns 429 with `Retry-After` seconds until UTC midnight; a different IP still succeeds. (Task 3)
4. **A tampered or expired session cookie** returns 401 on `/v1/keys/me`, and a GitHub callback with a missing or mismatched `state` returns 400 without creating a session. (Task 5)
5. **A GitHub login containing HTML** (`<img onerror>`) renders as text on the account page. (Task 7)

---

## File Structure

```
wrangler.jsonc                  + main, run_worker_first, d1_databases, triggers.crons
migrations/0001_init.sql        reports, keys, usage, hits
worker/index.js                 fetch() router + scheduled()
worker/http.js                  json(), error(), cors(), readJson()
worker/limits.js                ipHash(), hit(), secondsToUtcMidnight()
worker/reports.js               handleReport()
worker/session.js               sign(), verify(), sessionFrom(), cookie helpers
worker/github.js                authStart(), authCallback(), logout()
worker/keys.js                  newKey(), hashKey(), authKey(), handleKeys()
worker/cleanup.js               cleanup(db, now)
site/templates/account.js       /account/ page
site/assets/account.js          account page script
site/templates/{docs,contribute,home,layout}.js   updated copy
tools/reports.mjs               owner: export / mark reports via wrangler d1 execute --remote
tests/worker/*.test.mjs         Miniflare tests
tests/e2e/account.spec.mjs
eschamuyo: site/index.html (new #/avisar screen), site/js/report.js, site/js/app.js, site/_headers, tests
```

### Test harness (used by every Worker task)

`tests/worker/harness.mjs` exports `makeWorker({ fetchMock } = {})`: builds a `new Miniflare({ modules: true, scriptPath: 'worker/index.js', modulesRules: [{ type: 'ESModule', include: ['**/*.js'] }], compatibilityDate: '2026-11-01', d1Databases: ['DB'], bindings: { IP_SALT: 'salt', SESSION_SECRET: 'x'.repeat(32), GITHUB_CLIENT_ID: 'cid', GITHUB_CLIENT_SECRET: 'csecret', TURNSTILE_SECRET: '1x0000000000000000000000000000000AA' }, assets: { directory: <tmp dir with index.html containing "STATIC"> }, outboundService: fetchMock })`, applies `migrations/0001_init.sql` to `DB`, and returns `{ mf, fetch: (path, init) => mf.dispatchFetch('https://scamdb.dev' + path, init), db: await mf.getD1Database('DB'), dispose }`. Tests pass the client IP with header `CF-Connecting-IP`. `fetchMock(request)` answers Turnstile (`challenges.cloudflare.com`) and GitHub (`github.com`, `api.github.com`) calls; token `"ok"` verifies, anything else fails.

---

### Task 1: Worker skeleton, config and D1 schema

**Files:**
- Create: `worker/index.js`, `worker/http.js`, `migrations/0001_init.sql`, `tests/worker/harness.mjs`, `tests/worker/router.test.mjs`
- Modify: `wrangler.jsonc`, `package.json` (devDependency `miniflare@4`; `"test": "node --test tests/unit/*.test.mjs tests/worker/*.test.mjs"`)

**Interfaces:**
- Produces:
  - `json(data, status = 200, headers = {}) : Response`; `error(status, code, message, headers = {}) : Response`; `cors(response) : Response` (adds the `/v1/reports` CORS headers); `readJson(request, maxBytes = 20000) : Promise<object>` — throws `HttpError(415|413|400, code, message)` for non-`application/json`, oversized, or unparseable bodies.
  - `class HttpError extends Error { status, code }` in `worker/http.js`.
  - `export default { fetch(request, env, ctx), scheduled(event, env, ctx) }` in `worker/index.js`. Routes: `OPTIONS|POST /v1/reports` → Task 3; `GET|POST|DELETE /v1/keys…` → Task 6; `GET /auth/github`, `/auth/github/callback`, `POST /auth/logout` → Task 5. Unknown path → `env.ASSETS.fetch(request)`. Any thrown `HttpError` → `error(...)`; any other throw → `error(500, 'internal', 'Something went wrong on our side.')` without logging the body.
- Schema (`migrations/0001_init.sql`):
  - `reports(id TEXT PRIMARY KEY, created_at TEXT NOT NULL, country TEXT NOT NULL, channel TEXT, text TEXT, what_happened TEXT, contact TEXT, source TEXT NOT NULL, key_id TEXT, status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','reviewed','promoted','rejected')))`, index on `(status, created_at)`.
  - `keys(id TEXT PRIMARY KEY, key_hash TEXT UNIQUE NOT NULL, github_id INTEGER UNIQUE NOT NULL, github_login TEXT NOT NULL, created_at TEXT NOT NULL)`.
  - `usage(key_id TEXT NOT NULL, day TEXT NOT NULL, endpoint TEXT NOT NULL, count INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (key_id, day, endpoint))`.
  - `hits(bucket TEXT NOT NULL, day TEXT NOT NULL, count INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (bucket, day))`.
- `wrangler.jsonc` adds: `"main": "worker/index.js"`, `assets.binding: "ASSETS"`, `assets.run_worker_first: ["/v1/reports", "/v1/keys*", "/auth/*"]`, `"d1_databases": [{ "binding": "DB", "database_name": "scamdb", "database_id": "<filled in Task 8>", "migrations_dir": "migrations" }]`, `"triggers": { "crons": ["17 4 * * *"] }`.

- [ ] **Step 1: Failing tests** (`router.test.mjs`): `wrangler.jsonc run_worker_first is exactly the three dynamic patterns` (strip `//` comments, `JSON.parse`, `deepEqual`); `an unknown path falls through to static assets` (`fetch('/whatever-static')` body contains `STATIC`); `OPTIONS /v1/reports answers CORS` (204, `access-control-allow-origin: *`, allow-methods includes `POST`); `an unexpected throw returns a JSON 500` (call the exported `handle(request, env)` directly for `POST /v1/reports` with an `env.DB` whose `prepare` throws; assert status 500 and `error === 'internal'`); `the migration creates the four tables` (query `sqlite_master`).
- [ ] **Step 2:** `npm test` → FAIL (no worker).
- [ ] **Step 3:** Implement `worker/http.js`, `worker/index.js` (export `handle` too, for the 500 test), migration, wrangler changes, harness.
- [ ] **Step 4:** `npm test` → PASS; `npm run build && npx wrangler deploy --dry-run` → lists the Worker and assets, no error.
- [ ] **Step 5:** Commit `feat(worker): skeleton, D1 schema, dynamic routes only`.

---

### Task 2: Abuse counters

**Files:**
- Create: `worker/limits.js`, `tests/worker/limits.test.mjs`

**Interfaces:**
- Produces:
  - `utcDay(now = new Date()) : string` → `YYYY-MM-DD`.
  - `secondsToUtcMidnight(now = new Date()) : number` (≥ 1).
  - `ipHash(ip: string, salt: string, day: string) : Promise<string>` — hex SHA-256 of `` `${salt}:${day}:${ip}` ``.
  - `hit(db, bucket: string, max: number, now?) : Promise<{ ok: boolean, count: number }>` — atomically `INSERT … ON CONFLICT(bucket, day) DO UPDATE SET count = count + 1 RETURNING count`; `ok = count <= max`.

- [ ] **Step 1: Failing tests:** `ipHash differs by day and by salt and never contains the ip`; `hit allows max then refuses` (max 3: three `ok`, fourth `ok === false`, `count === 4`); `hit buckets are independent`; `a new day starts at zero` (pass `now` one day later); `secondsToUtcMidnight at 23:59:30 is 30`.
- [ ] **Step 2:** FAIL. **Step 3:** implement. **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat(worker): daily abuse counters with salted IP hashes`.

---

### Task 3: `POST /v1/reports`

**Files:**
- Create: `worker/reports.js`, `worker/turnstile.js`, `tests/worker/reports.test.mjs`

**Interfaces:**
- Consumes: `readJson`, `error`, `json`, `cors`, `HttpError`; `hit`, `ipHash`, `utcDay`, `secondsToUtcMidnight`; `authKey` (Task 6 — until then a stub in `worker/keys.js` returning `null`, replaced in Task 6).
- Produces:
  - `verifyTurnstile(token: string, ip: string, secret: string) : Promise<boolean>` — POST form `secret, response, remoteip` to `https://challenges.cloudflare.com/turnstile/v0/siteverify`, true only on `success: true`.
  - `handleReport(request, env) : Promise<Response>`.
- Request body (JSON): `{ text?: string ≤ 5000, whatHappened?: string ≤ 2000, country: one of COUNTRIES (exported from worker/reports.js, currently ['ar']), channel?: one of whatsapp|sms|phone|online|in-person|email|social, contact?: string ≤ 200, source?: string ≤ 40 (default 'api'), turnstileToken?: string }`. At least one of `text`/`whatHappened` non-blank after trim.
- Order of checks: parse (415/413/400) → validate (400 `invalid_report` naming the field) → key (`authKey`) or Turnstile (403 `turnstile_failed`) → global cap 2,000/day bucket `reports:global` (503 `reports_paused`) → per-key 200 (`reports:key:<id>`) or per-IP 10 (`reports:ip:<hash>`) → 429 `too_many_reports` with `Retry-After` → insert with `id = crypto.randomUUID()`, `created_at = new Date().toISOString()` → `201 { id, received: true }`. All responses go through `cors()`.

- [ ] **Step 1: Failing tests** (Review Focus 2 and 3 included):
  - `a valid keyless report with a Turnstile token is stored` → 201, row exists with `status 'new'`, `source 'eschamuyo'` when sent.
  - `without key or Turnstile token → 403 turnstile_failed`; `bad token → 403`.
  - `text and whatHappened both blank → 400 invalid_report`; `text as a number → 400`; `country 'zz' → 400`; `channel 'fax' → 400`.
  - `not JSON → 400 bad_json`; `text/plain → 415`; `body over 20 kB → 413`.
  - `the 11th keyless report from one IP is 429 with Retry-After` (assert header is a positive integer ≤ 86400); `another IP still gets 201`.
  - `the response never echoes the report` (body keys exactly `id, received`).
  - `CORS header present on 201, 400 and 429`.
- [ ] **Step 2:** FAIL. **Step 3:** implement. **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat(worker): private reports endpoint with Turnstile and limits`.

---

### Task 4: Daily cleanup

**Files:**
- Create: `worker/cleanup.js`, `tests/worker/cleanup.test.mjs`
- Modify: `worker/index.js` (`scheduled` calls `cleanup(env.DB, new Date(event.scheduledTime))`)

**Interfaces:**
- Produces: `cleanup(db, now: Date) : Promise<{ reports: number, hits: number, usage: number }>` — deletes reports older than 180 days whose `status != 'promoted'`, hits with `day` older than 2 days, usage with `day` older than 400 days; returns deleted counts.

- [ ] **Step 1: Failing tests:** seed one report 181 days old (`new`), one 181 days old (`promoted`), one 10 days old; hits 3 days and today; usage 401 days and today. `cleanup` returns `{ reports: 1, hits: 1, usage: 1 }` and the promoted + recent rows remain. Plus `scheduled() runs cleanup` via `mf.getWorker()` → `worker.scheduled({ scheduledTime: Date.now() })`.
- [ ] **Step 2:** FAIL. **Step 3:** implement. **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat(worker): daily cleanup of old reports and counters`.

---

### Task 5: GitHub sign-in and sessions

**Files:**
- Create: `worker/session.js`, `worker/github.js`, `tests/worker/auth.test.mjs`

**Interfaces:**
- Produces:
  - `sign(payload: object, secret) : Promise<string>` → `base64url(JSON) + '.' + base64url(HMAC-SHA256)`; `verify(token, secret) : Promise<object|null>` (null on bad signature, bad JSON, or `exp` in the past).
  - `sessionFrom(request, env) : Promise<{ githubId: number, login: string } | null>` — reads cookie `scamdb_session`.
  - `authStart(request, env) : Response` — 302 to `https://github.com/login/oauth/authorize?client_id=…&redirect_uri=https://scamdb.dev/auth/github/callback&scope=&state=<random 16 bytes base64url>`, sets cookie `scamdb_state` (10 min).
  - `authCallback(request, env) : Promise<Response>` — 400 `bad_state` if `state` query ≠ cookie or either missing; exchanges `code` at `https://github.com/login/oauth/access_token` (`Accept: application/json`), reads `https://api.github.com/user` (`User-Agent: scamdb`), sets `scamdb_session` (`{ githubId, login, exp: now + 30 days }`), clears `scamdb_state`, 302 to `/account/`. GitHub failure → 302 to `/account/?error=github`.
  - `logout() : Response` — clears `scamdb_session`, 302 to `/account/`.
  - Scope is empty (public profile only). The GitHub access token is used once and never stored.

- [ ] **Step 1: Failing tests** (Review Focus 4): `sign/verify round trip`; `a tampered signature verifies to null`; `an expired token verifies to null`; `/auth/github redirects to GitHub with a state cookie`; `callback with matching state creates a session cookie and redirects to /account/` (fetchMock: token → `{ access_token: 't' }`, user → `{ id: 42, login: 'ana' }`); `callback with missing or mismatched state → 400 bad_state and no session cookie`; `GitHub error → redirect with error=github`; `logout clears the cookie`.
- [ ] **Step 2:** FAIL. **Step 3:** implement. **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat(worker): GitHub sign-in with signed session cookies`.

---

### Task 6: API keys

**Files:**
- Create: `worker/keys.js` (replaces the Task 3 stub), `tests/worker/keys.test.mjs`

**Interfaces:**
- Consumes: `sessionFrom`, `json`, `error`, `utcDay`.
- Produces:
  - `newKey() : string` (`sk_` + 43 base64url chars); `hashKey(key) : Promise<string>` (hex SHA-256).
  - `authKey(request, env) : Promise<{ id: string, githubLogin: string } | null>` — `Authorization: Bearer sk_…`; looks up by hash.
  - `recordUsage(db, keyId, endpoint, now?) : Promise<void>` — upsert `usage` (+1). `handleReport` calls it for keyed reports with endpoint `'reports'`.
  - `handleKeys(request, env) : Promise<Response>`:
    - `GET /v1/keys/me` → 401 `not_signed_in` without session; else `{ login, hasKey, prefix: 'sk_ab12…' | null, createdAt, usageToday: { reports: n }, limits: { reports: 200 } }`.
    - `POST /v1/keys` → 401 without session; requires header `X-Requested-With: scamdb` (CSRF guard, 403 otherwise); creates or replaces the user's key (one key per GitHub account), returns `201 { key, prefix }` — the only time the full key is returned.
    - `DELETE /v1/keys/me` → same guards; deletes the key; `204`.

- [ ] **Step 1: Failing tests:** `newKey format` (`/^sk_[A-Za-z0-9_-]{43}$/`); `GET /v1/keys/me without session → 401`; `POST creates a key returned once, stored only as a hash` (DB row has `key_hash` ≠ key and no column with the key); `POST again replaces it (old key no longer authenticates)`; `POST without X-Requested-With → 403`; `a keyed report needs no Turnstile, counts in usage and is limited at 200/day` (set count to 200 directly in `hits`, expect 429); `GET /v1/keys/me shows usageToday.reports`; `DELETE removes the key`.
- [ ] **Step 2:** FAIL. **Step 3:** implement. **Step 4:** PASS (also re-run Task 3 tests).
- [ ] **Step 5:** Commit `feat(worker): free API keys tied to GitHub accounts`.

---

### Task 7: scamdb.dev pages

**Files:**
- Create: `site/templates/account.js`, `site/assets/account.js`, `tests/e2e/account.spec.mjs`
- Modify: `tools/build-site.mjs` (write `account/index.html`), `site/templates/layout.js` (nav: add "Account"), `site/templates/docs.js` (sections "Reports" and "Keys and limits"; remove reports/keys from "Coming next"), `site/templates/contribute.js` ("Report a scam" → eschamuyo form link `https://eschamuyo.com/#/avisar` + the API), `site/templates/home.js` (button "Get a free key" → `/account/`; endpoints strip adds `POST /v1/reports` "free, private"), `tests/unit/build-site.test.mjs` (page list includes `account/index.html`)

**Interfaces:**
- Consumes: Task 6 JSON shapes.
- Account page (static HTML + `account.js`): signed out → "Sign in with GitHub" (`<a href="/auth/github">`) and one paragraph on what a key is for and that only your public GitHub profile is read; `?error=github` → "GitHub sign-in didn't work. Try again." Signed in → login, key prefix or "No key yet", "Create key" / "Replace key" button (POST with `X-Requested-With: scamdb`), the new key shown once in a selectable box with "Copy" and "You won't see this key again", today's usage `reports n / 200`, "Delete key", "Sign out" (form POST `/auth/logout`). All server strings inserted with `textContent` (Review Focus 5).
- Docs "Reports": request body table (fields and limits from Task 3), example `curl` with `Authorization: Bearer sk_…`, statement that reports are private, kept 180 days, never published, and that keyless calls need a Turnstile token (so they come from a form).

- [ ] **Step 1: Failing tests:** unit — `account page is written and has one h1`; e2e (`account.spec.mjs`, static server; intercept `/v1/keys/me` with `page.route`): `signed out shows the GitHub sign-in link`; `signed in shows the login as text even when it contains HTML` (login `<img src=x onerror=alert(1)>` → visible literally, no `img` element inside the login node); `creating a key shows it once`; axe passes (light and dark).
- [ ] **Step 2:** FAIL. **Step 3:** implement. **Step 4:** `npm test && npm run e2e` → PASS.
- [ ] **Step 5:** Commit `feat(site): account page, reports and keys docs`.

---

### Task 8: Owner tooling and setup

**Files:**
- Create: `tools/reports.mjs`, `tests/unit/reports-tool.test.mjs`
- Modify: `package.json` (`"reports": "node tools/reports.mjs"`), `.gitignore` (`reports/`), `README.md` (sections "Phase 2 setup (owner, once)" and "Reading reports"), `wrangler.jsonc` (real `database_id` once created)

**Interfaces:**
- Produces:
  - `buildQuery(cmd: 'list'|'mark', args) : string` — `list [--status new] [--limit 200]` → `SELECT id, created_at, country, channel, text, what_happened, source FROM reports WHERE status = ? ORDER BY created_at LIMIT ?` (values inlined after validation: status ∈ the four statuses, limit integer 1–1000); `mark <status> <id…>` → `UPDATE reports SET status = '<status>' WHERE id IN (…)` with ids validated as UUIDs. Contact is **not** exported by `list` (owner sees it only with `list --with-contact`).
  - CLI: runs `npx wrangler d1 execute scamdb --remote --json --command "<sql>"`; `list` writes `reports/inbox-<date>.json` (gitignored) and prints the count; `mark` prints rows changed.
- README "Phase 2 setup": (1) `npx wrangler d1 create scamdb` → paste `database_id` into `wrangler.jsonc`; (2) `npx wrangler d1 migrations apply scamdb --remote`; (3) Turnstile: dashboard → Turnstile → Add widget, hostnames `eschamuyo.com` and `www.eschamuyo.com`, mode Managed → site key goes into eschamuyo (Task 9), secret → `npx wrangler secret put TURNSTILE_SECRET`; (4) GitHub → Settings → Developer settings → OAuth Apps → New: homepage `https://scamdb.dev`, callback `https://scamdb.dev/auth/github/callback` → `wrangler secret put GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`; (5) `wrangler secret put SESSION_SECRET` and `IP_SALT` with `openssl rand -base64 32`. Each command in its own fenced block.
- README "Reading reports": open a Claude session on scamdb, run `npm run reports list`, ask Claude to cluster them, strip personal data and draft entries or examples as pull requests, then `npm run reports mark reviewed <ids>` / `promoted` / `rejected`.

- [ ] **Step 1: Failing tests:** `list builds a parameter-safe query` (status `new`, limit 50); `list rejects an unknown status` (throws); `mark rejects a non-UUID id` (throws on `1; DROP TABLE reports`); `list never selects contact unless --with-contact`.
- [ ] **Step 2:** FAIL. **Step 3:** implement. **Step 4:** PASS.
- [ ] **Step 5:** Create the D1 database and apply the migration if the session has Cloudflare access (Cloudflare MCP `d1_database_create`, then `wrangler d1 migrations apply --remote` needs the owner's token — otherwise leave both as owner steps). Ledger which.
- [ ] **Step 6:** Commit `feat: reports tool and phase 2 setup docs`.

---

### Task 9: eschamuyo "Avisanos" screen (eschamuyo repo, branch `claude/kind-meitner-7jzcka`)

**Files (eschamuyo):**
- Create: `site/js/report.js`, `tests/unit/report.test.mjs`, `tests/e2e/report.spec.mjs`
- Modify: `site/index.html` (new screen `<article class="scr" id="s-avisar" data-hash="#/avisar">` at the end of the `#ch-ya-cai` stack, after `#s-contactos`; a link "Avisanos de este chamuyo" on the result screen `#s-resultado` that opens `#/avisar` with the pasted text prefilled), `site/js/app.js` (wire the screen), `site/_headers` (CSP: `script-src 'self' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; connect-src 'self' https://scamdb.dev`), `README.md` (one paragraph: where reports go)

**Interfaces:**
- Produces (`site/js/report.js`, pure, testable):
  - `buildReport({ text, whatHappened, channel, contact }, token) : object` → `{ text, whatHappened, channel, contact, country: 'ar', source: 'eschamuyo', turnstileToken: token }`, trimming strings and dropping empty ones.
  - `reportError(status: number) : string` — Spanish message for 400 ("Revisá el mensaje: falta el texto o es muy largo."), 403 ("No pudimos confirmar que no sos un robot. Probá de nuevo."), 429 ("Ya mandaste varios avisos hoy. Gracias: probá mañana."), 503 and other ("No pudimos mandarlo ahora. Probá más tarde.").
  - `REPORT_URL = 'https://scamdb.dev/v1/reports'`, `TURNSTILE_SITE_KEY` (placeholder `'1x00000000000000000000AA'`, Cloudflare's always-pass test key, until the owner pastes the real one).
- Screen copy (Rioplatense, eschamuyo tone): title "Avisanos de un chamuyo"; lead "Si te llegó una estafa, contanos. Nos ayuda a avisarle a otros."; fields "El mensaje que te llegó" (textarea, prefilled from the checker), "¿Qué pasó? (opcional)", "¿Por dónde te llegó?" (select with eschamuyo's channel names), "Tu mail, si querés que te escribamos (opcional)"; **privacy line, bold, above the button: "Esto sí se manda: lo leemos nosotros y no lo publicamos. No pongas claves, números de tarjeta ni datos de otras personas."**; button "Mandar el aviso"; success "¡Gracias! Lo recibimos."
- Turnstile script (`https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit`) is injected **only when `#/avisar` is first shown**, never on load. The checker's existing promise ("Lo que escribas no sale de tu celu") stays true: nothing is sent until "Mandar el aviso" is pressed.

- [ ] **Step 1: Failing tests:** unit — `buildReport drops empty fields and sets country/source`; `reportError has a message for 400, 403, 429, 503 and 500`. e2e (`report.spec.mjs`, intercept `https://scamdb.dev/v1/reports` and the Turnstile script with `page.route`): `the home page loads no Turnstile script` (no request to challenges.cloudflare.com on `/`); `opening #/avisar loads Turnstile`; `the result screen link prefills the message`; `sending shows thanks on 201`; `429 shows the Spanish limit message`; axe passes on the screen.
- [ ] **Step 2:** FAIL. **Step 3:** implement following eschamuyo `DESIGN.md` (existing `.paste`, `.btn`, `.field-error` classes). **Step 4:** eschamuyo `npm run validate && npm test && npx playwright test --trace off` → PASS.
- [ ] **Step 5:** Commit in eschamuyo `Avisanos: send a private scam report to scamdb`.
