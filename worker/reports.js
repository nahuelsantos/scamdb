// POST /v1/reports: a private scam report. Stored in D1, never published, never echoed back.
import { readJson, json, cors, HttpError } from './http.js';
import { authKey, recordUsage } from './keys.js';
import { verifyTurnstile } from './turnstile.js';
import { hit, ipHash, utcDay, secondsToUtcMidnight } from './limits.js';

export const COUNTRIES = ['ar'];
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

export async function handleReport(request, env) {
  const body = await readJson(request);
  const report = validateReport(body);
  const ip = request.headers.get('cf-connecting-ip') ?? '';
  const key = await authKey(request, env);
  if (!key && !(await verifyTurnstile(body.turnstileToken, ip, env.TURNSTILE_SECRET)))
    throw new HttpError(403, 'turnstile_failed', 'Requests without an API key need a valid Turnstile token.');

  const now = new Date();
  const retry = { 'retry-after': String(secondsToUtcMidnight(now)) };
  if (!(await hit(env.DB, 'reports:global', LIMITS.global, now)).ok)
    throw new HttpError(503, 'reports_paused', 'We are receiving too many reports today. Please try again tomorrow.', retry);
  const bucket = key ? `reports:key:${key.id}` : `reports:ip:${await ipHash(ip, env.IP_SALT, utcDay(now))}`;
  if (!(await hit(env.DB, bucket, key ? LIMITS.keyed : LIMITS.keyless, now)).ok)
    throw new HttpError(429, 'too_many_reports', 'Daily report limit reached. Thank you, and try again tomorrow.', retry);

  const id = crypto.randomUUID();
  await env.DB.prepare('INSERT INTO reports (id, created_at, country, channel, text, what_happened, contact, source, key_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(id, now.toISOString(), report.country, report.channel, report.text, report.whatHappened, report.contact, report.source, key?.id ?? null).run();
  if (key) await recordUsage(env.DB, key.id, 'reports', now);
  return cors(json({ id, received: true }, 201));
}
