#!/usr/bin/env node
// Daily discovery run (GitHub Actions): reads the allowed sources in tools/discover/feeds.json, keeps only metadata,
// classifies each item against the catalogue and writes signals for the weekly importer.
//
//   node tools/discover.mjs --out signals.json --md signals.md [--no-gdelt] [--days 7]
import { readFileSync, writeFileSync } from 'node:fs';
import { loadRepo } from '../lib/load.js';
import { parseFeed, parseGdelt, scamRelated, dedupe, classify, signals, toMarkdown } from '../lib/discover.js';

const args = process.argv.slice(2);
const value = (n) => (args.includes(n) ? args[args.indexOf(n) + 1] : null);
const root = new URL('..', import.meta.url).pathname;
const cfg = JSON.parse(readFileSync(`${root}tools/discover/feeds.json`, 'utf8'));
const days = Number(value('--days') ?? 7);
const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
const UA = 'scamdb-signals/1.0 (+https://scamdb.dev/docs/)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url, accept) {
  const r = await fetch(url, { headers: { 'user-agent': UA, accept }, signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.text();
}

const items = [], health = [];
for (const f of cfg.feeds.filter((x) => x.allowed)) {
  try {
    let list = parseFeed(await get(f.url, 'application/rss+xml, application/atom+xml, text/xml'));
    if (f.filter) list = list.filter(scamRelated);
    list = list.filter((i) => !i.date || i.date >= since);
    items.push(...list.map((i) => ({ ...i, country: f.country, type: f.type, feed: f.id, source: 'feed' })));
    health.push({ id: f.id, ok: true, items: list.length });
  } catch (e) { health.push({ id: f.id, ok: false, error: e.message }); }
}
if (!args.includes('--no-gdelt')) {
  for (const [cc, fips] of Object.entries(cfg.gdelt.countries)) {
    const q = encodeURIComponent(`${cfg.gdelt.query} sourcecountry:${fips}`);
    const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${q}&mode=artlist&format=json&maxrecords=100&timespan=${Math.min(days, 7)}d&sort=datedesc`;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const text = await get(url, 'application/json');
        const list = parseGdelt(JSON.parse(text), cc);
        items.push(...list);
        health.push({ id: `gdelt-${cc}`, ok: true, items: list.length });
        break;
      } catch (e) {
        if (attempt === 2) health.push({ id: `gdelt-${cc}`, ok: false, error: e.message });
        await sleep(10000 * (attempt + 1));
      }
    }
    await sleep(6000); // GDELT asks for one request every 5 seconds
  }
}

const repo = loadRepo(root);
const brands = JSON.parse(readFileSync(`${root}data/brands.json`, 'utf8')).brands;
const classified = classify(dedupe(items), repo.entries, brands);
const sig = signals(classified);
const now = new Date();
const week = `${now.getUTCFullYear()}-W${String(Math.ceil(((now - Date.UTC(now.getUTCFullYear(), 0, 1)) / 86400000 + new Date(Date.UTC(now.getUTCFullYear(), 0, 1)).getUTCDay() + 1) / 7)).padStart(2, '0')}`;
const out = { week, generatedAt: now.toISOString(), since, items: classified.length, health, ...sig };
if (value('--out')) writeFileSync(value('--out'), JSON.stringify(out, null, 1) + '\n');
if (value('--md')) writeFileSync(value('--md'), toMarkdown(sig, { week, generatedAt: out.generatedAt }) + `\n<details><summary>Source health</summary>\n\n${health.map((h) => `- ${h.id}: ${h.ok ? `${h.items} items` : `failed (${h.error})`}`).join('\n')}\n\n</details>\n`);
console.log(`${classified.length} items, ${sig.agency.length} official, ${sig.possiblyNew.length} possibly new, ${health.filter((h) => !h.ok).length} sources failed.`);
