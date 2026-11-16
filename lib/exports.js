// Plain exports of the catalogue for reuse: a CSV (one row per scam) and an Atom feed of new and edited scams.
const SITE = 'https://scamdb.dev';

const cell = (v) => {
  const s = Array.isArray(v) ? v.join('|') : String(v ?? '');
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const CSV_COLUMNS = ['id', 'country', 'lang', 'status', 'name_en', 'name_original', 'channels', 'signals', 'updated', 'page', 'json'];

/** One row per entry; list fields joined with "|". Starts with a UTF-8 BOM so spreadsheets read accents right. */
export function toCsv(entries) {
  const rows = entries.map((e) => {
    const signals = [...new Set((e.steps ?? []).map((s) => s.signal).filter(Boolean))];
    return [e.id, e.country, e.lang, e.status, e.name?.en, e.lang && e.lang !== 'en' ? e.name?.[e.lang] : '', e.channels, signals, e.updated,
      `${SITE}/catalogue/${e.id}/`, `${SITE}/v1/scams/${e.id}.json`].map(cell).join(',');
  });
  return '﻿' + [CSV_COLUMNS.join(','), ...rows].join('\r\n') + '\r\n';
}

const xml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));

/** Atom feed of the latest changes ({ id, change, date } from changes.json), newest first. */
export function toAtom(changes, entries, { updated } = {}) {
  const byId = new Map(entries.map((e) => [e.id, e]));
  const items = changes.filter((c) => byId.has(c.id)).slice(0, 50).map((c) => {
    const e = byId.get(c.id);
    const title = `${c.change === 'added' ? 'New' : 'Updated'} (${e.country.toUpperCase()}): ${e.name?.en ?? e.id}`;
    const summary = e.how?.en ?? '';
    return `  <entry>
    <id>${SITE}/catalogue/${xml(e.id)}/#${xml(c.date)}-${xml(c.change)}</id>
    <title>${xml(title)}</title>
    <link rel="alternate" href="${SITE}/catalogue/${xml(e.id)}/"/>
    <updated>${xml(c.date)}T00:00:00Z</updated>
    <category term="${xml(e.country)}"/>
    <summary>${xml(summary)}</summary>
  </entry>`;
  });
  const last = updated ?? (changes[0]?.date ? `${changes[0].date}T00:00:00Z` : new Date().toISOString());
  return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <id>${SITE}/v1/changes.atom</id>
  <title>scamdb: new and updated scams</title>
  <subtitle>Scam patterns by country, CC BY 4.0</subtitle>
  <link rel="self" href="${SITE}/v1/changes.atom"/>
  <link rel="alternate" href="${SITE}/catalogue/"/>
  <updated>${xml(last)}</updated>
  <rights>CC BY 4.0 · scamdb.dev</rights>
${items.join('\n')}
</feed>
`;
}
