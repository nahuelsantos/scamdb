// Checks that every link in the data still answers. Usage: node tools/check-links.mjs  (exits 1 if any is broken)
import { resolve } from 'node:path';
import { loadRepo } from '../lib/load.js';

/** Every https link in the data (sources, media, contact sources and web ways), once, with the file it came from. */
export function collectLinks(repo) {
  const seen = new Map();
  const add = (url, where) => { if (/^https:\/\//.test(url) && !seen.has(url)) seen.set(url, where); };
  for (const e of repo.entries) {
    for (const s of e.sources) add(s.url, e._path);
    for (const m of e.media ?? []) add(m.url, e._path);
  }
  for (const [cc, list] of repo.contacts) for (const k of list) {
    add(k.source, `data/${cc}/contacts.json`);
    for (const w of k.ways) if (w.type === 'web') add(w.value, `data/${cc}/contacts.json`);
  }
  return [...seen].map(([url, where]) => ({ url, where }));
}

const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36';
async function status(url) {
  for (const method of ['HEAD', 'GET']) {
    try {
      const r = await fetch(url, { method, redirect: 'follow', headers: { 'user-agent': UA }, signal: AbortSignal.timeout(20000) });
      if (r.ok) return r.status;
      if (method === 'GET' || ![403, 405, 400, 404].includes(r.status)) return r.status;
    } catch (e) { if (method === 'GET') return e.name; }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const links = collectLinks(loadRepo(resolve(process.argv[2] ?? '.')));
  const broken = [];
  for (let i = 0; i < links.length; i += 6) {
    await Promise.all(links.slice(i, i + 6).map(async (l) => {
      const s = await status(l.url);
      const ok = typeof s === 'number' && s < 400;
      if (!ok) broken.push({ ...l, status: s });
      console.log(`${ok ? 'ok    ' : 'BROKEN'} ${String(s).padEnd(4)} ${l.url}  (${l.where})`);
    }));
  }
  console.log(`\nlinks: ${links.length - broken.length}/${links.length} ok`);
  process.exit(broken.length ? 1 : 0);
}
