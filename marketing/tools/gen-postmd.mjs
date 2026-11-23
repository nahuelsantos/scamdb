// Writes marketing/posts/<week>/<id>/post.md for every post in december.mjs: copy, sources, alt text, images.
// Usage: node marketing/tools/gen-postmd.mjs   (then node marketing/tools/check-x.mjs)
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DECEMBER } from './december.mjs';

const ROOT = new URL('../../', import.meta.url).pathname;
const clean = (s = '') => String(s).replace(/<[^>]+>/g, '').replace(/\[\[(.+?)\]\]/g, '$1').replace(/\{\{\d\|(.+?)\}\}/g, '$1').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
const ASK = `Got a message like this, scam or genuine? Send it to us. Both help the check tell them apart, and reports stay private.\n\nhttps://scamdb.dev/report`;

function alt(sl) {
  const m = sl.msg;
  const label = m ? (m.source ? `${m.source.pill ?? `A real message quoted by ${m.source.short}`}` : 'An example written by scamdb') : '';
  switch (sl.type) {
    case 'cover': return `Hand-drawn illustration. ${clean(sl.eyebrow)}. Headline: “${clean(sl.title)}”. ${clean(sl.sub)}`;
    case 'message': case 'messageX': return `${label}${m.sender ? `, from ${clean(m.sender)}` : ''}: “${clean(m.text)}”. ${sl.title ? clean(sl.title) + '. ' : ''}Warning signs: ${sl.notes.map(clean).join('; ')}.`;
    case 'steps': return `How it goes, in four hand-drawn steps (see the catalogue entry).`;
    case 'todo': return `${clean(sl.title ?? 'What to do')}: ${(sl.items ?? []).map(clean).join(' ')}`;
    case 'cta': return `scamdb logo. Got one like this? Send it to scamdb.dev/report. Scam or genuine, both help. Reports stay private.`;
    case 'versus': return `${clean(sl.title)} A, from ${clean(sl.pair[0].sender)}: “${clean(sl.pair[0].text)}” B, from ${clean(sl.pair[1].sender)}: “${clean(sl.pair[1].text)}” ${clean(sl.note)}`;
    case 'answer': return `The answer, with a pink stamp “${clean(sl.stamp)}”: ${clean(sl.title)} ${sl.items.map(clean).join(' ')}`;
    case 'tip': return `${clean(sl.eyebrow)}. “${clean(sl.title)}” ${clean(sl.sub)}`;
    case 'list': return `${clean(sl.eyebrow)}. ${clean(sl.title)}. ${clean(sl.sub)} ${sl.items.map(([a, b]) => `${a}: ${clean(b)}`).join('; ')}. ${clean(sl.note)}`;
    default: return '';
  }
}

for (const p of DECEMBER) {
  const igSlides = p.slides.map((s, i) => [s, i]).filter(([s]) => (s.size ?? 'ig') === 'ig');
  const xSlide = p.slides.map((s, i) => [s, i]).find(([s]) => s.size === 'x');
  const file = (i, s) => `${String(i + 1).padStart(2, '0')}-${s.size ?? 'ig'}.png`;
  const parts = [`# ${p.date} · ${p.pillar}${p.textOnly ? ' (text only)' : ''}`, '',
    `- **Pillar:** ${p.pillar}`,
    `- **Catalogue entry:** ${p.entry ? `https://scamdb.dev/catalogue/${p.entry}/` : '—'}`,
    `- **Sources and notes:** ${p.facts}`,
    p.textOnly ? '- **Images:** none' : `- **Images:** ${igSlides.map(([s, i]) => '`' + file(i, s) + '`').join(', ')} (Instagram, in order)${xSlide ? `, \`${file(xSlide[1], xSlide[0])}\` (X)` : ''}`, ''];
  if (p.ig) {
    parts.push(`## Instagram${igSlides.length > 1 ? ` (${igSlides.length} slides)` : ''}`, '', '```ig', p.ig, '```', '', '**Alt text**', '');
    igSlides.forEach(([s], n) => parts.push(`${n + 1}. ${alt(s)}`));
    parts.push('');
  } else parts.push('## Instagram', '', 'No Instagram post today (optional: share yesterday’s post to your Story).', '');
  parts.push('## X', '', '```x', p.x, '```', '');
  if (xSlide) parts.push(`**Alt text (${file(xSlide[1], xSlide[0])}):** ${alt(xSlide[0])}`, '');
  if (p.xAnswer) parts.push('**Reply with the answer (a few hours later):**', '', '```x', p.xAnswer, '```', '');
  if (!p.textOnly) parts.push('**Reply with the ask (post it as a reply to your own post):**', '', '```x', ASK, '```', '');
  const dir = join(ROOT, 'marketing/posts', p.week, p.id);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'post.md'), parts.join('\n'));
}
console.log(`wrote ${DECEMBER.length} post.md files`);
