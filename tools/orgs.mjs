#!/usr/bin/env node
// Owner tool: approve organisations for the feed (production D1; needs `wrangler login`).
//   node tools/orgs.mjs list
//   node tools/orgs.mjs approve <github-login> "<Organisation name>"   (the person must have created a key first)
//   node tools/orgs.mjs revoke <github-login>
import { execFileSync } from 'node:child_process';

const LOGIN = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;
const ORG = /^[\p{L}\p{N} .,&()'-]{2,80}$/u;
const q = (s) => `'${s.replace(/'/g, "''")}'`;

/** The SQL for a command. Every value is validated before it is inlined. */
export function buildQuery(cmd, args) {
  if (cmd === 'list') return 'SELECT github_login, org, feed, created_at FROM keys WHERE feed = 1 OR org IS NOT NULL ORDER BY org';
  const [login, org] = args;
  if (!LOGIN.test(login ?? '')) throw new Error('a GitHub login (letters, digits and hyphens)');
  if (cmd === 'approve') {
    if (!ORG.test(org ?? '')) throw new Error('an organisation name, 2–80 letters, digits and simple punctuation');
    return `UPDATE keys SET feed = 1, org = ${q(org)} WHERE github_login = ${q(login)}`;
  }
  if (cmd === 'revoke') return `UPDATE keys SET feed = 0 WHERE github_login = ${q(login)}`;
  throw new Error('usage: orgs list | orgs approve <login> "<Organisation>" | orgs revoke <login>');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [cmd, ...args] = process.argv.slice(2);
  const sql = buildQuery(cmd, args);
  const out = JSON.parse(execFileSync('npx', ['wrangler', 'd1', 'execute', 'scamdb', '--remote', '--json', '--command', sql], { encoding: 'utf8' }))[0];
  if (cmd === 'list') console.table(out.results);
  else console.log(out.meta.changes ? 'Done.' : 'No key found for that login: they need to sign in and create a key first.');
}
