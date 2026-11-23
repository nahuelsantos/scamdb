// Video 4 "Shopped today? Expect this text." (teardown). Narration: ElevenLabs "Nahuel English", take B (v4-b.mp3).
// Message: FBI IC3 PSA I-041422-PSA, Apr 14, 2022 (the FBI's sample texts), bank name replaced.
import { render, scene, bubble, words, marked, endCard, icon, ring, W, H } from './video-lib.mjs';
import { ICONS, STEP_ICONS } from '../../site/templates/icons.js';

const LEAD = 0.4, at = (s) => +(LEAD + s).toFixed(2);
const T = { s2: at(3.2), f1: at(3.6), f2: at(5.3), no: at(7.9), call: at(9.9), code: at(12.1), safe: at(13.7), s3: at(16.0), ever: at(19.3), end: at(20.8), card: at(21.5), send: at(23.2) };

const body = `
${scene(0.1, T.s2, `
<div class="vt-eyebrow"><b>Black Friday</b> · after you shop</div>
<div class="vt-h1">Shopped today?</div>
<div class="vt-big" style="top:400px;font-size:118px;opacity:0;animation:up .4s ${at(1.2)}s forwards">${marked('Expect this text.', at(1.8))}</div>
${icon(ICONS.bank, 0.6, 400, 'right:80px;top:880px')}`)}

${scene(T.s2, T.s3, `
<div class="vt-eyebrow" style="top:150px"><b>The text, then the call</b></div>
<div class="vt-pill" style="top:220px;animation-delay:${T.s2 + 0.1}s">Real scam text · as published by the FBI</div>
<svg class="vt-full" viewBox="0 0 ${W} ${H}">${bubble(4101, 90, 320, 900, 330, T.s2)}${bubble(4102, 90, 860, 900, 200, T.call, 'left')}</svg>
<div class="vt-msg" style="left:140px;top:350px;width:800px;font-size:42px"><div class="vt-sender">“Bank Fraud Alert” · SMS</div>Free Msg- <span>${words('([bank name]) Bank Fraud Alert-', T.s2 + 0.3, 0.05, T.f1)}</span><sup class="vt-num" style="animation-delay:${T.f1}s">1</sup> ${words('Did You Attempt an', T.s2 + 0.6, 0.05)} ${words('Instant Payment in the amount of $5,000.00?', T.s2 + 0.8, 0.05, T.f2)}<sup class="vt-num" style="animation-delay:${T.f2}s">2</sup> ${words('REPLY YES or NO or 1 To STOP ALERTS', T.s2 + 1.3, 0.05)}</div>
<div class="vt-pop" style="right:90px;top:690px;animation-name:up;animation-delay:${T.no}s"><div style="background:var(--ink);color:var(--paper);font-size:46px;font-weight:600;padding:16px 34px;border-radius:28px 28px 6px 28px">NO</div></div>
<div class="vt-msg" style="left:140px;top:890px;width:800px;font-size:42px"><div class="vt-sender" style="opacity:0;animation:fade .3s ${T.call + 0.2}s forwards">After the “NO”</div>${words('Our fraud specialist will be contacting you shortly', T.call + 0.3, 0.06, T.call + 1.2)}<sup class="vt-num" style="animation-delay:${T.call + 1.2}s">3</sup></div>
<div class="vt-src" style="top:1110px;animation-delay:${T.s2 + 1.6}s">Source: FBI IC3, “Cybercriminals Trick Victims into Transferring Funds to ‘Reverse’ Instant Payments”, Apr 14, 2022. Bank name replaced.</div>
${icon(STEP_ICONS.asks_for_code, T.code, 230, 'left:120px;top:1230px')}
<div class="vt-hand" style="left:110px;top:1470px;width:300px;opacity:0;animation:up .35s ${T.code}s forwards">asks for a code</div>
${icon(STEP_ICONS.money_request, T.safe, 230, 'left:560px;top:1230px')}
<div class="vt-hand" style="left:530px;top:1470px;width:460px;opacity:0;animation:up .35s ${T.safe}s forwards">“move it somewhere safe”</div>`)}

${scene(T.s3, T.end, `
<div class="vt-eyebrow"><b>The rule</b></div>
<div class="vt-big" style="top:250px;font-size:112px">Your bank never asks you to ${marked('move money.', at(17.9))}</div>
<div class="vt-big" style="top:760px;font-size:150px;opacity:0;animation:up .35s ${T.ever}s forwards">Ever.</div>
${icon(STEP_ICONS.end, T.s3 + 0.4, 340, 'right:90px;top:1060px')}`)}

${endCard(T.end, { t1: 'Hang up.', t2: `Call the number on your card.`, t2at: T.card, sub: `Got one? Send it: scamdb.dev/report`, subAt: T.send })}`;

const captions = [
  [at(0), at(1.3), 'Spent money today?'],
  [at(1.3), at(3.1), 'Scammers are counting on it.'],
  [at(3.4), at(6.6), 'A fraud alert asks if you just paid $5,000.'],
  [at(6.7), at(9.7), 'You didn’t. You reply no.'],
  [at(9.9), at(13.6), 'Then a helpful “fraud specialist” calls, and asks for a code.'],
  [at(13.6), at(15.9), 'Or to move your money somewhere safe.'],
  [at(16.2), at(19.3), 'Your bank never asks you to move money to protect it.'],
  [at(19.3), at(20.8), 'Ever.'],
  [at(20.9), at(23.2), 'Hang up, call the number on your card,'],
  [at(23.2), at(24.5), 'and send the text to us.'],
];

await render({ id: 'video4', out: 'marketing/videos/video4', file: 'scamdb-video4-fraud-alert.mp4', voiceFile: 'marketing/videos/voice/v4-b.mp3', voiceLen: 24.61, lead: LEAD, body, captions, checks: [2, 6, 9, 15, 19.8, 25] });
