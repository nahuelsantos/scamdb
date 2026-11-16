import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readForm, extractText, MEDIA_MODELS, MAX_FILE } from '../../worker/media.js';

const form = (parts) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(parts)) f.append(k, v);
  return new Request('https://scamdb.dev/v1/isitascam', { method: 'POST', body: f });
};
const png = (size = 10) => new File([new Uint8Array(size)], 'a.png', { type: 'image/png' });
const ogg = () => new File([new Uint8Array(10)], 'a.ogg', { type: 'audio/ogg' });
const ai = (out, { throws, hang } = {}) => ({ run: async (model) => { if (throws) throw new Error('x'); if (hang) return new Promise(() => {}); return out(model); } });

test('readForm returns the fields and the image', async () => {
  const { body, file } = await readForm(form({ image: png(), country: 'au', lang: 'en', report: 'true' }));
  assert.deepEqual(body, { country: 'au', lang: 'en', report: true });
  assert.equal(file.kind, 'image');
  assert.equal(file.type, 'image/png');
  assert.equal(file.bytes.length, 10);
});
test('readForm accepts audio', async () => assert.equal((await readForm(form({ audio: ogg() }))).file.kind, 'audio'));
test('readForm with only text works like JSON', async () => {
  const { body, file } = await readForm(form({ text: 'hola' }));
  assert.equal(body.text, 'hola');
  assert.equal(file, null);
});
for (const [name, parts, status, field] of [
  ['an image over 5 MB', () => ({ image: png(MAX_FILE + 1) }), 413, null],
  ['a gif', () => ({ image: new File([new Uint8Array(3)], 'a.gif', { type: 'image/gif' }) }), 400, 'image'],
  ['a non-audio audio part', () => ({ audio: new File([new Uint8Array(3)], 'a.txt', { type: 'text/plain' }) }), 400, 'audio'],
  ['both image and audio', () => ({ image: png(), audio: ogg() }), 400, 'image'],
  ['an image plus text', () => ({ image: png(), text: 'hola' }), 400, 'text'],
]) {
  test(`readForm rejects ${name}`, async () => {
    await assert.rejects(readForm(form(parts())), (e) => e.status === status && (!field || e.message.startsWith(field)));
  });
}
test('extractText reads an image with the vision model', async () => {
  const t = await extractText(ai((m) => (m === MEDIA_MODELS.image ? { response: '  Your parcel is on hold, pay $2.99: [link]  ' } : null)), { kind: 'image', bytes: new Uint8Array(4), type: 'image/png' });
  assert.equal(t, 'Your parcel is on hold, pay $2.99: [link]');
});
test('extractText transcribes audio with whisper', async () => {
  const t = await extractText(ai((m) => (m === MEDIA_MODELS.audio ? { text: 'Mum it is me' } : null)), { kind: 'audio', bytes: new Uint8Array(4), type: 'audio/ogg' });
  assert.equal(t, 'Mum it is me');
});
test('extractText returns null on error, timeout or empty text', async () => {
  const f = { kind: 'audio', bytes: new Uint8Array(4), type: 'audio/ogg' };
  assert.equal(await extractText(ai(() => ({}), { throws: true }), f), null);
  assert.equal(await extractText(ai(() => ({}), { hang: true }), f, { timeoutMs: 20 }), null);
  assert.equal(await extractText(ai(() => ({ text: '   ' })), f), null);
});
test('extractText also reads the chat-completions answer shape', async () => {
  const t = await extractText(ai(() => ({ choices: [{ message: { content: 'Hi Mum, new number' } }] })), { kind: 'image', bytes: new Uint8Array(4), type: 'image/png' });
  assert.equal(t, 'Hi Mum, new number');
});
