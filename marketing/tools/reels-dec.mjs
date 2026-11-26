// December Reels V8–V15. Narration: "Nahuel English" (ElevenLabs), one take each, timings from the take's word timestamps.
// Usage: npm run build && node marketing/tools/reels-dec.mjs [video8 video9 …]   (no argument = all)
// Messages are the catalogue's written examples (labelled "an example"), the same ones used in the December posts.
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { render, scene, bubble, words, marked, endCard, icon, ring, stamp, esc, W, H, ROOT } from './video-lib.mjs';
import { ICONS, STEP_ICONS } from '../../site/templates/icons.js';

const LEAD = 0.4;
const at = (s) => +(LEAD + s).toFixed(2);
const h1 = (html, top = 250, fs = 118) => `<div class="vt-h1" style="top:${top}px;font-size:${fs}px">${html}</div>`;
const eyebrow = (html, top = 170) => `<div class="vt-eyebrow" style="top:${top}px">${html}</div>`;
const big = (html, top, a, fs = 100) => `<div class="vt-big" style="top:${top}px;font-size:${fs}px;opacity:0;animation:up .4s ${a}s forwards">${html}</div>`;
const hand = (txt, top, a, extra = '') => `<div class="vt-hand" style="left:90px;top:${top}px;width:900px;opacity:0;animation:up .35s ${a}s forwards;${extra}">${txt}</div>`;
const note = (n, t, a, top) => `<div class="vt-note" style="left:90px;top:${top}px;animation-delay:${a}s">${ring(n, a)}<b>${n + 1}</b><span>${t}</span></div>`;
const pill = (t, top, a) => `<div class="vt-pill" style="top:${top}px;border-style:dashed;border-color:var(--dim);animation-delay:${a}s">${t}</div>`;
const src = (t, top, a) => `<div class="vt-src" style="top:${top}px;animation-delay:${a}s">${t}</div>`;
const num = (n, a) => `<sup class="vt-num" style="animation-delay:${a}s">${n}</sup>`;
/** A row: label on the left (mono, pink) and text, appearing at `a`. */
const row = (label, text, top, a, fs = 46) => `<div class="vt-row" style="top:${top}px;animation-delay:${a}s"><b>${label}</b><span style="font-size:${fs}px">${text}</span></div>`;
const CSS = `
.vt-row{position:absolute;left:90px;width:900px;display:flex;gap:28px;align-items:baseline;opacity:0;animation:up .35s forwards}
.vt-row b{flex:none;width:90px;font-family:var(--mono);font-weight:500;font-size:34px;color:var(--accent-ink)}
.vt-row span{line-height:1.25}
.vt-no{position:absolute;right:90px;font-family:var(--hand);font-size:76px;color:var(--accent-ink);opacity:0;animation:up .3s forwards}
.vt-q{position:absolute;left:90px;font-family:var(--display);font-weight:700;font-size:76px;letter-spacing:-.03em;opacity:0;animation:up .35s forwards}
`;
const no = (t, top, a) => `<div class="vt-no" style="top:${top}px;animation-delay:${a}s">${t}</div>`;
const q = (t, top, a) => `<div class="vt-q" style="top:${top}px;animation-delay:${a}s">${t}</div>`;
const send = (a) => ({ t1: 'Got one?', t2: `Send it: <span class="vt-mark" style="animation-delay:${a + 0.3}s">scamdb.dev/report</span>`, t2at: a, sub: 'Check a message: scamdb.dev', subAt: a + 0.8 });
const shift = (caps) => caps.map(([a, b, t]) => [at(a), at(b), t]);

const VIDEOS = {
  // V8 · Tue Dec 1 · Nobody real asks for gift cards
  video8: () => ({ file: 'scamdb-video8-gift-cards.mp4', voice: 'v8-a.mp3', len: 23.59, cover: 2.2, body: `
${scene(0.1, at(2.6), `${eyebrow('<b>How the trick works</b> · the payment')}
${h1(`Who asks to be paid in ${marked('gift cards?', at(1.0))}`)}
${icon(ICONS.gift, 0.5, 400, 'right:90px;top:900px')}`)}
${scene(at(2.6), at(12.4), `${eyebrow('<b>Who asks for gift cards?</b>', 170)}
${q('The IRS?', 300, at(2.72))}${no('No.', 300, at(3.92))}
${q('The police?', 480, at(4.86))}${no('No.', 480, at(6.06))}
${q('Your bank?', 660, at(7.36))}${no('No.', 660, at(8.26))}
${q('A grandchild’s lawyer?', 840, at(9.24))}${no('Also no.', 960, at(10.8))}
${icon(STEP_ICONS.money_request, at(2.9), 320, 'left:90px;top:1120px')}`)}
${scene(at(12.4), at(17.2), `${eyebrow('<b>The answer</b>')}
<div class="vt-big" style="top:250px;font-size:130px">Only ${marked('scammers.', at(12.6))}</div>
${hand('Gift cards are fast, and the money can’t come back.', 560, at(13.74))}
${icon(ICONS.gift, at(12.6), 360, 'right:90px;top:1000px')}`)}
${scene(at(17.2), at(21.2), `${eyebrow('<b>The rule</b>')}
${big('Someone wants gift cards?', 250, at(17.3), 96)}
${big(`It’s a scam. ${marked('Hang up.', at(20.0))}`, 560, at(18.96), 96)}
${icon(STEP_ICONS.end, at(17.5), 360, 'right:90px;top:1000px')}`)}
${endCard(at(21.2), send(at(22.4)))}`,
    captions: shift([[0, 2.5, 'Who asks to be paid in gift cards?'], [2.7, 4.7, 'The IRS? No.'], [4.8, 7.2, 'The police? No.'], [7.3, 9.1, 'Your bank? No.'], [9.2, 12.3, 'A grandchild’s lawyer? Also no.'], [12.5, 13.6, 'Only scammers.'], [13.7, 17.1, 'Gift cards are fast, and the money can’t come back.'], [17.3, 19.9, 'If someone wants gift cards, it’s a scam.'], [20.0, 21.1, 'Hang up.'], [21.2, 23.4, 'Got one? Send it to us.']]) }),

  // V9 · Thu Dec 3 · “Move it to a safe account”
  video9: () => ({ file: 'scamdb-video9-safe-account.mp4', voice: 'v9-a.mp3', len: 20.43, cover: 5.6, body: `
${scene(0.1, at(6.1), `${eyebrow('<b>How the trick works</b> · the safe account')}
${h1('Your bank calls.')}
${hand('“Your money is at risk.”', 420, at(1.06))}
${big(`“Move it to a ${marked('safe account.', at(4.74))}”`, 560, at(3.04), 104)}
${icon(ICONS.bank, 0.6, 360, 'right:90px;top:1010px')}`)}
${scene(at(6.1), at(10.1), `${eyebrow('<b>The truth</b>')}
${big('There’s no safe account.', 250, at(6.26), 110)}
${big(`That account is ${marked('theirs.', at(8.8))}`, 560, at(8.16), 110)}
${icon(STEP_ICONS.money_request, at(6.4), 360, 'right:90px;top:1010px')}`)}
${scene(at(10.1), at(15.4), `${eyebrow('<b>One script</b> · 30+ countries')}
${h1('Same words, every language.', 240, 96)}
${row('UK', 'safe account', 560, at(10.6))}${row('ES', 'cuenta de respaldo de seguridad', 660, at(11.4))}${row('NL', 'veilige rekening', 760, at(12.2))}${row('PL', 'rachunek ochronny', 860, at(13.0))}${row('CZ', 'zajištěný účet', 960, at(13.8))}
${src('Words from scamdb’s written examples, based on police and bank warnings in each country.', 1100, at(11.0))}`)}
${scene(at(15.4), at(18.3), `${eyebrow('<b>The fix</b>')}
${big('Hang up.', 250, at(15.6), 120)}
${big(`Call the number ${marked('on your card.', at(17.0))}`, 430, at(16.38), 104)}
${icon(ICONS.card, at(15.6), 360, 'right:90px;top:1010px')}`)}
${endCard(at(18.3), send(at(19.3)))}`,
    captions: shift([[0, 2.9, 'Your bank calls. Your money is at risk.'], [3.0, 6.1, 'So they ask you to move it. To a safe account.'], [6.2, 8.1, 'There’s no safe account.'], [8.1, 10.1, 'That account is theirs.'], [10.2, 12.9, 'We have this script in more than 30 countries.'], [13.0, 15.4, 'Same words, every language.'], [15.5, 18.2, 'Hang up. Call the number on your card.'], [18.3, 20.4, 'Got one? Send it to us.']]) }),

  // V10 · Thu Dec 10 · The parcel text in 70 countries
  video10: () => ({ file: 'scamdb-video10-parcel-world.mp4', voice: 'v10-b.mp3', len: 22.94, cover: 2.2, body: `
${scene(0.1, at(2.3), `${eyebrow('<b>Around the world</b> · one script')}
${h1('“Your parcel is stuck.”')}
${hand('Pay a small fee.', 560, at(1.7))}
${icon(ICONS.parcel, 0.5, 400, 'right:90px;top:900px')}`)}
${scene(at(2.3), at(10.2), `${eyebrow('<b>The same text</b> · in the catalogue')}
${row('US', '“Your package can’t be delivered, update your address”', 270, at(3.42))}
${row('AU', '“Update your address to get your parcel”', 440, at(4.54))}
${row('BE', '“Pay customs fees or your parcel won’t be delivered”', 610, at(5.86))}
${row('AE', '“Your shipment is held, pay Dh3”', 780, at(7.28))}
${row('AM', '“Your parcel is on hold, pay a small fee”', 950, at(9.18))}`)}
${scene(at(10.2), at(15.1), `${eyebrow('<b>One trick</b>')}
<div class="vt-big" style="top:250px;font-size:150px">${marked('70 countries.', at(11.38))}</div>
${big('Only the logo changes.', 640, at(12.56), 96)}
${src('scamdb’s catalogue: 117 parcel-text entries in 70 countries, each based on postal, police or government warnings.', 940, at(12.8))}`)}
${scene(at(15.1), at(20.5), `${eyebrow('<b>The fix</b> · everywhere')}
${big('Don’t tap.', 250, at(17.58), 120)}
${big(`Track it where you ${marked('bought it.', at(19.4))}`, 430, at(18.74), 104)}
${icon(ICONS.parcel, at(15.3), 360, 'right:90px;top:1010px')}`)}
${endCard(at(20.5), send(at(21.7)))}`,
    captions: shift([[0, 1.6, 'Your parcel is stuck.'], [1.7, 3.3, 'Pay a small fee.'], [3.4, 5.8, 'In the US. In Australia.'], [5.8, 9.1, 'In Belgium. In the Emirates.'], [9.1, 10.2, 'In Armenia.'], [10.2, 12.5, 'We’ve found this text in 70 countries.'], [12.5, 15.0, 'Only the logo changes.'], [15.1, 17.5, 'The fix is the same everywhere.'], [17.5, 20.4, 'Don’t tap. Track it where you bought it.'], [20.5, 22.9, 'Got one? Send it to us.']]) }),

  // V11 · Mon Dec 14 · The online love who needs money
  video11: () => { const s2 = at(2.9); return { file: 'scamdb-video11-romance.mp4', voice: 'v11-b.mp3', len: 19.92, cover: 2.4, body: `
${scene(0.1, s2, `${eyebrow('<b>Scam of the week</b> · online')}
${h1('They’ve never met you.')}
${big(`But they ${marked('love you.', at(1.9))}`, 560, at(1.3), 110)}
${icon(ICONS.heart, 0.5, 380, 'right:90px;top:960px')}`)}
${scene(s2, at(11.6), `${eyebrow('<b>How it reads</b>', 150)}
${pill('An example of how this one reads', 220, s2 + 0.1)}
<svg class="vt-full" viewBox="0 0 ${W} ${H}">${bubble(11101, 90, 320, 900, 560, s2)}</svg>
<div class="vt-msg" style="left:140px;top:355px;width:800px;font-size:42px"><div class="vt-sender">“My love” · chat app</div>${words('Good morning my love. I can’t stop thinking about you.', s2 + 0.3, 0.04)} ${words('As soon as my contract on the oil rig ends', s2 + 0.8, 0.04, at(6.04))}${num(1, at(6.04))} ${words('we will finally be together. Baby,', s2 + 1.2, 0.04)} ${words('my account is frozen and I need help with the customs fee', s2 + 1.5, 0.04, at(7.92))}${num(2, at(7.92))} ${words('to send my things home.', s2 + 1.9, 0.04)} ${words('I will pay you back as soon as I land.', s2 + 2.2, 0.04, at(9.36))}${num(3, at(9.36))}</div>
${src('Written by scamdb from FTC warnings (US, Feb 14, 2025; Apr 27, 2026). Not a real message.', 960, s2 + 1.6)}
${note(0, 'A reason they can’t meet', at(6.04), 1080)}${note(1, 'A frozen account', at(7.92), 1170)}${note(2, 'A promise to pay you back', at(9.36), 1260)}`)}
${scene(at(11.6), at(17.9), `${eyebrow('<b>What to know</b>')}
${big(`It happens to ${marked('smart, careful people.', at(12.4))}`, 250, at(11.72), 100)}
${big('Never send money to someone you haven’t met in person.', 640, at(14.32), 78)}
${icon(ICONS.heart, at(11.8), 340, 'right:90px;top:1040px')}`)}
${endCard(at(17.9), send(at(18.7)))}`,
    captions: shift([[0, 2.9, 'They’ve never met you. But they love you.'], [3.0, 5.9, 'And now there’s a problem only you can fix.'], [6.0, 7.8, 'A reason they can’t meet.'], [7.9, 9.3, 'A frozen account.'], [9.3, 11.6, 'A promise to pay you back.'], [11.7, 14.2, 'It happens to smart, careful people.'], [14.3, 17.8, 'Never send money to someone you haven’t met in person.'], [17.9, 19.9, 'Got one? Send it to us.']]) }; },

  // V12 · Thu Dec 24 · Christmas Eve: the AI voice and the family code word
  video12: () => { const s2 = at(5.2); return { file: 'scamdb-video12-code-word.mp4', voice: 'v12-b.mp3', len: 21.78, cover: 4.8, body: `
${scene(0.1, s2, `${eyebrow('<b>Christmas Eve</b> · one thing to do tonight')}
${h1('This isn’t really me talking.')}
${hand('It’s an AI copy of my voice, made from recordings of me.', 660, at(1.64))}
${stamp('AI VOICE', at(1.9), 'left:90px;top:900px')}
${icon(ICONS.phone, 0.6, 360, 'right:90px;top:1010px')}`)}
${scene(s2, at(11.6), `${eyebrow('<b>Scammers copy voices too</b>', 150)}
${pill('An example of how this one sounds', 220, s2 + 0.1)}
<svg class="vt-full" viewBox="0 0 ${W} ${H}">${bubble(12101, 90, 320, 900, 400, s2)}</svg>
<div class="vt-msg" style="left:140px;top:355px;width:800px;font-size:44px"><div class="vt-sender">Phone call · sounds like your grandchild</div>${words('Grandma it’s me. I’m in trouble,', at(7.36), 0.05)} ${words('I had an accident', at(8.3), 0.05, at(8.58))}${num(1, at(8.58))} ${words('and the police are holding me.', at(8.9), 0.05)} ${words('Please don’t tell Mom and Dad.', at(9.74), 0.05, at(9.9))}${num(2, at(9.9))}</div>
${src('Written by scamdb from FBI warnings (IC3, Dec 3, 2024). Not a real call.', 800, s2 + 1.4)}
${note(0, 'A panic', at(8.58), 940)}${note(1, 'A secret', at(9.9), 1030)}`)}
${scene(at(11.6), at(20.4), `${eyebrow('<b>Tonight</b> · while everyone’s together')}
${big(`Pick a ${marked('family code word.', at(15.0))}`, 250, at(11.9), 112)}
${hand('A real relative knows it.', 640, at(16.38))}
${hand('A copy doesn’t.', 740, at(18.8))}
${icon(ICONS.family, at(11.8), 380, 'right:90px;top:960px')}`)}
${endCard(at(20.4), { t1: 'Merry Christmas.', t2: 'Pick the word tonight.', t2at: at(21.2), sub: 'Check a message: scamdb.dev', subAt: at(21.8) })}`,
    captions: shift([[0, 1.6, 'This isn’t really me talking.'], [1.6, 5.2, 'It’s an AI copy of my voice, made from recordings of me.'], [5.3, 7.3, 'Scammers copy voices too.'], [7.3, 9.7, 'A panicked call. An accident.'], [9.7, 11.6, 'Please don’t tell Mom and Dad.'], [11.7, 15.9, 'So tonight, while everyone’s together, pick a family code word.'], [16.3, 19.6, 'A real relative knows it. A copy doesn’t.'], [20.4, 21.8, 'Merry Christmas.']]) }; },

  // V13 · Sat Dec 26 · Boxing Day: check the shop first
  video13: () => ({ file: 'scamdb-video13-boxing-day.mp4', voice: 'v13-b.mp3', len: 22.15, cover: 2.6, body: `
${scene(0.1, at(6.5), `${eyebrow('<b>Boxing Day</b> · UK · Canada · Australia · NZ', 150)}
${pill('An example of how this one reads', 220, 0.2)}
<svg class="vt-full" viewBox="0 0 ${W} ${H}">${bubble(13101, 90, 320, 900, 380, 0.1)}</svg>
<div class="vt-msg" style="left:140px;top:355px;width:800px;font-size:44px"><div class="vt-sender">Ad on social media</div>${words('CLOSING SALE –', 0.3, 0.05)} ${words('everything 80% OFF today only!', 0.5, 0.05, at(0.1))} ${words('Premium boots now $39.99. Free shipping across Canada. Shop now before stock runs out: [link]', 0.9, 0.03)}</div>
${src('Written by scamdb from Canadian Anti-Fraud Centre advice (Oct 20, 2025). Not a real ad.', 780, 1.2)}
${hand('Boxing Day is when fake shops do their best work.', 900, at(2.94))}
${icon(ICONS.cart, at(3.2), 340, 'right:90px;top:1060px')}`)}
${scene(at(6.5), at(15.6), `${eyebrow('<b>Before you pay</b>')}
${h1('Three checks.', 250, 118)}
${note(0, 'Type the shop’s address yourself.', at(9.36), 520)}${note(1, 'Search its name + “reviews”.', at(11.48), 640)}${note(2, 'Pay by credit card.', at(13.74), 760)}
${icon(ICONS.cart, at(6.7), 360, 'right:90px;top:1010px')}`)}
${scene(at(15.6), at(19.7), `${eyebrow('<b>If it goes wrong</b>')}
${big(`${marked('It’s not your fault.', at(16.8))}`, 250, at(15.8), 112)}
${hand('Call your card provider.', 520, at(18.0))}
${icon(ICONS.card, at(15.8), 360, 'right:90px;top:1010px')}`)}
${endCard(at(19.7), send(at(20.7)))}`,
    captions: shift([[0, 1.7, '80% off. Today only.'], [1.8, 6.5, 'Boxing Day is when fake shops do their best work.'], [6.6, 9.3, 'Before you pay, three checks.'], [9.3, 11.4, 'Type the shop’s address yourself.'], [11.4, 13.6, 'Search its name, plus reviews.'], [13.7, 15.6, 'Pay by credit card.'], [15.7, 17.9, 'And if it goes wrong, it’s not your fault.'], [17.9, 19.6, 'Call your card provider.'], [19.7, 22.1, 'Got one? Send it to us.']]) }),

  // V14 · Mon Dec 28 · “You’re owed a refund”
  video14: () => { const s2 = at(8.4); return { file: 'scamdb-video14-tax-refund.mp4', voice: 'v14-a.mp3', len: 22.29, cover: 4.2, body: `
${scene(0.1, s2, `${eyebrow('<b>Scam of the week</b> · US · text, email')}
${h1('“You’re owed a refund.”')}
${big(marked('$1,284.50', at(1.0)), 560, at(0.84), 130)}
${hand('Nice.', 760, at(4.5))}
${hand('Except you never asked for it.', 860, at(6.52))}
${icon(ICONS.official, 0.6, 340, 'right:90px;top:1040px')}`)}
${scene(s2, at(15.2), `${eyebrow('<b>How it reads</b>', 150)}
${pill('An example of how this one reads', 220, s2 + 0.1)}
<svg class="vt-full" viewBox="0 0 ${W} ${H}">${bubble(14101, 90, 320, 900, 420, s2)}</svg>
<div class="vt-msg" style="left:140px;top:355px;width:800px;font-size:44px"><div class="vt-sender">“IRS Notice” · SMS</div>${words('IRS Notice: You are eligible for a tax refund of $1,284.50.', s2 + 0.1, 0.03, at(8.5))}${num(1, at(8.5))} ${words('Your direct deposit information is missing.', s2 + 0.5, 0.03)} ${words('Verify your bank account within 48 hours', s2 + 0.8, 0.03, at(10.58))}${num(2, at(10.58))} ${words('to receive your refund: [link]', s2 + 1.1, 0.03, at(12.6))}${num(3, at(12.6))}</div>
${src('Written by scamdb from IRS warnings (Mar 5, 2026). Not a real message.', 820, s2 + 1.3)}
${note(0, 'Money you weren’t expecting', at(8.5), 950)}${note(1, 'A 48-hour deadline', at(10.58), 1040)}${note(2, 'A link that wants your bank details', at(12.6), 1130)}`)}
${scene(at(15.2), at(20.1), `${eyebrow('<b>The fix</b>')}
${big('The IRS doesn’t text you for bank details.', 250, at(15.28), 92)}
${big(marked('Type the address yourself.', at(18.4)), 640, at(18.06), 92)}
${icon(ICONS.official, at(15.4), 340, 'right:90px;top:1040px')}`)}
${endCard(at(20.1), send(at(21.2)))}`,
    captions: shift([[0, 4.4, 'You’re owed a refund. $1,284.'], [4.5, 6.4, 'Nice.'], [6.5, 8.4, 'Except you never asked for it.'], [8.5, 10.5, 'Money you weren’t expecting.'], [10.6, 12.5, 'A 48-hour deadline.'], [12.6, 15.1, 'A link that wants your bank details.'], [15.3, 18.0, 'The IRS doesn’t text you for bank details.'], [18.0, 20.0, 'Type the address yourself.'], [20.1, 22.2, 'Got one? Send it to us.']]) }; },

  // V15 · Thu Dec 31 · Three rules for 2027
  video15: () => ({ file: 'scamdb-video15-three-rules.mp4', voice: 'v15-a.mp3', len: 17.97, cover: 10.8, body: `
${scene(0.1, null, `${eyebrow('<b>New Year</b> · three rules')}
${h1(`Three rules for ${marked('2027', at(0.7))}`, 250, 118)}
${note(0, 'Never move money to “protect” it.', at(2.78), 620)}
${note(1, 'Never read out or forward a code.', at(5.84), 740)}
${note(2, 'Hang up. Call the number you already know.', at(8.88), 860)}
${big(`They stop ${marked('most scams', at(13.2))} we’ve seen this year.`, 1040, at(12.02), 70)}`)}
${endCard(at(15.6), { t1: 'Happy New Year.', t2: `Send us what you get: <span class="vt-mark" style="animation-delay:${at(16.9)}s">scamdb.dev/report</span>`, t2at: at(16.6), sub: 'Check a message: scamdb.dev', subAt: at(17.2) })}`,
    captions: shift([[0, 2.7, 'Three rules for 2027.'], [2.7, 5.8, 'One. Never move money to protect it.'], [5.8, 8.8, 'Two. Never read out or forward a code.'], [8.8, 11.9, 'Three. Hang up, and call the number you already know.'], [12.0, 15.5, 'They stop most of the scams we’ve seen this year.'], [15.6, 17.9, 'Happy New Year. And send us what you get.']]) }),
};

const pick = process.argv.slice(2);
for (const id of pick.length ? pick : Object.keys(VIDEOS)) {
  const v = VIDEOS[id]();
  const out = `marketing/videos/${id}`;
  const mp4 = await render({ id, out, file: v.file, voiceFile: `marketing/videos/voice/${v.voice}`, voiceLen: v.len, lead: LEAD, body: v.body, captions: v.captions, css: CSS,
    checks: [1.5, 5, 9, 13, 17, v.len - 1.5].map((s) => +s.toFixed(1)) });
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', String(v.cover), '-i', mp4, '-frames:v', '1', join(ROOT, out, 'cover.png')]);
}
