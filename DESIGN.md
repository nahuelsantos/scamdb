# scamdb.dev design

A field guide to scams, for developers. Pages are calm, roomy and hand-drawn: sage paper, deep green ink, one pink
accent, and pen-and-shading drawings. The look was chosen by the owner from mockups (2026-11-15); this file is the
rulebook every page follows. Values live as CSS variables in `site/assets/styles.css`; pages use the names, never raw
values.

## Rules (owner)

1. **Icons over words.** Actions are icon buttons (copy, show/hide, replace, delete, sign out, GitHub, language).
   Every icon button has an `aria-label` and a `title` with the word, so screen readers and hover still say it. Use a
   word only when an icon would be ambiguous, and keep it short.
2. **Room to breathe.** Never let two controls touch. Groups of controls sit at least `--s4` apart; separate areas of a
   page (for example "your key" and "sign out") at least `--s6`. Text and a control below it: at least `--s4`.
3. **Everything drawn by hand.** Drawings and icons are generated at build time by `lib/sketch.js` in the pen-and-shading
   style: thin pen line traced twice (roughness 1.1, bowing 1, stroke 1.8), hatched shading offset down-right. No stock
   icon fonts, no emoji, no photos. Text inside drawings stays crisp (never filtered).
4. **No foreign text in drawings.** Drawings work in any language: scribbled lines stand in for text, and only codes,
   numbers and the handwritten notes appear.
5. **Secrets look like passwords.** API keys are masked by default, with an eye button to show them and a copy button.

## Color

| Token | Light | Dark | Role |
|---|---|---|---|
| `--paper` | `#eceee4` | `#131a15` | page background |
| `--card` | `#fafbf6` | `#1b241d` | cards, inputs, drawing fills |
| `--ink` | `#1d2a20` | `#e7ebde` | text, pen lines, solid buttons |
| `--dim` | `#545f52` | `#a3ad9f` | secondary text, labels |
| `--line` | `#cfd4c4` | `#2a362d` | borders, dividers |
| `--accent` | `#d63d74` | `#ff6f9f` | warning-sign strokes, stamps, focus of attention (one per view) |
| `--accent-ink` | `#b0285a` | `#ff8fb2` | accent used as text (contrast-safe) |
| `--hl` | lime 55% | lime 25% | highlighter behind a word or code |
| `--link` | `#1d6b46` | `#8fd6ac` | links, focus ring |
| `--panel` / `--panel-ink` | deep green / cream | near black / cream | the playground and code blocks |
| verdict | `--bad-panel` pink, `--warn-panel` amber, `--ok-panel` green | | the playground stamp only |

Text contrast is at least 4.5:1 in both themes (checked by axe in the browser tests).

## Typography

| Role | Family | Use |
|---|---|---|
| Display | Space Grotesk 700 | h1 (42–84px, line-height .95, tracking −.04em), h2 (26–38px), h3 19px |
| Body | IBM Plex Sans 400/600 | text 16px (lede 18px), line-height 1.55, lines ≤ 65ch |
| Mono | IBM Plex Mono 400/500 | code, ids, labels, eyebrows 12–13px |
| Hand | Patrick Hand 400 | notes in drawings, tier labels (20–21px) |

Fonts are self-hosted (`site/assets/fonts/`); no third-party requests.

## Spacing

One 4-based scale: `--s1` 4px · `--s2` 8px · `--s3` 12px · `--s4` 16px · `--s5` 24px · `--s6` 32px · `--s7` 48px ·
`--s8` 64px. Sections are `--s8` apart; page side gutter at least 16px; content width 1180px; reading width 65ch.

## Shape and depth

Radius: 10px buttons and inputs, 14–16px cards, 22px the playground panel, 999px pills. No drop shadows: depth comes
from the hatched shading in drawings and from 1.5px borders.

## Components

- **Buttons**: `display: inline-flex` always (never inline, so padding can't overlap text). Solid (ink background) for
  the one main action, outline for the rest. Icon buttons are 44×44px minimum, 1.5px border, radius 10px.
- **Pills / flags**: mono 12px, 1.5px border; pink for warning signs, grey dashed for "what happens".
- **Cards** (catalogue): card background, 1.5px line border, radius 16px, drawn icon top-right.
- **Selects**: one shared rule at the end of `styles.css` draws the chevron and keeps 44px on the right for it. A
  component styles a select's colours, border and font only: never its `padding` shorthand or `appearance`, never the
  `background` shorthand (use `background-color`). A browser test checks every select on every page.
- **Inputs and secret fields**: card background, 1.5px border, radius 10px, mono text for keys, icon buttons inside the
  same row.
- **Navigation**: logo left; Docs, Catalogue, Contribute, Account, GitHub, language on the right.
- **Footer**: credit, licenses, dataset version.

## Imagery and icons

Only the sketch style above: the hero phone, step circles with small icons, catalogue icons, UI icons (`UI_ICONS` in
`site/templates/icons.js`). Every drawing has fixed seeds so builds are identical.
