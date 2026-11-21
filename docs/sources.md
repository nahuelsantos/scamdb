# Sources: collecting real scam messages for review

scamdb grows from real, documented scams. Besides the reports people send, a small collector reads trustworthy
places where real scam messages are published (forums where people paste the text they received, government alerts,
fact-checkers) and puts what it finds in a **private review queue**. The owner reviews it on the phone.

Nothing in the queue reaches the public site, the API, the matcher, the evals or the fusion weights. An item marked
**useful** is a lead for research, for example a real message to add to a catalogue entry through an import PR, with
its source. That step stays manual and reviewed, like every other change to the data.

## The pieces

| Piece | Where | What it does |
|---|---|---|
| Sources registry | `sources/registry.json` | Each source: country, language, kind, feed, where it can be read from (`runs`), what we may keep (`terms`) and why we trust it (`why`). CI checks it (`tests/unit/collect.test.mjs`). |
| Collector | `tools/collect.mjs` (logic in `lib/collect.js`) | Reads the allowed feeds, keeps scam-related items (a source only about scams keeps everything), drops the Reddit author's name and sends the items to `POST /v1/collect`. No dependencies beyond Node 22. |
| Schedule | the owner's home lab (plunder), a daily systemd timer | Installed by `scripts/plunder/19-setup-scamdb-collector.sh` in `nahuelsantos/home-lab`. Some sites (Reddit, Cybermalveillance, Signal Arnaques) refuse cloud servers, so the home lab reads them. |
| Review queue | D1 table `source_items` (migration `0008_source_items.sql`) | One row per link; a link already in the queue is never added twice. |
| Review page | `https://scamdb.dev/review/` (not linked, `noindex`) | Sign in with GitHub; only reviewers (the owner's GitHub id, or `REVIEWER_GITHUB_IDS`) see it. Tabs New, Useful and Skipped; one tap marks an item. |

## Retention

A skipped item loses its copied text after 30 days; its link stays so it is not collected again. Useful and new items
keep their text. The daily cleanup does this (`worker/cleanup.js`).

## Setting it up (owner)

1. Apply the migration (as for every schema change):

   ```bash
   npx wrangler d1 migrations apply scamdb --remote
   ```

2. Install the collector on plunder from the home-lab checkout. The script creates the collector token the first time
   and tells you where it is:

   ```bash
   sudo bash scripts/plunder/19-setup-scamdb-collector.sh
   ```

3. Put the same token in the Worker as the secret `COLLECTOR_TOKEN`: Cloudflare dashboard → Workers & Pages →
   scamdb → Settings → Variables and secrets → Add → type Secret, name `COLLECTOR_TOKEN`, value from
   `sudo cat /etc/scamdb-collector/token` on plunder. Until it is set, `/v1/collect` answers 503 and nothing is stored.

4. Check one run by hand, then open `https://scamdb.dev/review/` on the phone:

   ```bash
   sudo bash scripts/plunder/19-setup-scamdb-collector.sh --run-now
   ```

The token only lets its holder add items to the review queue. It cannot read the queue, reports or keys, and it is
not a Cloudflare API token.

## Adding a source

Add an entry to `sources/registry.json` with `allowed: false` first, try it with
`node tools/collect.mjs --only <id> --dry-run --where home`, then switch it on. A source needs `terms` (what we may
keep: we keep the title, the text the feed itself publishes and the link, privately) and `why` (why it is
trustworthy). Forums are not checked by anyone, so every item from them is reviewed before use.

## Running it by hand

```bash
node tools/collect.mjs --where home --dry-run --days 7
```

`--where cloud` reads only the sources marked `any` or `cloud`. Each run prints one line per source (`kept`, or
`FAILED` with the reason, such as a bot check page) and exits non-zero when sending fails or every source fails, so
systemd marks the run as failed.
