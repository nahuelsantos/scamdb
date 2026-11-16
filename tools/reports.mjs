// Owner tool: read and mark private reports in the production D1 database (needs `wrangler login`).
//   npm run reports list [--status new] [--limit 200] [--with-contact]   → reports/inbox-<date>.json (gitignored)
//   npm run reports mark <reviewed|promoted|rejected|new> <id…>
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

const STATUSES = ['new', 'reviewed', 'promoted', 'rejected'];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** The SQL for a command. Every value is validated before it is inlined. */
export function buildQuery(cmd, args) {
  if (cmd === 'list') {
    const opt = (name, def) => { const i = args.indexOf(name); return i === -1 ? def : args[i + 1]; };
    const status = opt('--status', 'new');
    const limit = Number(opt('--limit', '200'));
    if (!STATUSES.includes(status)) throw new Error(`status must be one of ${STATUSES.join(', ')}`);
    if (!Number.isInteger(limit) || limit < 1 || limit > 1000) throw new Error('limit must be an integer from 1 to 1000');
    const cols = ['id', 'created_at', 'country', 'channel', 'scam_id', 'brands', 'text', 'what_happened', 'source', ...(args.includes('--with-contact') ? ['contact'] : [])];
    return `SELECT ${cols.join(', ')} FROM reports WHERE status = '${status}' ORDER BY created_at LIMIT ${limit}`;
  }
  if (cmd === 'mark') {
    const [status, ...ids] = args;
    if (!STATUSES.includes(status)) throw new Error(`status must be one of ${STATUSES.join(', ')}`);
    if (!ids.length || !ids.every((id) => UUID.test(id))) throw new Error('every id must be a report UUID');
    return `UPDATE reports SET status = '${status}' WHERE id IN (${ids.map((id) => `'${id}'`).join(', ')})`;
  }
  throw new Error('usage: reports list [--status new] [--limit 200] [--with-contact] | reports mark <status> <id…>');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [cmd, ...args] = process.argv.slice(2);
  const sql = buildQuery(cmd, args);
  const out = execFileSync('npx', ['wrangler', 'd1', 'execute', 'scamdb', '--remote', '--json', '--command', sql], { encoding: 'utf8' });
  const result = JSON.parse(out)[0];
  if (cmd === 'list') {
    mkdirSync('reports', { recursive: true });
    const file = `reports/inbox-${new Date().toISOString().slice(0, 10)}.json`;
    writeFileSync(file, JSON.stringify(result.results, null, 2) + '\n');
    console.log(`${result.results.length} report(s) → ${file}`);
  } else {
    console.log(`${result.meta?.changes ?? 0} report(s) marked ${args[0]}`);
  }
}
