// Renders scamdb social images in the site's hand-drawn style.
// Usage: npm run build && node marketing/tools/render.mjs [post-id ...]
// Reads the posts from marketing/tools/posts.mjs and writes PNGs next to each post's copy
// (marketing/posts/<week>/<post>/). Drawings come from the site's own helpers (lib/sketch.js, icons, logo),
// so the images match scamdb.dev. Two passes: lay out the HTML, measure the boxes marked data-frame,
// then draw hand-drawn frames at those exact sizes and screenshot.
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { chromium } from 'playwright';
import { serve } from '../../tools/serve.mjs';
import { sketch, roundRect } from '../../lib/sketch.js';
import { LOGO } from '../../site/templates/logo.js';
import { ICONS, STEP_ICONS } from '../../site/templates/icons.js';
import { POSTS as ALL_POSTS } from './posts.mjs';
import { STILLS } from './storyboard-stills.mjs';
const POSTS = process.argv.includes('--stills') ? STILLS : ALL_POSTS;

const ROOT = new URL('../../', import.meta.url).pathname;
const SIZES = { ig: [1080, 1350], igsq: [1080, 1080], x: [1600, 900], v: [1080, 1920] };
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Inline markup for slide text: [[word]] = lime highlighter, {{1|words}} = pink-numbered red flag. */
const md = (s) => esc(s)
  .replace(/\{\{(\d)\|(.+?)\}\}/g, '<span class="mk-flag">$2<sup>$1</sup></span>')
  .replace(/\[\[(.+?)\]\]/g, '<span class="mk-hl">$1</span>')
  .replace(/\n/g, '<br>');

const CSS = `
html,body{margin:0;background:var(--paper)}
.slide{position:relative;overflow:hidden;background:var(--paper);color:var(--ink);font-family:var(--body);display:flex;flex-direction:column;padding:72px 76px 64px}
.slide>*{position:relative;z-index:1}
.mk-frame{position:absolute;z-index:0;pointer-events:none;overflow:visible}
.mk-eyebrow{font-family:var(--mono);font-size:26px;letter-spacing:.14em;text-transform:uppercase;color:var(--dim);display:flex;gap:18px;align-items:center}
.mk-eyebrow b{color:var(--ink);font-weight:500}
h1{font-family:var(--display);font-weight:700;letter-spacing:-.04em;line-height:.95;margin:28px 0 0;font-size:96px}
h2{font-family:var(--display);font-weight:700;letter-spacing:-.03em;line-height:1;margin:0;font-size:76px}
.mk-sub{font-size:40px;line-height:1.35;margin-top:30px;max-width:30ch}
.mk-hl{background:var(--hl);padding:0 .12em;border-radius:6px;box-decoration-break:clone;-webkit-box-decoration-break:clone}
.mk-flag{position:relative}
.mk-flag sup{font-family:var(--mono);font-weight:500;color:var(--accent-ink);font-size:.62em;margin-left:.15em;vertical-align:super;line-height:0}
.mk-grow{flex:1}
.mk-foot{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;font-family:var(--mono);font-size:24px;color:var(--dim)}
.mk-brand{display:flex;align-items:center;gap:14px;font-family:var(--display);font-weight:700;font-size:38px;color:var(--ink);letter-spacing:-.03em}
.mk-brand svg{width:64px;height:64px}
.mk-pill{display:inline-flex;align-items:center;gap:10px;font-family:var(--mono);font-size:24px;padding:8px 18px;border:2px solid var(--line);border-radius:999px;color:var(--dim);align-self:flex-start}
.mk-pill.mk-real{border-color:var(--ink);color:var(--ink)}
.mk-pill.mk-example{border-style:dashed;border-color:var(--dim)}
.mk-art{position:absolute;z-index:0}
.mk-art svg{width:100%;height:100%}
.mk-bubble{padding:48px 52px 52px;font-size:46px;line-height:1.42;margin-top:30px}
.mk-sender{font-family:var(--body);font-weight:600;font-size:28px;margin-bottom:6px}
.mk-sender span{font-family:var(--mono);font-weight:400;color:var(--dim);font-size:22px;margin-left:12px}
.mk-orig{font-size:28px;color:var(--dim);margin-top:16px;font-style:italic}
.mk-notes{display:flex;flex-direction:column;gap:26px;margin-top:56px}
.mk-note{display:flex;gap:24px;align-items:center;font-family:var(--hand);font-size:50px;line-height:1.15}
.mk-num{flex:none;width:62px;height:62px;display:flex;align-items:center;justify-content:center;font-family:var(--mono);font-weight:500;font-size:28px;color:var(--accent-ink);position:relative}
.mk-source{font-family:var(--mono);font-size:24px;color:var(--dim);line-height:1.45;margin-top:28px}
.mk-steps{display:flex;flex-direction:column;gap:40px;margin-top:56px}
.mk-step{display:flex;gap:30px;align-items:center}
.mk-step svg{flex:none;width:150px;height:150px}
.mk-step p{margin:0;font-size:42px;line-height:1.3}
.mk-step small{display:block;font-family:var(--mono);font-size:22px;color:var(--dim);letter-spacing:.06em;margin-top:6px;text-transform:uppercase}
.mk-step small.mk-acc{color:var(--accent-ink)}
.mk-todo{display:flex;flex-direction:column;gap:34px;margin-top:48px}
.mk-todo div{display:flex;gap:30px;align-items:flex-start;font-size:44px;line-height:1.3}
.mk-todo svg{flex:none;width:64px;height:64px;margin-top:2px}
.mk-stamp{font-family:var(--mono);font-weight:500;color:var(--accent-ink);font-size:64px;letter-spacing:.16em;padding:10px 34px;transform:rotate(-8deg);display:inline-block}
.mk-stamp.mk-ink{color:var(--ink)}
.mk-cta-main{font-family:var(--display);font-weight:700;font-size:80px;letter-spacing:-.04em;line-height:1}
.mk-cta-url{font-family:var(--mono);font-size:30px;margin-top:22px;color:var(--ink);word-break:break-all}
.mk-cta-list{display:flex;flex-direction:column;gap:22px;margin-top:56px;font-size:36px}
.mk-hand{font-family:var(--hand);font-size:40px}
.mk-big-logo svg{width:220px;height:220px}
.mk-vs{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:40px;flex:1}
.mk-vs .mk-bubble{font-size:37px;margin-top:0;padding:40px 38px 44px}
.mk-tag{font-family:var(--display);font-weight:700;font-size:64px;margin-bottom:14px}
.mk-cols{display:grid;grid-template-columns:1.1fr 1fr;gap:60px;flex:1;align-items:start;margin-top:10px}
.sz-v{padding:150px 90px 120px}.sz-v h1{font-size:118px}.sz-v h2{font-size:92px}.sz-v .mk-sub{font-size:48px}.sz-v .mk-bubble{font-size:50px}.sz-v .mk-note{font-size:56px}.sz-v .mk-cta-main{font-size:96px}.sz-v .mk-vs{grid-template-columns:1fr;gap:36px}.sz-v .mk-vs .mk-bubble{font-size:42px}
.mk-bubble.mk-long{font-size:38px;line-height:1.36}.mk-cols .mk-bubble.mk-long{font-size:32px}.sz-x .mk-source{font-size:20px}
.sz-x .mk-vs .mk-bubble{font-size:32px}.sz-x .mk-vs{margin-top:24px}.sz-x .mk-tag{font-size:48px}
.mk-cols .mk-bubble{font-size:38px;padding:40px 44px 44px}.mk-cols .mk-note{font-size:44px}.mk-cols .mk-notes{margin-top:40px}
`;

const brand = () => `<div class="mk-brand">${LOGO}<span>scamdb</span></div>`;
const foot = (right = 'scamdb.dev') => `<div class="mk-foot">${brand()}<span>${esc(right)}</span></div>`;
const eyebrow = (s) => `<div class="mk-eyebrow">${s}</div>`;
const label = (m) => m.source
  ? `<div class="mk-pill mk-real">${esc(m.source.pill ?? `Real message · quoted by ${m.source.short}`)}</div>`
  : `<div class="mk-pill mk-example">An example of how this one reads</div>`;
const sourceLine = (m, entry) => m.source
  ? `<div class="mk-source">Source: ${esc(m.source.publisher)}, “${esc(m.source.title)}”, ${esc(m.source.date)}. Links and numbers replaced.</div>`
  : `<div class="mk-source">Written by scamdb from ${esc(entry.sources[0].publisher)} warnings. Not a real message.</div>`;
const bubble = (m, cls = "") => `<div class="mk-bubble ${cls} ${m.text.length > 190 ? "mk-long" : ""}" data-frame="bubble">
  ${m.sender || m.channel ? `<div class="mk-sender">${esc(m.sender ?? "")}${m.channel ? `<span>${esc(m.channel)}</span>` : ''}</div>` : ''}
  <div>${md(m.text)}</div>${m.english ? `<div class="mk-orig">${esc(m.english)}</div>` : ''}</div>`;
const notes = (list) => `<div class="mk-notes">${list.map((n, i) => `<div class="mk-note"><span class="mk-num" data-frame="ring">${i + 1}</span><span>${md(n)}</span></div>`).join('')}</div>`;
const CHECK = (seed) => { const s = sketch(seed); return `<svg viewBox="0 0 56 56" aria-hidden="true">${s.rect(6, 6, 42, 42, { fill: 'card', shade: true })}${s.path('M15 28 l9 9 l17 -20')}</svg>`; };

const SLIDES = {
  cover: (d) => `${eyebrow(d.eyebrow)}<h1>${md(d.title)}</h1>${d.sub ? `<div class="mk-sub">${md(d.sub)}</div>` : ''}
    <div class="mk-grow"></div>${d.icon ? `<div class="mk-art" style="${d.artStyle ?? 'right:40px;bottom:150px;width:430px;height:430px'}">${ICONS[d.icon]}</div>` : ''}
    ${d.stamp ? `<div style="align-self:flex-start;margin:0 0 56px 8px"><span class="mk-stamp" data-frame="stamp">${esc(d.stamp)}</span></div>` : ''}${foot(d.footRight)}`,
  message: (d, e) => `${eyebrow(d.eyebrow)}${d.title ? `<h2 style="margin-top:22px">${md(d.title)}</h2>` : ''}<div style="margin-top:26px">${label(d.msg)}</div>
    ${bubble(d.msg)}${notes(d.notes)}<div class="mk-grow"></div>${sourceLine(d.msg, e)}<div style="height:28px"></div>${foot()}`,
  messageX: (d, e) => `${eyebrow(d.eyebrow)}<div class="mk-cols"><div>${label(d.msg)}${bubble(d.msg)}${sourceLine(d.msg, e)}</div>
    <div>${d.title ? `<h2 style="font-size:58px">${md(d.title)}</h2>` : ''}${notes(d.notes)}</div></div>${foot(d.footRight)}`,
  steps: (d, e) => `${eyebrow(d.eyebrow)}<h2 style="margin-top:22px">${md(d.title ?? 'How it goes')}</h2>
    <div class="mk-steps">${e.steps.slice(0, 4).map((s, i) => `<div class="mk-step">${STEP_ICONS[s.signal] ?? STEP_ICONS.plain}<p>${esc(d.stepText?.[i] ?? s.text.en)}<small class="${d.accStep === i ? 'mk-acc' : ''}">${esc((d.signalNames ?? {})[s.signal] ?? (s.signal ? s.signal.replace(/_/g, ' ') : 'what happens'))}</small></p></div>`).join('')}</div>
    <div class="mk-grow"></div>${foot()}`,
  todo: (d, e) => `${eyebrow(d.eyebrow)}<h2 style="margin-top:22px">${md(d.title ?? 'What to do')}</h2>
    <div class="mk-todo">${(d.items ?? e.whatToDo.en).map((t, i) => `<div>${CHECK(800 + i)}<span>${md(t)}</span></div>`).join('')}</div>
    <div class="mk-grow"></div>${foot()}`,
  cta: (d) => `${eyebrow(d.eyebrow ?? 'Check it before you tap')}<div class="mk-grow"></div><div class="mk-big-logo">${LOGO}</div>
    <div class="mk-cta-main" style="margin-top:30px">${md(d.title ?? 'Got one like this?\nSend it to [[scamdb.dev/report]]')}</div>
    <div class="mk-sub" style="max-width:34ch">${md(d.sub ?? 'Scam or genuine, both help: they teach the check to tell them apart. It takes a minute, and reports stay private.')}</div>
    ${d.url ? `<div class="mk-cta-url">Full script: ${esc(d.url)}</div>` : ''}<div class="mk-grow"></div>${foot('Check a message: scamdb.dev')}`,
  versus: (d) => `${eyebrow(d.eyebrow ?? 'Real or scam?')}<h2 style="margin-top:22px">${md(d.title)}</h2>
    <div class="mk-vs">${d.pair.map((m, i) => `<div><div class="mk-tag">${'AB'[i]}</div>${bubble(m)}</div>`).join('')}</div>
    <div class="mk-source">${esc(d.note)}</div><div style="height:24px"></div>${foot(d.footRight ?? 'Answer on the next slide')}`,
  answer: (d) => `${eyebrow(d.eyebrow ?? 'The answer')}<h2 style="margin-top:22px">${md(d.title)}</h2>
    <div style="margin:44px 0 64px 6px"><span class="mk-stamp" data-frame="stamp">${esc(d.stamp)}</span></div>
    <div class="mk-todo" style="margin-top:30px">${d.items.map((t, i) => `<div>${CHECK(820 + i)}<span>${md(t)}</span></div>`).join('')}</div>
    <div class="mk-grow"></div>${d.note ? `<div class="mk-source">${esc(d.note)}</div><div style="height:24px"></div>` : ''}${foot()}`,
  tip: (d) => `${eyebrow(d.eyebrow)}<h1 style="font-size:${d.fs ?? 96}px">${md(d.title)}</h1>${d.sub ? `<div class="mk-sub" style="max-width:${d.subWidth ?? 30}ch">${md(d.sub)}</div>` : ''}
    ${d.hand ? `<div class="mk-hand" style="margin-top:36px">${md(d.hand)}</div>` : ''}<div class="mk-grow"></div>
    ${d.icon ? `<div class="mk-art" style="${d.artStyle ?? 'right:60px;bottom:150px;width:360px;height:360px'}">${(STEP_ICONS[d.icon] ?? ICONS[d.icon])}</div>` : ''}${foot(d.footRight)}`,
  list: (d) => `${eyebrow(d.eyebrow)}<h2 style="margin-top:22px">${md(d.title)}</h2>${d.sub ? `<div class="mk-sub" style="max-width:40ch">${md(d.sub)}</div>` : ''}
    <div class="mk-todo" style="gap:30px;margin-top:48px">${d.items.map((t) => `<div style="font-size:${d.itemSize ?? 40}px"><span style="font-family:var(--mono);color:var(--dim);min-width:3.2em">${esc(t[0])}</span><span>${md(t[1])}</span></div>`).join('')}</div>
    <div class="mk-grow"></div>${d.note ? `<div class="mk-source">${esc(d.note)}</div><div style="height:24px"></div>` : ''}${foot(d.footRight)}`,
};

const page = (body, [w, h], sz) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><link rel="stylesheet" href="/assets/styles.css">
<style>${CSS}.slide{width:${w}px;height:${h}px}</style></head><body><div class="slide sz-${sz}">${body}</div></body></html>`;

/** Hand-drawn frame for a measured box. */
function frame(kind, w, h, seed) {
  const k = sketch(seed);
  const pad = 4;
  let inner = '';
  if (kind === 'bubble') inner = k.path(roundRect(pad, pad, w - 2 * pad, h - 2 * pad, 28), { fill: 'card', shade: true }) + k.path(`M${48} ${h - pad} l-6 30 l34 -30`, { fill: 'card' });
  if (kind === 'ring') inner = k.circle(w / 2, h / 2, Math.min(w, h) - 4, { kind: 'acc' });
  if (kind === 'stamp') inner = k.rect(pad, pad, w - 2 * pad, h - 2 * pad, { kind: 'acc' }) + k.rect(pad + 7, pad + 7, w - 2 * pad - 14, h - 2 * pad - 14, { kind: 'acc' });
  if (kind === 'card') inner = k.path(roundRect(pad, pad, w - 2 * pad, h - 2 * pad, 22), { fill: 'card', shade: true });
  return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" style="overflow:visible">${inner}</svg>`;
}

const only = new Set(process.argv.slice(2).filter((a) => !a.startsWith('--')));
const server = await serve(join(ROOT, 'dist'), 0);
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
await mkdir(join(ROOT, 'dist/_mk'), { recursive: true });
let count = 0;
for (const post of POSTS) {
  if (only.size && !only.has(post.id)) continue;
  const entry = post.entry ? await import(join(ROOT, 'data', post.entry.split('/')[0], 'scams', `${post.entry.split('/')[1]}.json`), { with: { type: 'json' } }).then((m) => m.default, () => null) : null;
  for (const [i, s] of post.slides.entries()) {
    const size = SIZES[s.size ?? 'ig'];
    const html = page(SLIDES[s.type](s, entry), size, s.size ?? "ig");
    const name = `${post.id}-${i + 1}`;
    await writeFile(join(ROOT, 'dist/_mk', `${name}.html`), html);
    const p = await browser.newPage({ viewport: { width: size[0], height: size[1] }, deviceScaleFactor: 1, colorScheme: 'light' });
    await p.goto(`${base}/_mk/${name}.html`, { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready);
    const boxes = await p.$$eval('[data-frame]', (els) => els.map((el) => {
      const r = el.getBoundingClientRect(); const pr = el.offsetParent?.getBoundingClientRect() ?? { left: 0, top: 0 };
      return { kind: el.dataset.frame, x: r.left - pr.left, y: r.top - pr.top, w: r.width, h: r.height };
    }));
    const svgs = boxes.map((b, n) => frame(b.kind, Math.round(b.w), Math.round(b.h), 1300 + i * 40 + n * 7 + post.seed));
    await p.$$eval('[data-frame]', (els, svgs) => els.forEach((el, n) => {
      el.style.position = el.style.position || 'relative';
      const holder = document.createElement('span'); holder.className = 'mk-frame'; holder.style.left = '0'; holder.style.top = '0';
      holder.innerHTML = svgs[n]; el.prepend(holder);
      [...el.children].forEach((c) => { if (c !== holder) { c.style.position = 'relative'; c.style.zIndex = '1'; } });
      if (!el.children.length || el.childNodes.length > el.children.length) { const t = document.createElement('span'); t.style.position = 'relative'; t.style.zIndex = '1'; [...el.childNodes].filter((c) => c !== holder && c.nodeType === 3).forEach((c) => t.append(c)); el.append(t); }
    }), svgs);
    const out = join(ROOT, post.out ?? join('marketing/posts', post.week, post.id), `${String(i + 1).padStart(2, '0')}-${s.size ?? 'ig'}.png`);
    await mkdir(dirname(out), { recursive: true });
    await p.screenshot({ path: out });
    await p.close();
    count++;
  }
}
await browser.close();
server.close();
console.log(`rendered ${count} images`);
