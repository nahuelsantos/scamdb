# Fusion weights refit on real messages (2026-11-21)

Target (owner-approved): on real messages, genuine called "scam" ≤ 5%, scams flagged (scam or suspicious) ≥ 95%.
Verdicts are computed exactly as `worker/scorer.js` `combine()` does: fused probability, cut-offs, hard-rule floor to
"suspicious", a warning about a scam capped at "suspicious". AI answers: the cached Workers AI (gemma-4) answers in
`ai-real.json` (343 real), `ai-gemma-short.json` (197 written), `ai-private-short.json` (54 private). No new AI calls.

## Proposal

`refit/fusion-weights.js` (drop-in for `worker/fusion-weights.js`, no code change):

- Weights `[-2.049, 3.359, 0, 0.878, 0, 0.702, 0.322]` (bias, ai, hard, ruleScam, signs, keyword, nearest).
  `hard` and `signs` are 0: no feature set with them did better on held-out real messages; the hard rules still floor a
  verdict at "suspicious" in `combine()`, so they keep working as a safety net.
- Thresholds: scam **0.85** (was 0.7), suspicious 0.4 (unchanged).
- Fitted on the 343 real + 197 written messages (L2 0.01, no class weighting).

## Results

Real set (343: 238 scams, 105 genuine)

| | scams flagged | scams called "scam" | genuine called "scam" | genuine flagged |
|---|---|---|---|---|
| current weights | 95.0% (226) | 83.6% | **13.3% (14/105)** | 29.5% |
| proposal, in-sample | 95.8% (228) | 55.0% | **1.0% (1/105)** | 29.5% |
| proposal, leave-one-country-out | 95.8% | 54.6% | **2.9% (3/105)** | 29.5% |
| proposal, 5×5-fold CV (mean) | 95.8% | 54.2% | **1.9%** | 29.5% |

Other sets (not used to choose the cut-off; private never used for fitting)

| set | before | after |
|---|---|---|
| written (197) | flagged 98.1%, called scam 93.5%, genuine called scam 0/90 | flagged 98.1%, called scam 72.0%, genuine called scam 0/90 |
| private (54 with AI answers) | flagged 92.6%, called scam 77.8%, genuine called scam 0/27, genuine flagged 0% | flagged 92.6%, called scam 59.3%, genuine called scam 0/27, genuine flagged 7.4% |

Per country (real): genuine called scam drops in au 4→1, gb 3→0, id 2→0, es/fr/it/jp/us 1→0. No scam loses its flag
anywhere (2 gain one: gb, it). The one genuine message still called "scam": `r-au-15`.

## Trade-off (honest)

The target is met without losing any flagged scam, but about 30% of scams move from "scam" to "suspicious" (still
flagged, still shown with the warning and the matching entries). The reason: Workers AI gives coarse scores (mostly 0.9
or 0.95) to genuine bank, card and delivery alerts and to scams alike, so the only lever that separates them is a
higher "scam" cut-off. The cliff is steep (CV genuine called scam: 0.8 → 8.8%, 0.85 → 1.9%, 0.9 → 0%), so 0.85 is the
point with margin. Getting "scam" back for those messages needs a better signal, not new weights: e.g. the AI's
nearest-entry similarity per country, more genuine examples in the catalogue embeddings, or a prompt that grades
genuine-looking alerts lower.

Not covered: the owner's own 84 messages in D1 reports have no cached AI answers (the fusion only runs on keyed
checks with AI), so they could not be scored here; one Workers AI run over them (within the free allowance) would add
them. The CI floors in `tests/unit/eval.test.mjs` measure the matcher only and are unaffected; the full test suite
passes with the proposal (unit 386, worker 127, run on a scratch copy of main).

## Reproduce

```bash
cd <scratch folder with the refit scripts and the cached AI answers (ai-real.json, ai-gemma-short.json, ai-private-short.json)>
node baseline.mjs     # current weights on real, written, private
node search.mjs       # 5x repeated stratified 5-fold CV over feature sets, L2, class weight, +written, thresholds
node pick.mjs         # candidates across scam cut-offs
node final.mjs        # leave-one-country-out, final fit, before/after, writes fusion-weights.js
```
