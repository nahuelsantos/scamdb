// Screenshots of the built site for docs/screenshots. Usage: node tools/screenshots.mjs (after npm run build)
import { chromium } from 'playwright';
import { serve } from './serve.mjs';

const server = await serve('dist', 0);
const base = `http://127.0.0.1:${server.address().port}`;
const b = await chromium.launch();
const shots = [['home-desktop-light', '/', 1280, 900, 'light'], ['home-phone-dark', '/', 390, 844, 'dark'], ['entry-desktop-dark', '/catalogue/ar/whatsapp-codigo/', 1280, 900, 'dark'],
  ['entry-desktop-light', '/catalogue/ar/whatsapp-codigo/', 1280, 900, 'light']];
for (const [name, path, width, height, colorScheme] of shots) {
  const p = await b.newPage({ viewport: { width, height }, deviceScaleFactor: 2, colorScheme });
  await p.goto(base + path, { waitUntil: 'networkidle' });
  await p.screenshot({ path: `docs/screenshots/${name}.png`, fullPage: true });
  await p.close();
}
await b.close();
server.close();
