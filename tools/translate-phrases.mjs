#!/usr/bin/env node
// Fills in machine-translated search phrases (`phrasesTranslated.<lang>`) for languages an entry doesn't have, so the keyword matcher can
// recognise a scam documented in one country when it arrives in another language. Phrases are search aids, not
// published text. Uses Workers AI through Cloudflare's REST API; the output goes through a normal reviewed PR.
//
//   CLOUDFLARE_ACCOUNT_ID=… CLOUDFLARE_API_TOKEN=… node tools/translate-phrases.mjs --langs es,en,pt [--only ar/foo] [--dry]
import { readFileSync, writeFileSync } from 'node:fs';
import { loadRepo } from '../lib/load.js';

const args = process.argv.slice(2);
const value = (n) => (args.includes(n) ? args[args.indexOf(n) + 1] : null);
const LANGS = (value('--langs') ?? 'es,en,pt').split(',');
const NAMES = { es: 'Spanish (neutral Latin American)', en: 'English', pt: 'Portuguese', fr: 'French', de: 'German', it: 'Italian', nl: 'Dutch', pl: 'Polish' };
const MODEL = '@cf/google/gemma-4-26b-a4b-it';
const { CLOUDFLARE_ACCOUNT_ID: account, CLOUDFLARE_API_TOKEN: token } = process.env;
if (!account || !token) { console.error('Needs CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN.'); process.exit(1); }

/** Normalised, de-duplicated, 2–8 word phrases, at most 20. */
export function cleanPhrases(list) {
  const seen = new Set();
  return (Array.isArray(list) ? list : []).map((p) => String(p).toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^\p{L}\p{N}\s'-]/gu, ' ').replace(/\s+/g, ' ').trim())
    .filter((p) => p && p.split(' ').length <= 8 && p.length <= 80 && !seen.has(p) && seen.add(p)).slice(0, 20);
}

async function translate(entry, lang) {
  const source = entry.phrases[entry.lang] ?? entry.phrases.en ?? Object.values(entry.phrases)[0];
  const example = entry.examples?.[0]?.text?.en ?? '';
  const prompt = `A scam, described in English: "${entry.name.en}". ${entry.how?.en ?? ''}\nExample message: "${example}"\nSearch phrases in the original language: ${JSON.stringify(source)}\n\nWrite 12 to 15 short phrases in ${NAMES[lang] ?? lang} for recognising this scam when the message, call or a victim's description of it is in ${NAMES[lang] ?? lang}. Mix: the exact words such a message would contain (e.g. key nouns and verbs a scammer would write), and how a victim would describe it. Use natural everyday wording, not literal translation. Keep only international brand names. Answer only with a JSON array of lowercase strings.`;
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/${MODEL}`, {
    method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], max_tokens: 700, chat_template_kwargs: { enable_thinking: false } }),
  });
  const body = await r.json();
  const text = body.result?.response ?? body.result?.choices?.[0]?.message?.content ?? '';
  const m = String(typeof text === 'string' ? text : JSON.stringify(text)).match(/\[[\s\S]*\]/);
  return m ? cleanPhrases(JSON.parse(m[0])) : [];
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const root = new URL('..', import.meta.url).pathname;
  const only = value('--only');
  const todo = loadRepo(root).entries.filter((e) => !only || e.id === only)
    // Only languages the entry has no human-written phrases for; --force regenerates existing translations.
    .flatMap((e) => LANGS.filter((l) => !e.phrases?.[l]?.length && (args.includes('--force') || !e.phrasesTranslated?.[l]?.length)).map((l) => ({ e, l })));
  console.log(`${todo.length} entry × language pairs to fill.`);
  let done = 0, failed = 0;
  const queue = [...todo];
  await Promise.all([1, 2, 3].map(async () => {
    while (queue.length) {
      const { e, l } = queue.shift();
      try {
        const phrases = await translate(e, l);
        if (phrases.length < 5) throw new Error(`only ${phrases.length} phrases`);
        if (!args.includes('--dry')) {
          const json = JSON.parse(readFileSync(e._path, 'utf8'));
          json.phrasesTranslated = { ...(json.phrasesTranslated ?? {}), [l]: phrases };
          writeFileSync(e._path, JSON.stringify(json, null, 2) + '\n');
        }
        done++;
      } catch (err) { failed++; console.error(`${e.id} ${l}: ${err.message}`); }
    }
  }));
  console.log(`Filled ${done}, failed ${failed}.`);
}
