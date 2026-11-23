# ElevenLabs script: the first 4 videos

The owner's own voice, generated with ElevenLabs text-to-speech (owner's decision, 2026-11-22). The words are the
approved storyboard lines (`storyboards.md`), written out the way they should be *said*: numbers in words, and
`scamdb` spelled the way it's pronounced.

## 1. Make the voice (once)

1. ElevenLabs → **Voices** → **Add a new voice** → **Instant Voice Clone**.
2. Upload 1–2 minutes of clean speech. Your Voice Memos recording works: the cleanest stretch is the second take
   (from about 2:37 to the end).
3. Name it `scamdb narrator`. Confirm you have the right to use the voice (it's yours).

Check your plan allows commercial use of generated audio before posting. On ElevenLabs' free plan it usually doesn't.

## 2. Settings

| Setting | Value | Why |
|---|---|---|
| Model | **Eleven Multilingual v2** | The most natural and stable with a cloned voice, and it understands the `<break>` pauses below |
| Stability | 50% | Natural variation without wobbling |
| Similarity | 75% | Sounds like you, without copying recording noise |
| Style exaggeration | 0–10% | Keeps it calm; higher sounds theatrical |
| Speaker boost | On | |
| Speed | 0.90 | A bit slower than normal, as planned |

## 3. Generate: one file per video

Paste each block below as it is, including the `<break>` tags (pauses between lines; I use them to time the
animation). Generate 2–3 versions of each and download the one you like. Download as **MP3, 44.1 kHz** (the highest
quality your plan offers).

Name the files `v1.mp3`, `v2.mp3`, `v3.mp3`, `v4.mp3`.

### Video 1: "How it works" → `v1.mp3`

```
Got a text that feels off? Don't ask the group chat. <break time="0.8s" />
Paste it into scam D B dot dev. <break time="0.8s" />
It checks it against about twelve hundred known scam scripts. In your browser. Nothing gets sent. <break time="0.8s" />
You get the script they're running, and the one thing to do next. <break time="0.8s" />
It only knows scams someone has documented. Found a new one? Send it to us.
```

### Video 2: "Why only twelve fifty-one?" → `v2.mp3`

```
Why does a fake toll text ask for twelve dollars and fifty-one cents? <break time="0.6s" />
Because nobody argues about twelve dollars. <break time="0.8s" />
A toll program you know. <break time="0.4s" /> A small amount. <break time="0.4s" /> A fifty-dollar threat. <break time="0.4s" /> And a link. <break time="0.8s" />
They don't want the twelve fifty-one. They want the card number you just typed in. <break time="0.8s" />
Don't tap. Send it to us instead.
```

### Video 3: "Real or scam?" → `v3.mp3`

```
Two texts from your bank. One's a scam. Three seconds. <break time="3.0s" /> <break time="1.0s" />
B. <break time="0.4s" /> But look how alike they are. Same bank. Same "if this wasn't you." <break time="0.8s" />
So don't reply, and don't call the number in the text. Call the one on your card. <break time="0.8s" />
Got either kind? Send it. The real ones teach the check too.
```

(The two breaks after "Three seconds" make a 4-second silence for the countdown. ElevenLabs allows up to 3 seconds per
break.)

### Video 4: "Shopped today?" → `v4.mp3`

```
Spent money today? Scammers are counting on it. <break time="0.8s" />
A fraud alert asks if you just paid five thousand dollars. You didn't. You reply no. <break time="0.8s" />
Then a helpful "fraud specialist" calls, and asks for a code. Or to move your money somewhere safe. <break time="0.8s" />
Your bank never asks you to move money to protect it. Ever. <break time="0.8s" />
Hang up, call the number on your card, and send the text to us.
```

## 4. If something sounds wrong

| Problem | Fix |
|---|---|
| Says "scamdb" wrong | It's already written as "scam D B". If needed, try "scam-dee-bee". |
| Too fast | Speed 0.85, or add `<break time="0.3s" />` inside long sentences |
| Sounds flat | Stability down to 40% |
| Sounds dramatic or wobbly | Stability up to 60%, style 0% |
| A strange sound or a skipped word | Generate that video again (each generation is different) |

## 5. Labelling (required)

The voice is AI-generated, so it must be labelled. That's the platforms' rule, and it's also honest with an audience
we teach about AI voice scams.

- **On the video:** I add a small line to the end card: *"Voice: AI-generated from the founder's own voice."*
- **Instagram:** when posting, *Advanced settings* → turn on **Add AI label** ("AI info").
- **X:** add to the post text: *"(Voice: AI, made from mine.)"*, or something like it.

## 6. Sending

Put the four MP3s in `marketing/videos/voice/` or send them however is easiest. They stay out of the repo, like the
recording.
