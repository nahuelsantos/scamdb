---
name: import-scams
description: Research one country's current scams from official warnings and reputable news, draft scamdb entries (original language plus English) and open one pull request for the owner to review. Use for "/import-scams next", "/import-scams <country code>", or when asked to import or add scams for a country.
---

# Import scams

One run = one country = at most one pull request with at most 10 new entries. Nothing is merged by you: the owner
reviews every import. Read `CONTRIBUTING.md` (fields and rules) and
`docs/superpowers/specs/2026-11-16-worldwide-import-design.md` (why it works this way) before drafting.

Argument: `next` (default) or a country code (`au`, `us`, `gb`, `ca`, `es`, `mx`, `br`, or any code in
`data/countries.json`).

## 0. One import at a time

List open pull requests in `nahuelsantos/scamdb` with the label `import`. If one is open, **stop**: report "waiting
for review: <PR link>" and do nothing else. Never open a second import PR.

## 1. Remember rejections

Look at the closed import PRs (label `import`). For each scam drafted in one that is not in `main` now (PR closed
unmerged, or the file was removed during review) and is not already in `importer/rejected.json` (same country and
slug), add `{ "country", "slug", "name", "date" }` (`name` in English, `date` = the PR's close date). These
additions go in this run's PR; if the run opens no PR they are simply worked out again next time. Never re-propose
anything listed there.

## 2. Pick the country

- `next`: run `node tools/importer.mjs next` and use the code it prints. It reads `importer/runs.json`, so a country
  tried recently waits its turn.
- A code: use it.

Set `importer/runs.json` → `{ "<cc>": "<today>" }` for the country you try (keep the other keys). If research finds
nothing new for it, record that too and move on in the same run: `node tools/importer.mjs next --pending <tried codes>`,
at most 3 countries per run.

`node tools/importer.mjs status` shows entries and newest dates per country.

## 3. Country setup (first import for a country only)

If the country is not in `data/countries.json`, add it: `code`, `name` with `en` and the local language,
`languages` (original language first), `emergency` number. Then write `data/<cc>/contacts.json` from official sources:
the police cybercrime or fraud reporting line, the consumer agency, the banking regulator or ombudsman, the national
scam reporting service, and "your bank" (the number on the back of your card). Every text field has `en` and the
original language; every contact has a `source` URL and `checked` date (today).

## 4. Research

Start with the country's entries in `importer/sources.json`, then reputable national news. Only use material from the
**last 24 months**. List candidate scams with their sources. Drop a candidate when:

- `isDuplicate` (in `tools/importer.mjs`) finds it among the country's existing entries (same name or 3+ shared
  phrases): check with a quick script, or by reading `data/<cc>/scams/`;
- `isRejected` finds it in `importer/rejected.json`;
- it has no dated `https://` source you actually read.

If a host is blocked or refuses automated access, note it for the PR summary and use other sources; never invent what
a page says.

## 5. Draft (at most 10)

Prefer the most widespread and most harmful scams. For each, write `data/<cc>/scams/<slug>.json` following
`CONTRIBUTING.md`:

- `lang`: the language the scam arrives in (`en` for au/us/gb/ca, `es` for es/mx, `pt` for br). English-original
  entries need only `en`; others need the original **and** `en` in every text field.
- `examples`: invented, written the way scammers write in that country and language; links as `[enlace]` (Spanish) or
  `[link]` (English, Portuguese); no real numbers, links or names.
- `phrases`: 5+ everyday phrases per language, the way a victim would describe it.
- `steps` with `signal` ids from `data/signals.json`, `signals`, `redFlags`, `whatToDo`, `reportTo` (contact ids),
  `sources` (title, publisher, `https://` url, date), `updated` (today), `status: "active"`.
- Never invent cases, quotes, statistics or numbers. `story` only when a source describes a real case.

## 6. Validate

Run `npm run validate` and `npm test`. Fix or drop entries that fail. Do not touch code to make data pass.

## 7. Open the pull request

Use the branch the session was given if it has one; otherwise `import/<cc>-<YYYY-MM-DD>` from `main`. Commit
(the entries, `importer/runs.json`, any `importer/rejected.json` additions), push, and open a PR titled `Import: <Country> (<n> scams)` with
the label `import` (create the label if missing). The body follows `.github/pull_request_template.md` and adds a
review summary:

- one line per scam: slug, English name, its sources;
- what you were unsure about (wording, whether it is still current, translations);
- candidates you dropped and why (duplicate, rejected, too old, no source);
- hosts that were blocked;
- any non-official sources used.

If no country had anything new, open nothing and report which countries you tried and why. Do not merge, approve or enable auto-merge.
