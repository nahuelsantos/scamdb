// Video 1 "How it works" (screen recording of the live site, in a hand-drawn phone).
// Run marketing/tools/video1-capture.mjs first (on the day you publish). Narration: "Nahuel English", take A (v1-a.mp3).
// Message pasted: real scam text quoted by ABC7 (KGO-TV), Oct 4, 2021, bank name replaced.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, scene, endCard, icon, drawable, sketch, roundRect, marked, ROOT, W, H } from './video-lib.mjs';
import { ICONS } from '../../site/templates/icons.js';

const CAP = 'marketing/videos/video1/capture';
const meta = JSON.parse(readFileSync(join(ROOT, CAP, 'meta.json'), 'utf8'));
const LEAD = 0.4, at = (s) => +(LEAD + s).toFixed(2);
const T = { phone: at(3.3), typeFrom: at(3.7), typeTo: at(6.6), answer: at(7.2), browser: at(12.2), entry: at(14.0), todo: at(15.9), end: at(18.0), send: at(21.6) };

// The phone: a 600×1200 screen at (240, 330) inside a hand-drawn frame.
const SX = 240, SY = 330, SW = 600, SH = 1200;
const k = sketch(5101);
const PHONE = drawable(k.path(roundRect(SX - 26, SY - 34, SW + 52, SH + 70, 56), { fill: 'card', shade: true }) + k.line(SX + 250, SY - 16, SX + 350, SY - 16, { kind: 'thin' }), T.phone - 0.2);

const n = meta.typingFrames; // type-00 … type-(n-1); the last one already shows the answer starting
const typeTimes = Array.from({ length: n }, (_, i) => +(T.typeFrom + (i * (T.typeTo - T.typeFrom)) / (n - 2)).toFixed(2));
const shots = [
  ...Array.from({ length: n }, (_, i) => [`type-${String(i).padStart(2, '0')}.png`, i === 0 ? T.phone : typeTimes[i], i === n - 1 ? T.answer : typeTimes[i + 1] ?? T.answer]),
  ['answer.png', T.answer, T.entry],
];
const shotHtml = shots.map(([f, a, b]) => `<img class="vt-shot" src="${f}" style="animation-delay:${a}s, ${b}s">`).join('');
// The entry page scrolls: hold on "The script", then move to "What to do" (heading positions measured at capture).
const px = SW / meta.cssWidth;
const yScript = Math.round((meta.headings['The script'] - 24) * px);
const yTodo = Math.round((meta.headings['What to do'] - 24) * px);
const entry = `<img class="vt-entry" src="entry.png" style="animation-delay:${T.entry}s, ${T.entry}s">`;

const NOTES = [
  [T.phone, T.answer, 'Paste it on scamdb.dev'],
  [T.answer, T.browser, 'It matches a known scam script'],
  [T.browser, T.entry, 'In your browser. Nothing is sent.'],
  [T.entry, T.todo, 'The script they’re running'],
  [T.todo, T.end, '… and the one thing to do'],
].map(([a, b, t]) => `<div class="vt-note1" style="animation-delay:${a}s, ${b - 0.1}s">${t}</div>`).join('');

const css = `
.vt-screen{position:absolute;left:${SX}px;top:${SY}px;width:${SW}px;height:${SH}px;overflow:hidden;border-radius:30px;z-index:2}
.vt-shot{position:absolute;left:0;top:0;width:${SW}px;opacity:0;animation-name:cut,cutout;animation-duration:.01s,.01s;animation-fill-mode:forwards}
.vt-entry{position:absolute;left:0;top:0;width:${SW}px;opacity:0;animation-name:cut,scroll;animation-duration:.01s,${(T.end - T.entry).toFixed(2)}s;animation-fill-mode:forwards;animation-timing-function:linear,ease-in-out}
@keyframes scroll{0%{transform:translateY(-${yScript}px)}40%{transform:translateY(-${yScript}px)}75%{transform:translateY(-${yTodo}px)}100%{transform:translateY(-${yTodo}px)}}
.vt-note1{position:absolute;left:60px;right:60px;top:200px;text-align:center;font-family:var(--hand);font-size:66px;line-height:1;opacity:0;animation-name:up,fadeout;animation-duration:.3s,.2s;animation-fill-mode:forwards;z-index:3}
`;

const body = `
${scene(0.1, T.phone, `
<div class="vt-eyebrow"><b>How it works</b></div>
<div class="vt-h1">Got a text that feels ${marked('off?', at(0.9))}</div>
<div class="vt-hand" style="left:90px;top:640px;opacity:0;animation:up .35s ${at(1.7)}s forwards">Don’t ask the group chat.</div>
${icon(ICONS.sms, 0.5, 380, 'right:90px;top:900px')}`)}

${scene(T.phone, T.end, `
<svg class="vt-full" viewBox="0 0 ${W} ${H}">${PHONE}</svg>
<div class="vt-screen">${shotHtml}${entry}</div>
${NOTES}
<div class="vt-src" style="top:1572px;text-align:center;width:900px;font-size:23px;animation:fade .3s ${T.phone + 0.4}s forwards, fadeout .3s ${T.answer - 0.3}s forwards">Real scam text, quoted by ABC7 (KGO-TV), Oct 4, 2021</div>`)}

${endCard(T.end, { t1: '<span style="font-size:72px;line-height:1.05;display:block">It only knows scams someone has documented.</span>', t2: `Found a new one?<br>Send it: <span class="vt-mark" style="animation-delay:${T.send + 0.3}s">scamdb.dev/report</span>`, t2at: T.send, sub: 'Check a message: scamdb.dev', subAt: at(22.6) })}`;

const captions = [
  [at(0), at(1.6), 'Got a text that feels off?'],
  [at(1.6), at(3.3), 'Don’t ask the group chat.'],
  [at(3.5), at(6.6), 'Paste it into scamdb.dev.'],
  [at(6.9), at(10.4), 'It checks it against about 1,200 known scam scripts.'],
  [at(10.4), at(14.0), 'In your browser. Nothing gets sent.'],
  [at(14.1), at(17.6), 'You get the script they’re running, and the one thing to do next.'],
  [at(18.0), at(21.5), 'It only knows scams someone has documented.'],
  [at(21.5), at(23.3), 'Found a new one? Send it to us.'],
];

const assets = [...shots.map(([f]) => ({ from: `${CAP}/${f}`, to: f })), { from: `${CAP}/entry.png`, to: 'entry.png' }];
await render({ id: 'video1', out: 'marketing/videos/video1', file: 'scamdb-video1-how-it-works.mp4', voiceFile: 'marketing/videos/voice/v1-a.mp3', voiceLen: 23.45, lead: LEAD, body, captions, css, assets, checks: [2, 5.5, 9, 13, 15, 17.5, 23] });
