// Video 7 "Pay now or your power goes off" (teardown). Narration: "Nahuel English", take B (v7-b.mp3).
// Message: the catalogue's written example from us/utility-shutoff (FTC; NY Attorney General), labelled as written.
import { render, scene, bubble, words, marked, endCard, icon, ring, W, H } from './video-lib.mjs';
import { ICONS } from '../../site/templates/icons.js';

const LEAD = 0.4, at = (s) => +(LEAD + s).toFixed(2);
const T = { s2: at(3.9), point: at(4.0), f1: at(8.0), f2: at(9.9), f3: at(11.7), s3: at(13.7), call: at(16.9), end: at(18.7), send: at(20.0) };
const note = (n, t, a, top) => `<div class="vt-note" style="left:90px;top:${top}px;animation-delay:${a}s">${ring(n, a)}<b>${n + 1}</b><span>${t}</span></div>`;

const body = `
${scene(0.1, T.s2, `
<div class="vt-eyebrow"><b>Scam of the week</b> · US · winter</div>
<div class="vt-h1">Two hours until your power goes off?</div>
<div class="vt-big" style="top:640px;font-size:110px;opacity:0;animation:up .4s ${at(2.3)}s forwards">${marked('In December?', at(2.6))}</div>
${icon(ICONS.house, 0.6, 380, 'right:80px;top:920px')}`)}

${scene(T.s2, T.s3, `
<div class="vt-eyebrow" style="top:150px"><b>How it reads</b></div>
<div class="vt-pill" style="top:220px;border-style:dashed;border-color:var(--dim);animation-delay:${T.s2 + 0.1}s">An example of how this one reads</div>
<svg class="vt-full" viewBox="0 0 ${W} ${H}">${bubble(7101, 90, 320, 900, 430, T.s2)}</svg>
<div class="vt-msg" style="left:140px;top:355px;width:800px;font-size:44px"><div class="vt-sender">“Electric Co.” · SMS</div>${words('FINAL NOTICE: Your electric account is past due.', T.s2 + 0.3, 0.05, T.f1)}<sup class="vt-num" style="animation-delay:${T.f1}s">1</sup> ${words('Service will be disconnected within 2 hours.', T.s2 + 0.7, 0.05, T.f2)}<sup class="vt-num" style="animation-delay:${T.f2}s">2</sup> ${words('A technician has been dispatched. To avoid disconnection,', T.s2 + 1.1, 0.05)} ${words('pay now: [link]', T.s2 + 1.5, 0.05, T.f3)}<sup class="vt-num" style="animation-delay:${T.f3}s">3</sup></div>
<div class="vt-src" style="top:830px;animation-delay:${T.s2 + 1.4}s">Written by scamdb from FTC and New York Attorney General warnings. Not a real message.</div>
<div class="vt-hand" style="left:90px;top:930px;width:900px;opacity:0;animation:up .35s ${at(5.3)}s forwards">That’s the point: cold and panic make you pay fast.</div>
${note(0, 'Looks like your utility', T.f1, 1080)}${note(1, 'A two-hour deadline', T.f2, 1170)}${note(2, 'Their link to pay', T.f3, 1260)}`)}

${scene(T.s3, T.end, `
<div class="vt-eyebrow"><b>The rule</b></div>
<div class="vt-big" style="top:250px;font-size:100px">Real utilities warn you ${marked('in writing first.', T.s3 + 1.2)}</div>
<div class="vt-big" style="top:640px;font-size:96px;opacity:0;animation:up .4s ${T.call}s forwards">Call the number on your bill.</div>
${icon(ICONS.phone, T.s3 + 0.3, 340, 'right:90px;top:1020px')}`)}

${endCard(T.end, { t1: 'Got one?', t2: `Send it: <span class="vt-mark" style="animation-delay:${T.send + 0.3}s">scamdb.dev/report</span>`, t2at: T.send, sub: 'Check a message: scamdb.dev', subAt: at(20.6) })}`;

const captions = [
  [at(0), at(2.3), 'Two hours until your power goes off?'],
  [at(2.3), at(3.9), 'In December?'],
  [at(4.0), at(5.2), 'That’s the point.'],
  [at(5.2), at(7.8), 'Cold and panic make you pay fast.'],
  [at(8.0), at(13.4), 'Looks like your utility. A two-hour deadline. And their link to pay.'],
  [at(13.8), at(16.8), 'Real utilities warn you in writing first.'],
  [at(16.8), at(18.6), 'Call the number on your bill.'],
  [at(18.7), at(21.1), 'Got one? Send it to us.'],
];
await render({ id: 'video7', out: 'marketing/videos/video7', file: 'scamdb-video7-utility.mp4', voiceFile: 'marketing/videos/voice/v7-b.mp3', voiceLen: 21.22, lead: LEAD, body, captions, checks: [2.8, 6, 12.5, 17.5, 21] });
