// Sends one week of the December campaign to Dispatch as drafts (nothing is published until the owner approves it there).
// Usage: DISPATCH_TOKEN=… node marketing/tools/send-dispatch.mjs 2026-W49 [--dry]
// In a Claude cloud session where the proxy holds the Dispatch token, DISPATCH_TOKEN can be left out.
// Follows Dispatch's own guide (GET /api/guide): find the accounts, upload each file (PNG converted to JPEG), send the batch.
// Re-sending is safe: drafts are matched by `ref` and updated; approved or published posts are never changed.
import { readFile, mkdir } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';

const ROOT = new URL('../../', import.meta.url).pathname;
const BASE = process.env.DISPATCH_URL ?? 'https://dispatch.loopingbyte.com';
const AUTH = { Authorization: `Bearer ${process.env.DISPATCH_TOKEN ?? 'x'}` };
const week = process.argv[2];
const dry = process.argv.includes('--dry');
if (!week) throw new Error('Usage: node marketing/tools/send-dispatch.mjs 2026-W49 [--dry]');

const batch = JSON.parse(await readFile(join(ROOT, 'marketing/dispatch', `${week}.json`), 'utf8'));
const api = async (path, opts = {}) => {
  const r = await fetch(BASE + path, { ...opts, headers: { ...AUTH, ...(opts.headers ?? {}) } });
  const body = await r.text();
  if (!r.ok) throw new Error(`${opts.method ?? 'GET'} ${path}: ${r.status} ${body.slice(0, 300)}`);
  return JSON.parse(body);
};

const files = [...new Set(batch.posts.flatMap((p) => p.media_files))];
console.log(`${week}: ${batch.posts.length} drafts, ${files.length} files`);
if (dry) { for (const p of batch.posts) console.log(`  ${p.scheduled_at}  ${p.platform.padEnd(9)} ${p.kind.padEnd(8)} ${p.ref}`); process.exit(0); }

const accounts = await api('/api/accounts');
const list = accounts.accounts ?? accounts;
const ig = list.find((a) => a.platform === 'instagram' && /scamdb/i.test(a.handle));
const x = list.find((a) => a.platform === 'x' && /scamdb/i.test(a.handle));
if (!ig) throw new Error('No scamdb Instagram account in Dispatch: connect it in Dispatch → Accounts.');
const project = ig.project_id;

const tmp = join(tmpdir(), `dispatch-${week}`);
await mkdir(tmp, { recursive: true });
const keys = {};
for (const f of files) {
  let path = join(ROOT, f);
  let type = f.endsWith('.mp4') ? 'video/mp4' : 'image/jpeg';
  if (f.endsWith('.png')) { // Instagram takes JPEG only
    const jpg = join(tmp, `${f.replace(/[/.]/g, '_')}.jpg`);
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', path, '-q:v', '2', jpg]);
    path = jpg;
  }
  const name = basename(f).replace('.png', '.jpg');
  const res = await api(`/api/media?project=${encodeURIComponent(project)}&filename=${encodeURIComponent(`${week}-${name}`)}`, { method: 'POST', headers: { 'Content-Type': type }, body: await readFile(path) });
  keys[f] = res.key;
  console.log(`  uploaded ${f}`);
}

const posts = batch.posts.map(({ media_files, ...p }) => ({
  ...p,
  account: p.platform === 'x' ? (x?.id ?? p.account) : ig.id,
  media: media_files.map((f) => keys[f]),
}));
if (!x) console.log('  note: no X account connected in Dispatch, X drafts use the @handle');
const out = await api('/api/posts/batch', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ project, batch: batch.batch, posts }) });
for (const p of out.posts ?? []) {
  const flags = [...(p.errors ?? []).map((e) => `ERROR ${e}`), ...(p.warnings ?? []).map((w) => `warn ${w}`)];
  console.log(`  ${p.ref}${flags.length ? `\n    ${flags.join('\n    ')}` : ' ok'}`);
}
console.log(`Done. Review and approve in Dispatch: ${BASE}`);
