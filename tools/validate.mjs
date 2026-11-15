// Validates everything under data/. Usage: node tools/validate.mjs [root]
// Prints "data: ok (N entries, M countries)" or one error per line (each starting with the file path) and exits 1.
import Ajv2020 from 'ajv/dist/2020.js';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { readRepoFiles } from '../lib/load.js';
import { tokens } from '../lib/text.js';

const SCHEMA_DIR = new URL('../schema/', import.meta.url);
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const LINK = /https?:|www\.|\b[a-z0-9-]+\.(com|ar|ly|me|net|org|io|gl|co)\b|wa\.me|t\.me/i;
const PHONE = /\+?\d[\d\s-]{7,}\d/;

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
  const signalIds = new Set((f.signals.json?.signals ?? []).map((s) => s.id));
  const contactIds = new Set();
  for (const c of f.contacts) {
    if (!c.json) continue;
    errors.push(...schemaErrors(S.contacts, c.json, c.path));
    if (c.json.country !== c.country) errors.push(`${c.path}: country must be "${c.country}" (its folder)`);
    for (const k of c.json.contacts ?? []) {
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

    for (const sig of s.signals ?? []) if (!signalIds.has(sig)) errors.push(`${path}: unknown signal "${sig}"`);
    for (const [i, st] of (s.steps ?? []).entries()) if (st.signal && !signalIds.has(st.signal)) errors.push(`${path}: steps[${i}]: unknown signal "${st.signal}"`);
    for (const r of s.related ?? []) if (!entryIds.has(r)) errors.push(`${path}: unknown related "${r}"`);
    for (const r of s.reportTo ?? []) if (!contactIds.has(r)) errors.push(`${path}: unknown contact "${r}"`);

    for (const [lang, list] of Object.entries(s.phrases ?? {})) {
      if (!Array.isArray(list)) continue;
      if (list.length < 5) errors.push(`${path}: phrases.${lang} needs at least 5 phrases (has ${list.length})`);
      for (const p of list) if (!tokens(p).length) errors.push(`${path}: phrase "${p}" has no meaningful words (it shrinks to filler)`);
    }
    const checked = [...(s.examples ?? []).flatMap((x, i) => strings(x.text, `examples[${i}].text`)), ...strings(s.phrases, 'phrases')];
    for (const { at, s: text } of checked) {
      if (LINK.test(text)) errors.push(`${path}: ${at} has a real link; write [enlace]`);
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
