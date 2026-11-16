# Labelled test set

`messages/<cc>.json`: 22 invented messages per country in the local language. The first 12 are scams, each tagged with
the catalogue entry it is an instance of (`scam`). The last 10 are safe look-alikes: real one-time codes, delivery
notices, relatives asking for money from their usual number, order confirmations and similar.

```bash
npm run eval
```

This scores the keyword matcher offline. To also score the Workers AI scorer the way the API combines it, run the
command below. It uses about 200 checks of the daily free Workers AI allowance and needs an API token with
"Workers AI: Read".

```bash
CLOUDFLARE_ACCOUNT_ID=… CLOUDFLARE_API_TOKEN=… node tools/eval.mjs --ai
```

- **Reports:** `report-matcher-<version>.md` keeps the results per matcher version.
- **Floors:** `tests/unit/eval.test.mjs` holds floors that CI enforces. Raise a floor when a change improves its
  number; never lower one to make a change pass.
- **Rules for messages:** they are invented. Write `[link]` and `[number]` instead of real links and numbers, and
  don't copy an entry's `examples` or `phrases`, because the matcher scores against them.
