// Shared engine for scamdb videos (1080×1920, 30 fps, MP4): the site's drawings and type, CSS animations with
// delays taken from the narration, frame-by-frame rendering, and the voice mixed in. Used by video1/3/4.mjs.
import { mkdir, rm, writeFile, cp } from 'node:fs/promises';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';
import { serve } from '../../tools/serve.mjs';
import { sketch, roundRect } from '../../lib/sketch.js';
import { LOGO } from '../../site/templates/logo.js';

export const ROOT = new URL('../../', import.meta.url).pathname;
export const W = 1080, H = 1920, FPS = 30;
export { sketch, roundRect, LOGO };

export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
/** Pen lines that draw themselves (pathLength=1 + stroke-dashoffset), starting at `delay` seconds. */
export const drawable = (svg, delay, dur = 0.9) => svg.replace(/<path class="(sk[^"]*)"/g, `<path pathLength="1" class="$1 vt-draw" style="animation-delay:${delay}s;animation-duration:${dur}s"`);
/** A hand-drawn speech bubble filling the box x,y,w,h, drawn from `at`; tail bottom-left or bottom-right. */
export const bubble = (seed, x, y, w, h, at, tail = 'left') => {
  const k = sketch(seed);
  const t = tail === 'left' ? `M${x + 60} ${y + h} l-8 52 l52 -52` : `M${x + w - 60} ${y + h} l8 52 l-52 -52`;
  return drawable(k.path(roundRect(x, y, w, h, 34), { fill: 'card', shade: true }) + k.path(t, { fill: 'card' }), at);
};
export const ring = (n, at, size = 70) => `<svg class="vt-ring" viewBox="0 0 70 70" style="width:${size}px;height:${size}px;animation-delay:${at}s">${sketch(2300 + n).circle(35, 35, 62, { kind: 'acc' })}</svg>`;
export const icon = (svg, at, size, style) => `<div class="vt-icon" style="width:${size}px;height:${size}px;${style};animation-delay:${at}s">${svg}</div>`;
/** Words that appear one by one; `hl` (seconds) sweeps the highlighter across them. */
export const words = (s, start, step, hl) => s.split(' ').map((w, i) => `<span class="vt-w${hl !== undefined ? ' vt-hlw' : ''}" style="animation-delay:${(start + i * step).toFixed(2)}s${hl !== undefined ? `, ${(hl + i * 0.06).toFixed(2)}s` : ''}">${esc(w)}</span>`).join(' ');
/** Text that is already there, with a highlighter sweep at `hl`. */
export const marked = (s, hl) => `<span class="vt-mark" style="animation-delay:${hl}s">${esc(s)}</span>`;
/** A layer shown from inAt (fade in) until outAt (fade out). */
export const scene = (inAt, outAt, body, extra = '') => `<div class="vt-scene ${extra}" style="animation-delay:${inAt}s${outAt ? `, ${outAt}s` : ''};animation-name:${outAt ? 'fadein, fadeout' : 'fadein'}">${body}</div>`;
/** Something that pops in at `at` (and optionally out at `out`). */
export const pop = (at, body, style = '', out) => `<div class="vt-pop" style="${style};animation-name:${out ? 'up, fadeout' : 'up'};animation-delay:${at}s${out ? `, ${out}s` : ''}">${body}</div>`;
export const stamp = (txt, at, style, ink = false) => `<div class="vt-stamp${ink ? ' vt-ink' : ''}" style="${style};animation-delay:${at}s"><svg viewBox="0 0 400 130">${sketch(2501).rect(4, 4, 392, 122, { kind: ink ? 'ink' : 'acc' })}${sketch(2502).rect(14, 14, 372, 102, { kind: ink ? 'thin' : 'acc' })}</svg><b>${esc(txt)}</b></div>`;
export const endCard = (at, { t1, t2, t2at, sub, subAt }) => scene(at, null, `<div class="vt-end">
<div class="vt-logo">${LOGO}</div><div class="vt-t1">${t1}</div>
${t2 ? `<div class="vt-t2" style="animation-delay:${t2at}s">${t2}</div>` : ''}
${sub ? `<div class="vt-t3" style="animation-delay:${subAt}s">${sub}</div>` : ''}
<div class="vt-ai">Voice: AI-generated from the founder’s own voice</div></div>`, 'vt-endwrap');

export const CSS = `
html,body{margin:0;background:var(--paper)}
.vt-v{position:relative;width:${W}px;height:${H}px;overflow:hidden;background:var(--paper);color:var(--ink);font-family:var(--body)}
.vt-scene{position:absolute;inset:0;opacity:0;animation-duration:.35s,.3s;animation-fill-mode:forwards;animation-timing-function:ease-out}
@keyframes fadein{to{opacity:1}}@keyframes fadeout{from{opacity:1}to{opacity:0}}@keyframes cut{to{opacity:1}}@keyframes cutout{to{opacity:0}}
@keyframes draw{to{stroke-dashoffset:0}}@keyframes fade{to{opacity:1}}@keyframes up{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:none}}
@keyframes hlw{to{background-size:100% 80%}}@keyframes thump{from{opacity:0;transform:rotate(-9deg) scale(1.7)}to{opacity:1;transform:rotate(-9deg) scale(1)}}
.vt-draw{stroke-dasharray:1;stroke-dashoffset:1;animation-name:draw;animation-timing-function:ease-out;animation-fill-mode:forwards}
.sk-shade.vt-draw{stroke-dasharray:none;stroke-dashoffset:0;opacity:0;animation-name:fade}
.sk-fill-card,.sk-fill-paper{opacity:0;animation:fade .4s forwards;animation-delay:inherit}
svg.vt-full{position:absolute;left:0;top:0;width:${W}px;height:${H}px;overflow:visible}
.vt-eyebrow{position:absolute;left:90px;top:170px;font-family:var(--mono);font-size:32px;letter-spacing:.14em;text-transform:uppercase;color:var(--dim)}
.vt-eyebrow b{color:var(--ink);font-weight:500}
.vt-h1{position:absolute;left:90px;top:250px;width:900px;font-family:var(--display);font-weight:700;font-size:118px;letter-spacing:-.04em;line-height:.95}
.vt-mark{background:linear-gradient(var(--hl),var(--hl)) no-repeat 0 62%/0% 80%;border-radius:8px;padding:0 .08em;animation:hlw .5s ease-out forwards}
.vt-icon{position:absolute;opacity:0;animation:up .5s forwards}.vt-icon svg{width:100%;height:100%}
.vt-pop{position:absolute;opacity:0;animation-duration:.4s,.3s;animation-fill-mode:forwards;animation-timing-function:ease-out}
.vt-pill{position:absolute;left:90px;font-family:var(--mono);font-size:28px;padding:10px 22px;border:2px solid var(--ink);border-radius:999px;opacity:0;animation:fade .4s forwards}
.vt-msg{position:absolute;font-size:46px;line-height:1.38;z-index:2}
.vt-sender{font-family:var(--mono);font-size:27px;color:var(--dim);margin-bottom:8px}
.vt-w{opacity:0;animation:fade .1s forwards}
.vt-hlw{background:linear-gradient(var(--hl),var(--hl)) no-repeat 0 60%/0% 84%;border-radius:6px;padding:0 4px;margin:0 -4px;animation:fade .1s forwards,hlw .25s ease-out forwards}
.vt-num{font-family:var(--mono);font-weight:500;color:var(--accent-ink);font-size:.6em;margin-left:.12em;opacity:0;animation:fade .2s forwards}
.vt-src{position:absolute;left:90px;width:900px;font-family:var(--mono);font-size:25px;color:var(--dim);line-height:1.45;opacity:0;animation:fade .5s forwards}
.vt-note{position:absolute;display:flex;align-items:center;gap:24px;font-family:var(--hand);font-size:52px;opacity:0;animation:up .35s forwards}
.vt-note b{position:absolute;left:0;top:0;width:70px;height:70px;display:flex;align-items:center;justify-content:center;font-family:var(--mono);font-weight:500;font-size:32px;color:var(--accent-ink)}
.vt-ring{flex:none;overflow:visible}
.vt-hand{position:absolute;font-family:var(--hand);font-size:58px;line-height:1.1}
.vt-big{position:absolute;left:90px;width:900px;font-family:var(--display);font-weight:700;letter-spacing:-.04em;line-height:.98}
.vt-stamp{position:absolute;width:400px;height:130px;opacity:0;animation:thump .3s cubic-bezier(.2,1.6,.4,1) forwards;z-index:6}
.vt-stamp svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.vt-stamp b{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:var(--mono);font-weight:500;font-size:64px;letter-spacing:.16em;color:var(--accent-ink)}
.vt-stamp.vt-ink b{color:var(--ink);font-size:52px}
.vt-cap{position:absolute;left:70px;right:70px;bottom:215px;display:flex;justify-content:center;opacity:0;animation-duration:.15s,.15s;animation-fill-mode:forwards;z-index:8}
.vt-cap span{background:var(--ink);color:var(--paper);font-family:var(--body);font-weight:600;font-size:44px;line-height:1.3;padding:14px 26px;border-radius:14px;text-align:center;max-width:900px}
.vt-foot{position:absolute;left:90px;right:90px;bottom:110px;display:flex;justify-content:space-between;align-items:center;font-family:var(--mono);font-size:30px;color:var(--dim);z-index:5}
.vt-foot .vt-b{display:flex;align-items:center;gap:16px;font-family:var(--display);font-weight:700;font-size:44px;color:var(--ink)}.vt-foot svg{width:76px;height:76px}
.vt-endwrap{z-index:7}
.vt-end{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;background:var(--paper);padding:0 70px}
.vt-end .vt-logo svg{width:260px;height:260px}
.vt-end .vt-t1{font-family:var(--display);font-weight:700;font-size:104px;letter-spacing:-.04em;line-height:1;margin-top:30px}
.vt-end .vt-t2{font-family:var(--display);font-weight:700;font-size:68px;letter-spacing:-.03em;line-height:1.1;margin-top:30px;opacity:0;animation:up .4s forwards}
.vt-end .vt-t3{font-family:var(--mono);font-size:34px;color:var(--dim);margin-top:44px;opacity:0;animation:fade .4s forwards}
.vt-end .vt-ai{margin-top:40px;font-family:var(--mono);font-size:24px;color:var(--dim)}
`;

/**
 * Renders a video. `body` is the scenes' HTML; captions are [from, to, text] in video seconds.
 * The narration file is delayed by `lead` seconds and padded by `endHold`.
 */
export async function render({ id, out, file, voiceFile, voiceLen, lead = 0.4, endHold = 2.4, body, captions, css = '', checks = [], assets = [] }) {
  const DUR = +(lead + voiceLen + endHold).toFixed(2);
  const OUT = join(ROOT, out);
  await rm(join(OUT, 'frames'), { recursive: true, force: true });
  await mkdir(join(OUT, 'frames'), { recursive: true });
  await mkdir(join(ROOT, 'dist/_mk', id), { recursive: true });
  for (const a of assets) await cp(join(ROOT, a.from), join(ROOT, 'dist/_mk', id, a.to));
  const caps = captions.map(([a, b, t]) => `<div class="vt-cap" style="animation-name:fadein, fadeout;animation-delay:${a.toFixed(2)}s, ${(b - 0.08).toFixed(2)}s"><span>${esc(t)}</span></div>`).join('');
  const html = `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="/assets/styles.css"><style>${CSS}${css}</style></head>
<body><div class="vt-v">${body}${caps}<div class="vt-foot"><span class="vt-b">${LOGO}scamdb</span><span>scamdb.dev</span></div></div></body></html>`;
  await writeFile(join(ROOT, 'dist/_mk', id, 'index.html'), html);

  const voice = join(OUT, 'voice.wav');
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', join(ROOT, voiceFile), '-af', `adelay=${lead * 1000}|${lead * 1000},apad=pad_dur=${endHold},loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000`, '-t', String(DUR), voice]);

  const server = await serve(join(ROOT, 'dist'), 0);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1, colorScheme: 'light' });
  await page.goto(`http://127.0.0.1:${server.address().port}/_mk/${id}/`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => Promise.all([...document.images].map((i) => i.decode().catch(() => {}))));
  await page.evaluate(() => document.getAnimations().forEach((a) => a.pause()));
  const frames = Math.round(DUR * FPS);
  for (let f = 0; f < frames; f++) {
    await page.evaluate((ms) => document.getAnimations().forEach((a) => { a.currentTime = ms; }), (f * 1000) / FPS);
    await page.screenshot({ path: join(OUT, 'frames', `${String(f).padStart(4, '0')}.png`) });
  }
  await browser.close();
  server.close();
  const mp4 = join(OUT, file);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', join(OUT, 'frames/%04d.png'), '-i', voice,
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-crf', '18', '-c:a', 'aac', '-b:a', '160k', '-shortest', '-movflags', '+faststart', mp4]);
  for (const s of checks) execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', String(s), '-i', mp4, '-frames:v', '1', '-vf', 'scale=300:-1', join(OUT, `check-${s}.png`)]);
  await rm(join(OUT, 'frames'), { recursive: true });
  console.log(`wrote ${mp4} (${DUR}s)`);
  return mp4;
}
