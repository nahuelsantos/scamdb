// Video 3 "Real or scam? 3 seconds" (quiz). Narration: ElevenLabs "Nahuel English", take A (v3-a.mp3).
// A = the owner's own genuine bank alert (NZ), bank name replaced. B = real scam text quoted by ABC7 (KGO-TV), Oct 4, 2021.
import { render, scene, bubble, words, marked, stamp, endCard, pop, icon, W, H } from './video-lib.mjs';
import { ICONS } from '../../site/templates/icons.js';

const LEAD = 0.4, at = (s) => +(LEAD + s).toFixed(2);
const T = { quiz: at(3.0), count: [at(3.9), at(5.4), at(6.9)], answer: at(8.5), alike: at(11.0), scene3: at(14.4), card: at(17.3), end: at(19.4), send: at(20.6) };

const A = 'A new iPhone OS device has been registered for the [bank] Mobile Banking app.';
const A2 = 'If this was not authorised by you,';
const A3 = 'please call us on [number] or [number]';
const B1 = '[bank] fraud alert.';
const B2 = 'Did you just attempt a Zelle transaction of $3,500?';
const B3 = 'Please reply yes or no.';

const body = `
${scene(0.1, T.quiz, `
<div class="vt-eyebrow"><b>Real or scam?</b></div>
<div class="vt-h1">Two texts from your bank.</div>
<div class="vt-big" style="top:560px;font-size:96px;opacity:0;animation:up .4s ${at(1.4)}s forwards">One is a scam.</div>
<div class="vt-big" style="top:720px;font-size:96px;opacity:0;animation:up .4s ${at(2.4)}s forwards">${marked('3 seconds.', at(2.7))}</div>`)}

${scene(T.quiz, T.scene3, `
<div class="vt-eyebrow" style="top:150px"><b>Real or scam?</b> · 3 seconds</div>
<div class="vt-big" style="top:230px;font-size:64px">A</div>
<svg class="vt-full" viewBox="0 0 ${W} ${H}">${bubble(3101, 90, 310, 900, 400, T.quiz)}${bubble(3102, 90, 860, 900, 330, T.quiz + 0.2, 'right')}</svg>
<div class="vt-msg" style="left:140px;top:345px;width:800px;font-size:42px"><div class="vt-sender">[bank] · SMS</div>${words(A, T.quiz + 0.2, 0.03)} <span class="vt-alike-a">${words(A2, T.quiz + 0.6, 0.03, T.alike)}</span> ${words(A3, T.quiz + 0.8, 0.03)}</div>
<div class="vt-big" style="top:780px;font-size:64px">B</div>
<div class="vt-msg" style="left:140px;top:895px;width:800px;font-size:42px"><div class="vt-sender">“[bank] fraud alert” · SMS</div>${words(B1, T.quiz + 0.4, 0.03)} ${words(B2, T.quiz + 0.5, 0.03, T.alike + 0.3)} ${words(B3, T.quiz + 0.7, 0.03)}</div>
${T.count.map((c, i) => pop(c, `${3 - i}`, 'right:110px;top:1250px;font-family:var(--hand);font-size:200px;line-height:1', T.count[i + 1] ?? T.answer)).join('')}
${stamp('SCAM', T.answer, 'left:560px;top:1120px')}
${stamp('GENUINE', T.answer + 0.35, 'left:560px;top:640px', true)}
<div class="vt-src" style="top:1290px;width:640px;animation-delay:${T.answer + 0.6}s">A: a genuine message, shared by scamdb’s founder. B: a real scam text quoted by ABC7 (KGO-TV), Oct 4, 2021. Bank names replaced.</div>`)}

${scene(T.scene3, T.end, `
<div class="vt-eyebrow"><b>The rule</b></div>
<div class="vt-big" style="top:250px;font-size:104px">Never act through the ${marked('message.', T.scene3 + 0.6)}</div>
<div class="vt-big" style="top:620px;font-size:60px;line-height:1.15;opacity:0;animation:up .4s ${T.scene3 + 0.3}s forwards">Don’t reply. Don’t call the number in the text.</div>
<div class="vt-big" style="top:860px;font-size:80px;opacity:0;animation:up .4s ${T.card}s forwards">Call the one on ${marked('your card.', T.card + 0.5)}</div>
${icon(ICONS.card, T.card + 0.2, 380, 'left:90px;top:1080px')}`)}

${endCard(T.end, { t1: 'Scam or real,', t2: `send us yours:<br><span class="vt-mark" style="animation-delay:${T.send + 0.3}s">scamdb.dev/report</span>`, t2at: T.send, sub: 'The real ones teach the check too.', subAt: at(21.8) })}`;

const captions = [
  [at(0), at(1.4), 'Two texts from your bank.'],
  [at(1.4), at(2.4), 'One’s a scam.'],
  [at(2.4), at(3.4), 'Three seconds.'],
  [at(8.5), at(10.9), 'B. But look how alike they are.'],
  [at(10.9), at(14.0), 'Same bank. Same “if this wasn’t you”.'],
  [at(14.5), at(17.3), 'So don’t reply, and don’t call the number in the text.'],
  [at(17.3), at(19.0), 'Call the one on your card.'],
  [at(19.6), at(21.7), 'Got either kind? Send it.'],
  [at(21.7), at(23.6), 'The real ones teach the check too.'],
];

await render({ id: 'video3', out: 'marketing/videos/video3', file: 'scamdb-video3-real-or-scam.mp4', voiceFile: 'marketing/videos/voice/v3-a.mp3', voiceLen: 23.68, lead: LEAD, body, captions, checks: [2, 6, 9.5, 12, 16, 21.5] });
