# Report attachments, redaction and the organisation feed: plan

**Goal:** make reporting easy (screenshots too) without storing personal data, then turn reports into an
aggregated feed for organisations: trends and brand alerts, never raw reports.

**Decisions** (owner, 2026-11-16):
- **Screenshots are read and dropped.** Only the extracted text is kept.
- **Personal data is replaced with placeholders before storage:** phone numbers, emails, card and account numbers,
  greeting names.
- **Scammer links are kept privately.** Phone numbers are kept only as salted hashes, so they can be counted but
  not read.
- **The feed shares aggregates and redacted examples only.** Access is by approved organisation keys under short
  terms: no re-identification, no public naming. It's free for CERTs, police, consumer agencies and non-profits.
- **Raw reports are never shared.**

## PR 1: redaction and screenshot reports
- `lib/redact.js`: `redact(text) -> { text, found }`. Links → `[link]`, emails → `[email]`, cards → `[card]`,
  account numbers (CBU, CLABE, IBAN, CPF) → `[account]`, phones → `[number]`, names after a greeting → `[name]`.
  `found` holds the domains and the normalised phone digits, for PR 2.
- `/v1/reports` redacts `text` and `whatHappened` before insert. `contact` is the reporter's own and stays as
  given (private, retention unchanged).
- `/v1/reports` accepts multipart with `image` (keyed only, like `/v1/isitascam`). The text is read with Workers
  AI, redacted, and stored; the image is never stored.
- Tests: redaction cases in es/en/pt; a stored report has no phone or link; an image report stores only redacted
  text.

## PR 2: private indicators and tagging
- `report_indicators (report_id, kind, value)`: `domain` (the link's host) and `phone` (an HMAC-SHA256 of the
  digits with `IP_SALT`, so the same number can be counted but not read).
- Each report also stores the matcher's top catalogue match (`scam_id`) and the brands it names (`brands`, from
  a curated `data/brands.json`).
- Retention follows the report (180 days).

## PR 3: the organisation feed
- `keys.org` (organisation name) and `keys.feed` (0/1, set by the owner by hand) mark feed access.
- `GET /v1/feed/trends?country=&weeks=`: weekly report counts per catalogue scam and per channel, plus rising
  scams (up against the previous 4 weeks). Counts under 3 are withheld (k-anonymity).
- `GET /v1/feed/brands?brand=&country=`: weekly reports naming the brand, with up to 5 redacted example texts
  (only from reports with 3 or more look-alikes, so no single person's message is shown).
- A docs section, `/feed/terms/` (plain-language terms), and an owner tool to approve an organisation.

## Not now
- **Indicator lists** for organisations come later: verified domains only, after several independent reports and
  owner review.
- **Paid tiers:** pricing is the owner's decision.
