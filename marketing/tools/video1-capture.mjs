// Captures the live scamdb.dev in a phone-sized window for video 1 ("How it works").
// Usage: node marketing/tools/video1-capture.mjs   (re-run on the day you publish, so the video shows today's site)
// Writes marketing/videos/video1/capture/: type-NN.png (the message being typed), answer.png, entry.png (tall), meta.json
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

const ROOT = new URL('../../', import.meta.url).pathname;
const OUT = join(ROOT, 'marketing/videos/video1/capture');
// Real scam text quoted by ABC7 (KGO-TV), Oct 4, 2021, bank name replaced. Chosen because the in-browser check
// (which has no country setting) matches it to the US entry; the USPS, toll and FBI texts matched other countries.
const MSG = '[bank] fraud alert. Did you just attempt a Zelle transaction of $3,500? Please reply yes or no.';

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
// A US visitor: the page fills in "Where it arrived" from the time zone and language.
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: 'light', timezoneId: 'America/New_York', locale: 'en-US' });
await page.goto('https://scamdb.dev/?v=' + Date.now(), { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
const box = page.locator('#pg-text');
await box.fill('');
// Put the text box near the top of the screen, the way a visitor would scroll to it.
await page.evaluate(() => { const r = document.querySelector('#pg-text').getBoundingClientRect(); window.scrollBy(0, r.top - 150); });
await page.waitForTimeout(600);
// While typing, hide the answer panel: the check runs on every keystroke and half a message gives half-right answers.
// The final answer (shown after) is exactly what the site says for the full message.
await page.addStyleTag({ content: '#pg-out{visibility:hidden}' });
const words = MSG.split(' ');
let typed = '';
let n = 0;
for (let i = 0; i <= words.length; i += 1) {
  typed = words.slice(0, i).join(' ');
  await box.fill(typed);
  await page.waitForTimeout(120);
  await page.screenshot({ path: join(OUT, `type-${String(n++).padStart(2, '0')}.png`) });
}
await box.fill(MSG);
await page.waitForTimeout(2500);
await page.addStyleTag({ content: '#pg-out{visibility:visible !important}' });
await page.waitForTimeout(300);
await page.screenshot({ path: join(OUT, `type-${String(n++).padStart(2, '0')}.png`) });
// The answer: scroll so the verdict is in view.
await page.evaluate(() => { const r = document.querySelector('#pg-out').getBoundingClientRect(); window.scrollBy(0, r.top - 120); });
await page.waitForTimeout(800);
await page.screenshot({ path: join(OUT, 'answer.png') });
const verdict = await page.locator('#pg-out').innerText();
// The matching entry's page: the script and what to do (a tall screenshot that the video scrolls through).
await page.goto('https://scamdb.dev/catalogue/us/bank-fraud-alert-zelle/', { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: join(OUT, 'entry.png'), fullPage: true });
const height = await page.evaluate(() => document.documentElement.scrollHeight);
// Where the "The script" and "What to do" headings are on the page (CSS pixels from the top), for the scroll.
const headings = await page.evaluate(() => Object.fromEntries([...document.querySelectorAll('h2')].map((h) => [h.textContent.trim(), Math.round(h.getBoundingClientRect().top + window.scrollY)])));
await writeFile(join(OUT, 'meta.json'), JSON.stringify({ captured: new Date().toISOString(), typingFrames: n, verdict, entryHeight: height, headings, cssWidth: 390 }, null, 2));
await browser.close();
console.log(verdict.split('\n').slice(0, 6).join(' | '));
