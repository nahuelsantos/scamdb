// Instagram Story frames for December (1080×1920, with Instagram's top and bottom areas left clear).
// Usage: npm run build && node marketing/tools/render.mjs --stories   (render.mjs reads this list when --stories is given)
// Writes marketing/stories/<week>/<id>/01-s.png. Quiz and answer frames reuse that day's feed post, so they always match.
import { POSTS } from './posts.mjs';

const S = 's';
const ART = 'right:70px;bottom:470px;width:380px;height:380px';
const slide = (postId, type) => ({ ...POSTS.find((p) => p.id === postId).slides.find((s) => s.type === type && !s.size), size: S });
const quiz = (postId) => { const v = slide(postId, 'versus'); return { ...v, note: v.note.replace(/on the last slide|in the post/g, 'in tomorrow’s answer'), footRight: 'Vote, answer tomorrow' }; };
const answer = (postId) => ({ ...slide(postId, 'answer'), eyebrow: 'Yesterday’s answer' });
const theme = (dates, title, sub, icon) => ({ type: 'tip', size: S, eyebrow: `<b>This week on scamdb</b> · ${dates}`, title, sub, icon, fs: 104, artStyle: ART });
const story = (week, id, s, seed) => ({ id, out: `marketing/stories/${week}/${id}`, seed, slides: [s] });

export const STORIES = [
  // Reused every Friday (and pinned in the "Send one" Highlight). Add a link sticker to scamdb.dev/report by hand.
  story('all', 'send-one', { type: 'cta', size: S, eyebrow: 'Send us yours', title: 'Got a strange message?\nSend it to [[scamdb.dev/report]]', sub: 'Scam or genuine, both help the check tell them apart. It takes a minute, and reports stay private.' }, 900),

  story('2026-12-W49', 's49-mon-theme', theme('Nov 30 – Dec 4', 'After the shopping weekend: [[the fake fraud alert]]', 'Big card spending, then a text from “your bank”. This week: how it reads, and the one rule that beats it.', 'bank'), 901),
  story('2026-12-W49', 's49-tue-giving', { type: 'tip', size: S, eyebrow: '<b>Giving Tuesday</b>', title: 'Giving today? Give on the [[charity’s own site]].', sub: 'Not through a text, a DM or a link someone sends you. Type the address yourself.', icon: 'heart', fs: 104, artStyle: ART }, 902),
  story('2026-12-W49', 's49-wed-quiz', quiz('w49-wed-real-or-scam-bank'), 903),
  story('2026-12-W49', 's49-thu-answer', answer('w49-wed-real-or-scam-bank'), 904),

  story('2026-12-W50', 's50-mon-theme', theme('Dec 7 – 11', 'Deliveries and gifts: [[“You won!”]]', 'Fake prizes, “Hi Mum, new number”, and the parcel text in 70 countries.', 'parcel'), 911),
  story('2026-12-W50', 's50-wed-quiz', quiz('w50-wed-real-or-scam-code'), 913),
  story('2026-12-W50', 's50-thu-answer', answer('w50-wed-real-or-scam-code'), 914),

  story('2026-12-W51', 's51-mon-theme', theme('Dec 14 – 18', 'Love, giving and [[fees]]', 'Lonely holidays, charity appeals, and “pay a little to get a lot”.', 'heart'), 921),
  story('2026-12-W51', 's51-wed-quiz', quiz('w51-wed-real-or-scam-subscription'), 923),
  story('2026-12-W51', 's51-thu-answer', answer('w51-wed-real-or-scam-subscription'), 924),

  story('2026-12-W52', 's52-mon-theme', theme('Dec 21 – 26', 'Christmas week: [[pick a family code word]]', 'Threats in the cold, secrets, codes, and Boxing Day sales.', 'family'), 931),
  story('2026-12-W52', 's52-wed-quiz', quiz('w52-wed-real-or-scam-verification'), 933),
  story('2026-12-W52', 's52-thu-answer', answer('w52-wed-real-or-scam-verification'), 934),
  story('2026-12-W52', 's52-fri-christmas', { type: 'tip', size: S, eyebrow: '<b>Merry Christmas</b>', title: 'No scam advice today.\nJust [[call someone you love]].', sub: 'Back tomorrow.', icon: 'family', fs: 104, artStyle: ART }, 935),
  story('2026-12-W52', 's52-sat-boxing-day', { type: 'tip', size: S, eyebrow: '<b>Boxing Day</b> · UK · Canada · Australia · NZ', title: '80% off? [[Check the shop first.]]', sub: 'Type the address yourself. Look for reviews. Pay by credit card.', icon: 'cart', fs: 104, artStyle: ART }, 936),

  story('2026-12-W53', 's53-mon-theme', theme('Dec 28 – 31', 'Year end: [[“You’re owed a refund”]]', 'Fake tax refunds start before tax season. Plus scamdb’s first year, in numbers.', 'official'), 941),
  story('2026-12-W53', 's53-thu-new-year', { ...POSTS.find((p) => p.id === 'w53-thu-new-year').slides[0], size: S, itemSize: 54 }, 942),
  story('2026-12-W53', 's53-fri-2027', { type: 'tip', size: S, eyebrow: '<b>Happy 2027</b>', title: 'New year, [[same scams]].', sub: 'Got a message that feels off? Check it on scamdb.dev before you tap.', icon: 'sms', fs: 104, artStyle: ART }, 943),
];
