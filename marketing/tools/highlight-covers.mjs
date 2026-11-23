// Instagram Story Highlight covers (1080×1920; Instagram crops the centre to a circle). Site style, one drawing each.
// Usage: npm run build && node marketing/tools/highlight-covers.mjs
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { serve } from '../../tools/serve.mjs';
import { sketch } from '../../lib/sketch.js';
import { LOGO } from '../../site/templates/logo.js';
import { ICONS } from '../../site/templates/icons.js';

const ROOT = new URL('../../', import.meta.url).pathname;
const q = sketch(4401);
const QUESTION = `<svg viewBox="0 0 64 64">${q.circle(32, 32, 56, { fill: 'card', shade: true })}</svg>`;
const COVERS = [
  ['how-it-works', ICONS.sms, ''],
  ['scams', LOGO, ''],
  ['real-or-scam', QUESTION, '<div class="qm">A<span>/</span>B</div>'],
];
const page = (svg, extra) => `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="/assets/styles.css"><style>
html,body{margin:0;background:var(--paper)}
.c{position:relative;width:1080px;height:1920px;background:var(--paper);display:flex;align-items:center;justify-content:center}
.art{position:relative;width:620px;height:620px}.art svg{width:100%;height:100%}
.qm{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:var(--display);font-weight:700;font-size:200px;letter-spacing:-.04em;color:var(--ink)}
.qm span{color:var(--accent);margin:0 .06em}
</style></head><body><div class="c"><div class="art">${svg}${extra}</div></div></body></html>`;

await mkdir(join(ROOT, 'dist/_mk'), { recursive: true });
const server = await serve(join(ROOT, 'dist'), 0);
const b = await chromium.launch();
for (const [name, svg, extra] of COVERS) {
  await writeFile(join(ROOT, 'dist/_mk', `hl-${name}.html`), page(svg, extra));
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1, colorScheme: 'light' });
  await p.goto(`http://127.0.0.1:${server.address().port}/_mk/hl-${name}.html`, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: join(ROOT, 'marketing/brand/highlights', `highlight-${name}.png`) });
  await p.close();
}
await b.close(); server.close();
console.log('ok');
