// Fitted by the 2026-11-21 refit on 343 real messages (eval/real) + 197 written ones (eval/messages), with the
// Workers AI answers cached on 2026-11-19. Order: bias, ai, hard, ruleScam, signs, keyword, nearest. `hard` and `signs`
// are 0: they did not help on real messages (the hard rules still floor a verdict at "suspicious" in combine()).
// The "scam" cut-off is 0.85 (was 0.7): genuine bank, card and delivery alerts scored 0.7-0.85; scams there are now
// "suspicious", still flagged. Re-fit after the real set or the engines change; the CI floors in tests/unit/eval.test.mjs still apply.
export const WEIGHTS = [-2.049,3.359,0,0.878,0,0.702,0.322];
// Verdict cut-offs on the fused probability.
export const THRESHOLDS = {"scam":0.85,"suspicious":0.4};
