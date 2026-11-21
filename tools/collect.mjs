#!/usr/bin/env node
// Source collector: reads the allowed feeds in sources/registry.json and sends scam-related items to the private review
// queue (POST /v1/collect). It runs on the owner's home lab (some sites refuse cloud servers); see docs/sources.md.
// No dependencies beyond Node 22, so it runs from a plain checkout.
//
//   node tools/collect.mjs [--where home|cloud] [--only fr-a,fr-b] [--days 3] [--dry-run]
//
// Env: SCAMDB_COLLECTOR_TOKEN or SCAMDB_COLLECTOR_TOKEN_FILE (not needed with --dry-run),
//      SCAMDB_COLLECT_URL (default https://scamdb.dev/v1/collect).
import { readFileSync } from 'node:fs';
import { parseItems, sourcesFor, candidates, checkRegistry } from '../lib/collect.js';

const args = process.argv.slice(2);
const value = (n, d = null) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const root = new URL('..', import.meta.url).pathname;
const registry = JSON.parse(readFileSync(`${root}sources/registry.json`, 'utf8'));
const where = value('--where', 'home');
const only = value('--only')?.split(',') ?? null;
const days = Number(value('--days', '3'));
const dry = args.includes('--dry-run');
const endpoint = process.env.SCAMDB_COLLECT_URL ?? 'https://scamdb.dev/v1/collect';
const UA = 'linux:scamdb-collector:1.0 (read-only, one small run a day; +https://scamdb.dev/docs/)';
const BATCH = 50;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const problems = checkRegistry(registry);
if (problems.length) { console.error(`sources/registry.json is not valid:\n  ${problems.join('\n  ')}`); process.exit(2); }

let token = process.env.SCAMDB_COLLECTOR_TOKEN ?? '';
if (!token && process.env.SCAMDB_COLLECTOR_TOKEN_FILE) token = readFileSync(process.env.SCAMDB_COLLECTOR_TOKEN_FILE, 'utf8').trim();
if (!dry && token.length < 32) { console.error('No collector token: set SCAMDB_COLLECTOR_TOKEN_FILE (or use --dry-run).'); process.exit(2); }

// Reddit asks unauthenticated readers to go slowly (staysy-social learned 8 s); other sites get 2 s.
const delayFor = (url) => (/reddit\.com$/.test(new URL(url).hostname) ? 8000 : 2000);
let last = 0;
async function get(url) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const wait = last + delayFor(url) - Date.now();
    if (wait > 0) await sleep(wait);
    last = Date.now();
    const r = await fetch(url, { headers: { 'user-agent': UA, accept: 'application/rss+xml, application/atom+xml, text/xml;q=0.9' }, signal: AbortSignal.timeout(25000) });
    if (r.status === 429 && attempt === 0) { await sleep(Math.min(Number(r.headers.get('retry-after')) || 30, 60) * 1000); continue; }
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const text = await r.text();
    if (!/<(rss|feed|rdf:RDF)\b/i.test(text.slice(0, 2000))) throw new Error('not a feed (a bot check page?)');
    return text;
  }
  throw new Error('HTTP 429 twice');
}

const startedAt = new Date().toISOString();
const since = new Date(Date.now() - days * 86400000).toISOString();
const found = [], health = [];
for (const s of sourcesFor(registry, where, only)) {
  try {
    const items = parseItems(await get(s.feed));
    const kept = candidates(items, s, { since });
    found.push(...kept);
    health.push({ id: s.id, ok: true, kept: kept.length, total: items.length });
  } catch (e) { health.push({ id: s.id, ok: false, kept: 0, total: 0, error: e.message }); }
}

let added = 0, known = 0, sendError = null;
if (dry) {
  for (const c of found) console.log(`${c.source}\t${c.score}\t${c.publishedAt?.slice(0, 10) ?? '?'}\t${c.title}\n\t${c.url}`);
} else {
  for (let i = 0; i < found.length && !sendError; i += BATCH) {
    try {
      const r = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${token}`, 'user-agent': UA },
        body: JSON.stringify({ items: found.slice(i, i + BATCH) }), signal: AbortSignal.timeout(30000) });
      const body = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(`HTTP ${r.status} ${body.error ?? ''}`.trim());
      added += body.added ?? 0; known += body.known ?? 0;
    } catch (e) { sendError = e.message; }
  }
}

const allFailed = health.length > 0 && health.every((h) => !h.ok);
// Tell scamdb how the run went, for the review page's Runs and Sources tabs. Best effort: a failure here is only logged.
let reportError = null;
if (!dry) {
  const run = { startedAt, host: process.env.SCAMDB_COLLECTOR_HOST ?? where, ok: !sendError && !allFailed, candidates: found.length, added, known,
    error: sendError ? `sending failed: ${sendError}` : allFailed ? 'every source failed' : null, sources: health };
  try {
    const r = await fetch(`${endpoint.replace(/\/+$/, '')}/run`, { method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}`, 'user-agent': UA }, body: JSON.stringify(run), signal: AbortSignal.timeout(30000) });
    if (!r.ok) reportError = `HTTP ${r.status}`;
  } catch (e) { reportError = e.message; }
}

console.log(`scamdb collector (${where}${dry ? ', dry run' : ''}): ${found.length} candidates${dry ? '' : `, ${added} new in the review queue, ${known} already there`}`);
for (const h of health) console.log(`  ${h.id}: ${h.ok ? `${h.kept} of ${h.total} kept` : `FAILED (${h.error})`}`);
if (sendError) console.log(`  sending FAILED: ${sendError}`);
if (reportError) console.log(`  run summary not stored: ${reportError}`);
process.exit(sendError || allFailed ? 1 : 0);
