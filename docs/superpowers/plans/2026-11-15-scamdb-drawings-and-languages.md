# scamdb drawings and languages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redraw every scamdb.dev drawing in one hand-drawn pen-and-shading style generated at build time, fix the script steps, and serve the interface in English (`/`) and Spanish (`/es/`) while scams stay in their original language.

**Architecture:** `lib/sketch.js` wraps rough.js's generator (no DOM) and turns shapes into static SVG `<path>` strings with CSS classes. Templates call it instead of hand-written SVG. A string table `site/i18n.js` feeds every template; `build-site` renders the page set twice, once per interface language.

**Tech Stack:** rough.js 4.6.6 (dev dependency, build time only), existing Node build, `node:test`, Playwright + axe.

**Spec:** `docs/superpowers/specs/2026-11-15-scamdb-design.md`, section "Addendum (2026-11-15): drawings and languages". Visual reference: https://claude.ai/artifact/KjHJMoejveN8v6xW2vHnUT (option A with C's shading).

## Global Constraints

- Pen style everywhere: `roughness: 1.1, bowing: 1, strokeWidth: 1.8` (thin details `1.3`, accents `2.4`), multi-stroke on; shading = `fillStyle: 'hachure', hachureGap: 7, hachureAngle: -50, fillWeight: 0.6`.
- Fixed seeds per drawing: identical output on every build.
- No colour attributes in generated paths: classes `sk` (ink stroke), `sk-acc` (accent stroke), `sk-thin`, `sk-shade` (hatching, ink at 35% opacity), `sk-fill-card`, `sk-fill-paper` (solid fills). Coordinates rounded to 1 decimal.
- The `#rough` filter and the `.d/.d-thin/.d-acc` filter rules are removed.
- Interface languages: `en` (default, `/…`) and `es` (`/es/…`). Scam content shows in its own language on both; signal labels use `label[lang]`.
- No runtime dependency added; the playground keeps working in both languages.

## Review Focus

1. **A Spanish page linking to an English-only path** (e.g. nav, catalogue cards, "See all") — every internal link on an `/es/` page starts with `/es/` except `/v1/…` and GitHub. Test in Task 3.
2. **Scam content accidentally translated or mislabelled**: an entry's text on `/es/` and `/` is byte-identical and carries `lang` of its own language. Test in Task 3.
3. **Dark mode drawings**: generated paths must not carry `stroke="#…"`/`fill="#…"`. Test in Task 1.
4. **Page weight**: the home page HTML stays under 250 kB after inlining the drawings (rounding to 1 decimal). Test in Task 2.
5. **Language switch on the 404 and entry pages** points to the counterpart page, not the home page. Test in Task 3.

---

### Task 1: `lib/sketch.js`

**Files:** Create `lib/sketch.js`, `tests/unit/sketch.test.mjs`; modify `package.json` (devDependency `roughjs@4.6.6`).

**Interfaces — Produces:**
- `sketch(seed: number) : Sketch` where `Sketch` has `path(d, o?)`, `circle(cx, cy, diameter, o?)`, `rect(x, y, w, h, o?)`, `line(x1, y1, x2, y2, o?)`, each returning an SVG string. Options `o`: `{ kind?: 'ink'|'acc'|'thin', fill?: 'card'|'paper', shade?: boolean, dash?: [n, n] }`. Each call advances the seed (`seed + callIndex`) so shapes differ but builds repeat.
- Paths emitted as `<path class="sk|sk-acc|sk-thin|sk-shade|sk-fill-card|sk-fill-paper" d="…"/>`; dashed lines add `stroke-dasharray`.

- [ ] **Step 1: Failing tests:** `same seed gives the same SVG`; `different seeds differ`; `no colour attributes` (no `stroke="#`, `fill="#`, `stroke="currentColor"`); `shade adds sk-shade paths`; `fill card adds a sk-fill-card path first`; `coordinates have at most 1 decimal` (regex over `d`).
- [ ] **Step 2:** FAIL. **Step 3:** implement with `rough.generator()` + `generator.toPaths()`, mapping the marker colours to classes. **Step 4:** PASS. **Step 5:** commit `feat: build-time hand-drawn sketch helper`.

### Task 2: Redraw every drawing; fix the steps

**Files:** Modify `site/templates/icons.js`, `site/templates/home.js` (hero, underline), `site/templates/layout.js` (logo; remove `#rough` filter), `site/templates/parts.js` (steps), `site/assets/styles.css`; tests in `tests/unit/build-site.test.mjs`.

**Interfaces:** `ICONS`, `STEP_ICONS`, `iconFor` keep their names and return types (SVG strings); `steps(entry, signalsById, lang, ui)` adds `ui` (Task 3 string table; until then a local `{ whatHappens: 'What happens' }`).

- Hero phone = the options page geometry (body, notch, home button, avatar, bubble, highlighter, SMS box, stamp, four notes with arrows), body with `fill: 'card', shade: true`, bubble `fill: 'paper', shade: true`.
- Step circles `fill: 'card'`, icons in pen style; the route line `dash: [2, 10]`, `roughness 0.6`.
- Steps: `.step { gap: 14px }` (circle → label → text equal spacing); step without `signal` gets `<span class="flag out">What happens</span>` (grey, dashed).

- [ ] **Step 1: Failing tests:** `no page contains #rough or filter:url`; `every step has a label` (count `.flag` = steps); `a step without signal is labelled What happens with class out`; `home page HTML is under 250 kB`; `icons are pen-drawn` (`ICONS.bank` contains `class="sk`).
- [ ] **Step 2:** FAIL. **Step 3:** implement. **Step 4:** `npm test && npm run e2e` PASS; screenshots (home light + dark) compared by eye with the options page once.
- [ ] **Step 5:** commit `feat(site): pen-and-shading drawings everywhere; steps spacing and labels`.

### Task 3: English and Spanish interface

**Files:** Create `site/i18n.js`; modify all `site/templates/*.js`, `tools/build-site.mjs`, `site/assets/playground.js`, `tests/unit/build-site.test.mjs`, `tests/e2e/site.spec.mjs`.

**Interfaces — Produces:**
- `LANGS = ['en', 'es']`; `UI: Record<lang, Record<key, string>>` (every interface string in the templates and playground: nav, buttons, headings, docs text, verdict words, "What happens", footer, 404); `t(lang, key) : string` (throws on a missing key, so a test catches gaps); `prefix(lang) : '' | '/es'`.
- Templates receive `ctx.lang` and build links with `prefix(lang)`; `layout` sets `<html lang>`, `<link rel="alternate" hreflang="en|es|x-default">`, canonical per language, and an EN / ES switch linking to the same page in the other language.
- `buildSite` writes the whole page set for `en` at the root and for `es` under `es/` (404 only once, English, with a link to `/es/`). Assets shared.
- Playground reads its strings from `data-*` attributes on `#pg-out` set by the template, so one `playground.js` serves both.

- [ ] **Step 1: Failing tests:** `every page exists in en and es`; `es pages have html lang="es" and Spanish nav ("Catálogo", "Documentación", "Contribuir")`; `every internal link on es pages stays under /es/` (except `/v1/`, `/assets/`, external); `entry content is identical in both languages and keeps lang="es"`; `hreflang alternates point to each other`; `the switch on an entry page points to the same entry in the other language`; `t() has every key in both languages` (keys of `UI.en` equal keys of `UI.es`). e2e: axe and 360 px checks run on the `/es/` pages too; the playground on `/es/` shows `CHAMUYO`-free Spanish verdict words ("estafa", "sospechoso", "no lo reconocemos").
- [ ] **Step 2:** FAIL. **Step 3:** implement. **Step 4:** `npm test && npm run e2e` PASS.
- [ ] **Step 5:** commit `feat(site): English and Spanish interface; scams stay in their own language`.
