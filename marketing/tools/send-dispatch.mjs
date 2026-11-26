// Sends one week of the December campaign to Dispatch as drafts (nothing is published until the owner approves it there).
// Usage: DISPATCH_TOKEN=… node marketing/tools/send-dispatch.mjs 2026-W49 [--dry]
// In a Claude cloud session where the proxy holds the Dispatch token, DISPATCH_TOKEN can be left out.
// Follows Dispatch's own guide (GET /api/guide): find the accounts, upload each file (PNG converted to JPEG), send the batch.
// Re-sending is safe: drafts are matched by `ref` and updated; approved or published posts are never changed.
import { readFile, mkdir, writeFile } from 'node:fs/promises';
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
// curl, not fetch: curl goes through the session's HTTPS proxy, which adds the Dispatch token in cloud sessions.
const api = async (path, opts = {}) => {
  const args = ['-s', '-m', '300', '-w', '\n%{http_code}', '-X', opts.method ?? 'GET', BASE + path, '-H', `Authorization: ${AUTH.Authorization}`];
  for (const [k, v] of Object.entries(opts.headers ?? {})) args.push('-H', `${k}: ${v}`);
  if (opts.file) args.push('--data-binary', `@${opts.file}`);
  else if (opts.body) { const f = join(tmpdir(), `dispatch-body-${process.pid}.json`); await writeFile(f, opts.body); args.push('--data-binary', `@${f}`); }
  const raw = execFileSync('curl', args, { maxBuffer: 64 * 1024 * 1024 }).toString();
  const i = raw.lastIndexOf('\n'); const body = raw.slice(0, i); const code = Number(raw.slice(i + 1));
  if ((code < 200 || code >= 300) && !(code === 422 && path === '/api/posts/batch')) throw new Error(`${opts.method ?? 'GET'} ${path}: ${code} ${body.slice(0, 300)}`);
  return JSON.parse(body);
};

const files0 = [...new Set(batch.posts.flatMap((p) => p.media_files))];
let files = files0;
console.log(`${week}: ${batch.posts.length} drafts, ${files.length} files`);
if (dry) { for (const p of batch.posts) console.log(`  ${p.scheduled_at}  ${p.platform.padEnd(9)} ${p.kind.padEnd(8)} ${p.ref}`); process.exit(0); }

const accounts = await api('/api/accounts');
const list = accounts.accounts ?? accounts;
const ig = list.find((a) => a.platform === 'instagram' && /scamdb/i.test(a.handle));
const x = list.find((a) => a.platform === 'x' && /scamdb/i.test(a.handle));
if (!ig) throw new Error('No scamdb Instagram account in Dispatch: connect it in Dispatch → Accounts.');
const project = ig.project_id;
if (!x) files = [...new Set(batch.posts.filter((p) => p.platform !== 'x').flatMap((p) => p.media_files))];

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
  const res = await api(`/api/media?project=${encodeURIComponent(project)}&filename=${encodeURIComponent(`${week}-${name}`)}`, { method: 'POST', headers: { 'Content-Type': type }, file: path });
  keys[f] = res.key;
  console.log(`  uploaded ${f}`);
}

const skipped = x ? [] : batch.posts.filter((p) => p.platform === 'x').map((p) => p.ref);
const posts = batch.posts.filter((p) => x || p.platform !== 'x').map(({ media_files, ...p }) => ({
  ...p,
  account: p.platform === 'x' ? (x?.id ?? p.account) : ig.id,
  media: media_files.map((f) => keys[f]),
}));
if (skipped.length) console.log(`  skipped ${skipped.length} X drafts: no X account connected in Dispatch (${skipped.join(', ')})`);
const out = await api('/api/posts/batch', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ project, batch: batch.batch, posts }) });
console.log(`  saved ${out.saved}, not saved ${out.rejected}, X cost estimate ${out.x_cost_estimate} USD`);
for (const p of out.results ?? []) {
  const flags = [...(p.errors ?? []).map((e) => `ERROR ${e}`), ...(p.warnings ?? []).map((w) => `warn ${w}`)];
  console.log(`  ${p.ref}${flags.length ? `\n    ${flags.join('\n    ')}` : ' ok'}`);
}
console.log(`Done. Review and approve in Dispatch: ${BASE}`);
