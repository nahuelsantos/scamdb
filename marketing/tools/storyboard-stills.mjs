// One still per scene for the video storyboards (marketing/videos/storyboards.md).
// Usage: npm run build && node marketing/tools/render.mjs --stills  (render.mjs reads this list when --stills is given)
const FBI_TOLL = { pill: 'Real scam text · as published by the FBI', short: 'the FBI', publisher: 'FBI Internet Crime Complaint Center (IC3)', title: 'Smishing Scam Regarding Debt for Road Toll Services', date: 'Apr 12, 2024' };
const FBI_BANK = { pill: 'Real scam text · as published by the FBI', short: 'the FBI', publisher: 'FBI Internet Crime Complaint Center (IC3)', title: 'Cybercriminals Trick Victims into Transferring Funds to “Reverse” Instant Payments', date: 'Apr 14, 2022' };
const FOX5 = { short: 'FOX 5 DC', publisher: 'FOX 5 DC, citing the U.S. Postal Inspection Service', title: 'USPS officials issue warning about text scams ahead of holidays', date: 'Dec 2, 2024' };
const V = 'v';
const END = (title) => ({ type: 'cta', size: V, eyebrow: 'Send us yours', title, sub: 'Scam or genuine, both help the check tell them apart. Reports stay private.' });

export const STILLS = [
  { id: 'video1', out: 'marketing/videos/stills/video1', seed: 300, slides: [
    { type: 'tip', size: V, eyebrow: '<b>How it works</b> · 0–3 s', title: 'Got a text that feels [[off]]?', sub: 'Don’t ask the group chat.', icon: 'sms' },
    { type: 'message', size: V, eyebrow: '<b>Paste it</b> · 3–9 s (then the real site)', title: 'Paste it on scamdb.dev', msg: { sender: '“USPS”', channel: 'SMS', source: FOX5, text: 'The {{1|USPS package}} has arrived at the warehouse and {{2|cannot be delivered due to incomplete address information.}}' }, notes: ['A text you never asked for', 'A problem only you can fix'] },
    END('Got a new one?\nSend it: [[scamdb.dev/report]]'),
  ] },
  { id: 'video2', out: 'marketing/videos/stills/video2', seed: 310, slides: [
    { type: 'tip', size: V, eyebrow: '<b>Teardown</b> · 0–3 s', title: 'Why does a fake toll text ask for [[$12.51]]?', icon: 'money_request' },
    { type: 'message', size: V, eyebrow: '<b>The text</b> · 3–17 s', msg: { channel: 'SMS', source: FBI_TOLL, text: '{{1|(State Toll Service Name):}} We’ve noticed an outstanding toll amount of {{2|$12.51}} on your record. To avoid {{3|a late fee of $50.00}}, visit {{4|[link]}} to settle your balance.' }, notes: ['A toll program you know', 'A small amount', 'A $50 threat', 'A link'] },
    { type: 'tip', size: V, eyebrow: '<b>The point</b> · 17–23 s', title: 'They don’t want $12.51. They want your [[card number]].', icon: 'card' },
    END('Don’t tap.\nSend it: [[scamdb.dev/report]]'),
  ] },
  { id: 'video3', out: 'marketing/videos/stills/video3', seed: 320, slides: [
    { type: 'versus', size: V, eyebrow: 'Real or scam? · 0–8 s', title: 'Two texts from your bank. 3 seconds.', note: 'A: genuine message, shared by scamdb’s founder. B: real scam text quoted by ABC7 (KGO-TV), Oct 4, 2021. Bank names replaced.', footRight: '3 · 2 · 1',
      pair: [
        { sender: '[bank]', channel: 'SMS', text: 'A new iPhone OS device has been registered for the [bank] Mobile Banking app. If this was not authorised by you, please call us on [number] or [number]' },
        { sender: '“[bank] fraud alert”', channel: 'SMS', text: '[bank] fraud alert. Did you just attempt a Zelle transaction of $3,500? Please reply yes or no.' },
      ] },
    { type: 'answer', size: V, eyebrow: 'The answer · 8–20 s', title: 'B is the scam. But look how alike they are.', stamp: 'B · SCAM', items: ['Same bank. Same “if this wasn’t you”.', '[[Never act through the message.]] Don’t reply, don’t call the number in the text.', 'Call the number on the back of your card.'] },
    END('Scam or real,\nsend us yours: [[scamdb.dev/report]]'),
  ] },
  { id: 'video4', out: 'marketing/videos/stills/video4', seed: 330, slides: [
    { type: 'tip', size: V, eyebrow: '<b>Black Friday</b> · 0–3 s', title: 'Shopped today? [[Expect this text.]]', icon: 'bank' },
    { type: 'message', size: V, eyebrow: '<b>The text, then the call</b> · 3–17 s', msg: { sender: '“Bank Fraud Alert”', channel: 'SMS', source: FBI_BANK, text: 'Free Msg- {{1|([bank name]) Bank Fraud Alert-}} Did You Attempt an {{2|Instant Payment in the amount of $5,000.00?}} REPLY YES or NO or 1 To STOP ALERTS\n\nAfter a “NO”:\n{{3|Our fraud specialist will be contacting you shortly}}' }, notes: ['Looks like your bank', 'A payment you didn’t make', 'Then a call from “fraud”'] },
    { type: 'tip', size: V, eyebrow: '<b>The rule</b> · 17–23 s', title: 'Your bank never asks you to [[move money]].', sub: 'Hang up. Call the number on your card.', icon: 'end' },
    END('Got one?\nSend it: [[scamdb.dev/report]]'),
  ] },
];
