// Fitted by tools/fit-fusion.mjs on 197 labelled messages (eval/). Order: bias, ai, hard, ruleScam, signs, keyword, nearest.
// Re-fit after the labelled set or the engines change; the CI floors in tests/unit/eval.test.mjs still apply.
export const WEIGHTS = [-2.816,3.756,-0.121,1.05,0.1,0.999,0.381];
// Verdict cut-offs on the fused probability.
export const THRESHOLDS = {"scam":0.7,"suspicious":0.4};
