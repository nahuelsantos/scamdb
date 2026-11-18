# scamdb marketing brief

The starting point for anyone (person or agent) promoting scamdb on social media. It summarises the vision
(`docs/vision.md`), the design rules (`DESIGN.md`) and the account setup (`docs/social.md`). Those three files win if
anything here disagrees.

## What scamdb is

A free, open field guide to scams: **1,199 documented scams from 76 countries** (2026-11-18; `npm run build` prints
the current count). Each scam has its script step by step, real example messages with their source, the warning signs,
what to do and who to report it to. Anyone can paste a message on scamdb.dev and see whether it matches a known scam;
the check runs in the browser and nothing is sent. Developers get the same check as a free API and the whole catalogue
as open data (CC BY 4.0; code MIT).

**Why it matters (the one-line pitch):** scammers change numbers and links every week, but the script stays the same
for years. Learn the script and you'll spot the scam.

## Goal of the social accounts

Bring people to scamdb.dev to **check a message for free**, and make scamdb the place people think of when a message
looks wrong. Growth comes from free, useful detection (the reCAPTCHA idea in the vision), not from ads. Money is
welcome but not the goal.

Secondary goals: get people to **report** scams they receive (scamdb.dev/report), and get developers to use the API.

## Accounts

| Network | Handle | Link |
|---|---|---|
| Instagram (Business account, category Website) | @scamdb.dev | https://www.instagram.com/scamdb.dev/ |
| X (free Professional account) | @scamdb | https://x.com/scamdb |

Free X posts are limited to **280 characters** (a link counts as 23). Instagram captions allow 2,200; 3–5 hashtags.

## Audience

1. **Everyday people** who just got a strange text, call or WhatsApp, and the relatives who get asked "is this real?".
   Older adults and their families are a priority: grandparent, fake bank and fake government scams hit them hardest.
2. **People who help others**: journalists, teachers, librarians, consumer and senior organisations, police
   prevention teams. They share content that is accurate and sourced.
3. **Developers and companies** (banks, telcos, messaging apps) who could use the API.

The site, the API and the docs are in **English**; English is the default for posts. The US is the default example
country. Real messages are always quoted in their original language, with an English line explaining them.

## Voice and tone

- **A calm friend who knows the tricks.** Plain words, short sentences, no jargon. Explain how the trick works, never
  just "beware!".
- **Never shame victims.** Scams work on smart people; say "they" (the scammers) did something, not "you fell for".
- **Specific over scary.** Show the real message, the 3–4 warning signs and the one thing to do. No fear-mongering, no
  ALL CAPS, no siren emoji.
- **Honest about limits.** scamdb matches known scam patterns; it can miss new ones and say "not recognised". Never claim
  it catches everything.
- **Credit sources.** Every real message comes from a public, dated source (a government warning, a bank, a news
  article); name it in the post, as the catalogue does.

## Hard rules

1. **Only real, documented scams.** Never invent a scam message and present it as real. A written example must be
   labelled as an example ("an example of how this one reads").
2. **No impersonation.** Never use a real bank's, company's or agency's logo, branding or look in an image. Name them in
   text only when quoting a real warning ("the FTC warns…").
3. **No personal data.** Phone numbers, links, names and account numbers in real messages are replaced with
   placeholders like [number] and [link], exactly as in the catalogue. Never post a live scam link.
4. **Reports are private.** Never post anything taken from a report someone sent to scamdb.
5. **No paid ads** without the owner's OK.
6. **The owner approves before anything is published.** Agents draft; the owner posts.

## Visual style

Every image should look like the site: a hand-drawn field guide, not a stock "cyber security" graphic.

- **Colours:** paper `#eceee4` background, deep green ink `#1d2a20` for text and pen lines, card `#fafbf6` for
  shapes, and **one pink accent** `#d63d74` per image for the thing to notice (the red flag, the stamp). Lime
  highlighter `#d4e88a` behind a key word, sparingly. Dark versions: paper `#131a15`, ink `#e7ebde`, pink `#ff6f9f`.
- **Type:** Space Grotesk 700 for headlines, IBM Plex Sans for text, IBM Plex Mono for ids and labels, Patrick Hand for
  handwritten notes with arrows.
- **Drawings:** pen lines traced twice with hatched shading down and to the right (`lib/sketch.js`). No photos, stock
  icons, emoji, gradients or glassmorphism.
- **Recurring elements:** the anglerfish logo (its pink lure is the bait that hides the trap), the phone with a
  message bubble, handwritten notes with arrows pointing at warning signs, and the tilted pink **SCAM** stamp.
- **Sizes:** Instagram posts 1080×1350 (portrait) or 1080×1080; stories and reels 1080×1920; X images 1600×900 or
  1200×675. Keep 60px margins, and keep text large enough to read on a phone.

## Assets

| File | What |
|---|---|
| `docs/brand/scamdb-profile-1080.png` | Profile picture (both accounts) |
| `docs/brand/scamdb-x-header-1500x500.png` | X header |
| `site/assets/og.png` | Link preview card (1200×630) |
| `site/templates/logo.js` | The anglerfish logo as SVG (`LOGO`, `FAVICON`) |
| `site/templates/home.js` | The hero phone drawing (`heroArt`) |
| `site/templates/icons.js` | Catalogue icons per kind of scam (`ICONS`, `kindOf`) and step icons (`STEP_ICONS`) |
| `site/assets/styles.css` | Colour and type tokens |
| `data/<country>/scams/*.json` | The catalogue: name, script steps, examples (real ones carry `source`), signals, what to do |

New images can be drawn with the same tools: build an HTML page with `/assets/styles.css` and the SVG helpers, serve
`dist/` locally and screenshot it with Playwright at the target size.

## Content pillars

1. **Scam of the week:** one catalogue entry. A carousel: the real message, the script in 3–4 steps with their
   warning signs, what to do, and a link to its page.
2. **Real or scam?:** a genuine message beside a scam that copies it (bank alerts, delivery texts). The answer on the
   next slide or in a reply. This is the strongest format for engagement.
3. **Trending now:** when an official warning (FTC, FBI IC3, police, a bank) describes a scam, post it the same day with
   the matching catalogue entry. Speed matters more than polish.
4. **How the trick works:** one tactic at a time (urgency, "read me the code", "move your money to a safe account",
   "new number, Mum"). This is the pattern idea behind scamdb.
5. **Behind scamdb (occasional):** open data, the API, new countries, accuracy numbers. Aimed at developers and press.

## Calls to action, in order of priority

1. "Check a message: scamdb.dev"
2. "Got one? Report it: scamdb.dev/report"
3. "Share this with someone who'd get this message"
4. For developers: "Free API and open data: scamdb.dev/docs"
