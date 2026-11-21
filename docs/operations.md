# Operations

Owner and maintainer steps: deploying scamdb.dev, the Worker and its secrets, automatic checks, imports and reading
reports. Users of the data and the API need none of this; start at the [README](../README.md).

## Deploy (once)

1. **Cloudflare → Workers & Pages → Create → Import a repository** → `nahuelsantos/scamdb`.
   Build command `npm ci && npm run build`, deploy command `npx wrangler deploy`. Every push to
   `main` then publishes.
2. The custom domains `scamdb.dev` and `www.scamdb.dev` in `wrangler.jsonc` attach on the first
   deploy (the zone is already in your Cloudflare account).
3. **scamdb.io → scamdb.dev:** in the `scamdb.io` zone, Rules → Redirect Rules → Create rule →
   Single redirect. When hostname equals `scamdb.io` or `www.scamdb.io`, redirect dynamically to
   `concat("https://scamdb.dev", http.request.uri.path)` with status 301 and "Preserve query string"
   on. (Free plan.) The zone needs a proxied DNS record for the rule to run: add an `AAAA` record
   for `@` and `www` pointing to `100::`, proxied.
4. Check `https://scamdb.dev/v1/index.json` and `https://scamdb.io/docs/`.

## Automatic checks

- **CI** (`.github/workflows/ci.yml`): every push and pull request validates the data, runs the
  unit tests, builds, and runs the browser tests (playground, accessibility, phone width).
- **Weekly check** (`.github/workflows/weekly-check.yml`): every Monday it re-checks every link and
  confirms every phone number and email is still printed on its official page. If something broke
  it opens an issue labelled `weekly-check`. Run it by hand from the Actions tab too.

## Sync to eschamuyo (optional, once)

eschamuyo.com is one consumer of the data, like any other.

When Argentine data changes on `main`, `.github/workflows/sync-eschamuyo.yml` opens or updates a
pull request on `nahuelsantos/eschamuyo` with the regenerated `site/data/scams.json`. It needs a token:

1. GitHub → Settings → Developer settings → Fine-grained tokens → Generate new token.
   Repository access: only `nahuelsantos/eschamuyo`. Permissions: **Contents** and **Pull requests**,
   read and write.
2. In this repo: Settings → Secrets and variables → Actions → New repository secret,
   name `ESCHAMUYO_TOKEN`, paste the token.

Without the secret the workflow skips itself and says so in its summary.

## Worker setup: reports, keys and sign-in (once)

Reports, keys and sign-in run in a small Worker with a D1 database. Do these once, in order.

1. Create the database (skip if `wrangler.jsonc` already has a real `database_id`):

```bash
npx wrangler d1 create scamdb
```

   Paste the `database_id` it prints into `wrangler.jsonc`.

2. Create the tables:

```bash
npx wrangler d1 migrations apply scamdb --remote
```

3. **Turnstile** (the anti-bot check on eschamuyo's report form): Cloudflare dashboard → Turnstile → Add widget,
   hostnames `eschamuyo.com` and `www.eschamuyo.com`, mode Managed. Put the **site key** in eschamuyo's
   `site/js/report.js` (`TURNSTILE_SITE_KEY`) and save the **secret**:

```bash
npx wrangler secret put TURNSTILE_SECRET
```

   scamdb.dev's own report form uses a second widget (hostnames `scamdb.dev`, `www.scamdb.dev`). Its site key is in
   `site/templates/report.js`, and its secret goes in:

```bash
npx wrangler secret put TURNSTILE_SECRET_SITE
```

4. **GitHub sign-in**: GitHub → Settings → Developer settings → OAuth Apps → New OAuth App. Homepage
   `https://scamdb.dev`, callback `https://scamdb.dev/auth/github/callback`. Then save both values:

```bash
npx wrangler secret put GITHUB_CLIENT_ID
```

```bash
npx wrangler secret put GITHUB_CLIENT_SECRET
```

5. Two random secrets (paste the output of `openssl rand -base64 32` for each):

```bash
npx wrangler secret put SESSION_SECRET
```

```bash
npx wrangler secret put IP_SALT
```

Secrets can also be added in the dashboard: Workers & Pages → scamdb → Settings → Variables and Secrets.

The test site (a Preview for every branch, with its own database) is described in [docs/uat.md](uat.md).

## Reading reports

Reports are private: they live only in D1, lose their contact details, story, key link and indicators after 180 days (the redacted text and outcome are kept), and never reach this repo.

1. Open a Claude session on this repo and run:

```bash
npm run reports list
```

   It writes `reports/inbox-<date>.json` (gitignored). Contacts are left out unless you add `--with-contact`.
2. Ask Claude to cluster the reports, strip personal data, and draft new entries or new examples as pull requests.
3. Mark what you handled:

```bash
npm run reports mark reviewed <id> <id>
```

   Use `promoted` for reports that became an entry (they are then kept), `rejected` for noise.

## Importing scams

New scams for a country come from the `import-scams` Claude Code skill (`.claude/skills/import-scams/SKILL.md`),
run only when the owner asks for a specific country: `/import-scams au`. It first collects real scam messages
quoted from reliable sources and stops if it finds fewer than 8; otherwise it drafts entries from official warnings
and reputable news, validates them and opens one pull request labelled `import`.

- `node tools/importer.mjs status` shows entries per country.
- Close an import PR, or delete a scam from it, to reject it: the next run adds it to `importer/rejected.json` and
  never proposes it again. Delete a line there to allow it back.
- The daily Discover workflow (`.github/workflows/discover.yml`) lists leads (new stories and official warnings) in a
  weekly "Scam signals" issue; leads are for the owner and for research, never a source on their own.

