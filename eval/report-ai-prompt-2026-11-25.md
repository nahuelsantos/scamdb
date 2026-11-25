# AI instructions that describe genuine messages (2026-11-25)

**Problem.** Keyed checks combine the keyword matcher with a Workers AI opinion (`worker/scorer.js`). The model's
instructions said what a scam is, but nothing about what genuine messages look like. It scored many of the owner's
genuine promos, renewals and reminders 0.7–0.95, the same as scams, so they came out "suspicious" (owner's reports:
54% of genuine messages flagged).

**Change.** The system prompt now starts with `GUIDANCE`:
- what genuine company messages do (promote their own app or offers, remind you of renewals, bills, appointments and
  deliveries, deliver a code with a warning, send you to log in yourself or to the number on your card);
- that a brand, a price or a link alone is not a scam;
- what makes a scam: an action through the message itself, a sender pretending, or a first-contact lure (an unexpected
  alert asking you to reply or call, expiring points or prizes, a stranger's job offer).

Nothing else changes: the same model, the same fusion weights and cut-offs, and the keyword check without a key.

## Results (the fused verdict, as keyed checks get it; current fusion weights)

| | before | after |
|---|---|---|
| Owner's reports: genuine flagged | 45/84 (53.6%) | **25/84 (29.8%)** |
| Owner's reports: genuine called "scam" | 0/84 | 0/84 |
| Owner's reports: scams flagged | 7/7 | 7/7 |
| Real set: genuine flagged | 31/105 (29.5%) | **28/105 (26.7%)** |
| Real set: genuine called "scam" | 1/105 | **3/105 (2.9%)** |
| Real set: scams flagged | 228/238 (95.8%) | **228/238 (95.8%)** |

On the real set, 2 scams are no longer flagged (`r-ca-02`, `r-it-03`) and 2 are newly flagged (`r-fr-07`, `r-tw-11`).
The private set also improved: more scams flagged and fewer genuine messages flagged (numbers not published, as for
every private-set result).

The two new "scam" calls on genuine messages are Australian bank alerts asking you to call the bank's fraud department
about a held payment (`r-au-18`, `r-au-19`). They read like the scam version almost word for word. `r-au-15`, the same
template, was already called "scam" before.

A first version without the first-contact lures cleared more genuine messages but missed 6 more real scams (lures that
only ask for a reply), so it was not kept.

Not yet measured: the written set (`eval/messages`, 197 messages with cached AI answers), which the fusion refit also
uses. It is run on the next day's free allowance before merging.

Also tried, not shipped: comparing each message with written examples of genuine messages by embedding similarity.
Genuine messages and scams were equally close to those examples (real set: 0.584 vs 0.572), so it added nothing.

## Cost

About 5.8 Workers AI neurons per check (488 checks ≈ 2,800 neurons), within the free daily allowance. The instructions
add about 300 tokens per check.
