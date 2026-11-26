// From december-plan.mjs, writes for each week:
//   marketing/publish-week-NN.md      the day-by-day guide (your time, every file, every text, what to do by hand)
//   marketing/dispatch/2026-WNN.json  the same week as Dispatch drafts (send with send-dispatch.mjs)
//   marketing/scamdb-weekNN.zip       every file for that week (not committed)
// Usage: node marketing/tools/gen-guides.mjs
import { mkdir, rm, writeFile, cp, readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { WEEKS, HIGHLIGHTS } from './december-plan.mjs';

const ROOT = new URL('../../', import.meta.url).pathname;
const TMP = '/tmp/claude-0/-home-user-scamdb/eaf12aea-26cd-5497-a943-f7f29d3e432d/scratchpad/guides';
const ACCOUNTS = { instagram: '@scamdb.dev', x: '@scamdb' };
const ASK_X = ['Got one, scam or genuine? Send it to us (link in bio).', 'Got one? Send it to us (link in bio).'];

const et = (t) => { const [h, m] = t.split(':').map(Number); return `${String((h + 18) % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`; };
const xlen = (s) => { let n = 0; for (const ch of s.replace(/https?:\/\/\S+/g, () => { n += 23; return ''; })) n += ch.codePointAt(0) > 0x10ff ? 2 : 1; return n; };

async function readPost(week, id) {
  const dir = join(ROOT, 'marketing/posts', week, id);
  const md = await readFile(join(dir, 'post.md'), 'utf8');
  const blocks = (lang) => [...md.matchAll(new RegExp('```' + lang + '\\n([\\s\\S]*?)\\n```', 'g'))].map((m) => ({ text: m[1], at: m.index }));
  const xs = blocks('x');
  const before = (b, label) => md.slice(Math.max(0, b.at - 200), b.at).includes(label);
  const igAlt = (md.match(/\*\*Alt text\*\*\n\n([\s\S]*?)\n\n(?:##|\*\*)/) ?? [])[1] ?? '';
  return {
    dir, md,
    title: md.split('\n')[0].replace(/^# [^·]*· /, ''),
    ig: blocks('ig')[0]?.text,
    x: xs.find((b) => !before(b, 'Reply with'))?.text,
    answer: xs.find((b) => before(b, 'Reply with the answer'))?.text,
    igAlt: igAlt.replace(/\n {3}/g, ' ').trim(),
    xAlt: (md.match(/\*\*Alt text \(\d\d-x\.png\):\*\* ([\s\S]*?)\n\n/) ?? [])[1]?.replace(/\n/g, ' ') ?? '',
    images: (await readdir(dir)).filter((f) => f.endsWith('.png')).sort(),
  };
}

/** X text for Dispatch: one standalone post, no links (X charges more for links and shows them less). */
function xForDispatch(text, { quiz = false } = {}) {
  let t = text.split('\n').filter((l) => !/https?:\/\//.test(l)).join('\n').replace(/\n{3,}/g, '\n\n').trim();
  if (quiz) t = t.replace('Answer in the replies.', 'Answer later today.');
  if (/link in bio|Send it to us|AI, made from|AI copy/i.test(t)) return t;
  for (const ask of ASK_X) if (xlen(`${t}\n\n${ask}`) <= 280) return `${t}\n\n${ask}`;
  return t;
}

const CAL = [];
const KIND = { 'ig-post': 'IG post', 'ig-reel': 'IG Reel', 'x-img': 'X image', 'x-vid': 'X video', 'x-text': 'X text', 'x-answer': 'X answer', story: 'IG Story', 'story-manual': 'IG Story ✋' };
const iso = (date, time) => `${date}T${time}:00+01:00`;

for (const w of WEEKS) {
  const zipDir = join(TMP, `week${w.n}`);
  await rm(zipDir, { recursive: true, force: true });
  await mkdir(join(zipDir, 'copy'), { recursive: true });
  const drafts = [];
  const L = [`# How to publish: ${w.title}`, '',
    'Every post, Reel, Story and X post for the week, in order. Times are **your time (Spain)**, US Eastern in brackets.', '',
    '**Two ways to publish, same content:**', '',
    `- **Dispatch:** \`marketing/dispatch/2026-W${w.n}.json\` has the week as drafts (every caption, file and time). Send it with`,
    '  `node marketing/tools/send-dispatch.mjs 2026-W' + w.n + '`, then review and approve in Dispatch. Dispatch can’t do the steps marked ✋, so those stay',
    '  with you (a few minutes a day).',
    `- **By hand:** everything is in \`scamdb-week${w.n}.zip\`: one folder per day, \`copy/\` with every post file, \`stories/\` and \`highlights/\`.`, '',
    '**Every time:** captions are in the `post.md` named (in the zip: `copy/<name>.md`), block **ig** for Instagram. For X, use the text printed',
    'here: it is the Dispatch version, one post with no link (“link in bio” instead), so there is no reply to add. On Reels the',
    '**Voice: AI, made from my own.** line stays in the caption.', ''];
  const posts = new Set();
  for (const [date, day, items] of w.days) {
    L.push(`## ${day}`, '');
    const short = date.slice(5);
    for (const [time, kind, ref, extra] of items) {
      CAL.push([day.split(' · ')[0], time, kind, ref, extra]);
      const when = `**${time}** (${et(time)} ET)`;
      const dest = join(zipDir, short);
      await mkdir(dest, { recursive: true });
      if (kind === 'story' || kind === 'story-manual') {
        const sdir = (await readdir(join(ROOT, 'marketing/stories'))).map((d) => join('marketing/stories', d, ref)).find((p) => existsSync(join(ROOT, p)));
        const file = join(sdir, '01-s.png');
        await mkdir(join(zipDir, 'stories'), { recursive: true });
        await cp(join(ROOT, file), join(zipDir, 'stories', `${ref}.png`));
        if (kind === 'story') {
          L.push(`${when} · **Instagram Story** · \`stories/${ref}.png\` · Dispatch posts it as is.`, '');
          drafts.push({ ref: `${ref}-${short}`, account: ACCOUNTS.instagram, platform: 'instagram', kind: 'story', scheduled_at: iso(date, time), timezone: 'Europe/Madrid', caption: '', media_files: [file], notes: 'Story image, no stickers. Add it to its Highlight afterwards (see the guide).' });
        } else {
          L.push(`${when} · ✋ **Instagram Story, by hand** · \`stories/${ref}.png\``, `- ${extra}`, '- Not in Dispatch: Instagram doesn’t let apps add stickers.', '');
        }
        continue;
      }
      const p = await readPost(w.week, ref);
      if (!posts.has(ref)) { posts.add(ref); await cp(join(p.dir, 'post.md'), join(zipDir, 'copy', `${ref}.md`)); }
      if (kind === 'ig-post') {
        const imgs = p.images.filter((f) => f.endsWith('-ig.png'));
        for (const f of imgs) await cp(join(p.dir, f), join(dest, `${ref}-${f}`));
        L.push(`${when} · **Instagram ${imgs.length > 1 ? 'carousel' : 'post'}** · ${p.title}`,
          `- Images, in order: ${imgs.map((f) => '`' + `${short}/${ref}-${f}` + '`').join(', ')}`,
          `- Caption: \`copy/${ref}.md\` → **ig**. ✋ Alt text (same file): Dispatch can’t add it, so once it’s live: ⋯ → Edit → Edit alt text.`, '');
        drafts.push({ ref: `${ref}-ig`, account: ACCOUNTS.instagram, platform: 'instagram', kind: imgs.length > 1 ? 'carousel' : 'post', scheduled_at: iso(date, time), timezone: 'Europe/Madrid', caption: p.ig, media_files: imgs.map((f) => join('marketing/posts', w.week, ref, f)), notes: `Alt text (add after posting: ⋯ → Edit → Edit alt text):\n${p.igAlt}` });
      } else if (kind === 'ig-reel' || kind === 'x-vid') {
        const vdir = join('marketing/videos', extra);
        const mp4 = (await readdir(join(ROOT, vdir))).find((f) => f.endsWith('.mp4'));
        await cp(join(ROOT, vdir, mp4), join(dest, mp4));
        await cp(join(ROOT, vdir, 'cover.png'), join(dest, `${extra}-cover.png`));
        const label = extra.replace('video', 'Video ');
        if (kind === 'ig-reel') {
          L.push(`${when} · **Instagram Reel** · ${label}: ${p.title.replace(/^Video \d+: /, '').replace(/ \(Reel \+ X video\)$/, '')}`,
            `- Video: \`${short}/${mp4}\` · Cover: \`${short}/${extra}-cover.png\` · Caption: \`copy/${ref}.md\` → **ig**`,
            '- ✋ Once it’s live: set the cover (Reel → ⋯ → Edit → Edit cover → add from camera roll), share it to your Story (paper plane → Add to story), and add that Story to its Highlight.', '');
          drafts.push({ ref: `${ref}-reel`, account: ACCOUNTS.instagram, platform: 'instagram', kind: 'reel', scheduled_at: iso(date, time), timezone: 'Europe/Madrid', caption: p.ig, media_files: [join(vdir, mp4)], notes: `${label}. After it posts: set the cover (${vdir}/cover.png), share to Story, add to the Highlight.` });
        } else {
          const xt = xForDispatch(p.x);
          L.push(`${when} · **X video** · ${label} · \`${short}/${mp4}\``, '', '```x', xt, '```', `<sub>${xlen(xt)}/280</sub>`, '');
          drafts.push({ ref: `${ref}-x`, account: ACCOUNTS.x, platform: 'x', kind: 'post', scheduled_at: iso(date, time), timezone: 'Europe/Madrid', caption: xt, media_files: [join(vdir, mp4)], notes: label });
        }
      } else if (kind === 'x-img') {
        const img = p.images.find((f) => f.endsWith('-x.png'));
        await cp(join(p.dir, img), join(dest, `${ref}-${img}`));
        const xt = xForDispatch(p.x, { quiz: Boolean(p.answer) });
        L.push(`${when} · **X post with image** · ${p.title} · \`${short}/${ref}-${img}\``, '', '```x', xt, '```', `<sub>${xlen(xt)}/280 · Alt text: in \`copy/${ref}.md\`</sub>`, '');
        drafts.push({ ref: `${ref}-x`, account: ACCOUNTS.x, platform: 'x', kind: 'post', scheduled_at: iso(date, time), timezone: 'Europe/Madrid', caption: xt, media_files: [join('marketing/posts', w.week, ref, img)], notes: `Alt text: ${p.xAlt}` });
      } else if (kind === 'x-answer') {
        const xt = [`Today’s Real or scam? The answer: ${p.answer}`, `Real or scam? ${p.answer}`].map((t) => xForDispatch(t)).find((t) => xlen(t) <= 280) ?? xForDispatch(p.answer);
        L.push(`${when} · **X post, the quiz answer** (its own post, no image)`, '', '```x', xt, '```', `<sub>${xlen(xt)}/280</sub>`, '');
        drafts.push({ ref: `${ref}-x-answer`, account: ACCOUNTS.x, platform: 'x', kind: 'post', scheduled_at: iso(date, time), timezone: 'Europe/Madrid', caption: xt, media_files: [], notes: 'Answer to the 18:00 quiz post.' });
      } else if (kind === 'x-text') {
        const xt = xForDispatch(p.x);
        L.push(`${when} · **X text post**`, '', '```x', xt, '```', `<sub>${xlen(xt)}/280</sub>`, '');
        drafts.push({ ref: `${ref}-x`, account: ACCOUNTS.x, platform: 'x', kind: 'post', scheduled_at: iso(date, time), timezone: 'Europe/Madrid', caption: xt, media_files: [], notes: '' });
      }
    }
  }
  L.push('## Highlights (by hand, a minute each)', '',
    'Covers are in the zip (`highlights/`). To add a Story that Dispatch posted: open the Highlight → ⋯ → Edit highlight → Stories → pick it from your archive.', '',
    ...Object.entries(HIGHLIGHTS).map(([name, h]) => `- **${name}** (\`${h.cover}\`): ${h.what}`), '',
    '## Every day, after posting (10–15 minutes)', '',
    '1. Answer comments and DMs (saved replies on Instagram: `/report`, `/check`, `/lost`, `/recovery`).',
    '2. Hide recovery-scam spam (X: ⋯ → Hide reply).',
    '3. Note the numbers: link taps, shares, saves; Reel average watch time; Story poll votes and link-sticker taps.', '');
  if (w.extra) L.push(w.extra, '');
  const md = L.join('\n');
  await writeFile(join(ROOT, `marketing/publish-week-${w.n}.md`), md);
  await writeFile(join(zipDir, `publish-week-${w.n}.md`), md);
  await mkdir(join(ROOT, 'marketing/dispatch'), { recursive: true });
  const batch = { project: '<project_id>', batch: `2026-W${w.n}`, posts: drafts };
  await writeFile(join(ROOT, `marketing/dispatch/2026-W${w.n}.json`), JSON.stringify(batch, null, 2) + '\n');
  await cp(join(ROOT, 'marketing/brand/highlights'), join(zipDir, 'highlights'), { recursive: true });
  const zip = join(ROOT, `marketing/scamdb-week${w.n}.zip`);
  await rm(zip, { force: true });
  execFileSync('zip', ['-qr', zip, `week${w.n}`], { cwd: TMP });
  const long = drafts.filter((d) => d.platform === 'x' && xlen(d.caption) > 280).map((d) => d.ref);
  console.log(`week ${w.n}: ${drafts.length} drafts${long.length ? ` · OVER 280: ${long.join(', ')}` : ''}`);
}

// The calendar table in campaign-december.md (between the calendar markers).
const camp = join(ROOT, 'marketing/campaign-december.md');
const rows = ['| Day | Time | Where | What |', '|---|---|---|---|'];
let last = '';
for (const [day, time, kind, ref, extra] of CAL) {
  const what = extra?.startsWith?.('video') ? `${extra.replace('video', 'Video ')}` : kind.startsWith('story') ? `\`${ref}\`` : `\`${ref}\``;
  rows.push(`| ${day === last ? '' : `**${day}**`} | ${time} | ${KIND[kind]} | ${what} |`);
  last = day;
}
const c = await readFile(camp, 'utf8');
await writeFile(camp, c.replace(/<!-- calendar -->[\s\S]*<!-- \/calendar -->/, `<!-- calendar -->\n${rows.join('\n')}\n<!-- /calendar -->`));
console.log(`calendar: ${CAL.length} items, X posts: ${CAL.filter((r) => r[2].startsWith('x-')).length}`);
