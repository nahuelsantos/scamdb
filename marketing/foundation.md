# Marketing foundation (discovery decisions)

The decisions from the discovery phase, stage by stage. The playbook (Stage 4) is built from this file.

## Go-to-market (owner, decided)

1. **Phase 1, supply first (Instagram + X):** everyday people; quick scam breakdowns; the ask is "send us the
   messages you get".
2. **Phase 2, build in public (X):** bot builders and security hobbyists; open metrics, pattern insights, easy API
   access.
3. **Phase 3, enterprise (later):** telcos (SMS filtering) and security-training companies.

## Stage 1: where things stand (2026-11-21)

| Item | Fact | What it means for marketing |
|---|---|---|
| Catalogue | 1,199 documented scams, 76 countries. Every example message is written by us (none is a real received message). | Real teardowns need real messages: from public sources (credited) and, increasingly, from reports. |
| Reports | 89, all from the owner: **84 genuine, 5 scam**. | The gap is **scam messages from other people**. Genuine ones the owner can supply. |
| Report form | **One required thing:** paste the message *or* add a screenshot (screenshots need a free sign-in). Then "Add details (optional)": country (can be detected), channel, what it turned out to be, what happened, email. Bot check (Turnstile). The form promises "we remove personal data before storing". | Low friction: "paste it, press send, done" is an honest promise. The product isn't changing; small fixes only if the numbers show drop-off. |
| Check API `POST /v1/isitascam` | Keyless: 10/day per IP, no AI score. Free key (GitHub sign-in): 50/day, 10/min, with the AI score. A shared daily allowance for everyone; when used up, 503 `checks_paused`/`ai_paused`. | Phase 2 hook: "10 checks a day, no signup; a free key adds the AI score." Risk: one popular bot can use up the shared allowance. Have a plan before Phase 2. |
| Report API `POST /v1/reports` | Keyless: 10/day per IP (Turnstile). Free key: 200/day, 20/min. | **Links the phases:** bots that check messages can also forward them as reports. That's supply from Phase 2. |
| Feed `GET /v1/feed/*` | Approved key only: 500/day, 60/min. | Later (Phase 2–3). |
| Owner's time | **3 hours a week**, faceless, own voice in English. Worried an accent puts people off. | 5 posts a week works because the posts are pre-drafted. Videos are batch-recorded about monthly. Captions always on; test voiced vs captions-only. No AI voice changers. |

## Stage 2: audiences (2026-11-21)

**Instagram persona: "the family helper" (Phase 1).** Aged 25–45. Gets "is this real?" from parents, grandparents
and friends, and is the one who'd paste a message and press send for them. Motivation: protect family, look like the
one who knows. Content they share: clear, kind, fast breakdowns. Ask: "Send us the ones your family gets."

**X during Phase 1:** the same everyday content as Instagram, adapted to 280 characters. No developer content on
@scamdb until Phase 2.

**X persona for Phase 2: the bot builder.** Indie developers who build or run moderation bots for Telegram, Discord or
WhatsApp communities, where scam links and fake "support" DMs are a daily problem. Motivation: keep their
communities clean without writing their own detection. Content: real metrics, scam patterns, a curl call in a
screenshot, "10 checks a day, no signup".

**Where messages come from: everywhere.** Supply is welcome in any language from any country. Accuracy depends on
original wording, and the catalogue is global. **But the content has one default:** English, US examples first, plus
the UK, Canada, Australia and New Zealand for seasonal moments. Every ask says "from anywhere, in any language". An
English account will mostly attract English speakers. Non-English supply will grow slowly, and that's fine for now.

**Owner's genuine messages can appear in content** (owner's decision): only messages the owner submitted, after
personal data is removed, with company names shown as [bank], [delivery company] and so on, and never a real company's
logo or screen layout. They make "Real or scam?" honest: one real genuine message next to one real, credited scam.

**Starting from zero on X:** the owner opened their accounts a week ago. Phase 2 needs a reputation among developers
before it starts.

## Stage 3: voice, look and video formats (2026-11-21)

- **Tone:** dry wit. Calm and a little amused at the scammers, never at the people they target.
- **Look:** the site style, as in the posts and the animation test. Videos run about 25% slower than the test.
- **Video formats (repeatable):** (a) teardown of one real message, (b) "Real or scam?" quiz, (d) screen recording of
  scamdb.dev. Four videos before Black Friday; storyboards in `videos/storyboards.md`, approved by the owner before
  anything is made.
- **Music:** added by the owner on Instagram from its licensed library, at low volume. Voice-only on X. Sound effects
  made by us.

**Voice update (2026-11-22, owner's decision):** the owner didn't like their own reading, so the narration is the
owner's voice generated with ElevenLabs (an instant clone of their own recording). Every video carries an AI-voice
label on the end card, Instagram's "AI info" label, and a note in the X post. Script and settings:
`videos/elevenlabs-script.md`.
