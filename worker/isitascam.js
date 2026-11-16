// POST /v1/isitascam: is this message a scam? The matcher always answers (free, no AI); keyed requests may also get a
// Workers AI score; keyless requests never reach it. Nothing is stored unless report: true, which needs a key.
import { readJson, json, cors, HttpError } from './http.js';
import { authKey, recordUsage } from './keys.js';
import { hit, ipHash, utcDay, secondsToUtcMidnight } from './limits.js';
import { loadCatalogue, loadEntry } from './catalogue.js';
import { matchMessage, VERSION } from '../packages/matcher/index.js';
import { scoreWithWorkersAI, combine } from './scorer.js';
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
  return { text, country: b.country ?? null, lang: b.lang ?? 'en', report: b.report === true };
}

/** The response body (pure). `result` is { verdict, score, signals: [{id, evidence}], matches: [{id}] }. */
export function buildAnswer({ result, catalogue, top, lang, country, scorer, scorerError }) {
  const byId = new Map(catalogue.entries.map((e) => [e.id, e]));
  const reportCountry = top?.country ?? (result.matches[0] ? byId.get(result.matches[0].id)?.country : null) ?? country;
  return {
    verdict: result.verdict,
    score: result.score ?? null,
    signals: result.signals.map((s) => ({ id: s.id, label: pickText(catalogue.signals.get(s.id)?.label, lang) ?? s.id, evidence: s.evidence })),
    matches: result.matches.map(({ id }) => ({ id, name: pickText(byId.get(id)?.name, lang) ?? id, url: `${ORIGIN}/v1/scams/${id}.json`, page: `${ORIGIN}/catalogue/${id}/` })),
    whatToDo: pickText(top?.whatToDo, lang) ?? [],
    reportTo: reportCountry ? `${ORIGIN}/v1/${reportCountry}/contacts.json` : null,
    engine: { matcher: VERSION, scorer, ...(scorerError ? { scorerError } : {}) },
    datasetVersion: catalogue.version,
  };
}

/** Only keyed requests reach Workers AI; keyless checks are matcher-only by design. */
export const usesScorer = (key, env) => Boolean(key && env.AI);

async function checkLimits(env, key, ip, now) {
  const retry = { 'retry-after': String(secondsToUtcMidnight(now)) };
  const bucket = key ? `isitascam:gh:${key.githubId}` : `isitascam:ip:${await ipHash(ip, env.IP_SALT, utcDay(now))}`;
  if (!(await hit(env.DB, bucket, key ? LIMITS.keyed : LIMITS.keyless, now)).ok)
    throw new HttpError(429, 'too_many_checks', `Daily limit reached (${key ? LIMITS.keyed : LIMITS.keyless} checks). Try again tomorrow${key ? '' : ', or get a free key for more'}.`, retry);
  if (!(await hit(env.DB, 'isitascam:global', LIMITS.global, now)).ok)
    throw new HttpError(503, 'checks_paused', 'We are answering too many checks today. Please try again tomorrow.', retry);
}

export async function handleIsItAScam(request, env) {
  const multipart = /^multipart\/form-data/i.test(request.headers.get('content-type') ?? '');
  // 32 KB: 5,000 characters fit even when every one is sent as a \uXXXX escape.
  const { body, file } = multipart ? await readForm(request) : { body: await readJson(request, 32000), file: null };
  const catalogue = await loadCatalogue(env);
  const check = validateCheck(file ? { ...body, text: '-' } : body, catalogue.countries);
  const key = await authKey(request, env);
  if (file && !key) throw new HttpError(401, 'key_required', 'Screenshots and voice notes need a free API key (scamdb.dev/account). Text checks work without one.');
  if (check.report && !key) throw invalid('report', 'saving a report needs an API key; without one, use POST /v1/reports');

  const now = new Date();
  await checkLimits(env, key, request.headers.get('cf-connecting-ip') ?? '', now);

  if (file) {
    if (!env.AI) throw new HttpError(503, 'not_available', 'Reading screenshots and voice notes is not switched on yet.');
    if (!(await hit(env.DB, 'isitascam:ai', LIMITS.ai, now)).ok) throw new HttpError(503, 'ai_paused', 'We have used today\'s free AI allowance. Send the message as text, or try again tomorrow.', { 'retry-after': String(secondsToUtcMidnight(now)) });
    const read = await extractText(env.AI, file);
    if (!read) throw new HttpError(422, 'unreadable', `We could not ${file.kind === 'image' ? 'read any text in the screenshot' : 'hear any words in the voice note'}. Try again, or send the message as text.`);
    check.text = read.slice(0, MAX_TEXT);
  }

  let result = matchMessage(check.text, catalogue.entries, { country: check.country ?? undefined });
  if (check.report && !check.country && !result.matches.length) throw invalid('country', 'needed to save a report when no catalogue scam matches');
  let scorer = 'matcher', scorerError = null; // keyed callers see why the AI step was skipped
  // Keyed only, and only while today's shared AI allowance lasts; any failure leaves the matcher's answer.
  if (usesScorer(key, env) && (await hit(env.DB, 'isitascam:ai', LIMITS.ai, now)).ok) {
    const diag = {};
    const scored = await scoreWithWorkersAI(env.AI, { text: check.text, catalogue, country: check.country, hints: result.matches.map((m) => m.id) }, { diag });
    if (scored) { result = combine(result, scored, check.text); scorer = 'workers-ai'; } else scorerError = diag;
  }
  const top = result.matches[0] ? await loadEntry(env, result.matches[0].id) : null;
  const answer = buildAnswer({ result, catalogue, top, lang: check.lang, country: check.country, scorer, scorerError });
  if (file) answer.input = { type: file.kind, text: check.text };

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
