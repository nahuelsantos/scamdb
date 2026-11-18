// Builds dist/: validates the data, writes the static API, then the site. Usage: node tools/build.mjs
import { rmSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { validateRepo } from './validate.mjs';
import { loadRepo } from '../lib/load.js';
import { withRealExamples } from '../lib/real-examples.js';
import { buildApi, datasetMeta } from './build-api.mjs';

const root = resolve(new URL('..', import.meta.url).pathname);
const out = join(root, 'dist');
const errors = validateRepo(root);
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }

// Real messages from eval/real go ahead of the written examples on the site and in the API.
const repo = withRealExamples(loadRepo(root), root);
const meta = datasetMeta(root);
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
const api = buildApi(repo, out, meta, root);
let site = [];
if (existsSync(join(root, 'tools/build-site.mjs'))) {
  const { buildSite } = await import('./build-site.mjs');
  site = buildSite(repo, out, meta, root);
}
copyFileSync(join(root, 'site/_headers'), join(out, '_headers'));
copyFileSync(join(root, 'site/_redirects'), join(out, '_redirects'));
console.log(`built ${meta.version}: ${api.length} API files, ${site.length} site files`);
