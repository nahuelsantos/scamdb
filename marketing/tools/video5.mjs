// Video 5 "Hi Mum, new number" (teardown). Narration: "Nahuel English", take B (v5-b.mp3).
// Message: the catalogue's written example from gb/hi-mum-text (Which?, Jul 30, 2026), labelled as written.
import { render, scene, bubble, words, marked, endCard, icon, ring, W, H } from './video-lib.mjs';
import { ICONS, STEP_ICONS } from '../../site/templates/icons.js';

const LEAD = 0.4, at = (s) => +(LEAD + s).toFixed(2);
const T = { s2: at(4.0), name: at(4.9), f1: at(8.4), f2: at(9.8), f3: at(11.4), s3: at(13.8), call: at(15.5), end: at(17.2), send: at(18.3) };
const note = (n, t, a, top) => `<div class="vt-note" style="left:90px;top:${top}px;animation-delay:${a}s">${ring(n, a)}<b>${n + 1}</b><span>${t}</span></div>`;

const body = `
${scene(0.1, T.s2, `
<div class="vt-eyebrow"><b>How the trick works</b> · the new number</div>
<div class="vt-h1">“Hi Mum, it’s me. ${marked('New number.', at(1.5))}”</div>
<div class="vt-hand" style="left:90px;top:620px;opacity:0;animation:up .35s ${at(2.4)}s forwards">Sound familiar?</div>
${icon(STEP_ICONS.new_number, 0.6, 400, 'right:80px;top:880px')}`)}

${scene(T.s2, T.s3, `
<div class="vt-eyebrow" style="top:150px"><b>How it reads</b></div>
<div class="vt-pill" style="top:220px;border-style:dashed;border-color:var(--dim);animation-delay:${T.s2 + 0.1}s">An example of how this one reads</div>
<svg class="vt-full" viewBox="0 0 ${W} ${H}">${bubble(5101, 90, 320, 900, 420, T.s2)}</svg>
<div class="vt-msg" style="left:140px;top:355px;width:800px;font-size:46px"><div class="vt-sender">Unknown number · SMS</div>${words('Hi Mum it’s me,', T.s2 + 0.3, 0.06, T.name)} ${words('I’ve lost my phone so', T.s2 + 0.6, 0.06)} ${words('this is my new number.', T.s2 + 0.9, 0.06, T.f1)}<sup class="vt-num" style="animation-delay:${T.f1}s">1</sup> ${words('Can you text me back?', T.s2 + 1.2, 0.06)} ${words('I need a favour, it’s urgent', T.s2 + 1.5, 0.06, T.f2)}<sup class="vt-num" style="animation-delay:${T.f2}s">2</sup> x</div>
<div class="vt-src" style="top:820px;animation-delay:${T.s2 + 1.4}s">Written by scamdb from Which? warnings (UK, Jul 30, 2026). Not a real message.</div>
<div class="vt-hand" style="left:90px;top:920px;width:900px;opacity:0;animation:up .35s ${T.name + 0.6}s forwards">No name. You fill in your own child.</div>
${note(0, 'A new number', T.f1, 1060)}${note(1, 'An urgent favour', T.f2, 1150)}${note(2, 'Then: a bill they can’t pay', T.f3, 1240)}`)}

${scene(T.s3, T.end, `
<div class="vt-eyebrow"><b>The fix</b></div>
<div class="vt-big" style="top:250px;font-size:104px">It takes ten seconds.</div>
<div class="vt-big" style="top:500px;font-size:112px;opacity:0;animation:up .4s ${T.call}s forwards">${marked('Call the old number.', T.call + 0.4)}</div>
${icon(ICONS.phone, T.s3 + 0.3, 380, 'right:90px;top:960px')}`)}

${endCard(T.end, { t1: 'Got one?', t2: `Send it: <span class="vt-mark" style="animation-delay:${T.send + 0.3}s">scamdb.dev/report</span>`, t2at: T.send, sub: 'Check a message: scamdb.dev', subAt: at(19.0) })}`;

const captions = [
  [at(0), at(2.4), 'Hi Mum, it’s me. New number.'],
  [at(2.4), at(4.0), 'Sound familiar?'],
  [at(4.1), at(6.3), 'The scammer never says a name.'],
  [at(6.3), at(8.2), 'You fill in your own child.'],
  [at(8.3), at(13.6), 'A new number. An urgent favour. Then a bill they can’t pay.'],
  [at(13.8), at(15.5), 'The fix takes ten seconds.'],
  [at(15.5), at(17.2), 'Call the old number.'],
  [at(17.3), at(19.3), 'Got one? Send it to us.'],
];
await render({ id: 'video5', out: 'marketing/videos/video5', file: 'scamdb-video5-hi-mum.mp4', voiceFile: 'marketing/videos/voice/v5-b.mp3', voiceLen: 19.46, lead: LEAD, body, captions, checks: [2.5, 7, 12.5, 16, 19.5] });
