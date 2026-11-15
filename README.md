# scamdb

**A field guide to scams.** An open database of scam *patterns*, country by country: how each scam
works, how it unfolds step by step, sample messages, the phrases people use to describe it, the
warning signs, what to do, and who to report it to.

Blacklists of phone numbers and links already exist, and they go stale every week. The script of a
scam ("Le hablo de PAMI… le va a llegar un código") lasts for years. scamdb catalogues the scripts,
starting with Argentina, in the language people actually use.

The data is free to use, including commercially, under **CC BY 4.0**. It powers
[eschamuyo.com](https://eschamuyo.com) and anyone else who wants to build on it.

## The API

Base URL `https://scamdb.dev/v1/`. Static JSON, no key, no limit, CORS open.

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
| `GET /v1/changes.json` | Recent additions and edits, newest first |

Every file is wrapped as `{ "license", "attribution", "version", "data" }`. Credit us as
`scamdb.dev · CC BY 4.0`.

Coming next: private reports, free API keys, and `POST /v1/isitascam` (send a message, get a
verdict and the reasons).

## Contribute

Every scam is one file under `data/<country>/scams/`. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Run it

```bash
npm ci
```

```bash
npm run validate
```

```bash
npm test
```

```bash
npm run build
```

The build writes the API and the site to `dist/`. The site is in English at `/` and Spanish at `/es/`; interface strings live in
`site/i18n.js`. Scams always show in their own language. Drawings are generated at build time by `lib/sketch.js`.

## Licenses

- Data (`data/` and everything under `/v1/`): [CC BY 4.0](LICENSE-DATA) (full legal text). You may copy, share
  and adapt it for any purpose, including commercially, as long as you give credit, link to the license and
  say if you changed it. Credit it as: **scamdb.dev · CC BY 4.0**.
- Sources and media linked from each entry belong to their owners; scamdb links to them and does not
  relicense them.
- Code: [MIT](LICENSE).

## Deploy (owner steps, once)

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

## Sync to eschamuyo (owner step, once)

When Argentine data changes on `main`, `.github/workflows/sync-eschamuyo.yml` opens or updates a
pull request on `nahuelsantos/eschamuyo` with the regenerated `site/data/scams.json`. It needs a token:

1. GitHub → Settings → Developer settings → Fine-grained tokens → Generate new token.
   Repository access: only `nahuelsantos/eschamuyo`. Permissions: **Contents** and **Pull requests**,
   read and write.
2. In this repo: Settings → Secrets and variables → Actions → New repository secret,
   name `ESCHAMUYO_TOKEN`, paste the token.

Without the secret the workflow skips itself and says so in its summary.
