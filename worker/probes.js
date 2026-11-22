// Probe detection: someone tuning a scam message against the checker sends many near-identical versions of it. Each
// check leaves a 64-bit SimHash of its text (the text can't be rebuilt from it), kept per key or per daily IP hash for
// 2 days. From the PROBE_LIMIT+1-th near-identical check in a UTC day, the API stops answering those.
import { normalize, tokens } from '../lib/text.js';
import { HttpError } from './http.js';
import { secondsToUtcMidnight, utcDay } from './limits.js';

export const PROBE_LIMIT = 5; // near-identical checks a subject may make per UTC day
export const NEAR_BITS = 16; // of 64 bits: small edits land 0–14 apart; of 19,503 pairs of different eval messages, 2 come this close

const MASK = (1n << 64n) - 1n;
/** FNV-1a, 64-bit. */
function fnv(s) {
  let h = 0xcbf29ce484222325n;
  for (let i = 0; i < s.length; i++) { h ^= BigInt(s.charCodeAt(i)); h = (h * 0x100000001b3n) & MASK; }
  return h;
}

/** SimHash over words and word pairs, as 16 hex digits. */
export function fingerprint(text) {
  const w = tokens(normalize(text));
  const parts = [...w, ...w.slice(1).map((x, i) => `${w[i]} ${x}`)]; // words and word pairs
  const counts = new Array(64).fill(0);
  for (const p of parts) {
    const h = fnv(p);
    for (let b = 0; b < 64; b++) counts[b] += (h >> BigInt(b)) & 1n ? 1 : -1;
  }
  let out = 0n;
  for (let b = 0; b < 64; b++) if (counts[b] > 0) out |= 1n << BigInt(b);
  return out.toString(16).padStart(16, '0');
}

export function distance(a, b) {
  let x = BigInt(`0x${a}`) ^ BigInt(`0x${b}`), n = 0;
  while (x) { n += Number(x & 1n); x >>= 1n; }
  return n;
}

/** Throws 429 too_many_similar when `subject` already made PROBE_LIMIT near-identical checks today; else records this one. */
/** The probe check as two statements for a db.batch (read today's prints, then record this one) and a judge for the
 * read's rows that throws 429 when too many are near. The read runs before the insert, so it never sees this check. */
export function probeStatements(db, subject, text, now = new Date()) {
  const print = fingerprint(text);
  const day = utcDay(now);
  return {
    print,
    read: db.prepare('SELECT print FROM check_prints WHERE subject = ? AND day = ?').bind(subject, day),
    record: db.prepare('INSERT INTO check_prints (subject, day, print, created_at) VALUES (?, ?, ?, ?)').bind(subject, day, print, now.toISOString()),
    judge(rows) {
      if (rows.filter((r) => distance(r.print, print) <= NEAR_BITS).length >= PROBE_LIMIT)
        throw new HttpError(429, 'too_many_similar', 'You have checked this message, or versions of it, many times today. Try again tomorrow.',
          { 'retry-after': String(secondsToUtcMidnight(now)) });
    },
  };
}

export async function checkProbe(db, subject, text, now = new Date()) {
  const print = fingerprint(text);
  const day = utcDay(now);
  const { results } = await db.prepare('SELECT print FROM check_prints WHERE subject = ? AND day = ?').bind(subject, day).all();
  const near = results.filter((r) => distance(r.print, print) <= NEAR_BITS).length;
  if (near >= PROBE_LIMIT) {
    throw new HttpError(429, 'too_many_similar', 'You have checked this message, or versions of it, many times today. Try again tomorrow.',
      { 'retry-after': String(secondsToUtcMidnight(now)) });
  }
  await db.prepare('INSERT INTO check_prints (subject, day, print, created_at) VALUES (?, ?, ?, ?)').bind(subject, day, print, now.toISOString()).run();
}
