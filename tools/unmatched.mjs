#!/usr/bin/env node
// Real, documented scams that follow no known pattern (docs/vision.md): the real messages in eval/real with
// `scam: null`. Similar ones are grouped; a group of two or more is a candidate new pattern for a human to review.
//
//   node tools/unmatched.mjs          Markdown report
//   node tools/unmatched.mjs --json   the same as JSON ({ groups: [{ ids, messages }] })
//
// The weekly check posts the report to a GitHub issue labelled `unknown-pattern` when new messages appear.
import { resolve } from 'node:path';
import { loadRealMessages } from '../lib/eval.js';
import { normalize, tokens } from '../lib/text.js';

const UNSPACED = /[฀-໿က-႟ក-៿぀-ヿ㐀-鿿]/u;

/** Words for comparison: tokens, or two-character pieces for scripts written without spaces. */
export function features(text) {
  const t = normalize(text);
  if (UNSPACED.test(t)) { const s = new Set(); for (let i = 0; i + 1 < t.length; i++) if (t[i] !== ' ' && t[i + 1] !== ' ') s.add(t.slice(i, i + 2)); return s; }
  return new Set(tokens(t));
}

const jaccard = (a, b) => { let n = 0; for (const x of a) if (b.has(x)) n++; return n / (a.size + b.size - n || 1); };

/** Groups messages whose word sets overlap enough (single link), largest groups first. */
export function group(messages, threshold = 0.2) {
  const f = messages.map((m) => features(m.text));
  const parent = messages.map((_, i) => i);
  const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  for (let i = 0; i < messages.length; i++) for (let j = i + 1; j < messages.length; j++) if (jaccard(f[i], f[j]) >= threshold) parent[find(i)] = find(j);
  const groups = new Map();
  messages.forEach((m, i) => { const r = find(i); if (!groups.has(r)) groups.set(r, []); groups.get(r).push(m); });
  return [...groups.values()].sort((a, b) => b.length - a.length);
}

export function unmatched(root) {
  return loadRealMessages(root).filter((m) => m.label === 'scam' && !m.scam);
}

export function toMarkdown(groups) {
  const line = (m) => `- \`${m.id}\` (${m.country}, ${m.channel ?? 'unknown channel'}) [${m.source?.publisher ?? 'source'}](${m.source?.url ?? ''}): ${m.text.replace(/\s+/g, ' ').slice(0, 160)}`;
  const multi = groups.filter((g) => g.length > 1), single = groups.filter((g) => g.length === 1);
  return [
    `# Real scams with no known pattern`,
    '',
    `${groups.reduce((n, g) => n + g.length, 0)} documented scam messages match no pattern in the catalogue. Investigate them: each is either a new pattern (draft an entry from its sources) or belongs to an existing entry (set its \`scam\` in \`eval/real\`).`,
    '',
    '## Possible new patterns (similar messages)',
    '',
    multi.length ? multi.map((g, i) => [`### Group ${i + 1} (${g.length} messages)`, ...g.map(line)].join('\n')).join('\n\n') : 'None.',
    '',
    '## Single messages',
    '',
    single.length ? single.map((g) => line(g[0])).join('\n') : 'None.',
    '',
  ].join('\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const groups = group(unmatched(resolve('.')));
  console.log(process.argv.includes('--json') ? JSON.stringify({ groups: groups.map((g) => ({ ids: g.map((m) => m.id), messages: g })) }, null, 2) : toMarkdown(groups));
}
