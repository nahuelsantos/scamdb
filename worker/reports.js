// POST /v1/reports: a private scam report. Stored in D1, never published, never echoed back. Personal data (phone
// numbers, emails, card and account numbers, names after a greeting) is replaced with placeholders before storage.
// A screenshot (multipart `image`, with a key) is read with Workers AI and dropped: only the redacted text is kept.
import { readJson, json, cors, HttpError } from './http.js';
import { redact } from '../lib/redact.js';
import { readForm, extractText } from './media.js';
import { loadCatalogue, loadBrands } from './catalogue.js';
import { brandsIn } from '../lib/brands.js';
import { matchMessage } from '../packages/matcher/index.js';
import { authKey, sessionKey, recordUsage } from './keys.js';
import { verifyTurnstile } from './turnstile.js';
import { hit, ipHash, utcDay, secondsToUtcMidnight } from './limits.js';

export const COUNTRIES = ['ar', 'au', 'nz', 'us', 'ca', 'gb', 'mx', 'es', 'br', 'pt', 'ie', 'mt', 'fr', 'be', 'lu', 'nl', 'de', 'at', 'ch', 'it', 'pl', 'ro', 'md', 'ua', 'tr', 'gr', 'cy', 'bg', 'se', 'dk', 'no', 'fi', 'is', 'cz', 'sk', 'hu', 'si', 'hr', 'ee', 'lv', 'lt', 'rs', 'ba', 'me', 'mk', 'al', 'xk', 'ru', 'by', 'ge', 'am', 'az', 'cl', 'co', 'pe', 'uy', 'py', 'bo', 'ec', 've', 'gt', 'sv', 'hn', 'ni', 'cr', 'pa', 'bz', 'ph', 'ng', 'in', 'id', 'ae', 'th', 'kr', 'jp', 'tw'];
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
  const key = (await authKey(request, env)) ?? (await sessionKey(request, env));
  if (file && !key) throw new HttpError(401, 'key_required', 'Screenshots need a free API key (scamdb.dev/account). Text reports work without one.');
  // scamdb.dev's own form has its own Turnstile widget (TURNSTILE_SECRET_SITE); other forms (eschamuyo) use TURNSTILE_SECRET.
  const secret = report.source === 'scamdb.dev' && env.TURNSTILE_SECRET_SITE ? env.TURNSTILE_SECRET_SITE : env.TURNSTILE_SECRET;
  if (!key && !(await verifyTurnstile(body.turnstileToken, ip, secret)))
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
  const r1 = redact(report.text ?? ''), r2 = redact(report.whatHappened ?? '');
  const text = report.text ? r1.text : null;
  const whatHappened = report.whatHappened ? r2.text : null;
  const tags = await tagReport(env, `${text ?? ''}\n${whatHappened ?? ''}`, report.country);

  const id = crypto.randomUUID();
  const at = now.toISOString();
  const indicators = await indicatorRows(env, id, at, [r1.found, r2.found]);
  await env.DB.batch([
    env.DB.prepare('INSERT INTO reports (id, created_at, country, channel, text, what_happened, contact, source, key_id, scam_id, brands) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(id, at, report.country, report.channel, text, whatHappened, report.contact, report.source, key?.id ?? null, tags.scamId, tags.brands),
    ...indicators,
  ]);
  if (key) await recordUsage(env.DB, key.id, 'reports', now);
  return cors(json({ id, received: true }, 201));
}

/** The matcher's top catalogue match and the brands the (redacted) text names. Failures just leave them empty. */
async function tagReport(env, text, country) {
  try {
    const [catalogue, brands] = await Promise.all([loadCatalogue(env), loadBrands(env)]);
    const scamId = matchMessage(text, catalogue.entries, { country }).matches[0]?.id ?? null;
    const named = brandsIn(text, brands, country);
    return { scamId, brands: named.length ? named.join(',') : null };
  } catch {
    return { scamId: null, brands: null };
  }
}

/** HMAC-SHA256 of the phone digits with IP_SALT: the same number always gives the same value, which can't be read back. */
export async function phoneHash(digits, salt) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(salt), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`phone:${digits}`));
  return [...new Uint8Array(sig)].slice(0, 16).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** INSERT statements for the private indicators: link domains and hashed phone numbers (at most 10 of each). */
async function indicatorRows(env, id, at, founds) {
  const domains = [...new Set(founds.flatMap((f) => f.domains))].slice(0, 10);
  const phones = [...new Set(founds.flatMap((f) => f.phones))].slice(0, 10);
  const ins = (kind, value) => env.DB.prepare('INSERT INTO report_indicators (report_id, kind, value, created_at) VALUES (?, ?, ?, ?)').bind(id, kind, value, at);
  return [...domains.map((d) => ins('domain', d)), ...(await Promise.all(phones.map(async (p) => ins('phone', await phoneHash(p, env.IP_SALT)))))];
}
