// POST /v1/isitascam: is this message a scam? The matcher always answers (free, no AI); keyed requests may also get a
// Workers AI score; keyless requests never reach it. The message text is never stored unless report: true, which needs a key
// (probe detection keeps only a fingerprint).
import { readJson, json, cors, HttpError } from './http.js';
import { authKey, sessionKey, recordUsage } from './keys.js';
import { hit, burst, BURST, ipHash, utcDay, secondsToUtcMidnight } from './limits.js';
import { loadCatalogue, loadEntry } from './catalogue.js';
import { matchMessage, VERSION } from '../packages/matcher/index.js';
import { scoreWithWorkersAI, combine } from './scorer.js';
import { checkProbe } from './probes.js';
import { d1VectorStore } from './vectorstore.js';
import { readForm, extractText } from './media.js';
import { LIMITS as REPORT_LIMITS } from './reports.js';

const ORIGIN = 'https://scamdb.dev';
// ai: shared daily cap on Workers AI calls (scores and file reading), sized to stay inside the free allowance.
export const LIMITS = { keyless: 10, keyed: 50, global: 20000, ai: 300 };
const MAX_TEXT = 5000;

const invalid = (field, why) => new HttpError(400, 'invalid_check', `${field}: ${why}`);
const pickText = (obj, lang) => (obj ? obj[lang] ?? obj.en ?? Object.values(obj)[0] : undefined);

/** Checks and normalises the body; throws a 400 naming the first bad field. */
export function validateCheck(b, countries) {
  if (typeof b.text !== 'string' || !b.text.trim()) throw invalid('text', 'send the message as text');
  const text = b.text.trim();
  if (text.length > MAX_TEXT) throw invalid('text', `at most ${MAX_TEXT} characters`);
  if (b.country !== undefined && b.country !== null && !countries.has(b.country)) throw invalid('country', `one of ${[...countries].join(', ')}`);
  if (b.lang !== undefined && b.lang !== null && (typeof b.lang !== 'string' || !/^[a-z]{2}$/.test(b.lang))) throw invalid('lang', 'a two-letter language code like en');
  if (b.report !== undefined && b.report !== null && typeof b.report !== 'boolean') throw invalid('report', 'true or false');
  if (b.wait !== undefined && b.wait !== null && typeof b.wait !== 'boolean') throw invalid('wait', 'true or false');
  return { text, country: b.country ?? null, lang: b.lang ?? 'en', report: b.report === true, wait: b.wait === true };
}

/** The response body (pure). `result` is { verdict, score, signals: [{id, evidence}], matches: [{id}] }. */
export function buildAnswer({ result, catalogue, top, lang, country, scorer, scorerError }) {
  const byId = new Map(catalogue.entries.map((e) => [e.id, e]));
  const reportCountry = country ?? top?.country ?? (result.matches[0] ? byId.get(result.matches[0].id)?.country : null);
  const elsewhere = result.verdict === 'not_recognised' ? [] : result.elsewhere ?? [];
  return {
    verdict: result.verdict,
    // A forwarded warning about a scam ("they call you from a fake courier… warn your family"): never called a scam.
    warning: Boolean(result.warning),
    score: result.score ?? null,
    signals: result.signals.map((s) => ({ id: s.id, label: pickText(catalogue.signals.get(s.id)?.label, lang) ?? s.id, evidence: s.evidence })),
    matches: result.matches.map(({ id }) => ({ id, name: pickText(byId.get(id)?.name, lang) ?? id, url: `${ORIGIN}/v1/scams/${id}.json`, page: `${ORIGIN}/catalogue/${id}/` })),
    // Scams documented in another country (any language) that fit better than anything local. whatToDo and reportTo
    // stay those of the caller's country.
    // "known": it follows a pattern in the catalogue; "unknown": it reads as a scam but follows no known pattern (a
    // new scam worth investigating, docs/vision.md); null: not recognised as a scam.
    pattern: result.verdict === 'not_recognised' ? null : result.matches.length || elsewhere.length ? 'known' : 'unknown',
    seenElsewhere: elsewhere.map(({ id }) => ({ id, country: byId.get(id)?.country ?? id.split('/')[0], name: pickText(byId.get(id)?.name, lang) ?? id, url: `${ORIGIN}/v1/scams/${id}.json`, page: `${ORIGIN}/catalogue/${id}/` })),
    whatToDo: pickText(top?.whatToDo, lang) ?? [],
    reportTo: reportCountry ? `${ORIGIN}/v1/${reportCountry}/contacts.json` : null,
    engine: { matcher: VERSION, scorer, ...(scorerError ? { scorerError } : {}) },
    datasetVersion: catalogue.version,
  };
}

/** Only keyed requests reach Workers AI; keyless checks are matcher-only by design. */
export const usesScorer = (key, env) => Boolean(key && env.AI);

/** Who a check counts against: the key's GitHub account, or a salted daily hash of the IP. */
const subjectOf = async (env, key, ip, now) => (key ? `gh:${key.githubId}` : `ip:${await ipHash(ip, env.IP_SALT, utcDay(now))}`);

async function checkLimits(env, key, subject, now) {
  const retry = { 'retry-after': String(secondsToUtcMidnight(now)) };
  const bucket = `isitascam:${subject}`;
  if (key) {
    const maxBurst = Number(env.BURST_CHECKS) || BURST.checks; // a setting can raise it (the tests do)
    const b = await burst(env.DB, bucket, maxBurst, now);
    if (!b.ok) throw new HttpError(429, 'too_fast', `Too many checks in one minute (limit ${maxBurst}). Wait a moment and try again.`, { 'retry-after': String(b.retryAfter) });
  }
  if (!(await hit(env.DB, bucket, key ? LIMITS.keyed : LIMITS.keyless, now)).ok)
    throw new HttpError(429, 'too_many_checks', `Daily limit reached (${key ? LIMITS.keyed : LIMITS.keyless} checks). Try again tomorrow${key ? '' : ', or get a free key for more'}.`, retry);
  if (!(await hit(env.DB, 'isitascam:global', LIMITS.global, now)).ok)
    throw new HttpError(503, 'checks_paused', 'We are answering too many checks today. Please try again tomorrow.', retry);
}

// AI answers wait here for GET /v1/isitascam/{id}: the Cache API of the data centre that answered, for 10 minutes. Only
// the key that asked can read its answer. Nothing is written to the database.
const AI_TTL = 600;
const aiCacheKey = (request, id) => new Request(`${new URL(request.url).origin}/__isitascam-ai/${id}`);
async function saveAiResult(request, id, value) {
  await caches.default.put(aiCacheKey(request, id), new Response(JSON.stringify(value), { headers: { 'content-type': 'application/json', 'cache-control': `max-age=${AI_TTL}` } }));
}

/** GET /v1/isitascam/{id}: the AI answer of an earlier check, for the same key. 202 while it is still running. */
export async function handleIsItAScamResult(request, env) {
  const key = (await authKey(request, env)) ?? (await sessionKey(request, env));
  if (!key) throw new HttpError(401, 'key_required', 'Send the same key that made the check.');
  const id = new URL(request.url).pathname.split('/').pop();
  const hitCache = await caches.default.match(aiCacheKey(request, id));
  if (!hitCache) return cors(json({ ai: { status: 'pending', id } }, 202, { 'retry-after': '1', 'cache-control': 'no-store' }));
  const { owner, answer } = await hitCache.json();
  if (owner !== `gh:${key.githubId}`) throw new HttpError(404, 'not_found', 'No such check for this key.');
  return cors(json(answer, 200, { 'cache-control': 'no-store' }));
}

export async function handleIsItAScam(request, env, ctx) {
  const multipart = /^multipart\/form-data/i.test(request.headers.get('content-type') ?? '');
  // 32 KB: 5,000 characters fit even when every one is sent as a \uXXXX escape.
  const { body, file } = multipart ? await readForm(request) : { body: await readJson(request, 32000), file: null };
  const catalogue = await loadCatalogue(env);
  const check = validateCheck(file ? { ...body, text: '-' } : body, catalogue.countries);
  const key = (await authKey(request, env)) ?? (await sessionKey(request, env));
  if (file && !key) throw new HttpError(401, 'key_required', 'Screenshots and voice notes need a free API key (scamdb.dev/account). Text checks work without one.');
  if (check.report && !key) throw invalid('report', 'saving a report needs an API key; without one, use POST /v1/reports');

  const now = new Date();
  const subject = await subjectOf(env, key, request.headers.get('cf-connecting-ip') ?? '', now);
  await checkLimits(env, key, subject, now);

  if (file) {
    if (!env.AI) throw new HttpError(503, 'not_available', 'Reading screenshots and voice notes is not switched on yet.');
    if (!(await hit(env.DB, 'isitascam:ai', LIMITS.ai, now)).ok) throw new HttpError(503, 'ai_paused', 'We have used today\'s free AI allowance. Send the message as text, or try again tomorrow.', { 'retry-after': String(secondsToUtcMidnight(now)) });
    const read = await extractText(env.AI, file);
    if (!read) throw new HttpError(422, 'unreadable', `We could not ${file.kind === 'image' ? 'read any text in the screenshot' : 'hear any words in the voice note'}. Try again, or send the message as text.`);
    check.text = read.slice(0, MAX_TEXT);
  }

  await checkProbe(env.DB, subject, check.text, now); // many near-identical checks look like tuning a scam against us
  let result = matchMessage(check.text, catalogue.entries, { country: check.country ?? undefined, elsewhere: true });
  if (check.report && !check.country && !result.matches.length) throw invalid('country', 'needed to save a report when no catalogue scam matches');
  let scorer = 'matcher', scorerError = null; // keyed callers see why the AI step was skipped
  const finish = async (res, sc, err) => {
    const top = res.matches[0] ? await loadEntry(env, res.matches[0].id) : null;
    const a = buildAnswer({ result: res, catalogue, top, lang: check.lang, country: check.country, scorer: sc, scorerError: err });
    if (file) a.input = { type: file.kind, text: check.text };
    return a;
  };
  const score = async (res) => {
    const diag = {};
    const scored = await scoreWithWorkersAI(env.AI, { text: check.text, catalogue, country: check.country, hints: res.matches.map((m) => m.id) }, { diag, store: d1VectorStore(env.DB) });
    return scored ? finish(combine(res, scored, check.text), 'workers-ai', null) : finish(res, 'matcher', diag);
  };
  // Keyed only, and only while today's shared AI allowance lasts; any failure leaves the matcher's answer.
  // The AI takes seconds, so by default the matcher's answer goes back at once and the AI runs after the response
  // (ctx.waitUntil); GET /v1/isitascam/{id} returns its answer. `wait: true` (and saving a report) waits for it instead.
  let answer;
  if (usesScorer(key, env) && (await hit(env.DB, 'isitascam:ai', LIMITS.ai, now)).ok) {
    if (check.wait || check.report || !ctx?.waitUntil) answer = await score(result);
    else {
      const id = crypto.randomUUID();
      answer = await finish(result, scorer, scorerError);
      answer.ai = { status: 'pending', id, poll: `${ORIGIN}/v1/isitascam/${id}` };
      const owner = subject;
      ctx.waitUntil(score(result)
        .then((final) => saveAiResult(request, id, { owner, answer: { ...final, ai: { status: final.engine?.scorer === 'workers-ai' ? 'done' : 'failed', id } } }))
        .catch(() => saveAiResult(request, id, { owner, answer: { ...answer, ai: { status: 'failed', id } } }).catch(() => {})));
    }
  } else answer = await finish(result, scorer, scorerError);

  if (key) await recordUsage(env.DB, key.id, 'isitascam', now);
  if (check.report) {
    // Saved reports share the reports limits, so this route can't be used to get around them.
    const retry = { 'retry-after': String(secondsToUtcMidnight(now)) };
    if (!(await hit(env.DB, `reports:gh:${key.githubId}`, REPORT_LIMITS.keyed, now)).ok) throw new HttpError(429, 'too_many_reports', 'Daily report limit reached. Thank you, and try again tomorrow.', retry);
    if (!(await hit(env.DB, 'reports:global', REPORT_LIMITS.global, now)).ok) throw new HttpError(503, 'reports_paused', 'We are receiving too many reports today. Please try again tomorrow.', retry);
    const byId = new Map(catalogue.entries.map((e) => [e.id, e]));
    const reportCountry = check.country ?? byId.get(result.matches[0]?.id)?.country;
    await env.DB.prepare('INSERT INTO reports (id, created_at, country, channel, text, what_happened, contact, source, key_id) VALUES (?, ?, ?, NULL, ?, NULL, NULL, ?, ?)')
      .bind(crypto.randomUUID(), now.toISOString(), reportCountry, check.text, 'isitascam', key.id).run();
    await recordUsage(env.DB, key.id, 'reports', now);
  }
  return cors(json(answer));
}
