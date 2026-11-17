// The labelled test set (eval/messages/<cc>.json) and the numbers that say how well an engine does on it.
// An engine is any function msg -> { verdict, matches: [{ id }] } (sync or async), so the keyword matcher and the
// Workers AI scorer are measured the same way.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export const LABELS = ['scam', 'safe'];
export const CHANNELS = ['sms', 'whatsapp', 'email', 'call', 'social'];

/** Every message in eval/messages, each with its country. */
export function loadMessages(root) {
  const dir = join(root, 'eval', 'messages');
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith('.json')).sort().flatMap((f) => {
    const { country, messages } = JSON.parse(readFileSync(join(dir, f), 'utf8'));
    return messages.map((m) => ({ ...m, country }));
  });
}

/** Problems with the set itself (empty when it is fine). `entryIds` is the catalogue's Set of ids. */
export function checkMessages(messages, entryIds) {
  const problems = [];
  const seen = new Set();
  for (const m of messages) {
    const where = m.id ?? '(no id)';
    if (!m.id || seen.has(m.id)) problems.push(`${where}: missing or duplicate id`);
    seen.add(m.id);
    if (!m.id?.startsWith(`${m.country}-`) && !m.id?.startsWith(`p-${m.country}-`)) problems.push(`${where}: id must start with "${m.country}-" (or "p-${m.country}-" in the private set)`);
    if (!LABELS.includes(m.label)) problems.push(`${where}: label must be scam or safe`);
    if (!CHANNELS.includes(m.channel)) problems.push(`${where}: unknown channel ${m.channel}`);
    if (typeof m.text !== 'string' || m.text.trim().length < 10) problems.push(`${where}: text too short`);
    if (m.label === 'scam' && !entryIds.has(m.scam)) problems.push(`${where}: scam "${m.scam}" is not in the catalogue`);
    if (m.label === 'scam' && !m.scam?.startsWith(`${m.country}/`)) problems.push(`${where}: scam must be from ${m.country}`);
    if (m.label === 'safe' && m.scam !== null) problems.push(`${where}: a safe message has scam: null`);
    if (/https?:\/\/|www\./i.test(m.text ?? '')) problems.push(`${where}: write links as [link], not real URLs`);
    if (/\d[\d\s-]{8,}\d/.test(m.text ?? '')) problems.push(`${where}: looks like a real phone or card number; use [number]`);
  }
  return problems;
}

const flagged = (r) => r.verdict !== 'not_recognised';
const pct = (a, b) => (b ? Math.round((a / b) * 1000) / 10 : null);

function tally(rows) {
  const scams = rows.filter((r) => r.m.label === 'scam');
  const safe = rows.filter((r) => r.m.label === 'safe');
  const ids = (r) => r.out.matches.map((x) => x.id);
  return {
    scams: scams.length,
    safe: safe.length,
    caught: scams.filter((r) => flagged(r.out)).length, // scam or suspicious
    calledScam: scams.filter((r) => r.out.verdict === 'scam').length,
    top1: scams.filter((r) => ids(r)[0] === r.m.scam).length,
    top3: scams.filter((r) => ids(r).includes(r.m.scam)).length,
    wrongMatches: scams.reduce((n, r) => n + ids(r).filter((id) => id !== r.m.scam).length, 0),
    falseScam: safe.filter((r) => r.out.verdict === 'scam').length, // the costly mistake
    falseFlag: safe.filter((r) => flagged(r.out)).length, // scam or suspicious
    safeMatched: safe.filter((r) => r.out.matches.length).length,
  };
}

/** Percentages for a tally (what the report and the regression floor read). */
export function rates(t) {
  return {
    caught: pct(t.caught, t.scams), calledScam: pct(t.calledScam, t.scams), top1: pct(t.top1, t.scams), top3: pct(t.top3, t.scams),
    falseScam: pct(t.falseScam, t.safe), falseFlag: pct(t.falseFlag, t.safe), safeMatched: pct(t.safeMatched, t.safe),
  };
}

/** Runs `engine` over the messages (a few at a time) and returns { all, byCountry, misses }. */
export async function evaluate(messages, engine, { concurrency = 4 } = {}) {
  const rows = new Array(messages.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, messages.length) }, async () => {
    while (next < messages.length) {
      const i = next++;
      rows[i] = { m: messages[i], out: await engine(messages[i]) };
    }
  }));
  const byCountry = {};
  for (const cc of [...new Set(messages.map((m) => m.country))]) byCountry[cc] = tally(rows.filter((r) => r.m.country === cc));
  const misses = rows.filter((r) => (r.m.label === 'scam' ? r.out.matches[0]?.id !== r.m.scam || !flagged(r.out) : flagged(r.out) || r.out.matches.length))
    .map(({ m, out }) => ({ id: m.id, label: m.label, expected: m.scam, verdict: out.verdict, matches: out.matches.map((x) => x.id), text: m.text }));
  return { all: tally(rows), byCountry, misses };
}

/** A Markdown report: one table per engine, by country, then the misses. */
export function report(name, result, { showMisses = true } = {}) {
  const head = '| | scams caught | called "scam" | right match first | right match in top 3 | wrong matches | safe called "scam" | safe flagged | safe with a match |\n|---|---|---|---|---|---|---|---|---|';
  const line = (label, t) => {
    const r = rates(t);
    return `| ${label} | ${r.caught}% (${t.caught}/${t.scams}) | ${r.calledScam}% | ${r.top1}% | ${r.top3}% | ${t.wrongMatches} | ${r.falseScam}% (${t.falseScam}/${t.safe}) | ${r.falseFlag}% | ${r.safeMatched}% |`;
  };
  const rows = [line('**all**', result.all), ...Object.entries(result.byCountry).map(([cc, t]) => line(cc, t))];
  let out = `## ${name}\n\n${head}\n${rows.join('\n')}\n`;
  if (showMisses && result.misses.length) {
    out += `\n<details><summary>${result.misses.length} messages to look at</summary>\n\n` + result.misses.map((x) =>
      `- \`${x.id}\` (${x.label}${x.expected ? `, expected ${x.expected}` : ''}): ${x.verdict}${x.matches.length ? `, matched ${x.matches.join(', ')}` : ''}`).join('\n') + '\n\n</details>\n';
  }
  return out;
}

/** Cross-lingual check: messages ({ text, country, expected }) checked against another country; counts how often the
 * expected (foreign) entry is found in `elsewhere`, or anywhere in the answer. */
export async function evaluateCross(messages, engine) {
  let found = 0, first = 0, anywhere = 0;
  const misses = [];
  for (const m of messages) {
    const out = await engine(m);
    const abroad = (out.elsewhere ?? []).map((x) => x.id);
    const all = [...out.matches.map((x) => x.id), ...abroad];
    if (abroad.includes(m.expected)) found++;
    if (abroad[0] === m.expected) first++;
    if (all.includes(m.expected)) anywhere++; else misses.push({ id: m.id, expected: m.expected, got: abroad });
  }
  return { total: messages.length, found, first, anywhere, misses };
}
