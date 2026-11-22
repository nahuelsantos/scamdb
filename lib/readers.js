// Page readers: for sources with no feed, turn the source's web page into the same items a feed gives
// ({ title, url, date, text }), so the collector treats them like any other source. One reader per site, tested
// against a saved copy of the real page (tests/fixtures/readers/). If a site changes its layout, its reader returns
// nothing and the collector reports the source as failed, so the Runs tab shows it instead of it going quiet.
import { plainText, MAX_TEXT, MAX_TITLE } from './collect.js';

const MONTHS_DE = { januar: 1, februar: 2, märz: 3, maerz: 3, april: 4, mai: 5, juni: 6, juli: 7, august: 8, september: 9, oktober: 10, november: 11, dezember: 12 };
const iso = (y, m, d) => {
  const t = Date.UTC(Number(y), Number(m) - 1, Number(d));
  return Number.isNaN(t) || !m ? null : new Date(t).toISOString();
};
const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

/**
 * Verbraucherzentrale Phishing-Radar: one long page; each warning is an <h2>"20. November 2026: <title>"</h2> followed by
 * a description of the message (subject, wording, warning signs) and a screenshot of the real message. Each warning
 * gets its own address (the page plus an anchor made of its date and title), so the review queue keeps them apart.
 */
function vzPhishingRadar(html, pageUrl) {
  const page = String(html);
  const end = page.search(/<h2>\s*Ältere Beiträge/i);
  const body = end > 0 ? page.slice(0, end) : page;
  const heads = [...body.matchAll(/<h2>\s*(\d{1,2})\.\s*([A-Za-zÄäÖöÜü]+)\s+(\d{4})\s*:?\s*([\s\S]*?)<\/h2>/g)];
  return heads.map((m, k) => {
    const month = MONTHS_DE[m[2].toLowerCase()];
    const date = iso(m[3], month, m[1]);
    const title = plainText(m[4]).slice(0, MAX_TITLE);
    const block = body.slice(m.index + m[0].length, heads[k + 1]?.index ?? body.length);
    const shot = block.match(/<img[^>]+src="(https:\/\/[^"]+)"/i)?.[1];
    const text = (plainText(block) + (shot ? `\n\nScreenshot: ${shot}` : '')).slice(0, MAX_TEXT);
    return { title, url: `${pageUrl}#${date?.slice(0, 10) ?? 'undated'}-${slug(title)}`, date, text };
  }).filter((i) => i.title && i.date);
}

/**
 * INCIBE citizen alerts (avisos): the list page, one <article> per alert with its title, link, "Publicado el DD/MM/YYYY"
 * and a short summary. Only the list is read: the alert pages themselves did not load from outside Spain when this was
 * written, so the summary plus the link is what reaches the review queue.
 */
function incibeAvisos(html, pageUrl) {
  const arts = [...String(html).matchAll(/<article\b[^>]*node--type-content-incibe-avisos[\s\S]*?<\/article>/g)].map((m) => m[0]);
  return arts.map((a) => {
    const link = a.match(/<h3>\s*<a href="([^"]+)"[^>]*?(?:title="([^"]*)")?[^>]*>([\s\S]*?)<\/a>/i);
    if (!link) return null;
    const title = plainText(link[2] || link[3]).slice(0, MAX_TITLE);
    const d = a.match(/Publicado el\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    const summary = a.match(/field--name-body[^>]*>([\s\S]*?)<\/div>/)?.[1];
    return { title, url: new URL(link[1], pageUrl).href, date: d ? iso(d[3], d[2], d[1]) : null, text: plainText(summary).slice(0, MAX_TEXT) };
  }).filter((i) => i && i.title);
}

export const READERS = { 'vz-phishingradar': vzPhishingRadar, 'incibe-avisos': incibeAvisos };

/** The items a source's page gives, or throws when the reader is unknown or finds nothing (a layout change). */
export function readPage(reader, html, pageUrl) {
  const read = READERS[reader];
  if (!read) throw new Error(`no page reader "${reader}"`);
  const items = read(html, pageUrl);
  if (!items.length) throw new Error('the page reader found no entries (has the page layout changed?)');
  return items;
}
