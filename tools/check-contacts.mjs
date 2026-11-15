// Confirms every phone number and email in data/*/contacts.json is still printed on its official source page,
// in a real browser (some pages need JavaScript). Usage: node tools/check-contacts.mjs  (exits 1 on any miss)
import { resolve } from 'node:path';
import { writeFileSync } from 'node:fs';
import { loadRepo } from '../lib/load.js';

const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** A pattern that finds the value on a page: emails and links literally, phone numbers tolerant of spacing and punctuation. */
export function contactPattern(value) {
  if (/@|^https?:/.test(value)) return new RegExp(escRe(value), 'i');
  const parts = value.match(/[a-z0-9]+/gi) ?? [];
  return new RegExp(`(?<!\\d)${parts.map(escRe).join('[\\s().-]*')}(?!\\d)`, 'i');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { chromium } = await import('playwright');
  const repo = loadRepo(resolve(process.argv[2] ?? '.'));
  const b = await chromium.launch();
  const p = await b.newPage({ locale: 'es-AR', userAgent: 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Mobile Safari/537.36' });
  const out = [];
  const pages = new Map();
  for (const [cc, list] of repo.contacts) for (const k of list) for (const w of k.ways) {
    if (w.type === 'web') continue;
    if (!pages.has(k.source)) {
      let text = '', status = 0;
      try {
        const r = await p.goto(k.source, { waitUntil: 'domcontentloaded', timeout: 45000 });
        status = r?.status() ?? 0;
        await p.waitForTimeout(3000);
        text = await p.evaluate(() => document.body.innerText + ' ' + document.body.innerHTML);
      } catch (e) { status = e.name; }
      pages.set(k.source, { text, status });
    }
    const { text, status } = pages.get(k.source);
    const found = contactPattern(w.value).test(text);
    out.push({ id: k.id, value: w.value, source: k.source, status, found, checked: new Date().toISOString().slice(0, 10) });
    console.log(`${found ? 'ok  ' : 'MISS'} ${String(status).padEnd(4)} ${k.id}: ${w.value}`);
  }
  await b.close();
  writeFileSync('docs/contacts-check.json', JSON.stringify(out, null, 1) + '\n');
  const miss = out.filter((o) => !o.found);
  console.log(`\ncontacts: ${out.length - miss.length}/${out.length} confirmed on the official page`);
  process.exit(miss.length ? 1 : 0);
}
