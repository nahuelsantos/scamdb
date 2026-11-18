// One-off: turns eschamuyo's site/data/scams.json into data/ar/scams/*.json plus migration/overlay.json.
// Usage: node tools/migrate-eschamuyo.mjs <path-to-eschamuyo>/site/data/scams.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

/** An eschamuyo scam as a scamdb entry. steps, signals and reportTo are left empty for the author. */
export function migrateScam(s, updated) {
  const e = {
    id: `ar/${s.id}`, country: 'ar', status: 'active', channels: s.channels,
    sender: s.sender, name: s.name, how: s.how,
    steps: [], examples: [{ text: s.example, synthetic: true }], phrases: s.phrases, signals: [],
    redFlags: s.redFlags, whatToDo: s.whatToDo, reportTo: [],
  };
  if (s.story) e.story = s.story;
  e.sources = s.sources;
  e.updated = updated;
  return e;
}

/** eschamuyo's own presentation data: list order and the isNew flags, keyed by short id. */
export function overlayFrom(data) {
  return { order: data.scams.map((s) => s.id), isNew: Object.fromEntries(data.scams.map((s) => [s.id, s.isNew])) };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const data = JSON.parse(readFileSync(process.argv[2], 'utf8'));
  mkdirSync('data/ar/scams', { recursive: true });
  mkdirSync('migration', { recursive: true });
  for (const s of data.scams) writeFileSync(`data/ar/scams/${s.id}.json`, JSON.stringify(migrateScam(s, data.updated), null, 2) + '\n');
  writeFileSync('migration/overlay.json', JSON.stringify(overlayFrom(data), null, 2) + '\n');
  console.log(`migrated ${data.scams.length} scams`);
}
