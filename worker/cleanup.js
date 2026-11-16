// Daily retention (cron): reports 180 days unless promoted, abuse counters 2 days, usage 400 days.
const DAY = 86400000;
const before = (now, days) => new Date(now.getTime() - days * DAY);

export async function cleanup(db, now = new Date()) {
  const [r, h, u] = await db.batch([
    db.prepare("DELETE FROM reports WHERE created_at < ? AND status != 'promoted'").bind(before(now, 180).toISOString()),
    db.prepare('DELETE FROM hits WHERE day < ?').bind(before(now, 2).toISOString().slice(0, 10)),
    db.prepare('DELETE FROM usage WHERE day < ?').bind(before(now, 400).toISOString().slice(0, 10)),
  ]);
  return { reports: r.meta.changes, hits: h.meta.changes, usage: u.meta.changes };
}
