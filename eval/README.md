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

In a cloud session where a network proxy adds the token, give Node the proxy and its certificate and use the token
placeholder `proxy-injected`: add `NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt` before the command.

- **Reports:** `report-matcher-<version>.md` keeps the results per matcher version.
- **Floors:** `tests/unit/eval.test.mjs` holds floors that CI enforces. Raise a floor when a change improves its
  number; never lower one to make a change pass.
- **Rules for messages:** they are invented. Write `[link]` and `[number]` instead of real links and numbers, and
  don't copy an entry's `examples` or `phrases`, because the matcher scores against them.

## The fused score

Keyed checks combine the matcher and the Workers AI scorer with a small logistic regression (`lib/fusion.js`, weights
in `worker/fusion-weights.js`). To refit it after the set or the engines change:

```bash
node tools/eval.mjs --ai --cache /tmp/ai.json
```

```bash
node tools/fit-fusion.mjs /tmp/ai.json
```

The second command prints held-out results (each country scored by weights fitted on the other eight). Add `--write`
to save the new weights. `report-ai-fusion.md` has the latest numbers.

## The private set

`private.enc` holds extra labelled messages, encrypted (AES-256-GCM), so nobody can tune a scam against them and the
numbers stay honest. Only the owner and CI have the key, in the `EVAL_PRIVATE_KEY` GitHub secret.

```bash
EVAL_PRIVATE_KEY=… node tools/private-eval.mjs open
```

That writes `eval/private/messages.json`, which is gitignored. Edit it, then encrypt it again:

```bash
EVAL_PRIVATE_KEY=… node tools/private-eval.mjs seal
```

To score the private set:

```bash
EVAL_PRIVATE_KEY=… node tools/eval.mjs --private
```

Add `--ai` to include the AI scorer. Never commit a report of the private set.
