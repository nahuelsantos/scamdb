// Tiny static server for previews and tests. Usage: node tools/serve.mjs [root=.] [port=0]
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';

const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.txt': 'text/plain', '.xml': 'application/xml' };

export function serve(root = '.', port = 0) {
  const base = resolve(root);
  const server = createServer(async (req, res) => {
    let path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname));
    let file = join(base, path);
    if (!file.startsWith(base)) { res.writeHead(403).end(); return; }
    try { if ((await stat(file)).isDirectory()) file = join(file, 'index.html'); } catch {}
    try {
      const body = await readFile(file);
      res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' }).end(body);
    } catch {
      try { res.writeHead(404, { 'content-type': TYPES['.html'] }).end(await readFile(join(base, '404.html'))); }
      catch { res.writeHead(404).end('not found'); }
    }
  });
  return new Promise((ok) => server.listen(port, '127.0.0.1', () => ok(server)));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const s = await serve(process.argv[2] || '.', Number(process.argv[3] || 8080));
  console.log(`serving on http://127.0.0.1:${s.address().port}`);
}
