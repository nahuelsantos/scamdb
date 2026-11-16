# scamdb worldwide import — design

Date: 2026-11-16 · Status: draft for owner review · Builds on `2026-11-15-scamdb-design.md`

Marked **[call]**: decisions Claude made that the owner has not explicitly confirmed. Everything else was decided in
conversation with the owner.

## Intent

scamdb today has 20 Argentine scams. The owner wants scams from all over the world, starting with **the United States,
the United Kingdom, Spain, Mexico, Brazil, Australia and Canada**. The owner is the only reviewer and has a few hours a
week; a Claude Code helper does the research and drafting. The site becomes **English-only**, and every scam is shown in
its **original language** alongside English.

## Goals

- An **importer** that, for one country at a time, researches that country's scams from official warnings and reputable
  news, drafts scamdb entries (original language + English), validates them, and opens **one pull request per run**
  for the owner to review.
- It runs **automatically every week** and can also be **run by hand** for a chosen country.
- Each new country comes with its **contacts** (who to report to) before its first scam, as the data rules require.
- **Languages:** every entry keeps its original language and has English. The site interface is English only; the
  Spanish interface (`/es/`) is removed.
- Existing Argentine entries gain English versions, so the English site has no untranslated Spanish explanations.

## Non-goals

- Auto-merging. Nothing goes live without the owner merging the pull request.
- Interface languages other than English. Entries get English, not Spanish or other translations.
- Blacklists of numbers, links or wallets (as before).
- A UAT/staging site (owner wants one; separate later piece).
- Paid plans (later).

## Anti-goals

- **Drafting scams that aren't real or aren't current.** Every entry needs at least one dated `https://` source; the
  importer must prefer official sources and must not invent cases, quotes or numbers.
- **Flooding the owner.** A run never opens more than one pull request or adds more than 10 entries [call]; a run that
  finds nothing new opens nothing.
- **Duplicates.** The same scam pattern in two countries is two entries (different language, contacts, examples), but
  the importer must not add a scam that already exists for that country.
- **Copying content.** Examples are written in the scammers' style but invented (links as `[enlace]`/`[link]`), media is
  linked not copied, as today.

## Constraints

- One reviewer (the owner), a few hours a week.
- Cloudflare Free plan; the catalogue stays static files built from `data/`.
- The importer runs as **Claude Code** (no separate AI API key, no per-call billing beyond the owner's Claude plan) [call].
- The data rules and validator stay the single source of truth.

## Approaches considered

| | How | Trade-off |
|---|---|---|
| 1. On-demand importer | A Claude Code skill in the repo; the owner runs it for a country | Free when idle, full control; coverage grows only when the owner remembers |
| **2. Weekly automatic run + manual run (chosen)** | The same skill, run weekly by a scheduled Claude Code session; the owner can also run it by hand | Steady coverage with no effort; uses the owner's Claude plan every week and puts a PR in front of the owner weekly |
| 3. Contributors only | Wait for pull requests from the public | Free; too slow to cover seven countries |

The owner chose 2 ("automate it, with the option of running it manually").

## How it works

### The importer skill

`.claude/skills/import-scams/SKILL.md` in the scamdb repo, invoked as `/import-scams <country>` or
`/import-scams next`.

1. **Pick the country.** `next` picks the target country (from the list above, then any country in
   `data/countries.json`) whose newest entry is oldest; a new country with no entries goes first [call].
2. **Country setup** (first run for a country only): add it to `data/countries.json` (code, English and local name,
   languages, emergency number) and write `data/<cc>/contacts.json` from official sources (police cybercrime unit,
   consumer agency, banking regulator, national reporting line).
3. **Research.** Read the country's official warning sources (`importer/sources.json`, see below) and reputable news
   from the last 24 months [call]; list candidate scams; drop ones already in `data/<cc>/scams/`.
4. **Draft** up to 10 entries following CONTRIBUTING.md: original language + English for every text field, steps,
   signals, red flags, what to do, `reportTo` (the new contacts), sources with dates.
5. **Validate** with `npm run validate` and `npm test`; fix or drop entries that fail.
6. **Open one pull request** titled `Import: <Country> (<n> scams)` with a review summary: one line per scam, its
   sources, what the importer was unsure about, and anything it dropped and why.

### Official sources per country (`importer/sources.json`) [call]

| Country | Sources to read first |
|---|---|
| US | FTC Consumer Alerts, FBI IC3 public service announcements |
| UK | Action Fraud, National Cyber Security Centre |
| Spain | INCIBE (OSI / 017), Policía Nacional, Guardia Civil |
| Mexico | CONDUSEF, Policía Cibernética (SSPC / state units) |
| Brazil | Febraban, gov.br consumer warnings, state police |
| Australia | Scamwatch (ACCC) |
| Canada | Canadian Anti-Fraud Centre |

The file lists URLs per country; the importer may use other reputable sources but must say so in the PR summary.

### The weekly run

A scheduled Claude Code session (a "scheduled task" on the owner's account) runs every week on a fixed day and time
[call: Mondays, outside the busy morning hours], starts fresh in this repo's cloud environment, and runs
`/import-scams next`. It needs web access to the sources (the environment's network must allow them; if a host is
blocked, the PR summary says which). Running by hand is the same command in any Claude Code session.

### Languages and the data model

- Each entry gains `lang`: its original language code (`es` for Argentina, `en` for US/UK/AU/CA, `pt` for Brazil,
  `es` for Spain and Mexico).
- **Every text field must have the original language and `en`** (validator rule). For English-original entries that is
  one language.
- `examples[].text` keep the original message (how it actually arrives) plus `en`.
- `phrases` keep the original-language phrases (they power matching) plus English phrases.
- The Argentine entries get `lang: "es"` and English versions of every field, drafted by Claude and reviewed by the
  owner in their own PR.

### The site (English only)

- The `/es/` pages are removed; requests to `/es/*` redirect permanently (301) to the same path without `/es` [call].
- The language switch is removed; `site/i18n.js` keeps only English.
- **Entry pages** show the explanation, steps, warning signs and what to do in **English**, and each **sample message in
  its original language** with the English translation underneath. A "Show original" control reveals the whole entry
  in its original language [call].
- The playground keeps matching pasted text in any language the catalogue covers.
- eschamuyo is unaffected: its sync uses the Spanish (`es`) fields of Argentine entries.

## Rollout order [call]

1. **English-only site + languages model**: `lang`, required `en`, English for the 20 Argentine entries, `/es/`
   removed with redirects, entry page shows originals.
2. **Importer skill + `importer/sources.json`**, tested by hand on one country (Australia: English, one strong source).
3. **Weekly schedule** switched on once a hand run produced a good PR.
4. The other countries arrive one per week (or faster by hand).

## Left to the builder

- The skill's exact wording and checklist, the PR summary format.
- How "Show original" looks (within DESIGN.md: icons over words).
- How duplicate detection works (by matching names and phrases against existing entries).
- Redirect mechanism for `/es/*` (Workers static assets `_redirects` or the Worker).
