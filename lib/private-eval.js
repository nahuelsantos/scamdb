// The private labelled set: extra messages nobody can tune scams against, committed only encrypted
// (eval/private.enc, AES-256-GCM). The key is EVAL_PRIVATE_KEY (32 bytes, base64): a GitHub Actions secret for CI and
// the owner's own copy. The plain file eval/private/messages.json is gitignored.
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
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

/** The private messages (each with its country), or null when there is no key or no encrypted file. */
export function loadPrivateMessages(root, b64Key = process.env.EVAL_PRIVATE_KEY) {
  const file = join(root, ...ENC_PATH);
  if (!b64Key || !existsSync(file)) return null;
  return JSON.parse(open(readFileSync(file, 'utf8'), b64Key)).messages;
}
