// Checks every ```x block in marketing/posts/**/post.md against the free X limit (280; each URL counts as 23).
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : p.endsWith('post.md') ? [p] : []; });
let bad = 0;
for (const file of walk(new URL('../posts', import.meta.url).pathname)) {
  for (const [, body] of readFileSync(file, 'utf8').matchAll(/```x\n([\s\S]*?)```/g)) {
    const text = body.replace(/\n$/, '');
    const len = [...text.replace(/https?:\/\/\S+/g, 'x'.repeat(23))].length;
    if (len > 280) bad++;
    console.log(`${len > 280 ? 'TOO LONG' : 'ok'} ${String(len).padStart(3)}  ${file.split('/posts/')[1]}  ${text.split('\n')[0].slice(0, 50)}`);
  }
}
process.exit(bad ? 1 : 0);
