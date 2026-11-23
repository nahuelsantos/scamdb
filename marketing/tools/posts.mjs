// The images for each drafted post. Copy, sources and hashtags live in marketing/posts/<week>/<post>/post.md.
// Text markup: [[word]] = lime highlighter, {{n|words}} = a red flag marked with pink number n.
// msg.source present = a real, quoted message (credited on the image); absent = labelled as a written example.

const FOX5 = { short: 'FOX 5 DC', publisher: 'FOX 5 DC, citing the U.S. Postal Inspection Service', title: 'USPS officials issue warning about text scams ahead of holidays', date: 'Dec 2, 2024' };
const IC3_TOLL = { short: 'the FBI', pill: 'Real scam text · as published by the FBI', publisher: 'FBI Internet Crime Complaint Center (IC3)', title: 'Smishing Scam Regarding Debt for Road Toll Services', date: 'Apr 12, 2024' };
const IC3_BANK = { short: 'the FBI', pill: 'Real scam text · as published by the FBI', publisher: 'FBI Internet Crime Complaint Center (IC3)', title: 'Cybercriminals Trick Victims into Transferring Funds to “Reverse” Instant Payments', date: 'Apr 14, 2022' };
const ABC7 = { short: 'ABC7', publisher: 'ABC7 (KGO-TV) 7 On Your Side', title: 'More victims of Bank of America, Zelle scams come forward', date: 'Oct 4, 2021' };

// Real, quoted messages (placeholders replace names and links).
const USPS = { sender: '“USPS”', channel: 'SMS', source: FOX5, text: 'The {{1|USPS package}} has arrived at the warehouse and {{2|cannot be delivered due to incomplete address information.}}' };
const TOLL = { channel: 'SMS', source: IC3_TOLL, text: '{{1|(State Toll Service Name):}} We’ve noticed an outstanding toll amount of {{2|$12.51}} on your record. To avoid {{3|a late fee of $50.00}}, visit {{4|[link]}} to settle your balance.' };
const ZELLE = { sender: '“Bank Fraud Alert”', channel: 'SMS', source: IC3_BANK, text: 'Free Msg- {{1|([bank name]) Bank Fraud Alert-}} Did You Attempt an {{2|Instant Payment in the amount of $5,000.00?}} REPLY YES or NO or 1 To STOP ALERTS\n\nAfter a “NO”:\n{{3|Our fraud specialist will be contacting you shortly}}' };
const GRAND = { sender: '“Grandson”', channel: 'Phone call', text: 'Grandma it’s me. {{1|I’m in trouble}}, I had an accident and the police are holding me. {{2|Please don’t tell Mom and Dad.}} {{3|My lawyer is going to call you}} about the bail, {{4|I need it today.}}' };

export const POSTS = [
  // ---------- Week 48 (Nov 23–27) ----------
  {
    id: 'w48-mon-usps', week: '2026-11-W48', entry: 'us/usps-delivery-text', seed: 0,
    slides: [
      { type: 'cover', eyebrow: '<b>Scam of the week</b> · US · SMS', title: '“Your package\ncan’t be\ndelivered”', sub: 'The busiest scam text of the holidays, and the signs that give it away.', icon: 'parcel' },
      { type: 'message', eyebrow: '<b>The text</b> · 1 of 4', msg: USPS,
        notes: ['A delivery text you never asked for', 'A problem only you can fix. Next comes a link to a look-alike site that asks for your card.'] },
      { type: 'steps', eyebrow: '<b>The script</b> · 2 of 4', title: 'How it goes', accStep: 2 },
      { type: 'todo', eyebrow: '<b>What to do</b> · 3 of 4', items: ['Don’t tap the link. Check tracking on the store’s site or by typing [[usps.com]] yourself.', 'Forward the text to [[7726]] (SPAM), then delete it.', 'Tapped it and paid? Call your card issuer now. It happens to careful people too.', 'Real USPS texts only come if you asked for them, and they have no links.'] },
      { type: 'cta', eyebrow: 'Send us yours · 4 of 4', url: 'scamdb.dev/catalogue/us/usps-delivery-text' },
      { type: 'messageX', size: 'x', eyebrow: '<b>Scam of the week</b> · US · SMS', title: '3 signs it’s fake', msg: USPS,
        notes: ['A text you never asked for', 'A problem only you can fix', 'Then a link that asks for your card'] },
    ],
  },
  {
    id: 'w48-tue-toll', week: '2026-11-W48', entry: 'us/toll-text', seed: 11,
    slides: [
      { type: 'tip', eyebrow: '<b>How the trick works</b> · the small amount', title: 'Why the fake toll is only [[$12.51]]', sub: 'A small bill feels too small to question. That’s the point: they don’t want $12.51, they want your card number.', icon: 'money_request' },
      { type: 'message', eyebrow: '<b>The text</b>', msg: TOLL,
        notes: ['A toll program you know', 'A small, believable amount', 'A threat on top', 'A link to “pay”'] },
      { type: 'messageX', size: 'x', eyebrow: '<b>How the trick works</b> · the small amount', title: 'Why only $12.51?', msg: TOLL,
        notes: ['A toll program you know', 'Too small to question', 'A threat on top', 'A link that wants your card'] },
    ],
  },
  {
    id: 'w48-wed-real-or-scam-delivery', week: '2026-11-W48', entry: 'us/usps-delivery-text', seed: 22,
    slides: [
      { type: 'versus', title: 'One is a scam. Which?', note: 'Both written by scamdb for this game. B follows the pattern in FTC and USPS warnings.',
        pair: [
          { sender: 'The store you ordered from', channel: 'SMS', text: 'Your order #[number] has shipped. Track it any time in our app or on our website. Reply STOP to opt out.' },
          { sender: '“USPS”', channel: 'SMS · unknown number', text: 'USPS: The package arrived at the warehouse but could not be delivered due to incomplete address information. Please confirm your address in the link: [link]' },
        ] },
      { type: 'answer', title: 'B is the scam', stamp: 'B · SCAM',
        items: ['A delivery [[problem]] you have to fix.', 'A link, from a number you don’t know.', 'No order number, no store name: it could be anyone’s package.', 'Even A can be faked. When unsure, open the store’s app yourself instead of tapping.'] },
      { type: 'versus', size: 'x', title: 'One is a scam. Which?', note: 'Both written by scamdb. B follows the pattern in FTC and USPS warnings.', footRight: 'Answer in the replies',
        pair: [
          { sender: 'The store you ordered from', text: 'Your order #[number] has shipped. Track it any time in our app or on our website.' },
          { sender: '“USPS”', text: 'USPS: The package could not be delivered due to incomplete address information. Confirm your address: [link]' },
        ] },
    ],
  },
  {
    id: 'w48-thu-family-code-word', week: '2026-11-W48', entry: 'us/family-emergency-call', seed: 33,
    slides: [
      { type: 'tip', eyebrow: '<b>Thanksgiving</b> · one thing to do at the table', title: 'Pick a [[family code word]]', sub: 'Scammers call grandparents pretending to be a grandchild in trouble, sometimes with an AI-copied voice. A word only your family knows ends the call in seconds.', icon: 'family', artStyle: 'right:60px;bottom:150px;width:300px;height:300px' },
      { type: 'message', eyebrow: '<b>How the call goes</b>', msg: GRAND,
        notes: ['Trouble, out of nowhere', 'Keep it secret', 'A “lawyer” takes over', 'Money, today'] },
      { type: 'tip', size: 'x', eyebrow: '<b>Thanksgiving</b> · one thing to do at the table', title: 'Pick a [[family code word]]', sub: 'A “grandchild in trouble” call can sound right, even the voice. A word only your family knows ends it in seconds.', subWidth: 38, icon: 'family', artStyle: 'right:80px;bottom:150px;width:260px;height:260px' },
    ],
  },
  {
    id: 'w48-fri-fake-shops', week: '2026-11-W48', entry: 'ca/fake-online-store', seed: 44,
    slides: [
      { type: 'list', eyebrow: '<b>Black Friday</b> · around the world', title: 'One trick, 28 countries', sub: 'Fake shops are in scamdb’s catalogue from Canada to Taiwan. The words change; the script doesn’t.',
        items: [['CA', '“[[80% off]], today only”'], ['BG', 'Up to 95% off and a countdown timer'], ['LT', '“Closing down, everything 80% off”'], ['SE', '“Family business closing down”'], ['TR', 'A copycat web address and a one-day deal']],
        note: 'From scamdb entries based on warnings by the Canadian Anti-Fraud Centre and police and consumer agencies in each country.' },
      { type: 'todo', eyebrow: '<b>Before you pay</b>', title: 'Four quick checks', items: ['Know the normal price. [[80% off]] a brand is the bait.', 'Search the shop’s name plus “reviews” on another site.', 'Pay by credit card: it has the most protection.', 'Paid and nothing came? Call your card issuer. It’s not your fault.'] },
      { type: 'list', size: 'x', eyebrow: '<b>Black Friday</b> · around the world', title: 'One trick, 28 countries', itemSize: 40,
        items: [['CA', '“[[80% off]], today only”'], ['BG', 'Up to 95% off and a countdown timer'], ['SE', '“Family business closing down”']] },
    ],
  },
  // ---------- Week 49 (Nov 30–Dec 4) ----------
  {
    id: 'w49-mon-bank-zelle', week: '2026-12-W49', entry: 'us/bank-fraud-alert-zelle', seed: 55,
    slides: [
      { type: 'cover', eyebrow: '<b>Scam of the week</b> · US · SMS + call', title: 'The fake\nfraud alert', sub: 'It starts with a text from “your bank”. It ends with you moving your own money to them.', icon: 'bank' },
      { type: 'message', eyebrow: '<b>The text</b> · 1 of 4', msg: ZELLE,
        notes: ['Looks like your bank', 'A payment you didn’t make', 'Then a call from “fraud”'] },
      { type: 'steps', eyebrow: '<b>The script</b> · 2 of 4', title: 'How it goes', accStep: 2 },
      { type: 'todo', eyebrow: '<b>What to do</b> · 3 of 4', items: ['Your bank will never ask you to [[move money]] to protect it.', 'Never read out a code someone texts or calls you about.', 'Hang up. Call the number on the back of your card.', 'Sent money? Tell your bank right away. Scammers fool careful people every day.'] },
      { type: 'cta', eyebrow: 'Send us yours · 4 of 4', url: 'scamdb.dev/catalogue/us/bank-fraud-alert-zelle' },
      { type: 'messageX', size: 'x', eyebrow: '<b>Scam of the week</b> · US', title: 'The fake fraud alert', msg: ZELLE,
        notes: ['Looks like your bank', 'A payment you didn’t make', 'Then a call from “fraud”'] },
    ],
  },
  {
    id: 'w49-tue-gift-cards', week: '2026-12-W49', entry: 'us/fake-police-government', seed: 66,
    slides: [
      { type: 'tip', eyebrow: '<b>How the trick works</b> · the payment', title: 'Nobody real asks to be paid in [[gift cards]]', fs: 88, sub: 'Not the IRS, not the police, not your bank, not a grandchild’s “lawyer”. If someone demands gift cards, it’s a scam.', icon: 'gift' },
      { type: 'list', eyebrow: '<b>In scamdb’s US catalogue</b>', title: '8 scripts that ask for gift cards', itemSize: 34,
        items: [['01', 'Fake police or government official'], ['02', 'Grandparent “I’m in trouble” call'], ['03', 'Jury duty “warrant”'], ['04', 'Utility shut-off threat'], ['05', 'Prize or sweepstakes “fee”'], ['06', 'Romance scam'], ['07', 'Fake check overpayment'], ['08', 'Sextortion']],
        note: 'Each one is documented in FTC or FBI warnings. Full list: scamdb.dev/catalogue/us' },
      { type: 'tip', size: 'x', eyebrow: '<b>How the trick works</b> · the payment', title: 'Nobody real asks to be paid in [[gift cards]]', fs: 80, sub: 'Not the IRS, the police, your bank or a grandchild’s “lawyer”.', subWidth: 40, icon: 'gift', artStyle: 'right:80px;bottom:150px;width:260px;height:260px' },
    ],
  },
  {
    id: 'w49-wed-real-or-scam-bank', week: '2026-12-W49', entry: 'us/bank-fraud-alert-zelle', seed: 77,
    slides: [
      { type: 'versus', title: 'One is a scam. Which?', note: 'One is a real scam text, quoted in the news. The other was written by scamdb. Sources on the last slide.',
        pair: [
          { sender: 'Your bank', channel: 'SMS · the usual number', text: 'Did you attempt a $3,500.00 purchase at [store]? Reply YES or NO. We will never ask for your PIN or a code.' },
          { sender: '“[bank] fraud alert”', channel: 'SMS · unknown number', text: '[bank] fraud alert. Did you just attempt a Zelle transaction of $3,500? Please reply yes or no.' },
        ] },
      { type: 'answer', title: 'B. But here’s the honest part', stamp: 'B · SCAM',
        items: ['Both ask you to reply. From the text alone, you [[can’t be sure]].', 'The scam starts after: a “fraud specialist” calls and asks for a code, or to move your money.', 'So don’t reply to either. Call the number on the back of your card.'],
        note: 'B: real scam text quoted by ABC7 (KGO-TV), Oct 4, 2021, bank name replaced. A: written by scamdb as a genuine-style alert.' },
      { type: 'versus', size: 'x', title: 'One is a scam. Which?', note: 'One is a real scam text quoted in the news; one was written by scamdb.', footRight: 'Answer in the replies',
        pair: [
          { sender: 'Your bank', text: 'Did you attempt a $3,500.00 purchase at [store]? Reply YES or NO. We never ask for a code.' },
          { sender: '“[bank] fraud alert”', text: '[bank] fraud alert. Did you just attempt a Zelle transaction of $3,500? Please reply yes or no.' },
        ] },
    ],
  },
  {
    id: 'w49-thu-safe-account', week: '2026-12-W49', entry: 'gb/bank-safe-account', seed: 88,
    slides: [
      { type: 'list', eyebrow: '<b>Around the world</b> · one script', title: '“Move it to a [[safe account]]”', sub: 'A fake bank or police caller says your money is at risk and has you move it. scamdb has this script in 30+ countries.',
        items: [['UK', 'safe account'], ['ES', 'cuenta de respaldo de seguridad'], ['NL', 'veilige rekening'], ['PL', 'rachunek ochronny'], ['CZ', 'zajištěný účet']],
        note: 'Words from scamdb’s written examples, based on police and bank warnings in each country.' },
      { type: 'tip', eyebrow: '<b>In any language</b>', title: 'There is no [[safe account]]', sub: 'No real bank or police force will ever ask you to move your money to protect it. Hang up and call your bank on the number on your card.', icon: 'end' },
      { type: 'list', size: 'x', eyebrow: '<b>Around the world</b> · one script in 30+ countries', title: '“Move it to a [[safe account]]”', itemSize: 40,
        items: [['ES', 'cuenta de respaldo de seguridad'], ['NL', 'veilige rekening'], ['PL', 'rachunek ochronny']] },
    ],
  },
  {
    id: 'w49-fri-how-the-check-works', week: '2026-12-W49', entry: null, seed: 99,
    slides: [
      { type: 'tip', eyebrow: '<b>Behind scamdb</b>', title: 'Paste a message. See the [[script]].', sub: 'scamdb compares it with 1,199 documented scams from 76 countries. The check runs in your browser: the message isn’t sent anywhere.', icon: 'sms' },
      { type: 'list', eyebrow: '<b>What the answer means</b>', title: 'Three possible answers', itemSize: 34,
        items: [['SCAM', 'It matches a known scam script. You’ll see which one and what to do.'], ['SUSP.', 'It has warning signs, but no known script.'], ['NONE', 'Not recognised. That is [[not a promise it’s safe]]: new scams appear every week.']],
        note: 'Got one we missed? Report it at scamdb.dev/report. Reports stay private.' },
      { type: 'tip', size: 'x', eyebrow: '<b>Behind scamdb</b>', title: 'Paste a message. See the [[script]].', sub: '1,199 documented scams from 76 countries. The check runs in your browser.', subWidth: 40, icon: 'sms', artStyle: 'right:80px;bottom:150px;width:260px;height:260px' },
    ],
  },
];

// December campaign (marketing/tools/december.mjs): same renderer, posts with images only.
import { DECEMBER } from './december.mjs';
POSTS.push(...DECEMBER.filter((p) => p.slides.length));
