// The free Workers AI scorer behind one interface: embeddings find the closest catalogue entries, a small instruct
// model gives a verdict, a score and the warning signs with quotes. Any failure returns null and the matcher answers.
import { hardRules } from '../packages/matcher/index.js';

export const MODELS = { embed: '@cf/baai/bge-m3', chat: '@cf/meta/llama-3.1-8b-instruct' };
export const TIMEOUT_MS = 4000;
const SIMILAR = 0.6;
const BATCH = 50;
const VERDICTS = ['scam', 'suspicious', 'not_recognised'];

let vectors = null; // { version, list: [{ id, v }] }
export const _resetCache = () => { vectors = null; };

const entryText = (e) => [...Object.values(e.name ?? {}), ...Object.values(e.phrases ?? {}).flat()].join(' · ');
const embedAll = async (ai, texts) => {
  const out = [];
  for (let i = 0; i < texts.length; i += BATCH) out.push(...(await ai.run(MODELS.embed, { text: texts.slice(i, i + BATCH) })).data);
  return out;
};
function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}
const withTimeout = (p, ms) => Promise.race([p, new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))]);

async function similar(ai, text, catalogue) {
  if (vectors?.version !== catalogue.version) {
    const list = await embedAll(ai, catalogue.entries.map(entryText));
    vectors = { version: catalogue.version, list: catalogue.entries.map((e, i) => ({ id: e.id, v: list[i] })) };
  }
  const [q] = await embedAll(ai, [text]);
  return vectors.list.map(({ id, v }) => ({ id, similarity: cosine(q, v) })).sort((a, b) => b.similarity - a.similarity);
}

const SCHEMA = {
  type: 'object', required: ['verdict', 'score', 'signals'],
  properties: {
    verdict: { type: 'string', enum: VERDICTS }, score: { type: 'number' },
    signals: { type: 'array', items: { type: 'object', required: ['id', 'evidence'], properties: { id: { type: 'string' }, evidence: { type: 'string' } } } },
  },
};

function prompt(text, catalogue, near) {
  const signs = [...catalogue.signals.entries()].map(([id, s]) => `- ${id}: ${s.label?.en ?? id}`).join('\n');
  const byId = new Map(catalogue.entries.map((e) => [e.id, e]));
  const known = near.slice(0, 5).map((n) => `- ${byId.get(n.id)?.name?.en ?? n.id} (similarity ${n.similarity.toFixed(2)})`).join('\n');
  return [
    { role: 'system', content: `You check whether a message someone received is a scam. Answer only with JSON: {"verdict": "scam" | "suspicious" | "not_recognised", "score": number from 0 to 1 (how likely it is a scam), "signals": [{"id": one of the ids below, "evidence": an exact quote from the message}]}. Only list signs you can quote word for word.\nWarning-sign ids:\n${signs}\nKnown scams most similar to this message:\n${known}` },
    { role: 'user', content: text },
  ];
}

function parse(answer, catalogue) {
  let a = answer;
  if (typeof a === 'string') {
    const m = a.match(/\{[\s\S]*\}/);
    try { a = m ? JSON.parse(m[0]) : null; } catch { a = null; }
  }
  if (!a || typeof a !== 'object') return null;
  if (!VERDICTS.includes(a.verdict) || typeof a.score !== 'number' || a.score < 0 || a.score > 1 || !Array.isArray(a.signals)) return null;
  if (a.signals.some((s) => !s || !catalogue.signals.has(s.id) || typeof s.evidence !== 'string')) return null;
  return { verdict: a.verdict, score: a.score, signals: a.signals.map(({ id, evidence }) => ({ id, evidence })) };
}

/** { score, verdict, signals, matches } or null on any error, timeout or invalid answer. */
/** `country` limits the matches (the catalogue is always embedded whole, so the cache stays valid). */
export async function scoreWithWorkersAI(ai, { text, catalogue, country = null }, { timeoutMs = TIMEOUT_MS } = {}) {
  try {
    return await withTimeout((async () => {
      const countryOf = new Map(catalogue.entries.map((e) => [e.id, e.country]));
      const near = (await similar(ai, text, catalogue)).filter((n) => !country || countryOf.get(n.id) === country);
      const out = await ai.run(MODELS.chat, { messages: prompt(text, catalogue, near), response_format: { type: 'json_schema', json_schema: SCHEMA } });
      const parsed = parse(out?.response, catalogue);
      if (!parsed) return null;
      return { ...parsed, matches: near.filter((n) => n.similarity >= SIMILAR).slice(0, 3) };
    })(), timeoutMs);
  } catch {
    return null;
  }
}

/** Merges the matcher's result with the scorer's (see the plan: evidence must be quoted, verdict floor). */
export function combine(matcher, scorer, text) {
  const lower = text.toLowerCase();
  const signals = [...matcher.signals];
  for (const s of scorer.signals) if (s.evidence && lower.includes(s.evidence.toLowerCase()) && !signals.some((m) => m.id === s.id)) signals.push(s);
  const seen = new Set();
  const matches = [...matcher.matches, ...scorer.matches].filter((m) => !seen.has(m.id) && seen.add(m.id)).slice(0, 3);
  const verdict = scorer.verdict === 'not_recognised' && hardRules(signals.map((s) => s.id)) ? 'suspicious' : scorer.verdict;
  return { verdict, score: scorer.score, signals, matches };
}
