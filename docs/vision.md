# scamdb vision

Date: 2026-11-18 · Owner-confirmed. This replaces the "Intent" and "Who it is for" sections of
`docs/superpowers/specs/2026-11-15-scamdb-design.md` wherever they disagree; the rest of that document still applies
until it is revised.

## What scamdb is

A database of the scam **patterns** of the world, built from **real, documented scams**, and a free detection API
that tells, as accurately as possible, whether a message is a scam, which pattern it follows and what to do.

Channels: phone calls, SMS, WhatsApp, Telegram, email, social media and any other way scams arrive.

## Principles

1. **Patterns first.** A pattern is the script of a scam (who they pretend to be, what they ask for, how they
   pressure). Numbers and links change weekly; scripts last for years. Detection matches messages to patterns.
2. **Only real, documented scams in the database.** Every pattern rests on real scams found online, each with a
   reliable, dated source. A real message is stored in its original language, as published, with phone numbers and
   links replaced by placeholders.
3. **Written examples are allowed, and always flagged.** Once a pattern is known from real messages, we may write
   example messages for languages that have none, for training and testing. Every written message is marked as
   such (`synthetic: true`) so developers never mistake it for a real one, and it never counts in accuracy numbers.
4. **English for the product.** The site, the API and the documentation are in English. Scams are stored in every
   language they arrive in, because accuracy depends on the original wording.
5. **Accuracy is the product.** We build strategies, algorithms and tools to catch more scams and, above all, to
   wrongly flag fewer genuine messages. Accuracy is measured only on real messages, and every change is checked
   against all countries before it ships.
6. **Unknown scams are a feature.** A documented scam that matches no known pattern is set aside, and a human (the
   owner or a reviewer) is notified to investigate. When two or three similar ones collect, a new pattern is
   proposed for approval. The API answers "suspicious, no known pattern" instead of guessing.
7. **Free detection, so it grows.** Like reCAPTCHA: people and developers use detection for free, and that use (with
   consent) is what makes it better. A message someone forwards, and their answer ("it was a scam", "it was really
   my bank"), is the labelled data accuracy needs most.
8. **Automated research.** Tools keep finding new documented scams, re-checking sources and flagging stale
   patterns. Humans approve; they do not do the legwork.
9. **Money is welcome, not the goal.** Licences stay as they are: data CC BY 4.0, code MIT. If scamdb earns money,
   it will be from the hosted service (an always-current API, volume, reliability) and from what cannot be copied
   (the trained model and the private labelled messages), not from closing the catalogue. Marketing and
   distribution come later.

## What this changes in the current project

- **Spanish and eschamuyo are no longer the focus.** Site, docs and API copy move to English only; eschamuyo is
  one possible user like any other.
- **Countries are added only when real, documented scam messages can be found for them**, and only when the owner
  asks. (Five countries without enough real messages were removed on 2026-11-18.)
- **Entry examples written by us** are kept for training but flagged as written; public examples show real quoted
  messages first, with their source.
- **Real messages quoted from articles** are kept with their source and marked as quotations; they are not ours to
  relicense, so they stay outside the CC BY data or are clearly labelled as third-party quotes.
- **The biggest data gap is genuine messages** (real messages that are not scams). Collecting them, with consent,
  is the priority, because they decide the false-alarm rate.

## Decided since

- **Retention (2026-11-18):** a report's redacted text and its outcome are kept, because they are the labelled data
  accuracy needs. After 180 days the contact details, the reporter's own story, the link to their key and any
  extracted phone numbers or domains are deleted. Nothing about a report is ever published.
- **Unknown-scam notifications:** a GitHub issue labelled `unknown-pattern`, kept up to date by the weekly check.

## Open questions for later

- How people forward messages for free (WhatsApp bot, app, web form) and what consent applies.
- Calls need speech-to-text and screenshots need text extraction before they can be matched.
