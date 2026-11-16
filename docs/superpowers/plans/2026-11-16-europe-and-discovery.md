# Europe and worldwide discovery: plan

**Goal:**
1. Add European countries and languages in waves.
2. Keep the catalogue current worldwide with a free, legal discovery pipeline that spots new and rising scams and
   hands them to the weekly importer as leads, for human review.

**Research:**
- `docs/research/europe-sources-2026-11-16.md`
- `docs/research/discovery-sources-2026-11-16.md`

## Part A: the matcher for any script (before new languages)

1. **`lib/text.js` normalise:**
   - Fold ß→ss, ø→o, æ→ae, œ→oe, ł→l, đ/ð→d, þ→th, ı/İ→i.
   - Keep `\p{L}` letters (Greek, Cyrillic) and `€`, `£`.
   - Mirror the same rules in `normalizeWithMap`, so the evidence quotes still line up.
   - Tests: `Straße` → `strasse`; `Łódź` → `lodz`; Greek and Cyrillic survive; `€1.480` keeps its sign. The 450
     labelled messages must score the same as before.
2. **Stop words per language** (fr, de, it, nl, pl…).
3. **Context rules per language** ("never share this code") before each language goes live.

## Part B: European waves

Each wave adds, per country:
- **Data:** `data/countries.json` entries, contacts (`data/<cc>/contacts.json`, where to report) and brands.
- **Matcher:** sign rules for the new languages.
- **Catalogue:** 15–20 entries from dated official sources (via the import skill, owner review).
- **Labelled messages:** 50 public per country, plus private ones.

| Wave | Countries | Language work |
|---|---|---|
| 1 | PT, IE, MT | pt-PT terms (MB WAY, Multibanco), en already done |
| 2 | FR, BE, LU, NL | French and Dutch rulesets |
| 3 | DE, AT, CH, LI | German ruleset |
| 4 | IT, PL, RO, MD | Italian, Polish, Romanian |
| 5 | UA, TR, GR, CY, BG | Needs Part A (Cyrillic, Greek, Turkish) |
| 6 | SE, DK, NO, FI, IS | Nordic rulesets |
| 7 | CZ, SK, HU, SI, HR | |
| 8 | EE, LV, LT | |
| 9 | RS, BA, ME, MK, AL, XK | |

**Licences:** we always write our own text and cite sources. Open licences (Etalab, CC0, OGL, CC BY) would allow
more, but we don't rely on them.

## Part C: discovery pipeline (GitHub Actions, daily)

```
tools/discover/feeds.json   allowed sources: { id, url, type: agency|news, country, lang, terms, allowed, maxPerDay }
tools/discover.mjs          daily (GitHub Actions cron):
  1. fetch the allowed agency RSS/Atom feeds (ETag / If-Modified-Since, honest User-Agent)
  2. GDELT DOC API per country: artlist (1 day) and timelinevolraw (3 months), 1 request per 6 s with backoff
  3. keep only: url, title, date, publisher domain, country, language, source type (no authors, no bodies)
  4. dedupe (canonical URL, SimHash on titles)
  5. classify each item against the catalogue (keyword matcher plus the brand list) for that country
  6. signals:
     NEW    3+ distinct sources (1 agency or 2 news domains) matching no existing entry
     SPIKE  a scam type's weekly count at least 3 sd above its 4-week baseline, from 5+ domains
     AGENCY every new official item
  7. write signals/<year>-W<week>.json: our own one-line label, counts, first seen, up to 5 links
     (URL, publisher, date). Titles and snippets are never published.
weekly: a "Signals <week>" GitHub issue; the import skill reads accepted signals as leads,
        then finds and cites official/reputable sources itself (signals are never the citation).
```

**Rules:**
- **Hygiene:** links, dates and counts only. CI fails if a feed marked `allowed: false` is enabled.
- **Credit:** GDELT is credited in the signals file and the README.
- **Privacy:** no usernames or handles, no phone numbers, no scam URLs.
- **Not used:** Reddit, X, Telegram, YouTube analytics, OpenPhish.
- **Health:** a feed failing for 7 days opens a `pipeline-health` issue.

## Order of work

1. **Now:** Part A normaliser (code) and Part C, the discovery pipeline: fetch, store, signals, weekly issue.
2. **Then:** wave 1 (PT, IE, MT): countries, contacts, brands, pt-PT rules. Content via the import skill, owner
   review.
3. **Then:** waves 2 and 3, one PR per language ruleset plus import PRs per country.
