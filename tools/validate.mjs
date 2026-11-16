// Validates everything under data/. Usage: node tools/validate.mjs [root]
// Prints "data: ok (N entries, M countries)" or one error per line (each starting with the file path) and exits 1.
import Ajv2020 from 'ajv/dist/2020.js';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { readRepoFiles } from '../lib/load.js';
import { tokens } from '../lib/text.js';

const SCHEMA_DIR = new URL('../schema/', import.meta.url);
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
// Links: a scheme, www., known shorteners, or a lowercase domain (case-sensitive, so "Pérez.Me dijo" is not a link).
const LINK = /https?:|www\.|\b(wa\.me|wa\.link|t\.me|bit\.ly|goo\.gl|tinyurl\.com)\b/i;
const DOMAIN = /\b[a-z0-9][a-z0-9-]*\.(com|ar|ly|me|net|org|io|gl|co|xyz|top|shop|online|site|info|link|club|store|app|live|click|icu|vip|fun|pro|biz|cc|ru|cn)\b|\b[a-z0-9][a-z0-9-]*\.[a-z]{2,}\/\S/;
// Phones: 8+ digits with spaces or hyphens, or dotted groups like 11.5555.1234 (money like $3.600.000 is not a phone).
const PHONE = /\+?\d[\d\s-]{7,}\d|\b\d{2,4}\.\d{3,4}\.\d{4}\b/;

let compiled;
function schemas() {
  if (compiled) return compiled;
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  for (const f of readdirSync(SCHEMA_DIR).filter((f) => f.endsWith('.json')))
    ajv.addSchema(JSON.parse(readFileSync(new URL(f, SCHEMA_DIR))));
  const get = (name) => ajv.getSchema(`https://scamdb.dev/schema/${name}.schema.json`);
  compiled = { entry: get('entry'), contacts: get('contacts'), countries: get('countries'), signals: get('signals') };
  return compiled;
}

/** "/sources/0/url" -> "sources[0].url" */
function field(pointer) {
  return pointer.split('/').filter(Boolean).reduce((s, p) => (/^\d+$/.test(p) ? `${s}[${p}]` : s ? `${s}.${p}` : p), '');
}

function schemaErrors(validate, json, path) {
  if (validate(json)) return [];
  const out = new Set();
  for (const e of validate.errors) {
    const at = field(e.instancePath) || '(file)';
    if (e.keyword === 'additionalProperties') out.add(`${path}: ${at === '(file)' ? '' : at + ': '}additional property "${e.params.additionalProperty}" is not allowed`);
    else if (e.keyword === 'required') out.add(`${path}: ${at === '(file)' ? '' : at + ': '}missing ${e.params.missingProperty}`);
    else if (e.keyword === 'pattern' && e.params.pattern === '^https://') out.add(`${path}: ${at} must start with https://`);
    else if (e.keyword === 'pattern' && e.params.pattern.includes('\\d{4}-\\d{2}-\\d{2}')) out.add(`${path}: ${at} must be a date (YYYY-MM-DD)`);
    else if (e.keyword === 'minItems') out.add(`${path}: ${at} needs at least ${e.params.limit} item(s)`);
    else if (e.keyword === 'enum') out.add(`${path}: ${at} must be one of ${e.params.allowedValues.join(', ')}`);
    else if (e.keyword !== 'if' && e.keyword !== 'allOf') out.add(`${path}: ${at} ${e.message}`);
  }
  return [...out];
}

/** A text field must carry English and the original language. */
function langErrors(path, field, obj, orig) {
  if (!obj || typeof obj !== 'object') return [];
  const out = [];
  if (!('en' in obj)) out.push(`${path}: ${field} needs an English version (en)`);
  if (orig && orig !== 'en' && !(orig in obj)) out.push(`${path}: ${field} needs the original language (${orig})`);
  return out;
}

/** Every localized string in a text or textList object, with its field name. */
function strings(obj, name) {
  const out = [];
  for (const [lang, v] of Object.entries(obj ?? {}))
    (Array.isArray(v) ? v : [v]).forEach((s, i) => out.push({ at: Array.isArray(v) ? `${name}.${lang}[${i}]` : `${name}.${lang}`, s: String(s) }));
  return out;
}

/** All problems in the data under root, each prefixed with its file path. Empty when valid. */
export function validateRepo(root) {
  const S = schemas();
  const f = readRepoFiles(root);
  const errors = [];
  for (const x of [f.countries, f.signals, ...f.contacts, ...f.entries]) if (x.error) errors.push(`${x.path}: invalid JSON (${x.error})`);
  if (f.countries.json) errors.push(...schemaErrors(S.countries, f.countries.json, f.countries.path));
  if (f.signals.json) errors.push(...schemaErrors(S.signals, f.signals.json, f.signals.path));

  const countryCodes = new Set((f.countries.json?.countries ?? []).map((c) => c.code));
  const countryLang = new Map((f.countries.json?.countries ?? []).map((c) => [c.code, c.languages?.[0]]));
  for (const c of f.countries.json?.countries ?? []) errors.push(...langErrors(f.countries.path, `countries.${c.code}.name`, c.name, c.languages?.[0]));
  const signalIds = new Set((f.signals.json?.signals ?? []).map((s) => s.id));
  const contactIds = new Set();
  for (const c of f.contacts) {
    if (!c.json) continue;
    errors.push(...schemaErrors(S.contacts, c.json, c.path));
    if (c.json.country !== c.country) errors.push(`${c.path}: country must be "${c.country}" (its folder)`);
    for (const k of c.json.contacts ?? []) {
      const orig = countryLang.get(c.country);
      for (const [field, v] of [['name', k.name], ['when', k.when], ['hours', k.hours], ...(k.ways ?? []).map((w, i) => [`ways[${i}].label`, w.label])])
        if (v) errors.push(...langErrors(c.path, `${k.id} ${field}`, v, orig));
      if (contactIds.has(k.id)) errors.push(`${c.path}: duplicate contact id "${k.id}"`);
      if (!String(k.id).startsWith(`${c.country}/`)) errors.push(`${c.path}: contact id "${k.id}" must start with ${c.country}/`);
      contactIds.add(k.id);
    }
  }

  const entryIds = new Set(f.entries.filter((e) => e.json).map((e) => e.json.id));
  const seen = new Set();
  const countriesWithEntries = new Set();
  for (const e of f.entries) {
    if (!e.json) continue;
    const { path, json: s } = e;
    const slug = e.file.replace(/\.json$/, '');
    countriesWithEntries.add(e.country);
    if (!SLUG.test(slug)) errors.push(`${path}: slug "${slug}" must be lowercase letters, numbers and hyphens`);
    if (s.id !== `${e.country}/${slug}`) errors.push(`${path}: id must be ${e.country}/${slug}`);
    if (seen.has(s.id)) errors.push(`${path}: duplicate id "${s.id}"`);
    seen.add(s.id);
    if (s.country !== e.country) errors.push(`${path}: country must be "${e.country}" (its folder)`);
    if (!countryCodes.has(e.country)) errors.push(`${path}: country "${e.country}" is not in data/countries.json`);
    errors.push(...schemaErrors(S.entry, s, path));
    if (s.lang) {
      for (const k of ['sender', 'name', 'how', 'story', 'phrases', 'redFlags', 'whatToDo']) if (s[k]) errors.push(...langErrors(path, k, s[k], s.lang));
      for (const [i, st] of (s.steps ?? []).entries()) errors.push(...langErrors(path, `steps[${i}].text`, st.text, s.lang));
      for (const [i, x] of (s.examples ?? []).entries()) errors.push(...langErrors(path, `examples[${i}].text`, x.text, s.lang));
    }

    // Source age: an active scam needs a source from the 2 years before `updated`; anything not archived, from the 5.
    const newest = (s.sources ?? []).map((x) => x.date).filter(Boolean).sort().at(-1);
    if (newest && s.updated) {
      const years = (Date.parse(s.updated) - Date.parse(newest)) / (365.25 * 864e5);
      if (s.status !== 'archived' && years > 5) errors.push(`${path}: needs a source from the 5 years before updated (newest is ${newest}); add one or mark it archived`);
      else if (s.status === 'active' && years > 2) errors.push(`${path}: an active scam needs a source from the 2 years before updated (newest is ${newest}); add one or mark it fading`);
    }

    for (const sig of s.signals ?? []) if (!signalIds.has(sig)) errors.push(`${path}: unknown signal "${sig}"`);
    for (const [i, st] of (s.steps ?? []).entries()) if (st.signal && !signalIds.has(st.signal)) errors.push(`${path}: steps[${i}]: unknown signal "${st.signal}"`);
    for (const r of s.related ?? []) if (!entryIds.has(r)) errors.push(`${path}: unknown related "${r}"`);
    for (const r of s.reportTo ?? []) if (!contactIds.has(r)) errors.push(`${path}: unknown contact "${r}"`);

    for (const [lang, list] of Object.entries(s.phrases ?? {})) {
      if (!Array.isArray(list)) continue;
      if (list.length < 5) errors.push(`${path}: phrases.${lang} needs at least 5 phrases (has ${list.length})`);
      for (const p of list) if (!tokens(p).length) errors.push(`${path}: phrase "${p}" has no meaningful words (it shrinks to filler)`);
    }
    const checked = [
      ...['sender', 'name', 'how', 'phrases', 'redFlags', 'whatToDo', 'story'].flatMap((k) => strings(s[k], k)),
      ...(s.steps ?? []).flatMap((x, i) => strings(x.text, `steps[${i}].text`)),
      ...(s.examples ?? []).flatMap((x, i) => strings(x.text, `examples[${i}].text`)),
    ];
    for (const { at, s: text } of checked) {
      if (LINK.test(text) || DOMAIN.test(text)) errors.push(`${path}: ${at} has a real link; write [enlace] or [link]`);
      else if (PHONE.test(text)) errors.push(`${path}: ${at} has a real phone number; leave it out`);
    }
  }
  for (const cc of countriesWithEntries)
    if (!f.contacts.some((c) => c.country === cc)) errors.push(`data/${cc}: a country with scams needs data/${cc}/contacts.json`);
  return errors;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const root = resolve(process.argv[2] ?? '.');
  const errors = validateRepo(root);
  if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
  const f = readRepoFiles(root);
  console.log(`data: ok (${f.entries.length} entries, ${f.countries.json.countries.length} countries)`);
}
