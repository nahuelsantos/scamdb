// Daily abuse counters. IPs are never stored: buckets use a salted hash that changes every UTC day.
export const utcDay = (now = new Date()) => now.toISOString().slice(0, 10);

/** Whole seconds until the next UTC midnight (at least 1): the Retry-After for daily limits. */
export function secondsToUtcMidnight(now = new Date()) {
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  return Math.max(1, Math.ceil((next - now.getTime()) / 1000));
}

export async function ipHash(ip, salt, day) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${day}:${ip}`));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** The statement that counts one hit in today's bucket and returns the new count (for db.batch: one round trip). */
export const hitStatement = (db, bucket, now = new Date()) =>
  db.prepare('INSERT INTO hits (bucket, day, count) VALUES (?, ?, 1) ON CONFLICT (bucket, day) DO UPDATE SET count = count + 1 RETURNING count').bind(bucket, utcDay(now));
/** This minute's bucket name for a burst limit. */
export const minuteBucket = (bucket, now = new Date()) => `${bucket}@${now.toISOString().slice(11, 16)}`;

/** Counts one hit in today's bucket (atomically) and says whether it is within `max`. */
export async function hit(db, bucket, max, now = new Date()) {
  const row = await hitStatement(db, bucket, now).first();
  return { ok: row.count <= max, count: row.count };
}

// Burst limits, per minute, on top of the daily ones: a key's daily allowance cannot all be spent in one second.
// Keyless senders need none: their daily limit (10) is already smaller than a minute's burst.
export const BURST = { checks: 10, reports: 20, feed: 60 };

/** Counts one hit in this minute's bucket and says whether it is within `max`; `retryAfter` is the seconds left. */
export async function burst(db, bucket, max, now = new Date()) {
  const { ok } = await hit(db, minuteBucket(bucket, now), max, now);
  return { ok, retryAfter: 60 - now.getUTCSeconds() };
}
