# /isitascam: screenshots and voice notes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** `POST /v1/isitascam` also accepts a screenshot or a voice note (multipart), turns it into text with Workers AI, and answers exactly as for text.

**Architecture:** A new `worker/media.js` reads the multipart body and extracts text (image → `@cf/meta/llama-4-scout-17b-16e-instruct`, vision, no licence step; audio → `@cf/openai/whisper-large-v3-turbo`). `handleIsItAScam` picks JSON or multipart by `Content-Type`, then runs the existing pipeline on the extracted text. Files are processed in memory and never stored.

**Spec:** `docs/superpowers/specs/2026-11-15-scamdb-design.md` ("/isitascam": multipart with `image` or `audio`, 5 MB image, 60 s audio, files never stored; Phases item 4).

## Global Constraints

- Keyless requests never use AI, so **image and audio need a free key**: keyless multipart → 401 `key_required`.
- Image: `image/png`, `image/jpeg` or `image/webp`, ≤ 5 MB. Audio: any `audio/*`, ≤ 5 MB (documented as "about 60 seconds"). Exactly one of `text`, `image`, `audio`.
- Extraction counts against the shared daily AI cap (`isitascam:ai`); cap reached → 503 `ai_paused`. No `AI` binding → 503 `not_available`.
- Nothing read or heard is stored, except the extracted text when `report=true`.
- The response adds `input: { type: "image" | "audio", text }` so callers see what was read.

## Review Focus

1. **Model returns nothing / throws** → 422 `unreadable` (not 500). 2. **Oversized or wrong-type file, two files, file plus text** → 400/413 naming the field. 3. **Keyless upload** → 401 before any AI call. 4. **A JSON request** behaves exactly as before.

### Task 1: Media input

**Files:** create `worker/media.js`, `tests/unit/media.test.mjs`; modify `worker/isitascam.js`, `tests/worker/isitascam.test.mjs`, `site/templates/docs.js`, `site/i18n.js`, `README.md`.

**Interfaces — Produces:** `MEDIA_MODELS = { image, audio }`; `MAX_FILE = 5 * 1024 * 1024`; `readForm(request) -> Promise<{ body: object, file: { kind: 'image'|'audio', bytes: Uint8Array, type: string } | null }>` (throws 400 `invalid_check` / 413 `too_large`); `extractText(ai, file, { timeoutMs = 15000 }) -> Promise<string | null>` (null on error, timeout or empty).

- [ ] Unit tests (`tests/unit/media.test.mjs`, fake AI): image → returns the model's text; audio → whisper's `.text`; throw / timeout / empty → null; `readForm` rejects a 5 MB + 1 byte image (413), `image/gif` (400 `image`), both image and audio (400), image plus text (400).
- [ ] Worker tests: keyless multipart image → 401 `key_required`; keyed image without an AI binding → 503 `not_available`; JSON tests unchanged.
- [ ] Implement; `npm test` → pass; docs section gets a multipart example and the rules above; commit `feat(worker): screenshots and voice notes in /v1/isitascam`.
