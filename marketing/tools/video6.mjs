// Video 6 "Real or scam? Subscriptions" (quiz). Narration: "Nahuel English", take A (v6-a.mp3).
// A = the owner's genuine membership reminder (name replaced). B = written example from ro/netflix-subscription-phishing (brand replaced).
import { render, scene, bubble, words, marked, stamp, endCard, pop, icon, W, H } from './video-lib.mjs';
import { STEP_ICONS } from '../../site/templates/icons.js';

const LEAD = 0.4, at = (s) => +(LEAD + s).toFixed(2);
const T = { quiz: at(3.3), count: [at(4.0), at(5.4), at(6.8)], answer: at(8.0), a: at(9.3), b: at(10.9), s3: at(14.7), never: at(16.8), end: at(18.6), send: at(19.9) };

const body = `
${scene(0.1, T.quiz, `
<div class="vt-eyebrow"><b>Real or scam?</b></div>
<div class="vt-h1">Two messages about your subscription.</div>
<div class="vt-big" style="top:620px;font-size:96px;opacity:0;animation:up .4s ${at(2.0)}s forwards">One is a scam.</div>
<div class="vt-big" style="top:780px;font-size:96px;opacity:0;animation:up .4s ${at(2.8)}s forwards">${marked('3 seconds.', at(3.0))}</div>`)}

${scene(T.quiz, T.s3, `
<div class="vt-eyebrow" style="top:150px"><b>Real or scam?</b> · 3 seconds</div>
<div class="vt-big" style="top:230px;font-size:64px">A</div>
<svg class="vt-full" viewBox="0 0 ${W} ${H}">${bubble(6101, 90, 310, 900, 290, T.quiz)}${bubble(6102, 90, 760, 900, 400, T.quiz + 0.2, 'right')}</svg>
<div class="vt-msg" style="left:140px;top:345px;width:800px;font-size:42px"><div class="vt-sender">[store] · SMS</div>${words('Your [store] membership fee', T.quiz + 0.2, 0.03)} ${words('will be charged to your account on 27 May 2026.', T.quiz + 0.4, 0.03, T.a)}</div>
<div class="vt-big" style="top:680px;font-size:64px">B</div>
<div class="vt-msg" style="left:140px;top:795px;width:800px;font-size:42px"><div class="vt-sender">“[streaming service]” · SMS</div>${words('[streaming service]: We couldn’t process the payment for your subscription. To avoid your account being suspended,', T.quiz + 0.4, 0.02)} ${words('update your payment method within the next 24 hours: [link]', T.quiz + 0.8, 0.02, T.b)}</div>
${T.count.map((c, i) => pop(c, `${3 - i}`, 'right:110px;top:1250px;font-family:var(--hand);font-size:200px;line-height:1', T.count[i + 1] ?? T.answer)).join('')}
${stamp('SCAM', T.answer, 'left:560px;top:1080px')}
${stamp('GENUINE', T.answer + 0.35, 'left:560px;top:530px', true)}
<div class="vt-src" style="top:1270px;width:640px;animation-delay:${T.answer + 0.6}s">A: a genuine message, shared by scamdb’s founder. B: written by scamdb from a published warning (Alba24, Romania, Nov 2026). Names replaced.</div>`)}

${scene(T.s3, T.end, `
<div class="vt-eyebrow"><b>The rule</b></div>
<div class="vt-big" style="top:250px;font-size:100px">Check in the app you ${marked('already use.', T.s3 + 0.8)}</div>
<div class="vt-big" style="top:620px;font-size:100px;opacity:0;animation:up .4s ${T.never}s forwards">Never through the link.</div>
${icon(STEP_ICONS.unknown_link, T.s3 + 0.3, 360, 'right:90px;top:1000px')}`)}

${endCard(T.end, { t1: 'Scam or real,', t2: `send us yours:<br><span class="vt-mark" style="animation-delay:${T.send + 0.3}s">scamdb.dev/report</span>`, t2at: T.send, sub: 'The real ones teach the check too.', subAt: at(21.2) })}`;

const captions = [
  [at(0), at(2.0), 'Two messages about your subscription.'],
  [at(2.0), at(2.8), 'One’s a scam.'],
  [at(2.8), at(3.7), 'Three seconds.'],
  [at(8.0), at(10.8), 'B. A real reminder tells you something.'],
  [at(10.8), at(14.4), 'A scam needs you to act. Now. Through its link.'],
  [at(14.7), at(16.8), 'So check in the app you already use.'],
  [at(16.8), at(18.4), 'Never through the link.'],
  [at(18.6), at(21.1), 'Got either kind? Send it.'],
  [at(21.1), at(23.0), 'The real ones teach the check too.'],
];
await render({ id: 'video6', out: 'marketing/videos/video6', file: 'scamdb-video6-subscription.mp4', voiceFile: 'marketing/videos/voice/v6-a.mp3', voiceLen: 23.08, lead: LEAD, body, captions, checks: [2.5, 6, 9.5, 12, 16.5, 21] });
