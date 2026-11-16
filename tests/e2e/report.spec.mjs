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
  await expect(page.locator('#rep-shot')).toBeDisabled();
  await page.locator('#rep-country').selectOption('es');
  await page.locator('#rep-text').fill('Correos: su paquete está retenido, pague 1,99 € aquí [link]');
  await page.getByRole('button', { name: 'Send report' }).click();
  await expect(page.locator('#rep-err')).toContainText('complete the check');
});
test('missing country or message is explained', async ({ page }) => {
  await signedIn(page);
  await page.goto('/report/');
  await page.getByRole('button', { name: 'Send report' }).click();
  await expect(page.locator('#rep-err')).toContainText('Choose your country');
  await page.locator('#rep-country').selectOption('ar');
  await page.getByRole('button', { name: 'Send report' }).click();
  await expect(page.locator('#rep-err')).toContainText('Paste the message');
});
test('signed in: no check, sends JSON with the site header, and thanks you', async ({ page }) => {
  await signedIn(page);
  let sent;
  await page.route('**/v1/reports', (r) => { sent = { headers: r.request().headers(), body: r.request().postDataJSON() }; return r.fulfill({ status: 201, json: { id: 'x', received: true } }); });
  await page.goto('/report/');
  await expect(page.locator('#rep-shot')).toBeEnabled();
  await page.locator('#rep-country').selectOption('mx');
  await page.locator('#rep-channel').selectOption('sms');
  await page.locator('#rep-text').fill('BBVA: detectamos un cargo, llama al [número]');
  await page.getByRole('button', { name: 'Send report' }).click();
  await expect(page.getByRole('heading', { name: 'Thank you!' })).toBeVisible();
  expect(sent.headers['x-requested-with']).toBe('scamdb');
  expect(sent.body).toMatchObject({ country: 'mx', channel: 'sms', source: 'scamdb.dev', text: 'BBVA: detectamos un cargo, llama al [número]' });
  expect(sent.body.turnstileToken).toBeUndefined();
});
test('"Report this message" on the home page carries the message to the form', async ({ page }) => {
  await signedOut(page);
  await page.goto('/');
  await page.locator('#pg-text').fill('Hi Mum, new number, can you send $900 today?');
  await page.getByRole('link', { name: 'Report this message' }).click();
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
