# Real messages

Messages quoted **verbatim** in official warnings, news reports or genuine notices, each with its source. They are
kept apart from `eval/messages` (written by research agents to cover the catalogue) so `node tools/eval.mjs --real`
shows how the matcher does on text nobody wrote for it.

- One file per country, `<cc>.json`: `{ "country": "<cc>", "messages": [...] }`.
- Each message: `id` (`r-<cc>-NN`), `label` (`scam` or `safe`), `scam` (a catalogue entry id from that country, or
  `null` when no entry covers it yet), `channel` (`sms`, `whatsapp`, `email`, `call`, `social`), `text`, and `source`
  (`url`, `publisher`, `date`).
- Copy the message as the source shows it; replace phone numbers, card numbers and links with `[number]` and `[link]`
  (or the local equivalent). Never add or improve words.
- Rules must not be written from these messages one by one: they are for measuring. When a rule change is tested,
  the real set is the check that it generalises.
