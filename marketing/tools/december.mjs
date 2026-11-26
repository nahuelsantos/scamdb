// December 2026 campaign: "Check before you pay". Every post's images (slides) and copy in one place.
// render.mjs draws the slides (POSTS in posts.mjs includes these); gen-postmd.mjs writes each post.md from this file.
// Messages without `source` are written by scamdb and labelled as such on the image. Messages marked `genuine` are the
// owner's own genuine messages (owner's decision), with company names replaced.

const W = 'Written by scamdb';
const GENUINE = { pill: 'Genuine message · shared by scamdb’s founder', short: 'scamdb’s founder', publisher: 'A genuine message shared by scamdb’s founder', title: 'company name replaced', date: '2026' };
const std = (country = '') => `Got one like this${country}, scam or genuine? Send it to us at scamdb.dev/report (link in bio). Reports stay private.`;

export const DECEMBER = [
  // ===================== Week 50 · Dec 7–11 · Deliveries and gifts =====================
  {
    id: 'w50-mon-prize', week: '2026-12-W50', date: 'Mon Dec 7', pillar: 'Scam of the week', entry: 'us/prize-sweepstakes', seed: 501,
    facts: 'FTC alert (Oct 26, 2026), in the catalogue entry. The message is the catalogue’s written example.',
    slides: [
      { type: 'cover', eyebrow: '<b>Scam of the week</b> · US · call, text, mail', title: '“You won!\nJust pay\nthe fees.”', sub: 'Holiday giveaways are everywhere this month. Real prizes never cost money.', icon: 'gift' },
      { type: 'message', eyebrow: '<b>The message</b> · 1 of 4', msg: { sender: '“Prize Claims Dept.”', channel: 'Text or call', text: '{{1|Congratulations! You have been selected as our grand prize winner}} of $2,500,000 and a new car. To release your winnings, {{2|a one-time processing and tax fee of $499}} is required. {{3|Call your claims agent today.}}' }, notes: ['You won something you never entered', 'A fee to get your prize', 'Hurry, call now'] },
      { type: 'steps', eyebrow: '<b>The script</b> · 2 of 4', title: 'How it goes', accStep: 3 },
      { type: 'todo', eyebrow: '<b>What to do</b> · 3 of 4', items: ['Never pay to claim a prize. [[Real prizes are free.]]', 'Don’t give your Social Security number or bank details.', 'Look the sweepstakes up yourself, with the word “scam”. Skip the paid ads.', 'Don’t trust caller ID: names and numbers can be faked.'] },
      { type: 'cta', eyebrow: 'Send us yours · 4 of 4', url: 'scamdb.dev/catalogue/us/prize-sweepstakes' },
      { type: 'messageX', size: 'x', eyebrow: '<b>Scam of the week</b> · US', title: 'Real prizes are free', msg: { sender: '“Prize Claims Dept.”', text: '{{1|Congratulations! You have been selected as our grand prize winner}} of $2,500,000 and a new car. To release your winnings, {{2|a one-time processing and tax fee of $499}} is required.' }, notes: ['You never entered', 'A fee to get your prize'] },
    ],
    ig: `“Congratulations, you won!” Then the catch: a fee, a tax or a “processing charge” before they can send the prize.

That fee is the whole scam. There is no prize. Real sweepstakes never ask winners to pay, and they don’t need your Social Security number to send you a gift.

Swipe for the script and what to do.

${std()}
Share this with someone who enters every giveaway.

#scamalert #scamawareness #giveaway #fraudprevention`,
    x: `“You won $2.5 million! To release it, pay a $499 processing fee.”

That fee is the scam. There is no prize. Real prizes are free.

How the script works:
https://scamdb.dev/catalogue/us/prize-sweepstakes/`,
  },
  {
    id: 'w50-tue-new-number', week: '2026-12-W50', date: 'Tue Dec 8', pillar: 'How the trick works', entry: 'gb/hi-mum-text', seed: 502,
    facts: 'Which? (Jul 30, 2026) for the UK entry; the same script is in 45 countries (entries with the "new number" sign, 2026-11-23). The message is the catalogue’s written example.',
    slides: [
      { type: 'tip', eyebrow: '<b>How the trick works</b> · the new number', title: '“Hi Mum, this is my [[new number]]”', sub: 'Why it works: it’s your child’s voice in your head, not the number on the screen. scamdb has this script in 45 countries.', icon: 'new_number' },
      { type: 'message', eyebrow: '<b>How it reads</b>', msg: { sender: 'Unknown number', channel: 'SMS · WhatsApp', text: '{{1|Hi Mum it’s me}}, I’ve lost my phone so {{2|this is my new number}}. Can you text me back? {{3|I need a favour, it’s urgent}} x' }, notes: ['No name, just “Mum”', 'A new number', 'Then: money, urgently'] },
      { type: 'messageX', size: 'x', eyebrow: '<b>How the trick works</b> · the new number', title: 'Call the old number', msg: { sender: 'Unknown number', text: '{{1|Hi Mum it’s me}}, I’ve lost my phone so {{2|this is my new number}}. Can you text me back? {{3|I need a favour, it’s urgent}} x' }, notes: ['No name', 'A new number', 'Then: money'] },
    ],
    ig: `“Hi Mum, I lost my phone, this is my new number.” A few messages later: an urgent bill they can’t pay from their banking app.

The trick works because you fill in your own child. The scammer never says a name. You do.

The fix takes ten seconds: call the old number. If it really is them, they’ll pick up, or reply from it. And agree a family password before you need one.

The message on the slide is an example we wrote, based on Which? and police warnings. This script is in scamdb’s catalogue in 45 countries.

${std()}

#scamawareness #hiMum #textscam #fraudprevention`,
    x: `“Hi Mum, I lost my phone, this is my new number.”

The scammer never says a name. You fill in your own child.

The fix takes ten seconds: call the old number.

The same script, 45 countries:
https://scamdb.dev/catalogue/gb/hi-mum-text/`,
  },
  {
    id: 'w50-wed-real-or-scam-code', week: '2026-12-W50', date: 'Wed Dec 9', pillar: 'Real or scam?', entry: 'us/bank-fraud-alert-zelle', seed: 503,
    facts: 'A: the owner’s own genuine code text (store name replaced). B: a written example based on the FTC warnings in us/bank-fraud-alert-zelle (it is also the sample on scamdb.dev’s home page).',
    slides: [
      { type: 'versus', title: 'Both mention a code. Which is the scam?', note: 'A: written by scamdb from FTC warnings. B: a genuine message shared by scamdb’s founder, store name replaced.',
        pair: [
          { sender: '“Your bank’s fraud team”', channel: 'Phone call', text: 'This is your bank’s fraud team. We’ve stopped a suspicious payment of $1,480. To protect your money, read me the 6-digit code we just sent you. Please don’t hang up.' },
          { sender: '[store]', channel: 'SMS', text: '[store]: Your code is [code]. Don’t share it. If you didn’t request it, deny here [link]' },
        ] },
      { type: 'answer', title: 'A. Real codes say “don’t share”. Scammers say “read it to me”.', stamp: 'A · SCAM', items: ['A code is a key to your account. [[Nobody legit needs it read back.]]', '“Don’t hang up” is pressure, not protection.', 'Hang up, and call the number on your card.'] },
      { type: 'versus', size: 'x', title: 'Both mention a code. Which is the scam?', note: 'A: written by scamdb from FTC warnings. B: genuine (founder’s, name replaced).', footRight: 'Answer in the replies',
        pair: [
          { sender: '“Bank fraud team”', text: 'We’ve stopped a suspicious payment. To protect your money, read me the 6-digit code we just sent you.' },
          { sender: '[store]', text: '[store]: Your code is [code]. Don’t share it. If you didn’t request it, deny here [link]' },
        ] },
    ],
    ig: `Real or scam? Both are about a code. Guess, then swipe.

A is an example we wrote, based on FTC warnings about fake bank “fraud teams”. B is a genuine text our founder received (store name removed).

Rule of thumb: a real code message tells you not to share it. A scammer asks you to read it out.

${std()}

#scamalert #bankfraud #scamawareness #onlinesafety`,
    x: `Real or scam? Two messages about a code. One is genuine, one is how a scam call goes.

A or B? Answer in the replies.`,
    xAnswer: `A.

Real code messages say “don’t share it”. Scammers say “read it to me”.

A code is a key to your account. Hang up and call the number on your card.

https://scamdb.dev/catalogue/us/bank-fraud-alert-zelle/`,
  },
  {
    id: 'w50-thu-parcel-world', week: '2026-12-W50', date: 'Thu Dec 10', pillar: 'Around the world', entry: 'au/parcel-delivery-text', seed: 504,
    facts: '117 parcel/delivery-text entries in 70 countries in scamdb’s catalogue (counted 2026-11-23). The lines quote each entry’s name.',
    slides: [
      { type: 'list', eyebrow: '<b>Around the world</b> · one script', title: 'The parcel text, in [[70 countries]]', sub: 'Same story everywhere: your parcel is stuck, pay a small fee or fix your address. Only the logo changes.',
        items: [['US', '“Your package can’t be delivered, update your address”'], ['AU', '“Update your address to get your parcel”'], ['BE', '“Pay customs fees or your parcel won’t be delivered”'], ['AE', '“Your shipment is held, pay Dh3”'], ['AM', '“Your parcel is on hold, pay a small fee”']],
        note: 'From scamdb’s catalogue: 117 entries in 70 countries, each based on postal, police or government warnings.' },
      { type: 'tip', eyebrow: '<b>In any country</b>', title: 'Track it where you [[bought it]]', sub: 'Don’t tap the link in the text. Open the store’s app or the courier’s site yourself, and check there.', icon: 'parcel' },
      { type: 'list', size: 'x', eyebrow: '<b>Around the world</b> · 117 entries, 70 countries', title: 'The parcel text, in [[70 countries]]', itemSize: 38,
        items: [['US', '“Update your address”'], ['BE', '“Pay customs fees”'], ['AE', '“Your shipment is held, pay Dh3”']] },
    ],
    ig: `The most common scam text in the world is probably the parcel text. scamdb has it in 70 countries.

The story never changes: your parcel is stuck, there’s a small fee or a missing detail, tap here to fix it. Only the logo changes: USPS, Australia Post, bpost, Emirates Post…

In any country, the fix is the same: don’t tap the link. Check your order in the store’s app or the courier’s own site.

${std(', from anywhere, in any language')}

#scamawareness #textscam #parcelscam #onlinesafety`,
    x: `The parcel text is in scamdb’s catalogue in 70 countries.

Same story everywhere: your parcel is stuck, pay a small fee or fix your address. Only the logo changes.

Check your order in the store’s app, not the link.
https://scamdb.dev/catalogue/`,
  },
  {
    id: 'w50-fri-genuine-ask', week: '2026-12-W50', date: 'Fri Dec 11', pillar: 'Behind scamdb', entry: null, seed: 505,
    facts: 'How scamdb works (docs/vision.md): accuracy is measured on real messages; genuine messages decide the false-alarm rate. No report data is used.',
    slides: [
      { type: 'tip', eyebrow: '<b>Behind scamdb</b> · a favour', title: 'Send us your [[boring]] messages', sub: 'Delivery updates, bank alerts, appointment reminders. The genuine ones teach the check what “not a scam” looks like.', icon: 'sms' },
      { type: 'list', eyebrow: '<b>Why it matters</b>', title: 'Two ways to get it wrong', itemSize: 36,
        items: [['MISS', 'Calling a scam safe. That’s why we collect scams.'], ['FALSE', 'Calling your real bank a scam. People stop trusting the check. That’s why we need [[genuine]] messages too.']],
        note: 'scamdb.dev/report: paste the message, mark it “genuine”, send. Personal data is removed. Reports stay private.' },
      { type: 'tip', size: 'x', eyebrow: '<b>Behind scamdb</b> · a favour', title: 'Send us your [[boring]] messages', sub: 'Genuine delivery updates and bank alerts teach the check what “not a scam” looks like.', subWidth: 40, icon: 'sms', artStyle: 'right:80px;bottom:150px;width:260px;height:260px' },
    ],
    ig: `A small favour that helps more than you’d think: send us your boring messages.

A scam check can go wrong two ways. It can call a scam safe, which is why we collect scams. Or it can call your real bank a scam, and then nobody trusts it. To avoid the second, it has to see lots of genuine messages: delivery updates, bank alerts, appointment reminders.

How: scamdb.dev/report (link in bio). Paste the message, choose “Genuine (it was really them)”, send. Personal data is removed before storing, and reports stay private.

#scamawareness #opendata #onlinesafety #scamalert`,
    x: `A favour: send us your boring messages.

Genuine delivery updates, bank alerts and reminders teach scamdb’s check what “not a scam” looks like, so it raises fewer false alarms.

Paste it, mark it genuine, send:
https://scamdb.dev/report`,
  },

  // ===================== Week 51 · Dec 14–18 · Love, giving and fees =====================
  {
    id: 'w51-mon-romance', week: '2026-12-W51', date: 'Mon Dec 14', pillar: 'Scam of the week', entry: 'us/romance-scam', seed: 511,
    facts: 'FTC alerts (Feb 14, 2025; Apr 27, 2026), in the catalogue entry. The message is the catalogue’s written example.',
    slides: [
      { type: 'cover', eyebrow: '<b>Scam of the week</b> · US · online', title: 'The online love\nwho needs\nmoney', sub: 'The holidays are lonely for many people. Scammers know it.', icon: 'heart' },
      { type: 'message', eyebrow: '<b>How it reads</b> · 1 of 4', msg: { sender: '“My love”', channel: 'Chat app', text: 'Good morning my love. I can’t stop thinking about you. {{1|As soon as my contract on the oil rig ends}} we will finally be together. Baby, {{2|my account is frozen and I need help with the customs fee}} to send my things home. {{3|I will pay you back as soon as I land.}}' }, notes: ['A reason they can never meet', 'A money problem only you can fix', 'A promise to pay back'] },
      { type: 'steps', eyebrow: '<b>The script</b> · 2 of 4', title: 'How it goes', accStep: 2 },
      { type: 'todo', eyebrow: '<b>What to do</b> · 3 of 4', items: ['Never send money or gifts to someone you haven’t [[met in person]].', 'Never let an online friend steer your investments.', 'Reverse-image search their photos. Talk to someone you trust.', 'It happens to smart, careful people. Report the profile, and call your bank.'] },
      { type: 'cta', eyebrow: 'Send us yours · 4 of 4', url: 'scamdb.dev/catalogue/us/romance-scam' },
      { type: 'messageX', size: 'x', eyebrow: '<b>Scam of the week</b> · US', title: 'Never met? No money.', msg: { sender: '“My love”', text: '{{1|As soon as my contract on the oil rig ends}} we will finally be together. Baby, {{2|my account is frozen and I need help with the customs fee}} to send my things home.' }, notes: ['They can never meet', 'A money problem'] },
    ],
    ig: `They’re kind, they listen, they message every morning. And there’s always a reason they can’t meet: an oil rig, a military posting, a contract abroad. Then a money problem only you can fix.

Romance scams aren’t about being naive. They’re slow, patient and built on real feelings, and the holidays make people lonelier.

One rule covers it: never send money or gifts to someone you haven’t met in person. And if an online friend starts “coaching” you to invest, stop there.

${std()}
Share this with someone who’s dating online.

#romancescam #scamawareness #onlinedating #fraudprevention`,
    x: `They message every morning, they listen, and there’s always a reason they can’t meet. Then a money problem only you can fix.

One rule: never send money to someone you haven’t met in person.

https://scamdb.dev/catalogue/us/romance-scam/`,
  },
  {
    id: 'w51-tue-the-fee', week: '2026-12-W51', date: 'Tue Dec 15', pillar: 'How the trick works', entry: 'us/prize-sweepstakes', seed: 512,
    facts: 'Quotes from the catalogue’s written examples: us/prize-sweepstakes, us/romance-scam, ae/fake-parcel-fee-sms, mx/advance-fee-loan.',
    slides: [
      { type: 'tip', eyebrow: '<b>How the trick works</b> · the fee', title: 'Pay a little to get a lot? That’s the [[whole scam]].', fs: 88, sub: 'A prize, an inheritance, a loan, a stuck parcel, a frozen account: the money is always one small fee away.', icon: 'money_request' },
      { type: 'list', eyebrow: '<b>Same trick, different costume</b>', title: 'The fee wears many outfits', itemSize: 36,
        items: [['PRIZE', '“a one-time processing and tax fee of $499”'], ['LOVE', '“I need help with the customs fee to send my things home”'], ['PARCEL', '“Please pay the Dh3 redelivery fee”'], ['LOAN', '“To release it you only need to pay the $1,500 opening and insurance fee”']],
        note: 'From scamdb’s written examples (US, US, UAE, Mexico), based on FTC, police and postal warnings.' },
      { type: 'tip', size: 'x', eyebrow: '<b>How the trick works</b> · the fee', title: 'Pay a little to get a lot? That’s the [[whole scam]].', fs: 80, sub: 'Prize, inheritance, loan, parcel: the money is always one small fee away.', subWidth: 40, icon: 'money_request', artStyle: 'right:80px;bottom:150px;width:260px;height:260px' },
    ],
    ig: `Here’s a trick hiding inside dozens of scams: pay a little now to get a lot later.

A prize that needs a “processing fee”. A loved one abroad who needs “customs fees”. A parcel that needs a “redelivery fee”. A loan that needs “insurance” first. The bigger payout never comes. Pay once and there’s another fee.

The rule: if you have to pay to receive money, it’s a scam.

${std()}

#scamalert #scamawareness #fraudprevention #advancefee`,
    x: `A trick hiding inside dozens of scams: pay a small fee now to get a lot later.

Prize “processing fee”. Romance “customs fee”. Parcel “redelivery fee”.

If you have to pay to receive money, it’s a scam.`,
  },
  {
    id: 'w51-wed-real-or-scam-subscription', week: '2026-12-W51', date: 'Wed Dec 16', pillar: 'Real or scam?', entry: 'ro/netflix-subscription-phishing', seed: 513,
    facts: 'A: the owner’s own genuine message (store name replaced). B: the English line of the written example in ro/netflix-subscription-phishing (Alba24, Nov 5, 2026), brand replaced.',
    slides: [
      { type: 'versus', title: 'Two subscription messages. Which is the scam?', note: 'A: a genuine message shared by scamdb’s founder, name replaced. B: written by scamdb from a Romanian warning (Alba24), brand replaced.',
        pair: [
          { sender: '[store]', channel: 'SMS', text: 'Your [store] membership fee will be charged to your account on 27 May 2026.' },
          { sender: '“[streaming service]”', channel: 'SMS', text: '[streaming service]: We couldn’t process the payment for your subscription. To avoid your account being suspended, update your payment method within the next 24 hours: [link]' },
        ] },
      { type: 'answer', title: 'B. A real reminder informs. A scam needs you to act now.', stamp: 'B · SCAM', items: ['A tells you something. It asks for [[nothing]].', 'B: a problem, a deadline, a link that wants your card.', 'Check in the app you already use. Never via the link.'] },
      { type: 'versus', size: 'x', title: 'Two subscription messages. Which is the scam?', note: 'A: genuine (founder’s, name replaced). B: written by scamdb from a published warning.', footRight: 'Answer in the replies',
        pair: [
          { sender: '[store]', text: 'Your [store] membership fee will be charged to your account on 27 May 2026.' },
          { sender: '“[streaming service]”', text: 'We couldn’t process your payment. To avoid suspension, update your payment method within 24 hours: [link]' },
        ] },
    ],
    ig: `Real or scam? Two messages about a subscription. Guess, then swipe.

A is a genuine message our founder received (store name removed). B is an example we wrote from a published warning about fake streaming-service texts.

The difference: a real reminder tells you something. A scam needs you to do something, right now, through its link.

${std()}

#scamalert #phishing #scamawareness #onlinesafety`,
    x: `Real or scam? Two messages about a subscription payment. One is genuine, one copies a real scam.

A or B? Answer in the replies.`,
    xAnswer: `B.

A real reminder tells you something and asks for nothing. A scam needs you to act now, through its link.

Check your subscription in the app you already use, never via the link.`,
  },
  {
    id: 'w51-thu-charity-world', week: '2026-12-W51', date: 'Thu Dec 17', pillar: 'Around the world', entry: 'ge/fake-charity-donation', seed: 514,
    facts: 'Fake charity and fundraising entries in 9 countries (counted 2026-11-23): ae, ge, is, ua, ve and others. Lines quote each entry’s name.',
    slides: [
      { type: 'list', eyebrow: '<b>Around the world</b> · giving season', title: 'Fake charities, from [[Iceland to Venezuela]]', sub: 'Good causes are the perfect costume: nobody wants to say no to a sick child.',
        items: [['GE', '“Money for a sick child’s treatment”'], ['IS', '“Support the deaf”'], ['UA', 'A fundraiser “for the army” in a famous name'], ['VE', 'Fake fundraisers after the earthquakes'], ['AE', '“Help this patient”']],
        note: 'From scamdb’s catalogue, each based on police or government warnings in that country.' },
      { type: 'tip', eyebrow: '<b>Give safely</b>', title: 'Give on the charity’s [[own site]]', sub: 'Not through a link, a stranger’s account or a “collector”. Look the charity up yourself, then donate there.', icon: 'heart' },
      { type: 'list', size: 'x', eyebrow: '<b>Around the world</b> · giving season', title: 'Fake charities, from [[Iceland to Venezuela]]', itemSize: 38,
        items: [['GE', '“Money for a sick child’s treatment”'], ['IS', '“Support the deaf”'], ['VE', 'Fake fundraisers after the earthquakes']] },
    ],
    ig: `December is giving season, and scammers dress up as good causes.

scamdb has fake charity scripts from Iceland to Venezuela: a sick child’s treatment, a fundraiser in a celebrity’s name, help after a disaster. Nobody wants to say no, and that’s the point.

Give safely: look the charity up yourself and donate on its own website. Not through a link in a message, a personal account or a “collector” at the door.

${std(', anywhere in the world')}

#givingseason #charityscam #scamawareness #fraudprevention`,
    x: `December is giving season, and scammers dress up as good causes.

scamdb has fake charity scripts from Iceland to Venezuela.

Give on the charity’s own website, never through a link or a stranger’s account.`,
  },
  {
    id: 'w51-fri-what-scammers-ask', week: '2026-12-W51', date: 'Fri Dec 18', pillar: 'Behind scamdb', entry: null, seed: 515,
    facts: 'Counts of warning signs across the 1,199 entries of scamdb’s catalogue (open data, counted 2026-11-23). Catalogue data only, no report data.',
    slides: [
      { type: 'list', eyebrow: '<b>Behind scamdb</b> · open data', title: 'What 1,199 scams have in common', itemSize: 34,
        items: [['1,010', 'pretend to be someone you trust'], ['912', 'ask for money'], ['889', 'rush you'], ['531', 'send a link'], ['377', 'ask for a code'], ['167', 'tell you to [[keep it secret]]']],
        note: 'Warning signs across scamdb’s catalogue (76 countries), counted Nov 23, 2026. Most scams use several.' },
      { type: 'tip', eyebrow: '<b>The short version</b>', title: 'Someone you trust, in a hurry, asking for [[money]].', fs: 88, sub: 'That’s most scams in the world, in one line. Stop at any of the three.', icon: 'urgency' },
      { type: 'list', size: 'x', eyebrow: '<b>Behind scamdb</b> · 1,199 scams, 76 countries', title: 'What scams have in common', itemSize: 34,
        items: [['1,010', 'pretend to be someone you trust'], ['912', 'ask for money'], ['889', 'rush you']] },
    ],
    ig: `We counted the warning signs in all 1,199 scams in scamdb’s catalogue.

1,010 pretend to be someone you trust. 912 ask for money. 889 rush you. 531 send a link. 377 ask for a code. 167 tell you to keep it secret.

So most scams in the world fit in one line: someone you trust, in a hurry, asking for money. Stop at any of the three, and check through a number or app you already know.

The data is open (CC BY 4.0): scamdb.dev/docs

#opendata #scamawareness #fraudprevention #infosec`,
    x: `We counted the warning signs in all 1,199 scams in scamdb’s catalogue:

1,010 impersonate someone
912 ask for money
889 rush you
531 send a link
377 ask for a code

Open data (CC BY 4.0):
https://scamdb.dev/docs`,
  },

  // ===================== Week 52 · Dec 21–26 · Christmas and Boxing Day =====================
  {
    id: 'w52-mon-utility', week: '2026-12-W52', date: 'Mon Dec 21', pillar: 'Scam of the week', entry: 'us/utility-shutoff', seed: 521,
    facts: 'FTC (Aug 13, 2024) and New York State Attorney General (Aug 13, 2025), in the catalogue entry. The message is the catalogue’s written example.',
    slides: [
      { type: 'cover', eyebrow: '<b>Scam of the week</b> · US · call, text', title: '“Pay now or\nyour power\ngoes off”', sub: 'The coldest week of the year is the perfect time to threaten your heating.', icon: 'house' },
      { type: 'message', eyebrow: '<b>How it reads</b> · 1 of 4', msg: { sender: '“Electric Co.”', channel: 'SMS', text: '{{1|FINAL NOTICE: Your electric account is past due.}} {{2|Service will be disconnected within 2 hours.}} A technician has been dispatched. To avoid disconnection, {{3|pay now: [link]}}' }, notes: ['Looks like your utility', 'Cut off in two hours', 'Pay through their link'] },
      { type: 'steps', eyebrow: '<b>The script</b> · 2 of 4', title: 'How it goes', accStep: 1 },
      { type: 'todo', eyebrow: '<b>What to do</b> · 3 of 4', items: ['Hang up. Call the number on your bill or the official website.', 'Utilities never take [[gift cards, crypto or a texted barcode]].', 'Don’t let anyone pressure their way into your home.', 'Paid already? Tell your payment company it was fraud, now.'] },
      { type: 'cta', eyebrow: 'Send us yours · 4 of 4', url: 'scamdb.dev/catalogue/us/utility-shutoff' },
      { type: 'messageX', size: 'x', eyebrow: '<b>Scam of the week</b> · US', title: 'Call the number on your bill', msg: { sender: '“Electric Co.”', text: '{{1|FINAL NOTICE: Your electric account is past due.}} {{2|Service will be disconnected within 2 hours.}} To avoid disconnection, {{3|pay now: [link]}}' }, notes: ['Looks like your utility', 'Two hours', 'Their link'] },
    ],
    ig: `“FINAL NOTICE: your power will be disconnected in 2 hours.” In the coldest week of the year, that’s a frightening message, which is exactly why scammers send it now.

Real utilities usually warn you in writing before any cut-off, and they don’t take gift cards, crypto or a barcode in a text.

If you get one: hang up or ignore the text, and call the number printed on your bill.

${std()}
Share this with a neighbour who lives alone.

#scamalert #utilityscam #scamawareness #fraudprevention`,
    x: `“FINAL NOTICE: your power will be disconnected in 2 hours. Pay now.”

Real utilities warn you in writing first, and don’t take gift cards, crypto or a texted barcode.

Call the number on your bill.
https://scamdb.dev/catalogue/us/utility-shutoff/`,
  },
  {
    id: 'w52-tue-secrecy', week: '2026-12-W52', date: 'Tue Dec 22', pillar: 'How the trick works', entry: 'us/family-emergency-call', seed: 522,
    facts: '167 of 1,199 entries use the “secrecy” sign (counted 2026-11-23). Quotes: us/family-emergency-call, us/fake-police-government, ar/cuento-del-tio, ar/voz-clonada (written examples).',
    slides: [
      { type: 'tip', eyebrow: '<b>How the trick works</b> · the secret', title: '“Don’t tell [[anyone]].”', sub: 'Your bank, your grandchild, the police: none of them needs you to keep it secret. Scammers do, because one phone call would end it.', icon: 'secrecy' },
      { type: 'list', eyebrow: '<b>Where you’ll hear it</b>', title: '167 scams use this line', itemSize: 36,
        items: [['US', '“Please don’t tell Mom and Dad.”'], ['US', '“Do not discuss this with anyone.”'], ['AR', '“I’m in trouble, don’t tell anyone.”'], ['AR', '“Don’t tell mum, please.”']],
        note: 'From scamdb’s written examples (English versions), based on FBI, FTC and police warnings. 167 of 1,199 entries.' },
      { type: 'tip', size: 'x', eyebrow: '<b>How the trick works</b> · the secret', title: '“Don’t tell [[anyone]].”', sub: 'Nobody legit needs you to keep it secret. Scammers do: one call would end it.', subWidth: 40, icon: 'secrecy', artStyle: 'right:80px;bottom:150px;width:260px;height:260px' },
    ],
    ig: `Three words show up in 167 of the scams in scamdb’s catalogue: “Don’t tell anyone.”

A grandchild in trouble who begs you not to tell their parents. A “police officer” who orders you not to discuss the case. A caller who says “don’t tell anyone” before passing you to their “colleague”.

Nobody legitimate needs your secrecy. Scammers do, because one phone call to someone you trust would end it. So that’s exactly what to do: tell someone.

This week, with family around: that’s the call to make.

${std()}

#scamawareness #elderfraud #fraudprevention #scamalert`,
    x: `Three words show up in 167 of the scams in scamdb’s catalogue: “Don’t tell anyone.”

Nobody legit needs you to keep a secret. Scammers do, because one call to someone you trust ends it.

So tell someone.`,
  },
  {
    id: 'w52-wed-real-or-scam-verification', week: '2026-12-W52', date: 'Wed Dec 23', pillar: 'Real or scam?', entry: 'az/whatsapp-code-takeover', seed: 523,
    facts: 'A: the owner’s own genuine verification text (app name replaced). B: the written example of az/whatsapp-code-takeover (based on Trend reports, Oct 2026).',
    slides: [
      { type: 'versus', title: 'You just got a code. Which message is the scam?', note: 'A: written by scamdb from news reports (Azerbaijan, Oct 2026). B: a genuine message shared by scamdb’s founder, app name replaced.',
        pair: [
          { sender: 'A contact', channel: 'WhatsApp', text: 'Hi dear, sorry to bother you, I was adding a new number to my phone and a 6-digit code went to your number by mistake. Please write me that code, it’s urgent, otherwise my account gets blocked.' },
          { sender: '[app]', channel: 'SMS', text: '[code] is your [app] verification code. Don’t share your code with anyone.' },
        ] },
      { type: 'answer', title: 'A. The code was for [[your]] account.', stamp: 'A · SCAM', items: ['Someone tried to log in to your account with your number.', 'Send them the code and the account is theirs.', 'Never forward a code. Delete it, and turn on two-step verification.'] },
      { type: 'versus', size: 'x', title: 'You just got a code. Which message is the scam?', note: 'A: written by scamdb from published warnings. B: genuine (founder’s, name replaced).', footRight: 'Answer in the replies',
        pair: [
          { sender: 'A contact', text: 'Sorry to bother you, a 6-digit code went to your number by mistake. Please write me that code, it’s urgent.' },
          { sender: '[app]', text: '[code] is your [app] verification code. Don’t share your code with anyone.' },
        ] },
    ],
    ig: `Real or scam? You just got a verification code, and then a second message. Guess, then swipe.

A is an example we wrote, based on warnings about account takeovers on WhatsApp and other apps. B is a genuine text our founder received (app name removed).

The trap: the code was for your account. Someone typed in your number and is waiting for you to hand it over.

${std()}

#scamalert #whatsappscam #scamawareness #onlinesafety`,
    x: `Real or scam? You get a verification code, then: “Sorry, a code went to your number by mistake, please write it to me.”

A or B? Answer in the replies.`,
    xAnswer: `A.

The code was for YOUR account. Someone typed in your number and wants you to hand it over.

Never forward a code. Delete it, and turn on two-step verification.`,
  },
  {
    id: 'w52-thu-christmas-eve', week: '2026-12-W52', date: 'Thu Dec 24', pillar: 'How the trick works', entry: 'us/family-emergency-call', seed: 524,
    facts: 'FBI IC3 PSA241203 (Dec 3, 2024): “Create a secret word or phrase with your family to verify their identity.”',
    slides: [
      { type: 'tip', eyebrow: '<b>Christmas Eve</b> · one thing to do tonight', title: 'Pick a [[family code word]]', sub: 'If someone calls in a panic sounding like family, ask for the word. A real relative knows it. A scammer, or an AI copy of a voice, doesn’t.', icon: 'family', artStyle: 'right:60px;bottom:150px;width:300px;height:300px' },
      { type: 'tip', size: 'x', eyebrow: '<b>Christmas Eve</b> · one thing to do tonight', title: 'Pick a [[family code word]]', sub: 'A panicked call that sounds like family? Ask for the word.', subWidth: 38, icon: 'family', artStyle: 'right:80px;bottom:150px;width:260px;height:260px' },
    ],
    ig: `One thing to do tonight, while everyone’s in the same room: pick a family code word.

If someone calls in a panic sounding like your grandchild, your son or your sister, ask for the word. A real relative knows it. A scammer, even with an AI copy of their voice, doesn’t. The FBI recommends exactly this.

Pick something you’d all remember and nobody would guess. Don’t post it anywhere.

Merry Christmas from scamdb.

#scamawareness #elderfraud #christmas #fraudprevention`,
    x: `One thing to do tonight, with everyone in the room: pick a family code word.

A panicked call that sounds like family? Ask for the word. A scammer, or an AI copy of a voice, won’t know it.

Merry Christmas from scamdb.`,
  },
  {
    id: 'w52-fri-christmas', week: '2026-12-W52', date: 'Fri Dec 25', pillar: 'Short note', entry: null, seed: 525, textOnly: true,
    facts: 'Text only. No image needed.',
    slides: [],
    ig: null,
    x: `Merry Christmas.

If a “family member” texts today from a new number asking for money, call their old number first. They’ll understand.

Back tomorrow.`,
  },
  {
    id: 'w52-sat-boxing-day', week: '2026-12-W52', date: 'Sat Dec 26', pillar: 'Around the world', entry: 'ca/fake-online-store', seed: 526,
    facts: 'Aimed at the UK, Canada, Australia and New Zealand. Canadian Anti-Fraud Centre (Oct 20, 2025) for ca/fake-online-store; Scamwatch (ACCC) for au/parcel-delivery-text; fake shops are in the catalogue in 28 countries.',
    slides: [
      { type: 'tip', eyebrow: '<b>Boxing Day</b> · UK · Canada · Australia · NZ', title: '80% off? [[Check the shop first.]]', fs: 96, sub: 'Fake shops copy real brands, take your card and send nothing, or a fake. Then comes the “your parcel is stuck” text.', icon: 'cart' },
      { type: 'todo', eyebrow: '<b>Before you pay</b>', title: 'Three Boxing Day checks', items: ['Type the shop’s address yourself. Don’t buy through an ad or a text.', 'Search the shop’s name plus “reviews” or “scam”.', 'Pay by credit card. If nothing arrives, call your card provider: [[it’s not your fault]].'] },
      { type: 'tip', size: 'x', eyebrow: '<b>Boxing Day</b> · UK · CA · AU · NZ', title: '80% off? [[Check the shop first.]]', fs: 84, sub: 'Type the address yourself, look for reviews, pay by credit card.', subWidth: 40, icon: 'cart', artStyle: 'right:80px;bottom:150px;width:260px;height:260px' },
    ],
    ig: `Happy Boxing Day to the UK, Canada, Australia and New Zealand.

Today’s sales bring out the fake shops: real brands, 80% off, a countdown timer, and nothing ever arrives (or a cheap copy does). A few days later comes the “your parcel is stuck, pay a small fee” text.

Three checks before you pay: type the shop’s address yourself, search its name plus “reviews”, and pay by credit card.

${std(', wherever you are')}

#boxingday #boxingdaysales #scamalert #onlineshopping`,
    x: `Happy Boxing Day, UK, Canada, Australia and NZ.

80% off a famous brand? Check the shop first: type the address yourself, search for reviews, pay by credit card.

Fake shops are in scamdb in 28 countries.
https://scamdb.dev/catalogue/ca/fake-online-store/`,
  },

  // ===================== Week 53 · Dec 28–31 · Year end =====================
  {
    id: 'w53-mon-tax-refund', week: '2026-12-W53', date: 'Mon Dec 28', pillar: 'Scam of the week', entry: 'us/fake-irs-ssa-message', seed: 531,
    facts: 'IRS (Mar 5, 2026), Taxpayer Advocate Service (May 11, 2026), SSA OIG (Feb 19, 2026), in the catalogue entry. The message is the catalogue’s written example.',
    slides: [
      { type: 'cover', eyebrow: '<b>Scam of the week</b> · US · text, email', title: '“You’re owed\na refund”', sub: 'Tax season starts soon, and fake refunds start before it.', icon: 'official' },
      { type: 'message', eyebrow: '<b>How it reads</b> · 1 of 4', msg: { sender: '“IRS Notice”', channel: 'SMS · email', text: '{{1|IRS Notice: You are eligible for a tax refund of $1,284.50.}} Your direct deposit information is missing. {{2|Verify your bank account within 48 hours}} to receive your refund: {{3|[link]}}' }, notes: ['Money you weren’t expecting', 'A deadline', 'A link that wants your bank details'] },
      { type: 'steps', eyebrow: '<b>The script</b> · 2 of 4', title: 'How it goes', accStep: 2 },
      { type: 'todo', eyebrow: '<b>What to do</b> · 3 of 4', items: ['Don’t click, scan or open. Delete it.', 'Check refunds yourself: [[type the IRS address]] and sign in.', 'The IRS doesn’t text or email you asking for bank details.', 'Entered bank details? Call your bank straight away.'] },
      { type: 'cta', eyebrow: 'Send us yours · 4 of 4', url: 'scamdb.dev/catalogue/us/fake-irs-ssa-message' },
      { type: 'messageX', size: 'x', eyebrow: '<b>Scam of the week</b> · US', title: 'Type the address yourself', msg: { sender: '“IRS Notice”', text: '{{1|You are eligible for a tax refund of $1,284.50.}} Your direct deposit information is missing. {{2|Verify your bank account within 48 hours}}: {{3|[link]}}' }, notes: ['Unexpected money', 'A deadline', 'A link'] },
    ],
    ig: `“You’re eligible for a tax refund of $1,284.50. Verify your bank account within 48 hours.”

Good news with a deadline and a link is a classic. The page behind it asks for your Social Security number and bank details, and that’s what they wanted all along.

Check refunds yourself: type the IRS address into your browser and sign in to your account. Same for Social Security statements.

${std()}

#scamalert #taxscam #irs #scamawareness`,
    x: `“You’re owed a $1,284.50 tax refund. Verify your bank account within 48 hours: [link]”

Good news + a deadline + a link = a scam.

Check refunds by typing the IRS address yourself.
https://scamdb.dev/catalogue/us/fake-irs-ssa-message/`,
  },
  {
    id: 'w53-tue-year-in-scamdb', week: '2026-12-W53', date: 'Tue Dec 29', pillar: 'Behind scamdb', entry: null, seed: 532,
    facts: 'Catalogue facts as of 2026-11-23 (1,199 scams, 76 countries). Update the numbers on the day from `npm run build`. No report data.',
    slides: [
      { type: 'list', eyebrow: '<b>Behind scamdb</b> · 2026', title: 'scamdb’s first year, in numbers', itemSize: 38,
        items: [['1,199', 'documented scams'], ['76', 'countries'], ['1', 'free check that runs in your browser'], ['0', 'messages sent anywhere when you check'], ['CC BY', 'open data, free for anyone to use']],
        note: 'Catalogue numbers as of late November 2026. Every scam rests on a dated, public source.' },
      { type: 'tip', eyebrow: '<b>For 2027</b>', title: 'Help us catch the [[next]] ones', sub: 'scamdb only knows scams someone has documented. Every message you send makes the check better, the scams and the genuine ones.', icon: 'sms' },
      { type: 'list', size: 'x', eyebrow: '<b>Behind scamdb</b> · 2026', title: 'The first year, in numbers', itemSize: 38,
        items: [['1,199', 'documented scams'], ['76', 'countries'], ['0', 'messages sent when you check']] },
    ],
    ig: `scamdb’s first year, in numbers: 1,199 documented scams from 76 countries, one free check that runs in your browser, zero messages sent anywhere when you use it, and all of it open data.

What it can’t do yet: know the scams nobody has documented. That’s where you come in. Every message you send, scam or genuine, makes it better for everyone.

Thank you for following along this month.

scamdb.dev/report (link in bio)

#opendata #scamawareness #yearinreview #onlinesafety`,
    x: `scamdb’s first year:

1,199 documented scams
76 countries
1 free check, in your browser
0 messages sent when you check
Open data (CC BY 4.0)

Help us catch the next ones:
https://scamdb.dev/report`,
  },
  {
    id: 'w53-thu-new-year', week: '2026-12-W53', date: 'Thu Dec 31', pillar: 'How the trick works', entry: 'us/bank-fraud-alert-zelle', seed: 533,
    facts: 'The three rules come from the catalogue’s “what to do” across entries (FTC, FBI warnings).',
    slides: [
      { type: 'list', eyebrow: '<b>New Year</b> · three rules for 2027', title: 'Three rules that stop [[most scams]]', itemSize: 40,
        items: [['1', 'Never move money to “protect” it.'], ['2', 'Never read out or forward a code.'], ['3', 'Hang up, and call the number you already know.']],
        note: 'From the “what to do” of scamdb’s 1,199 entries.' },
      { type: 'list', size: 'x', eyebrow: '<b>New Year</b> · three rules for 2027', title: 'Three rules that stop [[most scams]]', itemSize: 38,
        items: [['1', 'Never move money to “protect” it.'], ['2', 'Never read out or forward a code.'], ['3', 'Hang up. Call the number you know.']] },
    ],
    ig: `Three rules for 2027 that stop most scams:

1. Never move money to “protect” it. No real bank asks.
2. Never read out or forward a code. It’s a key to your account.
3. Hang up, and call the number you already know.

Save this, and send it to someone who’d want it.

Happy New Year from scamdb.

#newyear #scamawareness #fraudprevention #onlinesafety`,
    x: `Three rules for 2027 that stop most scams:

1. Never move money to “protect” it.
2. Never read out or forward a code.
3. Hang up, and call the number you already know.

Happy New Year from scamdb.`,
  },
];
