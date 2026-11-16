// Turns scamdb's Argentine entries back into eschamuyo's site/data/scams.json, using eschamuyo's overlay
// (list order and isNew). Usage: node tools/to-eschamuyo.mjs <eschamuyo-root>
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { loadRepo } from '../lib/load.js';

/** eschamuyo's scams.json shape: only active/fading Argentine entries, short ids, overlay order first. */
export function toEschamuyo(entries, overlay, updated) {
  const list = entries.filter((e) => e.country === 'ar' && e.status !== 'archived');
  const slug = (e) => e.id.split('/')[1];
  const rank = new Map(overlay.order.map((id, i) => [id, i]));
  list.sort((a, b) => {
    const ra = rank.get(slug(a)) ?? Infinity, rb = rank.get(slug(b)) ?? Infinity;
    return ra - rb || (slug(a) < slug(b) ? -1 : 1);
  });
  const es = (o) => ({ es: o.es }); // eschamuyo is Spanish only
  const scams = list.map((e) => {
    const s = { id: slug(e), isNew: overlay.isNew[slug(e)] ?? false, channels: e.channels, name: es(e.name), sender: es(e.sender),
      how: es(e.how), example: es(e.examples[0].text), phrases: es(e.phrases), redFlags: es(e.redFlags), whatToDo: es(e.whatToDo) };
    if (e.story) s.story = es(e.story);
    s.sources = e.sources;
    return s;
  });
  return { updated, scams };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const target = resolve(process.argv[2]);
  const overlay = JSON.parse(readFileSync(join(target, 'site/data/overlay.json'), 'utf8'));
  const { entries } = loadRepo(resolve(new URL('..', import.meta.url).pathname));
  const updated = entries.filter((e) => e.country === 'ar').map((e) => e.updated).sort().at(-1);
  writeFileSync(join(target, 'site/data/scams.json'), JSON.stringify(toEschamuyo(entries, overlay, updated), null, 2) + '\n');
  console.log(`wrote ${join(target, 'site/data/scams.json')}`);
}
