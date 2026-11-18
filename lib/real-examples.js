// Real messages as public examples. The data files hold only examples written by scamdb (`synthetic: true`); the
// real messages quoted from sources live in eval/real. At build time each entry gets its real messages first, each
// with its source, so the site and API show what was found before any illustration (docs/vision.md).
import { loadRealMessages } from './eval.js';

const EN_WORDS = /\b(the|your|you|is|has|been|please|to|and|account|we|will|our|for)\b/gi;

/** The language a real message is written in, from the country's languages (English only when it reads as English). */
export function realLang(text, langs, entryLang) {
  if (langs.length === 1) return langs[0];
  const latin = !/[^\u0000-ɏḀ-ỿ\s\p{P}\p{S}\p{N}]/u.test(text);
  const words = text.split(/\s+/).length;
  const hits = (text.match(EN_WORDS) ?? []).length;
  if (langs.includes('en') && latin && hits >= 2 && hits / words >= 0.08) return 'en';
  const other = langs.find((l) => l !== 'en');
  return entryLang && entryLang !== 'en' ? entryLang : (other ?? 'en');
}

/** Puts each entry's real messages (label scam, linked by `scam`) ahead of its written examples. Mutates and returns repo. */
export function withRealExamples(repo, root) {
  const byId = new Map();
  for (const m of loadRealMessages(root)) {
    if (m.label !== 'scam' || !m.scam) continue;
    if (!byId.has(m.scam)) byId.set(m.scam, []);
    byId.get(m.scam).push(m);
  }
  const langs = new Map(repo.countries.map((c) => [c.code, c.languages]));
  for (const e of repo.entries) {
    const real = byId.get(e.id);
    if (!real) continue;
    e.examples = [
      ...real.map((m) => ({ text: { [realLang(m.text, langs.get(e.country) ?? ['en'], e.lang)]: m.text }, ...(m.channel ? { channel: m.channel } : {}), source: m.source })),
      ...e.examples,
    ];
  }
  return repo;
}
