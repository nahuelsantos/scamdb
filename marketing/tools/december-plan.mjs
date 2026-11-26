// The December campaign, day by day, in the owner's time (Europe/Madrid, UTC+1 all of December).
// Read by gen-guides.mjs, which writes the weekly guides, the Dispatch drafts and the zips.
//
// Item: [time, kind, ref, extra]
//   ig-post   feed post (one image) or carousel (several): ref = post folder
//   ig-reel   Reel: ref = post folder of the video, extra = video folder (videoN)
//   x-img     X post with the post's X image: ref = post folder
//   x-vid     X post with the video: ref = post folder of the video, extra = videoN
//   x-text    X text post: ref = post folder
//   x-answer  the quiz answer, as its own X post: ref = quiz post folder
//   story     image Story, posted as is: ref = story id (marketing/stories/…)
//   story-manual  Story that needs a sticker added by hand: ref = story id, extra = sticker instructions
export const POLL = 'Add a **Poll** sticker over the empty space under B: question “Which is the scam?”, answers “A” / “B”.';
export const LINK = 'Add a **Link** sticker over the empty space: URL `https://scamdb.dev/report`, text “Send it to scamdb”.';

export const WEEKS = [
  { n: 49, week: '2026-12-W49', title: 'Mon Nov 30 – Fri Dec 4 · After the shopping weekend', days: [
    ['2026-11-30', 'Mon Nov 30', [['15:00', 'story', 's49-mon-theme'], ['18:00', 'ig-post', 'w49-mon-bank-zelle'], ['18:00', 'x-img', 'w49-mon-bank-zelle']]],
    ['2026-12-01', 'Tue Dec 1 · Giving Tuesday', [['15:00', 'story', 's49-tue-giving'], ['18:00', 'ig-post', 'w49-tue-gift-cards'], ['18:00', 'x-vid', 'w49-tue-video8', 'video8'], ['23:30', 'ig-reel', 'w49-tue-video8', 'video8']]],
    ['2026-12-02', 'Wed Dec 2', [['15:00', 'story-manual', 's49-wed-quiz', POLL], ['18:00', 'ig-post', 'w49-wed-real-or-scam-bank'], ['18:00', 'x-img', 'w49-wed-real-or-scam-bank'], ['23:30', 'x-answer', 'w49-wed-real-or-scam-bank']]],
    ['2026-12-03', 'Thu Dec 3', [['15:00', 'story', 's49-thu-answer'], ['18:00', 'ig-post', 'w49-thu-safe-account'], ['18:00', 'x-vid', 'w49-thu-video9', 'video9'], ['23:30', 'ig-reel', 'w49-thu-video9', 'video9']]],
    ['2026-12-04', 'Fri Dec 4', [['15:00', 'story-manual', 'send-one', LINK], ['18:00', 'ig-post', 'w49-fri-how-the-check-works'], ['18:00', 'x-img', 'w49-fri-how-the-check-works']]],
  ], extra: '**Sunday Dec 6:** review the first two weeks together (`playbook.md` §7). Bring your notes: link taps, shares, saves, Reel watch time, Story poll votes.' },
  { n: 50, week: '2026-12-W50', title: 'Mon Dec 7 – Fri Dec 11 · Deliveries and gifts', days: [
    ['2026-12-07', 'Mon Dec 7', [['15:00', 'story', 's50-mon-theme'], ['18:00', 'ig-post', 'w50-mon-prize'], ['18:00', 'x-img', 'w50-mon-prize']]],
    ['2026-12-08', 'Tue Dec 8', [['18:00', 'ig-post', 'w50-tue-new-number'], ['18:00', 'x-vid', 'w50-tue-video5', 'video5'], ['23:30', 'ig-reel', 'w50-tue-video5', 'video5']]],
    ['2026-12-09', 'Wed Dec 9', [['15:00', 'story-manual', 's50-wed-quiz', POLL], ['18:00', 'ig-post', 'w50-wed-real-or-scam-code'], ['18:00', 'x-img', 'w50-wed-real-or-scam-code'], ['23:30', 'x-answer', 'w50-wed-real-or-scam-code']]],
    ['2026-12-10', 'Thu Dec 10', [['15:00', 'story', 's50-thu-answer'], ['18:00', 'ig-post', 'w50-thu-parcel-world'], ['18:00', 'x-vid', 'w50-thu-video10', 'video10'], ['23:30', 'ig-reel', 'w50-thu-video10', 'video10']]],
    ['2026-12-11', 'Fri Dec 11', [['15:00', 'story-manual', 'send-one', LINK], ['18:00', 'ig-post', 'w50-fri-genuine-ask'], ['18:00', 'x-img', 'w50-fri-genuine-ask']]],
  ] },
  { n: 51, week: '2026-12-W51', title: 'Mon Dec 14 – Fri Dec 18 · Love, giving and fees', days: [
    ['2026-12-14', 'Mon Dec 14', [['15:00', 'story', 's51-mon-theme'], ['18:00', 'ig-post', 'w51-mon-romance'], ['18:00', 'x-vid', 'w51-mon-video11', 'video11'], ['23:30', 'ig-reel', 'w51-mon-video11', 'video11']]],
    ['2026-12-15', 'Tue Dec 15', [['18:00', 'ig-post', 'w51-tue-the-fee'], ['18:00', 'x-img', 'w51-tue-the-fee']]],
    ['2026-12-16', 'Wed Dec 16', [['15:00', 'story-manual', 's51-wed-quiz', POLL], ['18:00', 'ig-post', 'w51-wed-real-or-scam-subscription'], ['18:00', 'x-vid', 'w51-wed-video6', 'video6'], ['23:30', 'ig-reel', 'w51-wed-video6', 'video6']]],
    ['2026-12-17', 'Thu Dec 17', [['15:00', 'story', 's51-thu-answer'], ['18:00', 'ig-post', 'w51-thu-charity-world'], ['18:00', 'x-img', 'w51-thu-charity-world']]],
    ['2026-12-18', 'Fri Dec 18', [['15:00', 'story-manual', 'send-one', LINK], ['18:00', 'ig-post', 'w51-fri-what-scammers-ask'], ['18:00', 'x-img', 'w51-fri-what-scammers-ask']]],
  ] },
  { n: 52, week: '2026-12-W52', title: 'Mon Dec 21 – Sat Dec 26 · Christmas and Boxing Day', days: [
    ['2026-12-21', 'Mon Dec 21', [['15:00', 'story', 's52-mon-theme'], ['18:00', 'ig-post', 'w52-mon-utility'], ['18:00', 'x-vid', 'w52-mon-video7', 'video7'], ['23:30', 'ig-reel', 'w52-mon-video7', 'video7']]],
    ['2026-12-22', 'Tue Dec 22', [['18:00', 'ig-post', 'w52-tue-secrecy'], ['18:00', 'x-img', 'w52-tue-secrecy']]],
    ['2026-12-23', 'Wed Dec 23', [['15:00', 'story-manual', 's52-wed-quiz', POLL], ['18:00', 'ig-post', 'w52-wed-real-or-scam-verification'], ['18:00', 'x-img', 'w52-wed-real-or-scam-verification'], ['23:30', 'x-answer', 'w52-wed-real-or-scam-verification']]],
    ['2026-12-24', 'Thu Dec 24 · Christmas Eve', [['12:00', 'story', 's52-thu-answer'], ['15:00', 'ig-post', 'w52-thu-christmas-eve'], ['15:00', 'x-vid', 'w52-thu-video12', 'video12'], ['23:30', 'ig-reel', 'w52-thu-video12', 'video12']]],
    ['2026-12-25', 'Fri Dec 25 · Christmas', [['16:00', 'story', 's52-fri-christmas'], ['16:00', 'x-text', 'w52-fri-christmas']]],
    ['2026-12-26', 'Sat Dec 26 · Boxing Day (UK, Canada, Australia, NZ)', [['10:00', 'story', 's52-sat-boxing-day'], ['10:00', 'ig-reel', 'w52-sat-video13', 'video13'], ['10:00', 'x-vid', 'w52-sat-video13', 'video13'], ['14:00', 'ig-post', 'w52-sat-boxing-day']]],
  ] },
  { n: 53, week: '2026-12-W53', title: 'Mon Dec 28 – Fri Jan 1 · Year end and New Year', days: [
    ['2026-12-28', 'Mon Dec 28', [['15:00', 'story', 's53-mon-theme'], ['18:00', 'ig-post', 'w53-mon-tax-refund'], ['18:00', 'x-vid', 'w53-mon-video14', 'video14'], ['23:30', 'ig-reel', 'w53-mon-video14', 'video14']]],
    ['2026-12-29', 'Tue Dec 29', [['18:00', 'ig-post', 'w53-tue-year-in-scamdb'], ['18:00', 'x-img', 'w53-tue-year-in-scamdb']]],
    ['2026-12-31', 'Thu Dec 31 · New Year’s Eve', [['15:00', 'story', 's53-thu-new-year'], ['16:00', 'ig-reel', 'w53-thu-video15', 'video15'], ['16:00', 'x-vid', 'w53-thu-video15', 'video15'], ['18:00', 'ig-post', 'w53-thu-new-year']]],
    ['2027-01-01', 'Fri Jan 1 · New Year’s Day', [['18:00', 'story', 's53-fri-2027']]],
  ] },
];

// Which Highlight each Story goes into (added by hand: Highlight → Edit → Add from your archive).
export const HIGHLIGHTS = {
  'How it works': { cover: 'highlight-how-it-works.png', what: 'Video 1 (done), Video 15 “Three rules for 2027” and the New Year’s Eve rules Story.' },
  Scams: { cover: 'highlight-scams.png', what: 'Every teardown Reel shared to Story (Videos 2, 4, 5, 7, 8, 9, 10, 11, 13, 14), the Monday “This week” Stories, Giving Tuesday, Christmas Eve (Video 12), Christmas, Boxing Day and Happy 2027.' },
  'Real or scam?': { cover: 'highlight-real-or-scam.png', what: 'Video 3, Video 6, and each Wednesday quiz Story with its Thursday answer, side by side.' },
  'Send one': { cover: 'highlight-send-one.png', what: 'The “Got a strange message?” Story with its link sticker. Add it once (Dec 4); it stays there for good.' },
};
