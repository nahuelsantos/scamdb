// Screenshots and voice notes for /v1/isitascam: read the multipart body and turn the file into text with Workers AI.
// Files are processed in memory and never stored.
import { HttpError } from './http.js';

// Both current on Workers AI (Nov 2026). gemma-4 reads images; whisper-large-v3-turbo transcribes many languages.
export const MEDIA_MODELS = { image: '@cf/google/gemma-4-26b-a4b-it', audio: '@cf/openai/whisper-large-v3-turbo' };
export const MAX_FILE = 5 * 1024 * 1024;
const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const invalid = (field, why) => new HttpError(400, 'invalid_check', `${field}: ${why}`);
const isFile = (v) => v && typeof v === 'object' && typeof v.arrayBuffer === 'function';

/** { body: { text?, country?, lang?, report? }, file: { kind, bytes, type } | null } */
export async function readForm(request) {
  if (Number(request.headers.get('content-length') ?? 0) > MAX_FILE + 64 * 1024) throw new HttpError(413, 'too_large', 'Files can be at most 5 MB.');
  let form;
  try { form = await request.formData(); } catch { throw new HttpError(400, 'bad_form', 'The body is not valid multipart/form-data.'); }
  const image = form.get('image'), audio = form.get('audio');
  if (isFile(image) && isFile(audio)) throw invalid('image', 'send an image or an audio file, not both');
  const part = isFile(image) ? ['image', image] : isFile(audio) ? ['audio', audio] : null;
  const body = {};
  for (const k of ['text', 'country', 'lang']) if (typeof form.get(k) === 'string') body[k] = form.get(k);
  if (form.get('report') !== null) body.report = form.get('report') === 'true';
  if (!part) return { body, file: null };
  if (body.text !== undefined) throw invalid('text', 'send the message as text or as a file, not both');
  const [kind, f] = part;
  if (kind === 'image' && !IMAGE_TYPES.includes(f.type)) throw invalid('image', `one of ${IMAGE_TYPES.join(', ')}`);
  if (kind === 'audio' && !/^audio\//.test(f.type)) throw invalid('audio', 'an audio file (audio/*)');
  if (f.size > MAX_FILE) throw new HttpError(413, 'too_large', 'Files can be at most 5 MB.');
  return { body, file: { kind, bytes: new Uint8Array(await f.arrayBuffer()), type: f.type } };
}

function base64(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

const PROMPT = 'This is a screenshot of a message someone received. Copy out all of its text exactly as written, in its original language. Output only the text, nothing else.';

/** The text in the image or the words in the audio, or null on any error, timeout or empty result. */
export async function extractText(ai, file, { timeoutMs = 15000 } = {}) {
  const run = async () => {
    if (file.kind === 'image') {
      const out = await ai.run(MEDIA_MODELS.image, { messages: [{ role: 'user', content: [
        { type: 'text', text: PROMPT },
        { type: 'image_url', image_url: { url: `data:${file.type};base64,${base64(file.bytes)}` } },
      ] }], max_tokens: 1024 });
      return out?.response ?? out?.choices?.[0]?.message?.content;
    }
    return (await ai.run(MEDIA_MODELS.audio, { audio: base64(file.bytes) }))?.text;
  };
  try {
    const text = await Promise.race([run(), new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs))]);
    return typeof text === 'string' && text.trim() ? text.trim() : null;
  } catch {
    return null;
  }
}
