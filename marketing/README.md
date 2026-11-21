# marketing/

Social media plans, drafts and images for scamdb's Instagram (@scamdb.dev) and X (@scamdb) accounts. Nothing in this
folder is published automatically. The owner reviews and posts by hand.

| File | What |
|---|---|
| `playbook.md` | **Start here.** The Phase 1 playbook: goal, templates, routine, the 2-week test and what to measure |
| `foundation.md` | The discovery decisions behind the playbook |
| `brand-profile.md` | Who we talk to, voice, hard rules, look, calls to action, hashtags |
| `pillars.md` | The five content pillars, the weekly rhythm, and platform basics in plain words |
| `calendar.md` | The posting calendar, with notes for the owner |
| `posts/<week>/<post>/post.md` | Copy for Instagram and X, sources, alt text, catalogue link |
| `posts/<week>/<post>/*.png` | Images: `NN-ig.png` (1080×1350, Instagram, in order) and `NN-x.png` (1600×900, X) |
| `tools/posts.mjs` | What each image shows (text, messages, sources) |
| `tools/render.mjs` | Draws the images with the site's own helpers (`lib/sketch.js`, logo, icons, styles) |
| `tools/check-x.mjs` | Checks every X post fits in 280 characters |

## Remaking the images

```sh
npm ci && npm run build                  # the renderer uses dist/ for fonts and styles
node marketing/tools/render.mjs          # all posts
node marketing/tools/render.mjs w48-tue-toll   # one post
node marketing/tools/check-x.mjs
```

To change an image, edit its entry in `tools/posts.mjs` and run the renderer again. In slide text, `[[words]]` adds the
lime highlighter and `{{1|words}}` marks a red flag with pink number 1. A message with a `source` is labelled as real
and credited on the image. A message without one is labelled "An example of how this one reads" and credited to the
catalogue entry's first source.

## Rules (short version; `brand-profile.md` has the full list)

- Real messages only from public, dated sources, credited on the image and in the post. Everything else is labelled
  as written.
- No real logos or look-alike screens. Use the placeholders [number], [link], [name], [bank]. Never a live scam link.
- Nothing from reports sent to scamdb.dev/report.
- No ads, no scheduling tools. The owner publishes.
