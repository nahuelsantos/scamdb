// 10-second animation test in the site's style (1080×1920, 30 fps, MP4, no sound).
// Usage: npm run build && node marketing/tools/video-test.mjs
// Draws with the site's helpers, animates with CSS, then steps every animation frame by frame
// (deterministic, no screen recording) and joins the frames with ffmpeg.
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';
import { serve } from '../../tools/serve.mjs';
import { sketch, roundRect } from '../../lib/sketch.js';
import { LOGO } from '../../site/templates/logo.js';
import { STEP_ICONS } from '../../site/templates/icons.js';

const ROOT = new URL('../../', import.meta.url).pathname;
const OUT = join(ROOT, 'marketing/videos/test-10s');
const FPS = 30, SECONDS = 10, W = 1080, H = 1920;

// Every pen line gets pathLength=1 so CSS can "draw" it with stroke-dashoffset.
const drawable = (svg, cls) => svg.replace(/<path class="(sk[^"]*)"/g, `<path pathLength="1" class="$1 vt-${cls.split(" ").join(" vt-")}"`);

const k = sketch(2101);
const BUBBLE = drawable(k.path(roundRect(90, 520, 900, 560, 34), { fill: 'card', shade: true }) + k.path('M150 1080 l-8 52 l52 -52', { fill: 'card' }), 'draw d1');
const STAMP = drawable(k.rect(0, 0, 360, 130, { kind: 'acc' }) + k.rect(10, 10, 340, 110, { kind: 'acc' }), 'draw d3');
const ICONS = ['impersonation', 'urgency', 'unknown_link', 'money_request'].map((s, i) => `<div class="vt-ic" style="animation-delay:${6.9 + i * 0.25}s">${STEP_ICONS[s]}</div>`).join('');

const QUOTE = 'The USPS package has arrived at the warehouse and';
const FLAG = 'cannot be delivered due to incomplete address information.';
const words = (s, start, step, hl) => s.split(' ').map((w, i) => `<span class="vt-w${hl ? ' vt-hlw' : ''}" style="animation-delay:${(start + i * step).toFixed(2)}s${hl ? `, ${(hl + i * 0.09).toFixed(2)}s` : ''}">${w}</span>`).join(' ');

const html = `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="/assets/styles.css"><style>
html,body{margin:0;background:var(--paper)}
.vt-v{position:relative;width:${W}px;height:${H}px;overflow:hidden;background:var(--paper);color:var(--ink);font-family:var(--body)}
.vt-layer{position:absolute;inset:0}
svg.vt-full{position:absolute;left:0;top:0;width:${W}px;height:${H}px;overflow:visible}
.vt-draw{stroke-dasharray:1;stroke-dashoffset:1;animation:draw .9s ease-out forwards}
.sk-shade.vt-draw,.sk-fill-card{animation:fade .5s ease-out forwards;opacity:0}
.vt-d1{animation-delay:.3s}.vt-d1.sk-shade{animation-delay:.9s}
.vt-d3{animation-duration:.25s;animation-delay:5.3s}
@keyframes draw{to{stroke-dashoffset:0}}@keyframes fade{to{opacity:1}}
.vt-eyebrow{position:absolute;left:90px;top:150px;font-family:var(--mono);font-size:34px;letter-spacing:.14em;text-transform:uppercase;color:var(--dim);opacity:0;animation:fade .6s .1s forwards}
.vt-q{position:absolute;left:90px;top:230px;width:900px;font-family:var(--display);font-weight:700;font-size:112px;letter-spacing:-.04em;line-height:.95;opacity:0;animation:up .7s .2s forwards}
@keyframes up{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:none}}
.vt-msg{z-index:2;position:absolute;left:150px;top:590px;width:790px;font-size:52px;line-height:1.38}
.vt-sender{font-weight:600;font-size:34px;margin-bottom:10px;opacity:0;animation:fade .3s 1.1s forwards}.vt-sender span{font-family:var(--mono);font-weight:400;color:var(--dim);font-size:28px;margin-left:12px}
.vt-w{opacity:0;animation:fade .12s forwards}
.vt-hlw{background:linear-gradient(var(--hl),var(--hl)) no-repeat 0 60%/0% 84%;border-radius:6px;padding:0 4px;margin:0 -4px;animation:fade .12s forwards,hlw .25s ease-out forwards}
@keyframes hlw{to{background-size:100% 84%}}
.vt-flag{position:relative}
.vt-hl{position:absolute;left:-6px;right:-6px;top:8%;bottom:4%;background:var(--hl);border-radius:8px;transform:scaleX(0);transform-origin:left;animation:sweep .9s 4.2s ease-in-out forwards;z-index:-1}
@keyframes sweep{to{transform:scaleX(1)}}
.vt-flagtext{position:relative;z-index:1}
.vt-src{position:absolute;left:90px;top:1170px;font-family:var(--mono);font-size:26px;color:var(--dim);width:900px;opacity:0;animation:fade .5s 3.6s forwards}
.vt-stamp{position:absolute;left:600px;top:1000px;width:360px;height:130px;transform:rotate(-9deg) scale(1.6);opacity:0;animation:thump .3s 5.2s cubic-bezier(.2,1.6,.4,1) forwards}
.vt-stamp b{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:var(--mono);font-weight:500;color:var(--accent-ink);font-size:72px;letter-spacing:.18em}
.vt-stamp svg{position:absolute;inset:0;width:360px;height:130px;overflow:visible}
@keyframes thump{to{opacity:1;transform:rotate(-9deg) scale(1)}}
.vt-cap{position:absolute;left:90px;top:1300px;width:900px;font-family:var(--display);font-weight:700;font-size:72px;letter-spacing:-.03em;line-height:1;opacity:0;animation:up .6s 6.3s forwards}
.vt-cap em{font-style:normal;background:var(--hl);padding:0 .1em;border-radius:8px}
.vt-icons{position:absolute;left:90px;top:1500px;display:flex;gap:40px}
.vt-ic{width:170px;height:170px;opacity:0;animation:up .45s forwards}.vt-ic svg{width:100%;height:100%}
.vt-end{z-index:10;position:absolute;inset:0;background:var(--paper);display:flex;flex-direction:column;align-items:center;justify-content:center;opacity:0;animation:fade .5s 8.5s forwards}
.vt-end svg{width:300px;height:300px}
.vt-end .vt-name{font-family:var(--display);font-weight:700;font-size:110px;letter-spacing:-.04em;margin-top:20px}
.vt-end .vt-url{font-family:var(--mono);font-size:44px;margin-top:24px}
.vt-end .vt-url em{font-style:normal;background:var(--hl);padding:0 .2em;border-radius:8px}
.vt-end .vt-small{font-family:var(--hand);font-size:46px;margin-top:60px;color:var(--ink)}
.vt-foot{position:absolute;left:90px;right:90px;bottom:110px;display:flex;justify-content:space-between;align-items:center;font-family:var(--mono);font-size:30px;color:var(--dim)}
.vt-foot .vt-b{display:flex;align-items:center;gap:16px;font-family:var(--display);font-weight:700;font-size:44px;color:var(--ink)}.vt-foot svg{width:76px;height:76px}
</style></head><body><div class="vt-v">
<div class="vt-eyebrow">Is it a scam?</div>
<div class="vt-q">Got a text like this?</div>
<svg class="vt-full" viewBox="0 0 ${W} ${H}">${BUBBLE}</svg>
<div class="vt-msg"><div class="vt-sender">“USPS”<span>SMS</span></div>${words(QUOTE, 1.3, 0.11)} ${words(FLAG, 1.3 + QUOTE.split(' ').length * 0.11, 0.11, 4.2)}</div>
<div class="vt-src">Real scam text quoted by FOX 5 DC, citing the U.S. Postal Inspection Service, Dec 2, 2024.</div>
<div class="vt-stamp"><svg viewBox="0 0 360 130">${STAMP}</svg><b>SCAM</b></div>
<div class="vt-cap">Paste it on scamdb. <em>See the script.</em></div>
<div class="vt-icons">${ICONS}</div>
<div class="vt-foot"><span class="vt-b">${LOGO}scamdb</span><span>scamdb.dev</span></div>
<div class="vt-end">${LOGO}<div class="vt-name">scamdb</div><div class="vt-url">Check a message: <em>scamdb.dev</em></div><div class="vt-small">free · runs in your browser</div></div>
</div></body></html>`;

await rm(OUT, { recursive: true, force: true });
await mkdir(join(OUT, 'frames'), { recursive: true });
await mkdir(join(ROOT, 'dist/_mk'), { recursive: true });
await writeFile(join(ROOT, 'dist/_mk/video-test.html'), html);
const server = await serve(join(ROOT, 'dist'), 0);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1, colorScheme: 'light' });
await page.goto(`http://127.0.0.1:${server.address().port}/_mk/video-test.html`, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.evaluate(() => document.getAnimations().forEach((a) => a.pause()));
for (let f = 0; f < FPS * SECONDS; f++) {
  await page.evaluate((ms) => document.getAnimations().forEach((a) => { a.currentTime = ms; }), (f * 1000) / FPS);
  await page.screenshot({ path: join(OUT, 'frames', `${String(f).padStart(4, '0')}.png`) });
}
await browser.close();
server.close();
const mp4 = join(OUT, 'scamdb-test-10s.mp4');
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', join(OUT, 'frames/%04d.png'),
  '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-crf', '18', '-movflags', '+faststart', mp4]);
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', join(OUT, 'frames/0165.png'), join(OUT, 'still-5.5s.png')]);
await rm(join(OUT, 'frames'), { recursive: true });
console.log(`wrote ${mp4}`);
