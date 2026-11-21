# How detection works

How `POST /v1/isitascam` (and the check on the home page) decides whether a message is a scam, what the numbers
mean, and how we know whether it works. Code: `packages/matcher/` (the matcher), `worker/scorer.js` (Workers AI),
`lib/fusion.js` and `worker/fusion-weights.js` (the fused score), `worker/isitascam.js` (the endpoint).

## The pipeline

```
message ──► 1. matcher (always) ─────────────────────────────┐
              warning signs + closest catalogue scams         │
                                                              ▼
            2. Workers AI (only with a key, while the       3. fusion: 7 numbers → one probability
               day's AI allowance lasts)                       → 4. verdict + safety floors
              ├─ embeddings: closest scams by meaning ──────┘
              └─ chat model: its own verdict and score
```

### 1. The keyword matcher (every check, in the browser and in the API)

- **Warning signs** (`signs.js`): patterns in many languages for the moves scams make: pretending to be someone
  (`impersonation`), asking for a code (`asks_for_code`), money, urgency, a link, a new number, secrecy, remote access,
  keeping you on the line, too good to be true. Each sign comes with the words that triggered it (`evidence`).
- **Catalogue match**: the message is compared with each scam's phrases (exact words, one-typo words, whole
  phrases, and special rules for Korean, Thai, Japanese and Chinese). The best scams above a threshold are returned.
  A word index finds the few scams that share any word with the message, so only those are compared (1.35.0).
- **Its verdict**: `scam` when the signs form the shape of a scam (a code request; remote access; money plus a sign
  that it isn't who or what it seems; urgency plus an action such as paying or clicking), `suspicious` when there are
  signs or matches, otherwise `not_recognised`. A forwarded warning about a scam is never called `scam`.

Checks without a key stop here: the answer is the matcher's, with `score: null`. No AI is ever used for them.

### 2. Workers AI (checks with a key)

Two calls run at the same time, with an 8-second limit (`worker/scorer.js`):

- **Embeddings** (`@cf/baai/bge-m3`, multilingual): the scams closest in meaning, which also finds a scam documented in
  another country and language. `nearest` is the best similarity (0–1).
- **Chat model** (`@cf/google/gemma-4-26b-a4b-it`): reads the message, with the matcher's matches as hints, and answers
  with a verdict, a score from 0 to 1 and the signs it saw, quoting the words. A sign is kept only if its quote is
  really in the message.

If the AI fails or times out, the matcher's answer is returned unchanged.

*Timing:* with a key, `POST /v1/isitascam` answers at once with the catalogue check (steps 1–2); the AI and the fused
score (steps 3–4) run after the response and are fetched from `GET /v1/isitascam/{id}`, unless the caller sends
`wait: true`.

### 3. The fused score (`lib/fusion.js`)

A logistic regression turns seven numbers, each from 0 to 1, into one probability that the message is a scam:

| Feature | What it is | Weight today |
|---|---|---|
| bias | constant | −2.049 |
| `ai` | the chat model's score | 3.359 |
| `hard` | a hard rule fired (code request, remote access, or money plus impersonation) | 0 (the floor below handles it) |
| `ruleScam` | the matcher's verdict was `scam` | 0.878 |
| `signs` | number of warning signs, up to 4, divided by 4 | 0 |
| `keyword` | strength of the best catalogue match, up to 6, divided by 6 | 0.702 |
| `nearest` | best embedding similarity | 0.322 |

`probability = 1 / (1 + e^-(bias + Σ weight × feature))`. Reading the weights: the AI score counts most; the matcher
saying `scam` and a strong catalogue match each add about as much as a quarter of the AI scale; the others barely
matter. A message the AI scores 0.95, with no matcher verdict, no catalogue match and a nearest similarity of 0.55, gets
p ≈ 0.79: `suspicious`, not `scam` (the cut-off is 0.85). Weights from the 2026-11-21 refit on real messages,
`eval/report-fusion-refit-2026-11-21.md`.

### 4. Verdict and floors

- p ≥ 0.85 → `scam`; p ≥ 0.40 → `suspicious`; otherwise `not_recognised` (`THRESHOLDS`). The `scam` cut-off was 0.70
  until 2026-11-21; it was raised because genuine bank, card and delivery alerts scored 0.70–0.85.
- Floor: if a hard rule fired, the verdict is at least `suspicious`, whatever the AI says.
- A warning about a scam is never `scam`.
- `pattern` is `known` when a catalogue scam matches, `unknown` when it reads as a scam but matches none (these are
  collected for a human to review), `null` when not recognised.

## How we know it works

Accuracy is measured on **real messages only** (`eval/real`: quoted from public, dated sources, with the source kept),
never on messages we wrote. `node tools/eval.mjs --real` scores the matcher; `--ai` adds the AI (needs Workers AI).
CI holds floors on the matcher's numbers (`tests/unit/eval.test.mjs`). The private set (`eval/private.enc`) is kept
encrypted so nobody can tune a scam against it.

## The weights: where they came from and how good they are

Review on 2026-11-18 (`eval/report-ai-fusion.md` has the full numbers).

- **Training data.** The weights were fitted on 16 November on 197 messages **we wrote** (107 scams, 90 genuine,
  9 countries), with matcher 1.2. Written messages are easier than real ones: a hard rule fires on 19% of written scams
  but on 4% of real ones, and the matcher calls 50% of written scams `scam` but 32% of real ones. So the fit trusts
  the matcher a little more than real messages justify.
- **How they do on real messages anyway.** On the 215 real messages that have saved AI answers (172 scams, 43 genuine,
  18 countries): 165 of 172 scams caught, 146 called `scam`; 7 of 43 genuine messages called `scam`, 11 flagged.
  AUC 0.92.
- **Refits we tried** (all scored on the real set, held out by country so no country is scored by weights that saw
  it): fitting on real only, on real plus written, and with genuine messages weighted up. None was clearly better.
  They trade a few scams called `scam` against a few genuine ones called `scam`.
- **The AI score alone ranks real messages as well as the fusion** (AUC 0.925 vs 0.916; the fusion wins in only 25%
  of bootstrap resamples). What the fusion adds is caution: 7 genuine messages called `scam` instead of 10, at the cost
  of 17 scams called `suspicious` instead of `scam`.
- **The real limit is the number of genuine messages.** With 43, one message moves the false-alarm rate by 2.3
  points, so most differences above are noise. 105 genuine real messages exist now, but only 43 have AI answers.

## Plan to improve the weights

Steps 1–5 were done on 2026-11-21 (`eval/report-fusion-refit-2026-11-21.md`): on real messages, genuine called `scam`
went from 13.3% to 1–3% (cross-validated), scams flagged from 95.0% to 95.8%, scams called `scam` from 83.6% to about
55% (the rest are `suspicious`). Next: score the owner's own messages with the AI and add them, and find a better signal
so more scams can be called `scam` again without genuine alerts following.


1. **Score every real message with the AI** (the nightly AI eval: 343 messages instead of 215), then refit.
2. **Fit and judge on real messages, held out by country.** Written messages may be added for languages with no real
   genuine messages, but every number we report comes from real ones.
3. **Decide the trade-off first, then set the thresholds.** The vision says wrongly flagging fewer genuine messages
   comes first. Proposed target: at most 5% of genuine messages called `scam`, and as many scams as possible
   called at least `suspicious`. The thresholds are then chosen to meet that, instead of fixed at 0.7 and 0.4.
4. **Fewer features.** `hard` and `signs` carry almost no weight (`hard` is negative, and the hard-rule floor already
   handles it). Dropping them makes the fit steadier with little data.
5. **Adopt new weights only when they win clearly** on held-out real messages: no more genuine messages called `scam`,
   and more scams caught than the noise (about 2 messages per 100).
6. **More genuine messages.** This is the biggest lever: every report where someone answers "it was really my bank"
   becomes a labelled genuine message in the private set (`lib/private-eval.js`).
7. **Refit on a schedule** (monthly, or when the matcher or the AI model changes), with the numbers recorded in
   `eval/report-ai-fusion.md` and `docs/progress.md`.

A note on the probability itself: it is calibrated to the sets we fit on, where most messages are scams. Real
traffic has a different mix, so `score` should be read as "how scam-like" rather than an exact chance.
