// Video 2 "Why only $12.51?": the owner's voice + an animation in the site's style (1080×1920, 30 fps, MP4).
// Usage: npm run build && node marketing/tools/video2.mjs
// The voice is cut from marketing/videos/voice/voiceover-take1.m4a (best take of each line), cleaned and levelled.
// Every animation is a CSS animation with a delay taken from the voice timeline; frames are stepped one by one.
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';
import { serve } from '../../tools/serve.mjs';
import { sketch, roundRect } from '../../lib/sketch.js';
import { LOGO } from '../../site/templates/logo.js';
import { ICONS, STEP_ICONS } from '../../site/templates/icons.js';

const ROOT = new URL('../../', import.meta.url).pathname;
const VOICE = join(ROOT, 'marketing/videos/voice/v2-tts-a.mp3');
const OUT = join(ROOT, 'marketing/videos/video2');
const FPS = 30, W = 1080, H = 1920;

// --- Voice: the owner's ElevenLabs narration (voice "Nahuel Inglés", take A), one file, cues from its word timings ---
const LEAD = 0.4, END_HOLD = 2.4, VOICE_LEN = 21.73;
const at = (s) => +(LEAD + s).toFixed(2); // a time in the narration -> a time in the video
const DURATION = +(LEAD + VOICE_LEN + END_HOLD).toFixed(2);
const T = {
  l2: at(4.0), // "Because…"
  scene2: at(3.9),
  flags: [7.4, 9.3, 10.7, 12.6].map(at), // toll program · small amount · $50 threat · and a link
  scene3: at(13.5),
  card: at(16.45), // "They want the card number…"
  scene4: at(19.1),
  send: at(20.2), // "send it to us instead"
};
const CAPTIONS = [
  [at(0), T.l2, 'Why does a fake toll text ask for $12.51?'],
  [T.l2, at(6.4), 'Because nobody argues about $12.'],
  [at(6.9), at(10.6), 'A toll program you know. A small amount.'],
  [at(10.6), at(13.2), 'A $50 threat. And a link.'],
  [at(13.8), T.card, 'They don’t want the $12.51.'],
  [T.card, at(18.8), 'They want the card number you just typed in.'],
  [at(19.4), T.send, 'Don’t tap.'],
  [T.send, at(21.6), 'Send it to us instead.'],
];
const CLIPS = [{ at: LEAD }]; // kept for the first scene's highlight timing

// --- Drawings (site helpers); pathLength=1 lets CSS draw each pen line ---
const drawable = (svg, delay, dur = 0.9) => svg.replace(/<path class="(sk[^"]*)"/g, `<path pathLength="1" class="$1 vt-draw" style="animation-delay:${delay}s;animation-duration:${dur}s"`);
const k = sketch(2201);
const BUBBLE = (at) => drawable(k.path(roundRect(90, 460, 900, 560, 34), { fill: 'card', shade: true }) + k.path('M150 1020 l-8 52 l52 -52', { fill: 'card' }), at);
const RING = (n, at) => `<svg class="vt-ring" viewBox="0 0 70 70" style="animation-delay:${at}s">${sketch(2300 + n).circle(35, 35, 62, { kind: 'acc' })}</svg>`;
const STRIKE = (at) => drawable(sketch(2401).path('M0 30 C 120 18, 260 40, 420 22', { kind: 'acc' }), at, 0.35);
const icon = (svg, at, size, style) => `<div class="vt-icon" style="width:${size}px;height:${size}px;${style};animation-delay:${at}s">${svg}</div>`;

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const words = (s, start, step, hl) => s.split(' ').map((w, i) => `<span class="vt-w${hl !== undefined ? ' vt-hlw' : ''}" style="animation-delay:${(start + i * step).toFixed(2)}s${hl !== undefined ? `, ${(hl + i * 0.06).toFixed(2)}s` : ''}">${esc(w)}</span>`).join(' ');
const scene = (inAt, outAt, body) => `<div class="vt-scene" style="animation-delay:${inAt}s${outAt ? `, ${outAt}s` : ''};animation-name:${outAt ? 'fadein, fadeout' : 'fadein'}">${body}</div>`;

// Message, typed from scene2+0.3 at 0.07 s per word; flags highlight on the voice cue.
const TYPE0 = T.scene2 + 0.3, STEP = 0.07;
const parts = [
  ['(State Toll Service Name):', 0], ['We’ve noticed an outstanding toll amount of'], ['$12.51', 1], ['on your record. To avoid'],
  ['a late fee of $50.00,', 2], ['visit'], ['[link]', 3], ['to settle your balance.'],
];
let wi = 0;
const MSG = parts.map(([txt, flag]) => {
  const n = txt.split(' ').length;
  const html = words(txt, TYPE0 + wi * STEP, STEP, flag !== undefined ? T.flags[flag] : undefined)
    + (flag !== undefined ? `<sup class="vt-num" style="animation-delay:${T.flags[flag]}s">${flag + 1}</sup>` : '');
  wi += n;
  return html;
}).join(' ');
const NOTES = ['A toll program you know', 'A small amount', 'A $50 threat', 'And a link'].map((n, i) =>
  `<div class="vt-note" style="animation-delay:${T.flags[i]}s">${RING(i, T.flags[i])}<b>${i + 1}</b><span>${n}</span></div>`).join('');

const html = `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="/assets/styles.css"><style>
html,body{margin:0;background:var(--paper)}
.vt-v{position:relative;width:${W}px;height:${H}px;overflow:hidden;background:var(--paper);color:var(--ink);font-family:var(--body)}
.vt-scene{position:absolute;inset:0;opacity:0;animation-duration:.35s,.3s;animation-fill-mode:forwards;animation-timing-function:ease-out}
@keyframes fadein{to{opacity:1}}@keyframes fadeout{from{opacity:1}to{opacity:0}}
@keyframes draw{to{stroke-dashoffset:0}}@keyframes fade{to{opacity:1}}@keyframes up{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:none}}
.vt-draw{stroke-dasharray:1;stroke-dashoffset:1;animation-name:draw;animation-timing-function:ease-out;animation-fill-mode:forwards}
.sk-shade.vt-draw{stroke-dasharray:none;stroke-dashoffset:0;opacity:0;animation-name:fade}
.sk-fill-card,.sk-fill-paper{opacity:0;animation:fade .4s forwards;animation-delay:inherit}
svg.vt-full{position:absolute;left:0;top:0;width:${W}px;height:${H}px;overflow:visible}
.vt-eyebrow{position:absolute;left:90px;top:170px;font-family:var(--mono);font-size:32px;letter-spacing:.14em;text-transform:uppercase;color:var(--dim)}
.vt-eyebrow b{color:var(--ink);font-weight:500}
.vt-h1{position:absolute;left:90px;top:250px;width:900px;font-family:var(--display);font-weight:700;font-size:118px;letter-spacing:-.04em;line-height:.95}
.vt-h1 .vt-mark,.vt-mark{background:linear-gradient(var(--hl),var(--hl)) no-repeat 0 62%/0% 80%;border-radius:8px;padding:0 .08em;animation:hlw .5s ease-out forwards}
@keyframes hlw{to{background-size:100% 80%}}
.vt-icon{position:absolute;opacity:0;animation:up .5s forwards}.vt-icon svg{width:100%;height:100%}
.vt-pill{position:absolute;left:90px;top:340px;font-family:var(--mono);font-size:28px;padding:10px 22px;border:2px solid var(--ink);border-radius:999px;opacity:0;animation:fade .4s forwards}
.vt-msg{position:absolute;left:150px;top:520px;width:800px;font-size:50px;line-height:1.4;z-index:2}
.vt-sender{font-family:var(--mono);font-size:28px;color:var(--dim);margin-bottom:8px}
.vt-w{opacity:0;animation:fade .1s forwards}
.vt-hlw{background:linear-gradient(var(--hl),var(--hl)) no-repeat 0 60%/0% 84%;border-radius:6px;padding:0 4px;margin:0 -4px;animation:fade .1s forwards,hlw .25s ease-out forwards}
.vt-num{font-family:var(--mono);font-weight:500;color:var(--accent-ink);font-size:.6em;margin-left:.12em;opacity:0;animation:fade .2s forwards}
.vt-src{position:absolute;left:90px;top:1095px;width:900px;font-family:var(--mono);font-size:25px;color:var(--dim);line-height:1.45;opacity:0;animation:fade .5s forwards}
.vt-notes{position:absolute;left:90px;top:1240px;display:flex;flex-direction:column;gap:8px}
.vt-note{position:relative;display:flex;align-items:center;gap:28px;font-family:var(--hand);font-size:50px;opacity:0;animation:up .35s forwards}
.vt-note b{position:absolute;left:0;top:0;width:70px;height:70px;display:flex;align-items:center;justify-content:center;font-family:var(--mono);font-weight:500;font-size:32px;color:var(--accent-ink)}
.vt-ring{width:70px;height:70px;flex:none;overflow:visible}
.vt-big{position:absolute;left:90px;width:900px;font-family:var(--display);font-weight:700;letter-spacing:-.04em;line-height:.98}
.vt-strike{position:absolute;left:460px;top:330px;width:420px;height:60px;overflow:visible}
.vt-cap{position:absolute;left:70px;right:70px;bottom:215px;display:flex;justify-content:center;opacity:0;animation-duration:.15s,.15s;animation-fill-mode:forwards}
.vt-cap span{background:var(--ink);color:var(--paper);font-family:var(--body);font-weight:600;font-size:44px;line-height:1.3;padding:14px 26px;border-radius:14px;text-align:center;max-width:900px}
.vt-foot{position:absolute;left:90px;right:90px;bottom:110px;display:flex;justify-content:space-between;align-items:center;font-family:var(--mono);font-size:30px;color:var(--dim);z-index:5}
.vt-foot .vt-b{display:flex;align-items:center;gap:16px;font-family:var(--display);font-weight:700;font-size:44px;color:var(--ink)}.vt-foot svg{width:76px;height:76px}
.vt-end{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;background:var(--paper);z-index:4}
.vt-end .vt-logo svg{width:280px;height:280px}
.vt-end .vt-t1{font-family:var(--display);font-weight:700;font-size:120px;letter-spacing:-.04em;margin-top:30px}
.vt-end .vt-t2{font-family:var(--display);font-weight:700;font-size:72px;letter-spacing:-.03em;margin-top:26px;opacity:0;animation:up .4s forwards}
.vt-end .vt-ai{margin-top:40px;text-align:center;font-family:var(--mono);font-size:24px;color:var(--dim)}
.vt-end .vt-t3{font-family:var(--mono);font-size:36px;color:var(--dim);margin-top:44px;opacity:0;animation:fade .4s forwards}
</style></head><body><div class="vt-v">

${scene(0.15, T.scene2, `
<div class="vt-eyebrow"><b>How the trick works</b> · the small amount</div>
<div class="vt-h1">Why does a fake toll text ask for <span class="vt-mark" style="animation-delay:${CLIPS[0].at + 2.9}s">$12.51?</span></div>
${icon(STEP_ICONS.money_request, 0.9, 420, 'right:70px;top:900px')}`)}

${scene(T.scene2, T.scene3, `
<div class="vt-eyebrow"><b>The text</b></div>
<div class="vt-pill" style="animation-delay:${T.scene2 + 0.1}s">Real scam text · as published by the FBI</div>
<svg class="vt-full" viewBox="0 0 ${W} ${H}">${BUBBLE(T.scene2)}</svg>
<div class="vt-msg"><div class="vt-sender">SMS</div>${MSG}</div>
<div class="vt-src" style="animation-delay:${T.scene2 + 1.6}s">Source: FBI Internet Crime Complaint Center (IC3), “Smishing Scam Regarding Debt for Road Toll Services”, Apr 12, 2024. Link replaced.</div>
<div class="vt-notes">${NOTES}</div>`)}

${scene(T.scene3, T.scene4, `
<div class="vt-eyebrow"><b>The point</b></div>
<div class="vt-big" style="top:250px;font-size:112px">They don’t want <span style="position:relative;white-space:nowrap">$12.51.<svg class="vt-strike" viewBox="0 0 420 60" style="left:-10px;top:40px;width:400px">${STRIKE(T.scene3 + 1.1)}</svg></span></div>
<div class="vt-big" style="top:520px;font-size:112px;opacity:0;animation:up .45s ${T.card}s forwards">They want your <span class="vt-mark" style="animation-delay:${T.card + 0.8}s">card number.</span></div>
${icon(ICONS.card, T.card + 0.2, 440, 'left:90px;top:960px')}`)}

${scene(T.scene4, null, `<div class="vt-scene vt-end" style="opacity:1;animation:none">
<div class="vt-logo">${LOGO}</div>
<div class="vt-t1">Don’t tap.</div>
<div class="vt-t2" style="animation-delay:${T.send}s">Send it: <span class="vt-mark" style="animation-delay:${T.send + 0.4}s">scamdb.dev/report</span></div>
<div class="vt-t3" style="animation-delay:${T.send + 0.8}s">Check a message: scamdb.dev</div><div class="vt-ai">Voice: AI-generated from the founder’s own voice</div></div>`)}

${CAPTIONS.map(([a, b, txt]) => `<div class="vt-cap" style="animation-name:fadein, fadeout;animation-delay:${a.toFixed(2)}s, ${(b - 0.08).toFixed(2)}s"><span>${esc(txt)}</span></div>`).join('')}
<div class="vt-foot"><span class="vt-b">${LOGO}scamdb</span><span>scamdb.dev</span></div>
</div></body></html>`;

await rm(OUT, { recursive: true, force: true });
await mkdir(join(OUT, 'frames'), { recursive: true });
await mkdir(join(ROOT, 'dist/_mk'), { recursive: true });
await writeFile(join(ROOT, 'dist/_mk/video2.html'), html);

// Voice: delay by LEAD, pad, level (TTS audio is already clean).
const voice = join(OUT, 'voice.wav');
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', VOICE, '-af', `adelay=${LEAD * 1000}|${LEAD * 1000},apad=pad_dur=${END_HOLD},loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000`, '-t', String(DURATION), voice]);

const server = await serve(join(ROOT, 'dist'), 0);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1, colorScheme: 'light' });
await page.goto(`http://127.0.0.1:${server.address().port}/_mk/video2.html`, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.evaluate(() => document.getAnimations().forEach((a) => a.pause()));
const frames = Math.round(DURATION * FPS);
for (let f = 0; f < frames; f++) {
  await page.evaluate((ms) => document.getAnimations().forEach((a) => { a.currentTime = ms; }), (f * 1000) / FPS);
  await page.screenshot({ path: join(OUT, 'frames', `${String(f).padStart(4, '0')}.png`) });
}
await browser.close();
server.close();

const mp4 = join(OUT, 'scamdb-video2-toll.mp4');
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', join(OUT, 'frames/%04d.png'), '-i', voice,
  '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-crf', '18', '-c:a', 'aac', '-b:a', '160k', '-shortest', '-movflags', '+faststart', mp4]);
for (const s of [2, 6, 10.5, 15.5, 19]) execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', String(s), '-i', mp4, '-frames:v', '1', '-vf', 'scale=360:-1', join(OUT, `check-${s}.png`)]);
await rm(join(OUT, 'frames'), { recursive: true });
console.log(`wrote ${mp4} (${DURATION}s)`);
