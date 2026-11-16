# Worldwide import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make scamdb English-only with every scam in its original language plus English, then add an importer that drafts one country's scams per run (weekly and by hand) as a pull request for the owner.

**Architecture:** Entries gain `lang` and must carry `en`; the validator enforces it; the site renders English with originals beside them; the matcher reads every language. The importer is a Claude Code skill (`.claude/skills/import-scams/`) backed by a small deterministic helper (`tools/importer.mjs`) for picking the country, deduping and remembering rejections; a scheduled cloud session runs it weekly.

**Tech Stack:** existing Node build and tests; Claude Code skill (Markdown); scheduled task on the owner's account.

**Spec:** `docs/superpowers/specs/2026-11-16-worldwide-import-design.md` (and `2026-11-15-scamdb-design.md`).

## Global Constraints

- Every text field in entries, contacts and countries has the original language and `en`; entries declare `lang` (original). English-original entries need only `en`.
- Sample messages and phrases keep the original language; phrases also get English (≥ 5 per language).
- Site interface English only; `/es/*` → 301 to the same path without `/es`.
- eschamuyo's generated `scams.json` stays byte-identical (sync sends only `es`).
- Import runs: one PR at a time (label `import`), ≤ 10 entries, sources from the last 24 months, official first; nothing auto-merges; rejected scams recorded in `importer/rejected.json`.
- Countries: `au` (first, by hand), then `us`, `gb`, `ca`, `es`, `mx`, `br`.

## Review Focus

1. **An English-original entry** (`lang: "en"`) with no other language must validate and render without an "original" block duplicating the English. (Task 1, Task 2)
2. **A stale `/es/...` link** (bookmarks, eschamuyo's contribute link) lands on the English page, not a 404. (Task 2)
3. **eschamuyo round trip** stays byte-identical after Argentine entries gain `en`. (Task 1)
4. **Pasting an English scam** in the playground gets English warning signs and a match from an English entry. (Task 3)
5. **`next` with a country already pending in an open import PR** is skipped, not re-picked. (Task 4)

---

### Task 1: Languages in the data (`lang`, required `en`) and English for Argentina

**Files:** `schema/entry.schema.json` (+`lang`), `tools/validate.mjs`, `tools/to-eschamuyo.mjs` (copy only `es`), `data/ar/scams/*.json`, `data/ar/contacts.json`, `data/countries.json`, `tests/unit/validate.test.mjs`, `tests/fixtures/repo-ok/**`, `CONTRIBUTING.md`.

**Interfaces — Produces:** entry field `lang: string` (`^[a-z]{2}$`, required); validator errors `"<path>: <field> needs an English version (en)"` and `"<path>: <field> needs the original language (<lang>)"`; `toEschamuyo` emits `{ es: … }` objects only.

- [ ] Tests first: `rejects an entry without lang`; `rejects a field missing en` (`how: { es }` on a `lang: es` entry); `rejects a field missing the original` (`lang: pt`, `how: { en }`); `accepts an English-original entry with only en`; `rejects a contact name without en`; existing round-trip test (to-eschamuyo) must still deep-equal the fixture after the real data gains `en`.
- [ ] Implement schema + validator (walk every text/textList field of entries, contacts, countries); `to-eschamuyo` picks `es` from each text object.
- [ ] Write English for all 20 Argentine entries (name, sender, how, steps, examples, phrases ≥ 5, redFlags, whatToDo, story) and contacts/countries; set `lang: "es"`. Fixtures updated (br fixture `lang: pt` with `en`).
- [ ] `npm run validate && npm test` → PASS; commit `feat(data): original language plus English everywhere`.

### Task 2: English-only site with originals

**Files:** `site/i18n.js` (English only, `LANGS = ['en']`), `site/templates/*.js`, `tools/build-site.mjs`, `site/_redirects` (new: `/es/* /:splat 301`), `tools/build.mjs` (copy `_redirects`), `site/assets/styles.css`, tests (unit + e2e).

**Interfaces — Produces:** entry page sections render `pick(field, 'en')`; each example renders `<blockquote lang="<orig>">original</blockquote>` + `<p class="translation" lang="en">English</p>` when `lang !== 'en'`; a "Show original" icon button toggles a `<div class="original" lang="<orig>" hidden>` with the original how/steps/redFlags/whatToDo (no JS → shown in a `<details>`).

- [ ] Tests first: `no /es/ pages are built`; `_redirects sends /es/* to /:splat with 301`; `entry page shows English how and the original example with its translation`; `an English-original entry has no original block`; `no language switch`; e2e: axe and 360 px on the entry page with the original open; old `/es/` e2e tests removed.
- [ ] Implement; remove Spanish strings and `prefix()` uses.
- [ ] `npm test && npm run e2e` PASS; commit `feat(site): English-only, scams shown in their original language too`.

### Task 3: Matcher reads every language; English warning signs

**Files:** `packages/matcher/index.js`, `packages/matcher/signs.js`, `lib/text.js` (English stop words added to the filler list), `site/assets/playground.js` + `site/templates/home.js` + `tools/build-site.mjs` (one `assets/entries.json` with all countries), tests.

**Interfaces — Produces:** `matchMessage(text, entries, { country?, limit? })` scores each entry against the phrases and name in **every** language it has; `SIGNS` regexes cover Spanish and English (same ten ids); `readSigns` unchanged signature.

- [ ] Tests first: `an English code request reads asks_for_code` ("They'll send you a 6-digit code, read it to me"); `English urgency, money, link, secrecy, keep on line, too good to be true` (one each); `matches an English phrase of an Argentine entry` ("they asked me for a WhatsApp code" → `ar/whatsapp-codigo`); all existing Spanish matcher tests still pass; `playground loads entries.json` (e2e: paste an English scam → verdict `scam`).
- [ ] Implement; commit `feat(matcher): every language, English warning signs`.

### Task 4: Importer helper, sources and skill

**Files:** `tools/importer.mjs`, `importer/sources.json`, `importer/rejected.json` (`[]`), `.claude/skills/import-scams/SKILL.md`, `tests/unit/importer.test.mjs`, `README.md` ("Importing scams").

**Interfaces — Produces:**
- `TARGETS = ['au', 'us', 'gb', 'ca', 'es', 'mx', 'br']`.
- `pickNext(repo, { pending: string[] }) : string` — first target with no entries (in TARGETS order) not in `pending`; otherwise the country (targets, then others) whose newest `updated` is oldest, skipping `pending`; throws `'nothing to import'` if all pending.
- `isDuplicate(candidate: { name, phrases }, entries) : string | null` — id of an existing same-country entry whose normalized name or ≥ 3 shared phrases match.
- `isRejected(candidate: { country, slug, name }, rejected) : boolean`.
- CLI: `node tools/importer.mjs next [--pending au,us]` prints the code; `node tools/importer.mjs status` prints per-country counts and newest dates.
- `sources.json`: `{ "<cc>": [{ "name", "url", "kind": "official"|"news" }] }` for the seven targets (official URLs from the spec table).
- `SKILL.md`: the run checklist from the spec (one import at a time via GitHub open PRs with label `import`; record rejections from closed import PRs; pick; country setup; research ≤ 24 months; draft ≤ 10 with original + en; validate; open PR `Import: <Country> (<n> scams)` labelled `import` with the review summary).

- [ ] Tests first: `pickNext prefers a target with no entries`; `pickNext skips pending`; `pickNext falls back to the oldest country`; `throws when everything is pending`; `isDuplicate by name`; `isDuplicate by shared phrases`; `isRejected by slug`; `sources.json lists official https sources for every target`.
- [ ] Implement; commit `feat(importer): helper, sources and the import-scams skill`.

### Task 5: First hand run: Australia (content PR, owner reviews)

- [ ] On a separate branch from `main` after Tasks 1–4 merge: run the skill for `au` (country setup, contacts, up to 10 scams from Scamwatch and other official sources), validate, open `Import: Australia (n scams)` labelled `import`. **Do not merge**; the owner reviews.

### Task 6: Weekly schedule (after the owner approves the Australia PR)

- [ ] Create a scheduled task (fresh session each run, this environment, scamdb repo) every Monday at 13:23 UTC [call: outside 06–09 Pacific], prompt `/import-scams next`. Report its id to the owner; it can be paused or run on demand.
