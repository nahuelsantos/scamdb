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
| Review page | `https://scamdb.dev/review/` (not linked, `noindex`) | Three tabs: **Queue** (New, Useful, Skipped; one tap marks an item), **Sources** (every source, on or off and why, with its last result; filter Failing) and **Runs** (the last 14 runs, per source). Two locks: Cloudflare Access (owner's email only) and GitHub sign-in (owner's GitHub id, or `REVIEWER_GITHUB_IDS`). |
| Switches | D1 table `source_settings` (migration `0010_source_settings.sql`) | The On/Off switch on each source in the Sources tab. A row overrides the registry's `allowed` for one source (with when it changed); switching back to the registry's value deletes the row. The collector reads the switches (`GET /v1/collect/settings`) before each run. Sources with nothing to read, and lists of firms, cannot be switched on. |
| Page readers | `lib/readers.js`, tests on saved pages in `tests/fixtures/readers/` | For sites with no feed: `"reader"` in the registry names the reader and `feed` is the page address. Phishing-Radar (DE): each dated warning, with a link to the screenshot of the real message. INCIBE (ES): the alerts list (title, date, summary, link). A reader that finds nothing fails the source, so a layout change shows in the Runs tab. `days` lets a slow source look further back. |
| Run log | D1 table `collector_runs` (migration `0009_collector_runs.sql`) | After each run the collector sends a summary to `POST /v1/collect/run`: what each source kept or why it failed. Kept 60 days. |

## The research list (`data/sources.csv`, `data/scams.csv`)

The owner's research of 18 Nov 2026: 47 official and public-interest sources in the EU, 14 countries and one worldwide
database (IOSCO I-SCAN), and 101 documented scams (scam types with the latest official figures, plus examples of firms
named in official warnings). The CSVs are kept as given; the loader ignores files in `data/`, so they never reach the
catalogue or the API.

- Every source is in the registry with a `use`. Only sources that publish **messages** (real scam messages or close
  descriptions) and have a feed we confirmed are switched on. On 2026-11-21 that was Commissariato di P.S. (IT),
  Fraudehelpdesk alerts (NL), Scamwatch (AU), FBI IC3 announcements (US) and Safeonweb (BE, home only, to confirm).
- The two most valuable message sources have no feed: Verbraucherzentrale's Phishing-Radar (DE: real phishing
  messages word for word) and INCIBE's citizen alerts (ES). They need a page reader, which is the next step.
- Lists of firms and websites (regulator blacklists) are never sent to the review queue. They could later help check
  a domain or a firm in a message. A listing means "not authorised in that jurisdiction", not a court finding.
- `scams.csv` is research for country imports: figures to rank which scams matter most, and leads to primary sources.
  About a third of its links are news articles; an import uses the official source where one can be verified. Its
  named firms are not imported as scams, and Mexico's CONDUSEF alerts name the impersonated (legitimate) lenders, so
  they are never listed.

## Who can see it

`/review/*` and `/v1/review/*` are behind **Cloudflare Access** (Zero Trust → Access → Applications, "scamdb.dev",
policy *Allow · Owner*): Cloudflare asks for the owner's login before the request reaches scamdb, from any network.
Behind it, the Worker still checks the GitHub sign-in. `/v1/collect*` is not behind Access: plunder has no browser and
uses its own key. When the Access session ends, the page reloads through Access's login.

## Retention

A skipped item loses its copied text after 30 days; its link stays so it is not collected again. Useful and new items
keep their text. Run summaries are deleted after 60 days. The daily cleanup does this (`worker/cleanup.js`).

## Setting it up (owner)

1. Apply the migrations (as for every schema change; `0009` adds the run log):

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
