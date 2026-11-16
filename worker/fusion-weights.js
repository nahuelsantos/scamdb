// Fitted by tools/fit-fusion.mjs on 198 labelled messages (eval/). Order: bias, ai, hard, ruleScam, signs, keyword, nearest.
// Re-fit after the labelled set or the engines change; the CI floors in tests/unit/eval.test.mjs still apply.
export const WEIGHTS = [-2.719,3.684,-0.127,1.035,0.092,0.937,0.388];
// Verdict cut-offs on the fused probability.
export const THRESHOLDS = {"scam":0.7,"suspicious":0.4};
