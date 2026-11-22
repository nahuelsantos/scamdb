import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const signedOut = (page) => page.route('**/v1/keys/me', (r) => r.fulfill({ status: 401, json: { error: 'not_signed_in' } }));
const signedIn = (page) => page.route('**/v1/keys/me', (r) => r.fulfill({ json: { login: 'ana', hasKey: true, viewable: true, prefix: 'sk_aaaa…', usageToday: { reports: 0 }, limits: { reports: 200 } } }));
test.beforeEach(async ({ page }) => { await page.route('https://challenges.cloudflare.com/**', (r) => r.abort()); });

test('the report page lives on scamdb, is reachable from the nav and has no accessibility violations', async ({ page }) => {
  await signedOut(page);
  await page.goto('/');
  await page.getByRole('link', { name: 'Report a scam' }).first().click();
  await expect(page).toHaveURL(/\/report\/$/);
  await expect(page.getByRole('heading', { name: 'Report a scam' })).toBeVisible();
  const r = await new AxeBuilder({ page }).analyze();
  expect(r.violations).toEqual([]);
});
test('signed out: the screenshot field is off and the check is required', async ({ page }) => {
  await signedOut(page);
  await page.goto('/report/');
  await expect(page.locator('#rep-drop')).toHaveClass(/\boff\b/);
  await page.locator('#rep-text').fill('Correos: su paquete está retenido, pague 1,99 € aquí [link]');
  await page.getByRole('button', { name: 'Send report' }).click();
  await expect(page.locator('#rep-err')).toContainText('complete the check');
});
test('only the message is needed: a missing message is explained, everything else is optional', async ({ page }) => {
  await signedIn(page);
  let sent;
  await page.route('**/v1/reports', (r) => { sent = r.request().postDataJSON(); return r.fulfill({ status: 201, json: { id: 'x', received: true } }); });
  await page.goto('/report/');
  await page.getByRole('button', { name: 'Send report' }).click();
  await expect(page.locator('#rep-err')).toContainText('Paste the message');
  await expect(page.locator('#rep-more')).not.toHaveAttribute('open', '');
  await page.locator('#rep-text').fill('Su paquete está retenido, pague 1,99 € [link]');
  await page.getByRole('button', { name: 'Send report' }).click();
  await expect(page.getByRole('heading', { name: 'Thank you!' })).toBeVisible();
  expect(sent).toMatchObject({ text: 'Su paquete está retenido, pague 1,99 € [link]', source: 'scamdb.dev' });
});
test('the country is guessed from the browser language and shown next to "Add details"', async ({ browser }) => {
  const ctx = await browser.newContext({ locale: 'fr-FR' });
  const page = await ctx.newPage();
  await signedIn(page);
  await page.goto('/report/');
  await expect(page.locator('#rep-country')).toHaveValue('fr');
  await expect(page.locator('#rep-more-sum')).toContainText('France');
  await ctx.close();
});
test('signed in: no check, sends JSON with the site header, and thanks you', async ({ page }) => {
  await signedIn(page);
  let sent;
  await page.route('**/v1/reports', (r) => { sent = { headers: r.request().headers(), body: r.request().postDataJSON() }; return r.fulfill({ status: 201, json: { id: 'x', received: true } }); });
  await page.goto('/report/');
  await expect(page.locator('#rep-shot')).toBeEnabled();
  await page.locator('#rep-more summary').click();
  await page.locator('#rep-country').selectOption('mx');
  await page.locator('#rep-channel').selectOption('sms');
  await page.locator('#rep-text').fill('BBVA: detectamos un cargo, llama al [número]');
  await page.getByRole('button', { name: 'Send report' }).click();
  await expect(page.getByRole('heading', { name: 'Thank you!' })).toBeVisible();
  expect(sent.headers['x-requested-with']).toBe('scamdb');
  expect(sent.body).toMatchObject({ country: 'mx', channel: 'sms', source: 'scamdb.dev', text: 'BBVA: detectamos un cargo, llama al [número]' });
  expect(sent.body.turnstileToken).toBeUndefined();
});
test('"Report this message" under the check result carries the message to the form', async ({ page }) => {
  await signedOut(page);
  await page.goto('/');
  await page.locator('#pg-text').fill('Hi Mum, new number, can you send $900 today?');
  await page.locator('#pg-out').getByRole('link', { name: 'Report this message' }).click();
  await expect(page).toHaveURL(/\/report\/$/);
  await expect(page.locator('#rep-text')).toHaveValue('Hi Mum, new number, can you send $900 today?');
});
test('a catalogue page offers to report one like it, with the country chosen', async ({ page }) => {
  await signedOut(page);
  await page.goto('/catalogue/');
  await page.locator('a[href^="/catalogue/es/"]').first().click();
  await page.getByRole('link', { name: /Report it/ }).click();
  await expect(page.locator('#rep-country')).toHaveValue('es');
});

test('trends: counts with names and bars, or an honest empty state', async ({ page }) => {
  await page.route('**/v1/trends?country=ar', (r) => r.fulfill({ json: { country: 'ar', weeks: 12, kMin: 5, reports: 14, scams: { '2026-11-09': { 'ar/whatsapp-codigo': 9, 'ar/falso-banco': 5 } }, withheld: 3 } }));
  await page.route('**/v1/trends?country=au', (r) => r.fulfill({ json: { country: 'au', weeks: 12, kMin: 5, reports: null, scams: {}, withheld: 0 } }));
  await page.goto('/trends/');
  await page.locator('#tr-country').selectOption('ar');
  await expect(page.locator('#tr-list li')).toHaveCount(2);
  await expect(page.locator('#tr-list li').first()).toContainText('9');
  await expect(page.locator('#tr-status')).toContainText('14 reports');
  await page.locator('#tr-country').selectOption('au');
  await expect(page.locator('#tr-status')).toContainText('Not enough reports yet');
  const r = await new AxeBuilder({ page }).analyze();
  expect(r.violations).toEqual([]);
});

test('a large screenshot is shrunk to a JPEG before upload, and a server failure says so', async ({ page }) => {
  await signedIn(page);
  let sent = null;
  await page.route('**/v1/reports', (r) => { const buf = r.request().postDataBuffer(); sent = { bytes: buf.length, jpeg: buf.includes(Buffer.from('image/jpeg')) };
    return r.fulfill({ status: 503, contentType: 'text/html', body: '<h1>Error 1102</h1>' }); });
  await page.goto('/report/');
  const png = await page.evaluate(async () => { const c = document.createElement('canvas'); c.width = 1179; c.height = 2556; const x = c.getContext('2d');
    for (let y = 0; y < 2556; y += 40) { x.fillStyle = `hsl(${y % 360} 60% 50%)`; x.fillRect(0, y, 1179, 40); x.fillStyle = '#000'; x.font = '32px sans-serif'; x.fillText(`line ${y} of a long message`, 20, y + 30); }
    const blob = await new Promise((r) => c.toBlob(r, 'image/png')); return Array.from(new Uint8Array(await blob.arrayBuffer())); });
  await page.locator('#rep-more summary').click();
  await page.locator('#rep-country').selectOption('es');
  await page.locator('#rep-shot').setInputFiles({ name: 'shot.png', mimeType: 'image/png', buffer: Buffer.from(png) });
  await page.locator('#rep-send').click();
  await expect(page.getByText(/couldn’t finish reading the screenshot.*\(503\)/)).toBeVisible();
  expect(sent.jpeg).toBe(true);
  expect(sent.bytes).toBeLessThan(png.length);
});

// ---- Screenshot upload, the way a person does it: clicking the box and dragging a file onto it ----
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
const dropFile = (page, name = 'shot.png', type = 'image/png') => page.evaluate(async ({ name, type, b64 }) => {
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const dt = new DataTransfer();
  dt.items.add(new File([bytes], name, { type }));
  const zone = document.getElementById('rep-drop');
  for (const ev of ['dragenter', 'dragover', 'drop']) zone.dispatchEvent(new DragEvent(ev, { bubbles: true, cancelable: true, dataTransfer: dt }));
}, { name, type, b64: PNG.toString('base64') });

test('signed in with a key: clicking the box opens the file picker and the chosen file is shown', async ({ page }) => {
  await signedIn(page);
  await page.goto('/report/');
  await expect(page.locator('#rep-drop')).not.toHaveClass(/\boff\b/);
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.locator('#rep-drop').click()]);
  await chooser.setFiles({ name: 'whatsapp.png', mimeType: 'image/png', buffer: PNG });
  await expect(page.locator('#rep-drop-main')).toHaveText('whatsapp.png');
});
test('signed in with a key: dropping a picture on the box selects it', async ({ page }) => {
  await signedIn(page);
  await page.goto('/report/');
  await expect(page.locator('#rep-drop')).not.toHaveClass(/\boff\b/);
  await dropFile(page, 'sms.png');
  await expect(page.locator('#rep-drop-main')).toHaveText('sms.png');
  expect(await page.locator('#rep-shot').evaluate((i) => i.files.length)).toBe(1);
});
test('signed out: the box says to sign in, and clicking it goes to GitHub sign-in and back to the form', async ({ page }) => {
  await signedOut(page);
  await page.route('**/auth/github?next=/report/', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<p>sign-in</p>' }));
  await page.goto('/report/');
  await expect(page.locator('#rep-drop-main')).toHaveText('Sign in to add a screenshot');
  await expect(page.locator('#rep-shot-fix')).toHaveAttribute('href', '/auth/github?next=/report/');
  await page.locator('#rep-drop').click();
  await expect(page).toHaveURL(/\/auth\/github\?next=\/report\/$/);
});
test('signed out: pressing Enter on the focused box also goes to sign-in, never to an empty picker', async ({ page }) => {
  await signedOut(page);
  await page.route('**/auth/github?next=/report/', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<p>sign-in</p>' }));
  await page.goto('/report/');
  await expect(page.locator('#rep-drop')).toHaveClass(/\boff\b/);
  let picker = false;
  page.on('filechooser', () => { picker = true; });
  await page.locator('#rep-shot').focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/auth\/github\?next=\/report\/$/);
  expect(picker).toBe(false);
});
test('signed out: dropping a picture explains why instead of doing nothing', async ({ page }) => {
  await signedOut(page);
  await page.goto('/report/');
  await expect(page.locator('#rep-drop')).toHaveClass(/\boff\b/);
  await dropFile(page);
  await expect(page.locator('#rep-err')).toBeVisible();
  await expect(page.locator('#rep-err')).toContainText('Sign in with GitHub');
});
test('signed in without a key: the box leads to the account page to create one', async ({ page }) => {
  await page.route('**/v1/keys/me', (r) => r.fulfill({ json: { login: 'ana', hasKey: false, usageToday: { reports: 0 }, limits: { reports: 200 } } }));
  await page.goto('/report/');
  await expect(page.locator('#rep-drop-main')).toHaveText('Create your free key to add a screenshot');
  await expect(page.locator('#rep-shot-fix')).toHaveAttribute('href', '/account/');
});
test('signed in: dropping a file that is not a picture says so', async ({ page }) => {
  await signedIn(page);
  await page.goto('/report/');
  await expect(page.locator('#rep-drop')).not.toHaveClass(/\boff\b/);
  await dropFile(page, 'notes.pdf', 'application/pdf');
  await expect(page.locator('#rep-err')).toContainText('not a picture');
});
