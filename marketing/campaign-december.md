# December campaign: "Check before you pay" (Nov 30 – Jan 1)

The whole month for Instagram (@scamdb.dev) and X (@scamdb): feed posts, Reels, Stories, Highlights and X posts, each
with its copy, alt text, files and time. Day-by-day steps are in `publish-week-49.md` … `publish-week-53.md`; the same
weeks are ready as Dispatch drafts in `marketing/dispatch/`.

**Review first:** on **Sun Dec 6** we look at the first two weeks' numbers (`playbook.md` §7). Posts from Dec 7 on may
change after that review: the formats that bring reports get more room.

## The idea

December is when people buy, ship, give and gather, and scammers follow each of those moments. Each week takes one of
them, and everything ends with the same ask: **"Got one, scam or genuine? Send it to scamdb.dev/report."**

| Week | Theme | Key dates |
|---|---|---|
| Nov 30 – Dec 4 (W49) | **After the shopping weekend** | Cyber Monday (Nov 30), Giving Tuesday (Dec 1) |
| Dec 7 – 11 (W50) | **Deliveries and gifts** | Peak parcel season |
| Dec 14 – 18 (W51) | **Love, giving and fees** | Lonely holidays, charity appeals |
| Dec 21 – 26 (W52) | **Christmas and Boxing Day** | Christmas Eve, Christmas, Boxing Day (UK, Canada, Australia, NZ) |
| Dec 28 – Jan 1 (W53) | **Year end and New Year** | Tax season ahead, New Year's Eve, New Year's Day |

## What goes out

| | Per week | December total |
|---|---|---|
| Instagram feed posts (carousels and images) | 5 (Mon–Fri) | 23 |
| Instagram Reels | 2 (3 in Christmas week) | 11 (Videos 5–15) |
| Instagram Stories | 3–4 | 21: Monday "This week", Wednesday quiz (poll), Thursday answer, Friday "Send one", plus key dates |
| X posts | 1 a day, plus the quiz answers | 27 |
| Highlights | 4: How it works, Scams, Real or scam?, Send one | covers in `brand/highlights/` |

**Rhythm:** Stories 15:00 · feed post and X 18:00 · Reel 23:30 (your time; 09:00 / 12:00 / 17:30 ET). Key dates move
earlier: Christmas Eve post 15:00, Christmas 16:00, Boxing Day from 10:00 (morning in the UK, evening in Australia and
NZ), New Year's Eve Reel 16:00. On X, video days carry the video instead of the image.

**Hashtags:** 3–4 per Instagram post, already in each caption (two core + one seasonal: #givingtuesday #holidayshopping
#christmas #boxingday #newyear …). On X, at most one, only on the day itself.

**Calls to action:** 1. "Send it to scamdb.dev/report" (scam *or genuine*) · 2. "Share this with someone who…" ·
3. on Fridays, the open data and API for developers. On X the link stays in the bio ("link in bio"): X charges Dispatch
more for posts with links and shows them to fewer people.

## Dispatch

Dispatch publishes approved drafts on time. For each week:

1. `node marketing/tools/send-dispatch.mjs 2026-W49` uploads the files (PNG turned into JPEG, as Instagram asks) and
   sends the week as **drafts**. `--dry` lists them without sending. It needs the Dispatch API token (`DISPATCH_TOKEN`,
   or saved for dispatch.loopingbyte.com in a cloud session).
2. You review and approve in Dispatch. Nothing goes out unapproved.
3. The ✋ steps in each weekly guide stay with you, because Instagram doesn't let apps do them: alt text on feed posts,
   Reel covers, sharing Reels to Story, Story stickers (poll on Wednesdays, link on Fridays), and Highlights.

X posts are written to stand alone (no replies needed): the quiz answer is its own post a few hours later.

## The calendar

<!-- calendar -->
| Day | Time | Where | What |
|---|---|---|---|
| **Mon Nov 30** | 15:00 | IG Story | `s49-mon-theme` |
|  | 18:00 | IG post | `w49-mon-bank-zelle` |
|  | 18:00 | X image | `w49-mon-bank-zelle` |
| **Tue Dec 1** | 15:00 | IG Story | `s49-tue-giving` |
|  | 18:00 | IG post | `w49-tue-gift-cards` |
|  | 18:00 | X video | Video 8 |
|  | 23:30 | IG Reel | Video 8 |
| **Wed Dec 2** | 15:00 | IG Story ✋ | `s49-wed-quiz` |
|  | 18:00 | IG post | `w49-wed-real-or-scam-bank` |
|  | 18:00 | X image | `w49-wed-real-or-scam-bank` |
|  | 23:30 | X answer | `w49-wed-real-or-scam-bank` |
| **Thu Dec 3** | 15:00 | IG Story | `s49-thu-answer` |
|  | 18:00 | IG post | `w49-thu-safe-account` |
|  | 18:00 | X video | Video 9 |
|  | 23:30 | IG Reel | Video 9 |
| **Fri Dec 4** | 15:00 | IG Story ✋ | `send-one` |
|  | 18:00 | IG post | `w49-fri-how-the-check-works` |
|  | 18:00 | X image | `w49-fri-how-the-check-works` |
| **Mon Dec 7** | 15:00 | IG Story | `s50-mon-theme` |
|  | 18:00 | IG post | `w50-mon-prize` |
|  | 18:00 | X image | `w50-mon-prize` |
| **Tue Dec 8** | 18:00 | IG post | `w50-tue-new-number` |
|  | 18:00 | X video | Video 5 |
|  | 23:30 | IG Reel | Video 5 |
| **Wed Dec 9** | 15:00 | IG Story ✋ | `s50-wed-quiz` |
|  | 18:00 | IG post | `w50-wed-real-or-scam-code` |
|  | 18:00 | X image | `w50-wed-real-or-scam-code` |
|  | 23:30 | X answer | `w50-wed-real-or-scam-code` |
| **Thu Dec 10** | 15:00 | IG Story | `s50-thu-answer` |
|  | 18:00 | IG post | `w50-thu-parcel-world` |
|  | 18:00 | X video | Video 10 |
|  | 23:30 | IG Reel | Video 10 |
| **Fri Dec 11** | 15:00 | IG Story ✋ | `send-one` |
|  | 18:00 | IG post | `w50-fri-genuine-ask` |
|  | 18:00 | X image | `w50-fri-genuine-ask` |
| **Mon Dec 14** | 15:00 | IG Story | `s51-mon-theme` |
|  | 18:00 | IG post | `w51-mon-romance` |
|  | 18:00 | X video | Video 11 |
|  | 23:30 | IG Reel | Video 11 |
| **Tue Dec 15** | 18:00 | IG post | `w51-tue-the-fee` |
|  | 18:00 | X image | `w51-tue-the-fee` |
| **Wed Dec 16** | 15:00 | IG Story ✋ | `s51-wed-quiz` |
|  | 18:00 | IG post | `w51-wed-real-or-scam-subscription` |
|  | 18:00 | X video | Video 6 |
|  | 23:30 | IG Reel | Video 6 |
| **Thu Dec 17** | 15:00 | IG Story | `s51-thu-answer` |
|  | 18:00 | IG post | `w51-thu-charity-world` |
|  | 18:00 | X image | `w51-thu-charity-world` |
| **Fri Dec 18** | 15:00 | IG Story ✋ | `send-one` |
|  | 18:00 | IG post | `w51-fri-what-scammers-ask` |
|  | 18:00 | X image | `w51-fri-what-scammers-ask` |
| **Mon Dec 21** | 15:00 | IG Story | `s52-mon-theme` |
|  | 18:00 | IG post | `w52-mon-utility` |
|  | 18:00 | X video | Video 7 |
|  | 23:30 | IG Reel | Video 7 |
| **Tue Dec 22** | 18:00 | IG post | `w52-tue-secrecy` |
|  | 18:00 | X image | `w52-tue-secrecy` |
| **Wed Dec 23** | 15:00 | IG Story ✋ | `s52-wed-quiz` |
|  | 18:00 | IG post | `w52-wed-real-or-scam-verification` |
|  | 18:00 | X image | `w52-wed-real-or-scam-verification` |
|  | 23:30 | X answer | `w52-wed-real-or-scam-verification` |
| **Thu Dec 24** | 12:00 | IG Story | `s52-thu-answer` |
|  | 15:00 | IG post | `w52-thu-christmas-eve` |
|  | 15:00 | X video | Video 12 |
|  | 23:30 | IG Reel | Video 12 |
| **Fri Dec 25** | 16:00 | IG Story | `s52-fri-christmas` |
|  | 16:00 | X text | `w52-fri-christmas` |
| **Sat Dec 26** | 10:00 | IG Story | `s52-sat-boxing-day` |
|  | 10:00 | IG Reel | Video 13 |
|  | 10:00 | X video | Video 13 |
|  | 14:00 | IG post | `w52-sat-boxing-day` |
| **Mon Dec 28** | 15:00 | IG Story | `s53-mon-theme` |
|  | 18:00 | IG post | `w53-mon-tax-refund` |
|  | 18:00 | X video | Video 14 |
|  | 23:30 | IG Reel | Video 14 |
| **Tue Dec 29** | 18:00 | IG post | `w53-tue-year-in-scamdb` |
|  | 18:00 | X image | `w53-tue-year-in-scamdb` |
| **Thu Dec 31** | 15:00 | IG Story | `s53-thu-new-year` |
|  | 16:00 | IG Reel | Video 15 |
|  | 16:00 | X video | Video 15 |
|  | 18:00 | IG post | `w53-thu-new-year` |
| **Fri Jan 1** | 18:00 | IG Story | `s53-fri-2027` |
<!-- /calendar -->

## The Reels

All voiced with "Nahuel English" (ElevenLabs), disclosed in every caption ("Voice: AI, made from my own."). Messages are
the catalogue's written examples, labelled "an example" on screen, with the source warning credited. Videos 5–7 were
made on Nov 23; Videos 8–15 on Nov 26 (5,494 credits for two takes each; the cleaner take is used). Scripts and timing:
`tools/reels-dec.mjs`.

| Video | Day | Topic | Length |
|---|---|---|---|
| 8 | Tue Dec 1 | Who asks to be paid in gift cards? (Giving Tuesday) | 26 s |
| 9 | Thu Dec 3 | There is no safe account (one script, 30+ countries) | 23 s |
| 5 | Tue Dec 8 | "Hi Mum, new number" | 22 s |
| 10 | Thu Dec 10 | The parcel text in 70 countries | 26 s |
| 11 | Mon Dec 14 | The online love who needs money | 23 s |
| 6 | Wed Dec 16 | Real or scam? Subscriptions | 26 s |
| 7 | Mon Dec 21 | "Pay now or your power goes off" | 22 s |
| 12 | Thu Dec 24 | **"This isn't really me talking."** The AI voice tells you it's AI, then: pick a family code word | 25 s |
| 13 | Sat Dec 26 | Boxing Day: three checks before you pay | 25 s |
| 14 | Mon Dec 28 | "You're owed a refund" | 25 s |
| 15 | Thu Dec 31 | Three rules for 2027 | 21 s |

## Notes and open questions

1. **Every quiz answer this month is B.** W49–W52 all put the scam second. Followers may notice and stop guessing. I
   can swap A and B in the W51 and W52 quizzes (images, captions and answers) if you want.
2. **Video 12 uses your cloned voice as the lesson** ("This isn't really me talking"). It's honest and it's the
   strongest hook of the month, but it's your voice: say if you'd rather not.
3. **Report data is never used.** All numbers (1,199 scams, 76 countries, 70 countries with the parcel text, 30+ with
   the safe-account script) come from the open catalogue, counted on Nov 23. Update the Dec 29 numbers on the day.
4. **Dispatch limits today:** no alt text, Reel cover, stickers, X replies or Highlights through the API, so those are ✋
   steps. If Dispatch adds alt text and Reel covers, the guides get shorter.
5. **Regenerate** guides, drafts and zips with `node marketing/tools/gen-guides.mjs`; Reels with
   `node marketing/tools/reels-dec.mjs`; Stories with `node marketing/tools/render.mjs --stories`.
