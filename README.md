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

The build writes the API and the site to `dist/`.

## Licenses

- Data (`data/` and everything under `/v1/`): [CC BY 4.0](LICENSE-DATA).
- Code: [MIT](LICENSE).
