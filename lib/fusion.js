// Score fusion: one calibrated probability that a message is a scam, from the keyword matcher and the Workers AI
// scorer together. A logistic regression (weights in worker/fusion-weights.js, fitted by tools/fit-fusion.mjs on the
// labelled set in eval/) over a few numbers both engines already produce. Open on purpose: the weights say how much
// each signal counts, and the hard rules stay as floors in combine().
import { hardRules } from '../packages/matcher/index.js';

export const FEATURES = ['bias', 'ai', 'hard', 'ruleScam', 'signs', 'keyword', 'nearest'];

/** The inputs, all scaled to 0..1. `matcher` is matchMessage()'s result, `scorer` scoreWithWorkersAI()'s. */
export function features(matcher, scorer) {
  const ids = matcher.signals.map((s) => s.id);
  return [
    1,
    scorer.score,
    hardRules(ids) ? 1 : 0,
    matcher.verdict === 'scam' ? 1 : 0,
    Math.min(ids.length, 4) / 4,
    Math.min(matcher.matches[0]?.score ?? 0, 6) / 6,
    scorer.nearest ?? 0,
  ];
}

const sigmoid = (z) => 1 / (1 + Math.exp(-z));
export const probability = (weights, x) => sigmoid(x.reduce((s, v, i) => s + v * weights[i], 0));

/** Fits weights by gradient descent on log-loss with a little L2 (not on the bias). rows: [{ x, y: 0|1 }]. */
export function fit(rows, { iterations = 4000, rate = 0.5, l2 = 0.01 } = {}) {
  const w = new Array(rows[0].x.length).fill(0);
  for (let it = 0; it < iterations; it++) {
    const g = new Array(w.length).fill(0);
    for (const { x, y } of rows) {
      const err = probability(w, x) - y;
      for (let i = 0; i < w.length; i++) g[i] += err * x[i];
    }
    for (let i = 0; i < w.length; i++) w[i] -= rate * (g[i] / rows.length + (i ? l2 * w[i] : 0));
  }
  return w.map((v) => Math.round(v * 1000) / 1000);
}
