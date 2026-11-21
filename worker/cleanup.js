// Daily retention (cron). Reports: after 180 days the contact details, the reporter's own story, the link to their
// key and the extracted indicators (phone numbers, domains) are deleted; the redacted message text, country, channel,
// outcome and matched pattern are kept, because they are the labelled data accuracy needs. A report with no message
// text has nothing left to keep and is deleted. Abuse counters and check fingerprints: 2 days. Usage: 400 days.
// Source review queue: a skipped item loses its copied text after 30 days (its link stays, so it is not collected again).
const DAY = 86400000;
const before = (now, days) => new Date(now.getTime() - days * DAY);

export async function cleanup(db, now = new Date()) {
  const cut = before(now, 180).toISOString();
  const [i, r, a, h, u, p] = await db.batch([
    db.prepare('DELETE FROM report_indicators WHERE report_id NOT IN (SELECT id FROM reports) OR report_id IN (SELECT id FROM reports WHERE created_at < ?)').bind(cut),
    db.prepare("DELETE FROM reports WHERE created_at < ? AND status != 'promoted' AND (text IS NULL OR trim(text) = '')").bind(cut),
    db.prepare('UPDATE reports SET contact = NULL, what_happened = NULL, key_id = NULL WHERE created_at < ? AND (contact IS NOT NULL OR what_happened IS NOT NULL OR key_id IS NOT NULL)').bind(cut),
    db.prepare('DELETE FROM hits WHERE day < ?').bind(before(now, 2).toISOString().slice(0, 10)),
    db.prepare('DELETE FROM usage WHERE day < ?').bind(before(now, 400).toISOString().slice(0, 10)),
    db.prepare('DELETE FROM check_prints WHERE day < ?').bind(before(now, 2).toISOString().slice(0, 10)),
  ]);
  let sources = 0;
  try { // separate, so a database without the review queue (migration 0008 not applied yet) still runs the rest
    sources = (await db.prepare("UPDATE source_items SET text = NULL WHERE status = 'skip' AND text IS NOT NULL AND reviewed_at < ?").bind(before(now, 30).toISOString()).run()).meta.changes;
  } catch { sources = null; }
  return { reports: r.meta.changes, anonymised: a.meta.changes, hits: h.meta.changes, usage: u.meta.changes, prints: p.meta.changes, indicators: i.meta.changes, sources };
}
