// POST /v1/reports: a private scam report. Stored in D1, never published, never echoed back. Personal data (phone
// numbers, emails, card and account numbers, names after a greeting) is replaced with placeholders before storage.
// A screenshot (multipart `image`, with a key) is read with Workers AI and dropped: only the redacted text is kept.
import { readJson, json, cors, HttpError } from './http.js';
import { redact } from '../lib/redact.js';
import { readForm, extractText } from './media.js';
import { authKey, recordUsage } from './keys.js';
import { verifyTurnstile } from './turnstile.js';
import { hit, ipHash, utcDay, secondsToUtcMidnight } from './limits.js';

export const COUNTRIES = ['ar', 'au', 'nz', 'us', 'ca', 'gb', 'mx', 'es', 'br'];
export const CHANNELS = ['whatsapp', 'sms', 'phone', 'online', 'in-person', 'email', 'social'];
export const LIMITS = { keyless: 10, keyed: 200, global: 2000 };

const invalid = (field, why) => new HttpError(400, 'invalid_report', `${field}: ${why}`);

function optionalText(v, field, max) {
  if (v === undefined || v === null) return null;
  if (typeof v !== 'string') throw invalid(field, 'must be text');
  const s = v.trim();
  if (s.length > max) throw invalid(field, `at most ${max} characters`);
  return s || null;
}

/** Checks and normalises the body; throws a 400 naming the first bad field. */
export function validateReport(b) {
  const text = optionalText(b.text, 'text', 5000);
  const whatHappened = optionalText(b.whatHappened, 'whatHappened', 2000);
  if (!text && !whatHappened) throw invalid('text', 'send the message or say what happened (text or whatHappened)');
  if (!COUNTRIES.includes(b.country)) throw invalid('country', `one of ${COUNTRIES.join(', ')}`);
  if (b.channel !== undefined && b.channel !== null && !CHANNELS.includes(b.channel)) throw invalid('channel', `one of ${CHANNELS.join(', ')}`);
  return {
    text, whatHappened, country: b.country, channel: b.channel ?? null,
    contact: optionalText(b.contact, 'contact', 200),
    source: optionalText(b.source, 'source', 40) ?? 'api',
  };
}

const FORM_FIELDS = ['text', 'whatHappened', 'country', 'channel', 'contact', 'source', 'turnstileToken'];
const AI_DAILY = 300; // shared with /v1/isitascam's AI cap

export async function handleReport(request, env) {
  const multipart = /^multipart\/form-data/i.test(request.headers.get('content-type') ?? '');
  const { body, file } = multipart ? await readForm(request, { fields: FORM_FIELDS }) : { body: await readJson(request), file: null };
  if (file && file.kind !== 'image') throw invalid('audio', 'reports take a screenshot (image), not audio');
  const report = validateReport(file ? { ...body, text: body.text ?? '-' } : body);
  const ip = request.headers.get('cf-connecting-ip') ?? '';
  const key = await authKey(request, env);
  if (file && !key) throw new HttpError(401, 'key_required', 'Screenshots need a free API key (scamdb.dev/account). Text reports work without one.');
  if (!key && !(await verifyTurnstile(body.turnstileToken, ip, env.TURNSTILE_SECRET)))
    throw new HttpError(403, 'turnstile_failed', 'Requests without an API key need a valid Turnstile token.');

  const now = new Date();
  const retry = { 'retry-after': String(secondsToUtcMidnight(now)) };
  // Per-sender limit first, so refused requests never use up the shared daily cap. Keyed senders are counted
  // per GitHub account, so deleting and recreating a key does not reset the limit.
  const bucket = key ? `reports:gh:${key.githubId}` : `reports:ip:${await ipHash(ip, env.IP_SALT, utcDay(now))}`;
  if (!(await hit(env.DB, bucket, key ? LIMITS.keyed : LIMITS.keyless, now)).ok)
    throw new HttpError(429, 'too_many_reports', 'Daily report limit reached. Thank you, and try again tomorrow.', retry);
  if (!(await hit(env.DB, 'reports:global', LIMITS.global, now)).ok)
    throw new HttpError(503, 'reports_paused', 'We are receiving too many reports today. Please try again tomorrow.', retry);

  if (file) {
    if (!env.AI) throw new HttpError(503, 'not_available', 'Reading screenshots is not switched on yet.');
    if (!(await hit(env.DB, 'isitascam:ai', AI_DAILY, now)).ok) throw new HttpError(503, 'ai_paused', 'We have used today\'s free AI allowance. Send the message as text, or try again tomorrow.', retry);
    const read = await extractText(env.AI, file);
    if (!read) throw new HttpError(422, 'unreadable', 'We could not read any text in the screenshot. Try again, or send the message as text.');
    report.text = read.slice(0, 5000);
    if (report.source === 'api') report.source = 'screenshot';
  }
  // Nothing personal is stored: placeholders replace phone numbers, emails, cards, accounts and greeting names.
  const text = report.text ? redact(report.text).text : null;
  const whatHappened = report.whatHappened ? redact(report.whatHappened).text : null;

  const id = crypto.randomUUID();
  await env.DB.prepare('INSERT INTO reports (id, created_at, country, channel, text, what_happened, contact, source, key_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(id, now.toISOString(), report.country, report.channel, text, whatHappened, report.contact, report.source, key?.id ?? null).run();
  if (key) await recordUsage(env.DB, key.id, 'reports', now);
  return cors(json({ id, received: true }, 201));
}
