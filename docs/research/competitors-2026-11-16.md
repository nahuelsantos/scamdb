# Competitors and data sources (checked 2026-11-16)

Sites reviewed through their public pages only: no accounts, no form submissions, no scraping. Some pages render
dynamically, so details marked *unverified* could not be confirmed.

**Main finding:** all five are **person/entity lookups**: phone numbers, URLs, wallets, social handles, sometimes
people's names and photos.
- **None of them** catalogues scam *patterns* by country.
- **None of them** has content in Spanish or Portuguese.
- **Only GACS** claims an open licence, and its own terms contradict it.

## Summary

| Site | Reporting | Lookup | Checker | API | Open data | Countries | Languages | Privacy |
|---|---|---|---|---|---|---|---|---|
| GACS (gacs.app) | 5 steps, anonymous, screenshots | Entity directory | URL, wallet, handle | Free, no key | CC BY 4.0 claimed, but terms conflict | Global; US/UK/CA/DE/CH/AU/UAE featured | EN | Medium (handles listed) |
| ScamSearch (scamsearch.io) | 1 page, public | Person-level, reverse image | Search only | Free with key, 30/min | No | "Global" | EN | High risk |
| BBB Scam Tracker | 9 steps, moderated | Rich filters, 90-day heatmap | Lookup | Partner API only | No | US, CA | EN (Spanish PDFs only) | Good for reporters; businesses named |
| Scamers.org | 2 fields, anonymous | Person-level, fuzzy | Text checker | None | No | Claims 190+ (218 reports) | EN | High risk (names, photos) |
| ScamCatcher | 1 page, public | Person-level | Search only | Mentioned, no docs | No | "Global" | EN | High risk; terms links empty; looks like a ScamSearch clone |
| **scamdb** | Private, redacted, screenshots | Patterns by country | Keywords + AI | Free | **CC BY 4.0** | 9 | ES/PT/EN | Pattern-level, no people named |

## Notes per site

**GACS: "Global Anti-Crime & Safety"**
- **Who runs it:** an unnamed "GACS Research Team". It isn't a registered non-profit yet.
- **Features:**
  - free checkers for websites, wallets, email and social handles, plus a Telegram bot;
  - anonymous reporting with screenshots;
  - an A–Z directory with statuses Blacklisted / Temporary / Cleared, and an appeals process;
  - a free API that needs no key (`scams.json`, `domains.csv`, `stats.json`, `trending.json`, RSS) at 10 requests
    per second or less, with CORS.
- **Data:** individual entities, from user reports plus the PhishTank and OpenPhish feeds.
- **Licence conflict:** pages say "Licensed CC BY 4.0", but Terms §7 requires written permission for "large
  excerpts" and §5 bans scraping.

**ScamSearch**
- Anonymous operator, freemium model.
- Person-level reports are fully public, contact details excepted, with no visible checking.
- Its own figures conflict ("4 million" vs "1 million" scammers), and recent activity is small (about 880 reports a
  month).
- Licence: "you will not copy, retransmit, or modify any of the content".

**BBB Scam Tracker** (BBB Institute / IABBB, US non-profit)
- Covers the US and Canada.
- Moderated 9-step reporting.
- Strong lookup with filters and a 90-day heatmap.
- Terms forbid "republication, or aggregation" and compiling data "for any service". BBB holds a sublicensable
  licence to the reports, so bulk data would need a formal agreement.

**Scamers.org** (Delaware non-stock foundation; its 501(c)(3) claim is unverified)
- A 2-field report form, a romance-scammer list with names and photos, and an "I'm Innocent" removal process.
- Only 218 reports.
- No reuse without written permission.

**ScamCatcher**
- Nearly identical to ScamSearch.
- $12/week after a trial.
- "All rights reserved"; the Terms and Privacy links are placeholders.

## What we can do better (prioritised)

1. **Lead with "patterns, not people, in Spanish and Portuguese".** No competitor covers AR, MX, ES or BR in their
   own languages.
2. **Offer an unambiguous open-data download:** dumps under one clear CC BY 4.0 licence with a credit line. GACS
   shows the demand; its contradictory terms are the weakness to avoid.
3. **Answer with a pattern, not a list of people.** Competitors say "this number was reported". scamdb says "this
   matches scam X in your country: warning signs, what to do, where to report". We already do this.
4. **Public trends view,** like BBB's heatmap: aggregated counts by country, scam and brand over 90 days, never
   narratives. The organisation feed already computes this.
5. **Keep reporting short.** Scamers.org gets by with 2 fields. Our form has 2 required fields (country, message)
   plus optional ones, allows screenshots, redacts server-side, and needs no account. Later: optionally forward the
   report to the official agency for the country.
6. **Corrections and appeals channel** for brands named in alerts, as GACS and Scamers.org have.
7. **Make the API easy to adopt:** keyless read endpoints (the static API already is), CORS, an RSS/JSON feed of new
   patterns, published rate limits.

## Data we can use

| Site | Verdict | Why |
|---|---|---|
| GACS | Ask permission first (legal@gacs.app) | CC BY 4.0 claim conflicts with Terms §5/§7; unclear whether third-party feeds and user reports are covered. Person-level data is also a poor fit. At most, aggregate `trending.json` as inspiration for patterns. |
| ScamSearch | No | "you will not copy, retransmit, or modify any of the content"; high privacy/defamation risk |
| BBB Scam Tracker | No (needs a licence agreement) | Terms bar republication, aggregation and compiling data for any service. Can be linked as "where to report", and its public Risk Reports cited. |
| Scamers.org | No | No reuse without written permission; person-level, 218 reports |
| ScamCatcher | No | All rights reserved; no real terms |

**None of these sites should be scraped.**
