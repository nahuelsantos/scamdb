// The private labelled set: extra messages nobody can tune scams against, committed only encrypted
// (eval/private.enc, AES-256-GCM). The key is EVAL_PRIVATE_KEY (32 bytes, base64): a GitHub Actions secret for CI and
// the owner's own copy. The plain file eval/private/messages.json is gitignored.
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const ENC_PATH = ['eval', 'private.enc'];
export const PLAIN_PATH = ['eval', 'private', 'messages.json'];

function keyBytes(b64) {
  const k = Buffer.from(String(b64 ?? ''), 'base64');
  if (k.length !== 32) throw new Error('EVAL_PRIVATE_KEY must be 32 bytes, base64 (node tools/private-eval.mjs keygen)');
  return k;
}

export const newKey = () => randomBytes(32).toString('base64');

/** "v1.<iv>.<tag>.<ciphertext>", all base64. */
export function seal(plain, b64Key) {
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', keyBytes(b64Key), iv);
  const ct = Buffer.concat([c.update(plain, 'utf8'), c.final()]);
  return ['v1', iv.toString('base64'), c.getAuthTag().toString('base64'), ct.toString('base64')].join('.');
}

export function open(sealed, b64Key) {
  const [v, iv, tag, ct] = String(sealed).trim().split('.');
  if (v !== 'v1') throw new Error('unknown private.enc format');
  const d = createDecipheriv('aes-256-gcm', keyBytes(b64Key), Buffer.from(iv, 'base64'));
  d.setAuthTag(Buffer.from(tag, 'base64'));
  return Buffer.concat([d.update(Buffer.from(ct, 'base64')), d.final()]).toString('utf8');
}

/** True when a message copied from a report has passed its `expires` date (reports are kept 180 days, and so are
 * their copies here: the site promises reports are deleted after 180 days). Messages without `expires` never expire. */
export const isExpired = (m, today = new Date().toISOString().slice(0, 10)) => Boolean(m.expires && m.expires < today);

/** The private messages (each with its country), without expired ones, or null when there is no key or no file. */
export function loadPrivateMessages(root, b64Key = process.env.EVAL_PRIVATE_KEY, today) {
  const file = join(root, ...ENC_PATH);
  if (!b64Key || !existsSync(file)) return null;
  return JSON.parse(open(readFileSync(file, 'utf8'), b64Key)).messages.filter((m) => !isExpired(m, today));
}

const RETENTION_DAYS = 180;
const CHANNEL = { sms: 'sms', whatsapp: 'whatsapp', email: 'email', call: 'call', phone: 'call', social: 'social' };

/** Private test messages from reviewed reports (rows of the D1 `reports` table). A person's review is the label:
 * reviewed or promoted = scam, rejected = safe; unreviewed ("new") reports are skipped. Each copy keeps only what the
 * report stored (already redacted), a one-way hash of the report id (to skip duplicates), and an `expires` date 180
 * days after the report, the same day the report itself is deleted. */
export function reportsToMessages(rows, { includeNew = false } = {}) {
  const out = [];
  for (const r of rows) {
    if (!r?.text || String(r.text).trim().length < 10 || !r.country) continue;
    const label = r.status === 'rejected' ? 'safe' : ['reviewed', 'promoted'].includes(r.status) || (includeNew && r.status === 'new') ? 'scam' : null;
    if (!label) continue;
    const hash = createHash('sha256').update(String(r.id)).digest('hex');
    const expires = new Date(Date.parse(r.created_at) + RETENTION_DAYS * 864e5).toISOString().slice(0, 10);
    out.push({ id: `p-${r.country}-r${hash.slice(0, 10)}`, country: r.country, label, scam: label === 'scam' ? r.scam_id ?? null : null,
      channel: CHANNEL[r.channel] ?? 'sms', text: String(r.text), from: 'report', report: hash, expires });
  }
  return out;
}

/** Adds new report copies to the private messages (skipping reports already there) and drops expired ones. */
export function mergeReports(messages, copies, today) {
  const seen = new Set(messages.map((m) => m.report).filter(Boolean));
  return [...messages, ...copies.filter((c) => !seen.has(c.report))].filter((m) => !isExpired(m, today));
}
