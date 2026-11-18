# Contributing to scamdb

Thanks for helping people spot scams before they fall for them.

## Licensing

By opening a pull request you agree that your contribution is published under CC BY 4.0 (data) or MIT (code).

## Add or edit a scam

1. Create or edit `data/<country>/scams/<slug>.json`. The slug is lowercase letters, numbers and
   hyphens (`falso-correo`), and the `id` inside is `<country>/<slug>` (`ar/falso-correo`).
2. Run `npm ci` once, then `npm run validate`. Fix anything it reports.
3. Open a pull request. A maintainer reviews every change before it goes live.

A new country also needs an entry in `data/countries.json` and a `data/<country>/contacts.json`
before its first scam.

## The fields

Text fields are objects keyed by language. Every text field needs the scam's **original language**
(the entry's `lang`) **and English**: `{"es": "…", "en": "…"}`. A scam that arrives in English needs
only `en`. Sample messages and phrases keep the original wording; phrases also get English (5 or more
in each language). Contacts and countries follow the same rule.

| Field | Required | What it is |
|---|---|---|
| `id` | yes | `<country>/<slug>`, same as the file path |
| `country` | yes | ISO code, same as the folder (`ar`) |
| `lang` | yes | the language the scam arrives in (`es`, `en`, `pt`…) |
| `status` | yes | `active` (a source from the last 2 years), `fading` (newest source 2–5 years old) or `archived` (older, or no longer seen) |
| `channels` | yes | some of `whatsapp`, `sms`, `phone`, `online`, `in-person`, `email`, `social` |
| `sender` | yes | who the message claims to be, as shown on the phone (`“PAMI”`) |
| `name` | yes | short name people would recognise |
| `how` | yes | how it works, 3–4 short sentences |
| `steps` | yes | the script, step by step (2 or more), each `{ "text": {…}, "signal": "…" }`; `signal` is optional |
| `examples` | yes | sample messages, each `{ "text": {…}, "channel": "…" }`: real messages quoted from a source first; written examples are illustrations and must be flagged |
| `phrases` | yes | at least 5 everyday phrases people use to describe it ("me pidieron un código") |
| `signals` | yes | warning signs from `data/signals.json` |
| `redFlags` | yes | warning signs in plain words |
| `whatToDo` | yes | what to do, in plain words |
| `reportTo` | yes | contact ids from `data/<country>/contacts.json` |
| `sources` | yes | each `{ "title", "publisher", "url", "date" }` |
| `updated` | yes | `YYYY-MM-DD` |
| `story` | no | a real, anonymous case |
| `media` | no | links to videos, audio, articles or posts about it: `{ "type", "url", "title", "publisher", "date" }` |
| `related` | no | ids of related scams |
| `firstSeen` | no | `YYYY-MM`, when it started, if a source says so |

## The rules

- **No source, no scam.** Every source has a title, publisher, an `https://` link and a date.
- **Real messages first.** Every pattern rests on real, documented scams. A real message is quoted as published, in its
  original language, with its source; phone numbers and links are replaced by placeholders (`[link]`, `[number]`, or
  the local word). Never a real link or phone number.
- **Written examples are illustrations.** You may write an example for a language with no real message, in the way
  scammers write, but it must be flagged as written so nobody mistakes it for a real one (see `docs/vision.md`).
- **No personal data.** No real names, numbers or screenshots of real people.
- **Media is linked, never copied.** Credit the publisher.
- Phrases should not shrink to a common word ("hola ma" becomes just "hola").

## Report a scam you received

A private report form is coming. Until then, open an issue describing the scam **without any
personal data**, or contribute an entry directly.
