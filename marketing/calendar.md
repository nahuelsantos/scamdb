# Content calendar: first two weeks

Five posts a week on both Instagram and X (see `pillars.md` for why, and when to drop to three). Every post has its
copy, sources, alt text, hashtags and images in its folder under `marketing/posts/`. Nothing here is scheduled or
posted. You review, edit and publish.

| Date | Pillar | Post | Instagram | X | Real message? | Catalogue entry |
|---|---|---|---|---|---|---|
| **Mon Nov 23** | Scam of the week | [Fake USPS delivery text](posts/2026-11-W48/w48-mon-usps/post.md) | 5-slide carousel | 1 image + optional reply | Yes: FOX 5 DC, citing USPIS (Dec 2, 2024) | [us/usps-delivery-text](https://scamdb.dev/catalogue/us/usps-delivery-text/) |
| **Tue Nov 24** | How the trick works | [Why the fake toll is only $12.51](posts/2026-11-W48/w48-tue-toll/post.md) | 2 slides | 1 image | Yes: FBI IC3 (Apr 12, 2024) | [us/toll-text](https://scamdb.dev/catalogue/us/toll-text/) |
| **Wed Nov 25** | Real or scam? | [Two delivery texts](posts/2026-11-W48/w48-wed-real-or-scam-delivery/post.md) | 2 slides (answer on slide 2) | 1 image, answer in a reply | No: both written by scamdb, labelled | [us/usps-delivery-text](https://scamdb.dev/catalogue/us/usps-delivery-text/) |
| **Thu Nov 26** Thanksgiving | How the trick works | [Pick a family code word](posts/2026-11-W48/w48-thu-family-code-word/post.md) | 2 slides | 1 image | No: written example, labelled | [us/family-emergency-call](https://scamdb.dev/catalogue/us/family-emergency-call/) |
| **Fri Nov 27** Black Friday | Around the world | [One trick, 28 countries: fake shops](posts/2026-11-W48/w48-fri-fake-shops/post.md) | 2 slides | 1 image | No message shown | [ca/fake-online-store](https://scamdb.dev/catalogue/ca/fake-online-store/) |
| **Mon Nov 30** Cyber Monday | Scam of the week | [The fake fraud alert](posts/2026-12-W49/w49-mon-bank-zelle/post.md) | 5-slide carousel | 1 image | Yes: FBI IC3 (Apr 14, 2022) | [us/bank-fraud-alert-zelle](https://scamdb.dev/catalogue/us/bank-fraud-alert-zelle/) |
| **Tue Dec 1** Giving Tuesday | How the trick works | [Nobody real asks for gift cards](posts/2026-12-W49/w49-tue-gift-cards/post.md) | 2 slides | 1 image | No message shown | [us/fake-police-government](https://scamdb.dev/catalogue/us/fake-police-government/) |
| **Wed Dec 2** | Real or scam? | [Two bank alerts](posts/2026-12-W49/w49-wed-real-or-scam-bank/post.md) | 2 slides | 1 image, answer in a reply | B is real: ABC7 (Oct 4, 2021); A written, labelled | [us/bank-fraud-alert-zelle](https://scamdb.dev/catalogue/us/bank-fraud-alert-zelle/) |
| **Thu Dec 3** | Around the world | ["Move it to a safe account"](posts/2026-12-W49/w49-thu-safe-account/post.md) | 2 slides | 1 image | No: phrases from written examples, labelled | [gb/bank-safe-account](https://scamdb.dev/catalogue/gb/bank-safe-account/) |
| **Fri Dec 4** | Behind scamdb | [How the check works](posts/2026-12-W49/w49-fri-how-the-check-works/post.md) | 2 slides | 1 image + developer reply | No message shown | [scamdb.dev](https://scamdb.dev) |

**Before each post**

1. Read `post.md` and look at the images in the same folder.
2. Instagram: pick the `-ig.png` images in order, paste the caption from the `ig` block and the alt text for each
   image.
3. X: attach the `-x.png` image, paste the `x` block and the alt text. Post the reply (if there is one) as a reply to
   your own post.
4. Spend a few minutes answering comments later in the day.

`node marketing/tools/check-x.mjs` checks that every X post fits in 280 characters (links count as 23). All of them do
today.

## Notes for the owner

These are things I found while drafting. I didn't change the site, the API or the catalogue.

1. **The catalogue has no real quoted messages.** Every example in all 1,199 entries is `synthetic: true`. The brief
   and the vision expect real messages with sources. For these posts I found four real, quoted scam texts in public
   sources and checked them word for word:
   - USPS: FOX 5 DC, Dec 2, 2024
   - toll: FBI IC3 PSA240412, Apr 12, 2024
   - bank fraud alert: FBI IC3 PSA220414, Apr 14, 2022
   - Zelle alert: ABC7 (KGO-TV), Oct 4, 2021

   Links are in each post. You may want to add them to the catalogue, via `/import-scams` or by hand. I left the data
   alone.
2. **The US has no fake online shop entry**, but 28 other countries do. That matters for Black Friday. The Nov 27
   post links to the Canadian entry for now.
3. **Some written examples use realistic names instead of [name]**, for example `pl/bank-employee-safe-account`
   ("Marek Zieliński"), `cz/falesny-banker-bezpecny-ucet` ("Novotná") and `se/bank-employee-bankid` ("Johan"). They're
   made up, but the rule is placeholders. Worth a look.
4. **Not covered:** the FTC "we'll deactivate your phone number" scam (Oct 2026). I found no real quoted message from
   a reliable source, so it's left out for now. It's a good "Trending now" post if the FTC or FCC publishes an
   example.
5. **The Social Media Skills and Marketing plugins** didn't load in this session, so everything here was built from the
   repo docs. If you turn them on (`/reload-plugins` or a new session), they can help with later weeks and with
   analytics.

## After two weeks

Look at Instagram Insights (Professional dashboard, or "View insights" under each post) and, on X, the bar-chart icon
under each post. Note three numbers per post: **link taps**, **shares/sends** and
**saves**. Keep doing what gets shared. Drop what doesn't.
