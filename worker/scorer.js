// The free Workers AI scorer behind one interface: embeddings find the closest catalogue entries, a small instruct
// model gives a verdict, a score and the warning signs with quotes. Any failure returns null and the matcher answers.
import { hardRules } from '../packages/matcher/index.js';
import { features, probability } from '../lib/fusion.js';
import { WEIGHTS, THRESHOLDS } from './fusion-weights.js';

// llama-3.1-8b-instruct was retired on 2026-05-30; gemma-4 is Cloudflare's recommended small replacement (also reads images).
export const MODELS = { embed: '@cf/baai/bge-m3', chat: '@cf/google/gemma-4-26b-a4b-it' };
export const TIMEOUT_MS = 8000;
const MAX_TOKENS = 200; // the JSON answer is ~100 tokens; a cap keeps a rambling model from eating the timeout
const SIMILAR = 0.6;
const BATCH = 50;
const VERDICTS = ['scam', 'suspicious', 'not_recognised'];

let vectors = null; // { version, list: Promise<[{ id, v }]> }
export const _resetCache = () => { vectors = null; };

const entryText = (e) => [...Object.values(e.name ?? {}), ...Object.values(e.phrases ?? {}).flat()].join(' · ');
const embedAll = async (ai, texts) => {
  const batches = [];
  for (let i = 0; i < texts.length; i += BATCH) batches.push(ai.run(MODELS.embed, { text: texts.slice(i, i + BATCH) }));
  return (await Promise.all(batches)).flatMap((r) => r.data); // parallel: a cold isolate embeds the catalogue in one round
};
function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}
const withTimeout = (p, ms) => Promise.race([p, new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))]);

/** The catalogue's vectors. Concurrent checks share one in-flight computation; a failed one is not kept. */
function catalogueVectors(ai, catalogue, store) {
  if (vectors?.version !== catalogue.version) {
    const version = catalogue.version;
    const list = (async () => {
      const saved = store ? await store.get(version).catch(() => null) : null;
      if (saved?.length === catalogue.entries.length) return saved;
      const l = await embedAll(ai, catalogue.entries.map(entryText));
      const fresh = catalogue.entries.map((e, i) => ({ id: e.id, v: l[i] }));
      if (store) await store.put(version, fresh).catch(() => {}); // once per version; a failed save just recomputes later
      return fresh;
    })();
    const entry = { version, list, done: false };
    vectors = entry;
    list.then(() => { entry.done = true; }, () => { if (vectors === entry) vectors = null; });
  }
  return vectors.list;
}

async function similar(ai, text, catalogue, store) {
  const [list, [q]] = await Promise.all([catalogueVectors(ai, catalogue, store), embedAll(ai, [text])]);
  return list.map(({ id, v }) => ({ id, similarity: cosine(q, v) })).sort((a, b) => b.similarity - a.similarity);
}


function prompt(text, catalogue, hints) {
  const signs = [...catalogue.signals.entries()].map(([id, s]) => `- ${id}: ${s.label?.en ?? id}`).join('\n');
  const byId = new Map(catalogue.entries.map((e) => [e.id, e]));
  const known = hints.slice(0, 5).map((id) => `- ${byId.get(id)?.name?.en ?? id}`).join('\n') || '- (none matched by keywords)';
  return [
    { role: 'system', content: `You check whether a message someone received is a scam. Answer only with JSON: {"verdict": "scam" | "suspicious" | "not_recognised", "score": number from 0 to 1 (how likely it is a scam), "signals": [{"id": one of the ids below, "evidence": an exact quote from the message, at most 8 words}]}. List at most 3 signs, only ones you can quote word for word. No other text.\nWarning-sign ids:\n${signs}\nKnown scams that match this message's keywords:\n${known}` },
    { role: 'user', content: text },
  ];
}

/** The model's text: Workers AI `response` (object or string) or the OpenAI chat-completions shape. An empty string
 * counts as no answer, so the other shape is tried. */
const filled = (v) => v !== null && v !== undefined && !(typeof v === 'string' && !v.trim());
// Some models (qwen3 with thinking off) put the answer in reasoning_content instead of content.
export const answerOf = (out) => {
  const msg = out?.choices?.[0]?.message;
  return [out?.response, msg?.content, msg?.reasoning_content, msg?.reasoning].find(filled) ?? null;
};
/** gemma-4 thinks before answering by default; the thinking eats the token budget and leaves the answer empty. */
export const NO_THINKING = { chat_template_kwargs: { enable_thinking: false } };

function parse(answer, catalogue) {
  let a = answer;
  if (typeof a === 'string') {
    const m = a.match(/\{[\s\S]*\}/);
    try { a = m ? JSON.parse(m[0]) : null; } catch { a = null; }
  }
  if (!a || typeof a !== 'object') return null;
  if (!VERDICTS.includes(a.verdict) || typeof a.score !== 'number' || a.score < 0 || a.score > 1 || !Array.isArray(a.signals)) return null;
  // Unknown sign ids or quotes are dropped, not fatal: the verdict and score still stand.
  const signals = a.signals.filter((s) => s && catalogue.signals.has(s.id) && typeof s.evidence === 'string').map(({ id, evidence }) => ({ id, evidence }));
  return { verdict: a.verdict, score: a.score, signals };
}

/** { score, verdict, signals, matches } or null on any error, timeout or invalid answer. */
/** `country` limits the matches (the catalogue is always embedded whole, so the cache stays valid). */
/** On null, `diag.reason` says why ('timeout', 'embed', 'chat' or 'answer') and `diag.detail` gives a short hint. */
export async function scoreWithWorkersAI(ai, { text, catalogue, country = null, hints = [] }, { timeoutMs = TIMEOUT_MS, diag = {}, chatModel = MODELS.chat, store = null } = {}) {
  const started = Date.now();
  const pending = new Set(['embed', 'chat']);
  // The embeddings (closest catalogue entries) and the chat verdict run at the same time; the chat gets the
  // matcher's keyword matches as hints instead of waiting for the embeddings.
  const step = (name, p) => p.then((v) => { pending.delete(name); return v; }, (e) => { throw Object.assign(new Error(String(e?.message ?? e)), { stage: name }); });
  try {
    return await withTimeout((async () => {
      const countryOf = new Map(catalogue.entries.map((e) => [e.id, e.country]));
      const [nearAll, out] = await Promise.all([
        step('embed', similar(ai, text, catalogue, store)),
        step('chat', ai.run(chatModel, { messages: prompt(text, catalogue, hints), max_tokens: MAX_TOKENS, ...NO_THINKING })),
      ]);
      const near = nearAll.filter((n) => !country || countryOf.get(n.id) === country);
      const answer = answerOf(out);
      const parsed = parse(answer, catalogue);
      if (!parsed) {
        const finish = out?.choices?.[0]?.finish_reason;
        const detail = answer === null ? `empty answer${finish ? ` (finish_reason: ${finish})` : ''}` : typeof answer === 'string' ? answer : JSON.stringify(answer);
        Object.assign(diag, { reason: 'answer', detail: clip(detail) });
        return null;
      }
      return { ...parsed, matches: near.filter((n) => n.similarity >= SIMILAR).slice(0, 3), nearest: near[0]?.similarity ?? 0 };
    })(), timeoutMs);
  } catch (e) {
    const timedOut = e?.message === 'timeout';
    if (timedOut && vectors && !vectors.done) vectors = null; // a stuck catalogue computation must not block later checks
    Object.assign(diag, timedOut
      ? { reason: 'timeout', detail: `${[...pending].join(' and ')} still running after ${Date.now() - started} ms` }
      : { reason: e?.stage ?? 'chat', detail: clip(e?.message ?? e) });
    return null;
  }
}
const clip = (s) => String(s).replace(/\s+/g, ' ').slice(0, 160);

/**
 * Merges the matcher's result with the scorer's. The verdict and score come from the fused probability
 * (lib/fusion.js, weights in fusion-weights.js); the scorer's evidence must be quoted from the text; the hard rules
 * keep the verdict at "suspicious" or above. A message the formula clears gets no catalogue matches, so a weak
 * keyword match on one shared word doesn't make a safe message look like a known scam.
 */
export function combine(matcher, scorer, text) {
  const lower = text.toLowerCase();
  const signals = [...matcher.signals];
  for (const s of scorer.signals) if (s.evidence && lower.includes(s.evidence.toLowerCase()) && !signals.some((m) => m.id === s.id)) signals.push(s);
  const p = probability(WEIGHTS, features(matcher, scorer));
  let verdict = p >= THRESHOLDS.scam ? 'scam' : p >= THRESHOLDS.suspicious ? 'suspicious' : 'not_recognised';
  if (verdict === 'not_recognised' && hardRules(signals.map((s) => s.id))) verdict = 'suspicious';
  const seen = new Set();
  const matches = verdict === 'not_recognised' ? []
    : [...matcher.matches, ...scorer.matches].filter((m) => !seen.has(m.id) && seen.add(m.id)).slice(0, 3);
  return { verdict, score: Math.round(p * 100) / 100, signals, matches };
}
