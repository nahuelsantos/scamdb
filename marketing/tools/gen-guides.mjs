// Writes the day-by-day publishing guide for each December week (marketing/publish-week-NN.md) and a zip with that
// week's files (marketing/scamdb-weekNN.zip, not committed). Usage: node marketing/tools/gen-guides.mjs
import { mkdir, rm, writeFile, cp, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = new URL('../../', import.meta.url).pathname;
const TMP = '/tmp/claude-0/-home-user-scamdb/eaf12aea-26cd-5497-a943-f7f29d3e432d/scratchpad/guides';

// kind: ig-post (feed images), ig-reel, x-img, x-vid, x-text. `post` is the folder under marketing/posts/<week>/.
const WEEKS = [
  { n: 49, week: '2026-12-W49', title: 'Mon Nov 30 – Fri Dec 4 · After the shopping weekend', days: [
    ['Mon Nov 30', [['12:00', 'ig-post', 'w49-mon-bank-zelle', 'Carousel: the fake fraud alert'], ['12:00', 'x-img', 'w49-mon-bank-zelle']]],
    ['Tue Dec 1', [['12:00', 'ig-post', 'w49-tue-gift-cards', 'Nobody real asks for gift cards'], ['12:00', 'x-img', 'w49-tue-gift-cards']]],
    ['Wed Dec 2', [['12:00', 'ig-post', 'w49-wed-real-or-scam-bank', 'Real or scam? Two bank alerts'], ['12:00', 'x-img', 'w49-wed-real-or-scam-bank', 'answer reply a few hours later']]],
    ['Thu Dec 3', [['12:00', 'ig-post', 'w49-thu-safe-account', '“Move it to a safe account”, 5 languages'], ['12:00', 'x-img', 'w49-thu-safe-account']]],
    ['Fri Dec 4', [['12:00', 'ig-post', 'w49-fri-how-the-check-works', 'How the check works'], ['12:00', 'x-img', 'w49-fri-how-the-check-works', 'also the developer reply']]],
  ], extra: '**Sunday Dec 6:** review the first two weeks together (`playbook.md` §7). Bring your notes: link taps, shares, saves, Reel watch time.' },
  { n: 50, week: '2026-12-W50', title: 'Mon Dec 7 – Fri Dec 11 · Deliveries and gifts', days: [
    ['Mon Dec 7', [['12:00', 'ig-post', 'w50-mon-prize', 'Carousel: “You won! Just pay the fees.”'], ['12:00', 'x-img', 'w50-mon-prize']]],
    ['Tue Dec 8', [['12:00', 'ig-post', 'w50-tue-new-number', '“Hi Mum, this is my new number”'], ['12:00', 'x-vid', 'w50-tue-video5', 'video5'], ['17:30', 'ig-reel', 'w50-tue-video5', 'video5']]],
    ['Wed Dec 9', [['12:00', 'ig-post', 'w50-wed-real-or-scam-code', 'Real or scam? Two code messages'], ['12:00', 'x-img', 'w50-wed-real-or-scam-code', 'answer reply a few hours later']]],
    ['Thu Dec 10', [['12:00', 'ig-post', 'w50-thu-parcel-world', 'The parcel text in 70 countries'], ['12:00', 'x-img', 'w50-thu-parcel-world']]],
    ['Fri Dec 11', [['12:00', 'ig-post', 'w50-fri-genuine-ask', 'Send us your boring messages'], ['12:00', 'x-img', 'w50-fri-genuine-ask']]],
  ] },
  { n: 51, week: '2026-12-W51', title: 'Mon Dec 14 – Fri Dec 18 · Love, giving and fees', days: [
    ['Mon Dec 14', [['12:00', 'ig-post', 'w51-mon-romance', 'Carousel: the online love who needs money'], ['12:00', 'x-img', 'w51-mon-romance']]],
    ['Tue Dec 15', [['12:00', 'ig-post', 'w51-tue-the-fee', 'Pay a little to get a lot'], ['12:00', 'x-img', 'w51-tue-the-fee']]],
    ['Wed Dec 16', [['12:00', 'ig-post', 'w51-wed-real-or-scam-subscription', 'Real or scam? Subscriptions'], ['12:00', 'x-vid', 'w51-wed-video6', 'video6'], ['17:30', 'ig-reel', 'w51-wed-video6', 'video6']]],
    ['Thu Dec 17', [['12:00', 'ig-post', 'w51-thu-charity-world', 'Fake charities, Iceland to Venezuela'], ['12:00', 'x-img', 'w51-thu-charity-world']]],
    ['Fri Dec 18', [['12:00', 'ig-post', 'w51-fri-what-scammers-ask', 'What 1,199 scams have in common'], ['12:00', 'x-img', 'w51-fri-what-scammers-ask']]],
  ] },
  { n: 52, week: '2026-12-W52', title: 'Mon Dec 21 – Sat Dec 26 · Christmas and Boxing Day', days: [
    ['Mon Dec 21', [['12:00', 'ig-post', 'w52-mon-utility', 'Carousel: “Pay now or your power goes off”'], ['12:00', 'x-vid', 'w52-mon-video7', 'video7'], ['17:30', 'ig-reel', 'w52-mon-video7', 'video7']]],
    ['Tue Dec 22', [['12:00', 'ig-post', 'w52-tue-secrecy', '“Don’t tell anyone.”'], ['12:00', 'x-img', 'w52-tue-secrecy']]],
    ['Wed Dec 23', [['12:00', 'ig-post', 'w52-wed-real-or-scam-verification', 'Real or scam? The verification code'], ['12:00', 'x-img', 'w52-wed-real-or-scam-verification', 'answer reply a few hours later']]],
    ['Thu Dec 24', [['09:00', 'ig-post', 'w52-thu-christmas-eve', 'Christmas Eve: pick a family code word'], ['09:00', 'x-img', 'w52-thu-christmas-eve']]],
    ['Fri Dec 25', [['10:00', 'x-text', 'w52-fri-christmas', 'No Instagram post today (optional: share yesterday’s post to your Story)']]],
    ['Sat Dec 26', [['08:00', 'ig-post', 'w52-sat-boxing-day', 'Boxing Day: check the shop first (aimed at UK, Canada, Australia, NZ: morning in the UK, evening down under)'], ['08:00', 'x-img', 'w52-sat-boxing-day']]],
  ] },
  { n: 53, week: '2026-12-W53', title: 'Mon Dec 28 – Thu Dec 31 · Year end', days: [
    ['Mon Dec 28', [['12:00', 'ig-post', 'w53-mon-tax-refund', 'Carousel: “You’re owed a refund”'], ['12:00', 'x-img', 'w53-mon-tax-refund']]],
    ['Tue Dec 29', [['12:00', 'ig-post', 'w53-tue-year-in-scamdb', 'scamdb’s first year in numbers (check the numbers with `npm run build` first)'], ['12:00', 'x-img', 'w53-tue-year-in-scamdb']]],
    ['Thu Dec 31', [['12:00', 'ig-post', 'w53-thu-new-year', 'Three rules for 2027'], ['12:00', 'x-img', 'w53-thu-new-year']]],
  ] },
];

// The owner posts in Spain: ET + 6 hours (true for all of Nov–Dec).
const local = (et) => { const [h, m] = et.split(':').map(Number); return `${String((h + 6) % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`; };
const short = (d) => d.split(' ')[0].toLowerCase();
const HOW = { 'ig-post': 'Instagram carousel or image post', 'ig-reel': 'Instagram Reel', 'x-img': 'X image post', 'x-vid': 'X video post', 'x-text': 'X text post' };

for (const w of WEEKS) {
  const zipDir = join(TMP, `week${w.n}`);
  await rm(zipDir, { recursive: true, force: true });
  await mkdir(join(zipDir, 'copy'), { recursive: true });
  const L = [`# How to publish: ${w.title}`, '',
    `All files are in **\`scamdb-week${w.n}.zip\`** (one folder per day, plus \`copy/\` with every caption), or on the branch in`,
    `\`marketing/posts/${w.week}/\` and \`marketing/videos/\`. Copy the block marked **ig** for Instagram and **x** for X, exactly as written.`,
    `Times are **your time (Spain)**, US Eastern in brackets: posts 18:00 (12:00 ET), Reels 23:30 (17:30 ET). How to do each type, step by step: \`publish-week-48.md\` → "How to post each type".`, '',
    '**Every time:** add the alt text (in the same `post.md`), turn off "Share to Facebook", and after every X post add the **reply with the ask**. On Reels, use the `cover.png`, keep the **Voice: AI-generated…** line in the caption (no AI label, your choice), share it to your Story and add it to a Highlight (Scams, or Real or scam? for quizzes).', ''];
  const posts = new Set();
  for (const [day, items] of w.days) {
    L.push(`## ${day}`, '');
    for (const [time, kind, post, note] of items) {
      posts.add(post);
      const dir = join(ROOT, 'marketing/posts', w.week, post);
      const dest = join(zipDir, short(day), post);
      await mkdir(dest, { recursive: true });
      let files = [];
      if (kind === 'ig-post') files = (await readdir(dir)).filter((f) => f.endsWith('-ig.png')).sort();
      if (kind === 'x-img') files = (await readdir(dir)).filter((f) => f.endsWith('-x.png'));
      if (kind === 'ig-reel' || kind === 'x-vid') {
        const vdir = join(ROOT, 'marketing/videos', note);
        files = (await readdir(vdir)).filter((f) => f.endsWith('.mp4') || f === 'cover.png');
        for (const f of files) await cp(join(vdir, f), join(dest, f));
      } else for (const f of files) await cp(join(dir, f), join(dest, f));
      const label = kind === 'ig-post' ? note : kind === 'ig-reel' || kind === 'x-vid' ? note.replace("video", "Video ") : (note ?? 'image');
      L.push(`**${local(time)} (${time} ET) · ${HOW[kind]}** — ${label}`,
        `- Files: ${files.length ? files.map((f) => '`' + `${short(day)}/${post}/${f}` + '`').join(', ') : 'none (text only)'}`,
        `- Copy: \`copy/${post}.md\` → **${kind.startsWith('ig') ? 'ig' : 'x'}** block${kind === 'x-img' && note && note !== 'image' ? ` (${note})` : ''}`, '');
    }
  }
  for (const p of posts) await cp(join(ROOT, 'marketing/posts', w.week, p, 'post.md'), join(zipDir, 'copy', `${p}.md`));
  L.push('## Every day, after posting (10–15 minutes)', '',
    '1. Answer comments (saved replies on Instagram: `/report`, `/check`, `/lost`, `/recovery`).',
    '2. Hide recovery-scam spam (X: ⋯ → Hide reply).',
    '3. Note the numbers: link taps, shares, saves; for Reels, average watch time.', '');
  if (w.extra) L.push(w.extra, '');
  const md = L.join('\n');
  await writeFile(join(ROOT, `marketing/publish-week-${w.n}.md`), md);
  await writeFile(join(zipDir, `publish-week-${w.n}.md`), md);
  const zip = join(ROOT, `marketing/scamdb-week${w.n}.zip`);
  await rm(zip, { force: true });
  execFileSync('zip', ['-qr', zip, `week${w.n}`], { cwd: TMP });
  console.log(`week ${w.n}: guide + zip`);
}
