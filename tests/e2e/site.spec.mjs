import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// No country can be guessed here (no region in the language, a time zone outside the map): the home check matches
// every country, as before the country selector. The country tests below set their own.
test.use({ locale: 'en', timezoneId: 'UTC' });

const EN = ['/', '/catalogue/', '/catalogue/ar/whatsapp-codigo/', '/docs/', '/contribute/'];
const PAGES = EN;

test('home loads with no console errors', async ({ page }) => {
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('A field guide to');
  await page.getByRole('button', { name: 'Dentist reminder' }).click();
  await expect(page.locator('#pg-out .stamp')).toHaveText('not recognised');
  expect(errors).toEqual([]);
});

test('pasting a scam shows the verdict and a working match link', async ({ page }) => {
  await page.goto('/');
  await page.locator('#pg-text').fill('Hola ma, cambié de número, agendalo y pasame plata por transferencia');
  await expect(page.locator('#pg-out .stamp')).toHaveText('scam');
  await page.getByRole('button', { name: 'Bank fraud team' }).click();
  const link = page.locator('#pg-out .match a').first();
  await expect(link).toHaveText(/bank/);
  const res = await page.request.get(await link.getAttribute('href'));
  expect(res.status()).toBe(200);
});

for (const scheme of ['light', 'dark']) {
  for (const path of PAGES) {
    test(`${path} passes axe (${scheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto(path);
      const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
      const bad = r.violations.filter((v) => ['serious', 'critical'].includes(v.impact));
      expect(bad.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`)).toEqual([]);
    });
  }
}

test('no horizontal scroll at phone width', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  for (const path of PAGES) {
    await page.goto(path);
    const [sw, cw] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
    expect(sw, path).toBeLessThanOrEqual(cw);
  }
});

test('pasting an English scam gets English signs and a match', async ({ page }) => {
  await page.goto('/');
  await page.locator('#pg-text').fill("Hi, this is your bank's fraud department. They will send you a 6-digit code, read it to me. Don't hang up.");
  await expect(page.locator('#pg-out .stamp')).toHaveText('scam');
  await expect(page.locator('#pg-out .why code').first()).toHaveText('asks_for_code');
  await page.locator('#pg-text').fill('they asked me for a WhatsApp code');
  await expect(page.locator('#pg-out .match a').first()).toHaveText('ar/whatsapp-codigo');
});

test('the API button shows the endpoint JSON', async ({ page }) => {
  await page.route('**/v1/isitascam', (r) => r.fulfill({ json: { verdict: 'scam', score: null, signals: [], matches: [], engine: { matcher: '1.0.0', scorer: 'matcher' } } }));
  await page.goto('/');
  await page.getByRole('button', { name: 'Check with the API' }).click();
  await expect(page.locator('.api-out')).toBeVisible();
  await expect(page.locator('.api-out')).toContainText('"verdict": "scam"');
  await expect(page.locator('#pg-api-sum')).toContainText('Sign in and create a free key');
});

test('signed in with a key, the API button sends the site header and shows the AI score', async ({ page }) => {
  let header;
  await page.route('**/v1/isitascam', (r) => { header = r.request().headers()['x-requested-with']; return r.fulfill({ json: { verdict: 'scam', score: 0.93, signals: [], matches: [], engine: { matcher: '1.1.0', scorer: 'workers-ai' } } }); });
  await page.goto('/');
  await page.getByRole('button', { name: 'Check with the API' }).click();
  await expect(page.locator('#pg-api-sum')).toContainText('scam probability 93%');
  expect(header).toBe('scamdb');
});

test('a 429 from the API shows its message', async ({ page }) => {
  await page.route('**/v1/isitascam', (r) => r.fulfill({ status: 429, json: { error: 'too_many_checks', message: 'Daily limit reached (10 checks).' } }));
  await page.goto('/');
  await page.getByRole('button', { name: 'Check with the API' }).click();
  await expect(page.locator('.api-out')).toContainText('Daily limit reached');
});

test('the API is served as JSON', async ({ request }) => {
  const res = await request.get('/v1/ar/scams.json');
  expect(res.status()).toBe(200);
  expect((await res.json()).data.length).toBeGreaterThanOrEqual(20);
});

test('the original version of a scam opens and passes axe at phone width', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/catalogue/ar/whatsapp-codigo/');
  await expect(page.locator('.translation').first()).toBeVisible();
  await page.locator('.original summary').click();
  await expect(page.locator('.original > div[lang="es"] h2')).toHaveText('Robo de WhatsApp con el código de 6 números');
  const [sw, cw] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
  expect(sw).toBeLessThanOrEqual(cw);
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(r.violations.filter((v) => ['serious', 'critical'].includes(v.impact)).map((v) => v.id)).toEqual([]);
});

test('there is no language switch', async ({ page }) => {
  await page.goto('/docs/');
  await expect(page.getByRole('link', { name: 'Español' })).toHaveCount(0);
});

const USPS = 'USPS: The package arrived at the warehouse but could not be delivered due to incomplete address information. Please confirm your address in the link within 12 hours.';

test('with no country, the home check matches every country', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#pg-country')).toHaveValue('');
  await page.locator('#pg-text').fill(USPS);
  await expect(page.locator('#pg-out .match a').first()).toHaveText('in/india-post-address');
});

test.describe('the visitor\'s country', () => {
  test.use({ locale: 'en-GB', timezoneId: 'America/New_York' });

  test('is guessed from the time zone first, and the check matches its scams', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#pg-country')).toHaveValue('us');
    await page.locator('#pg-text').fill(USPS);
    await expect(page.locator('#pg-out .match a').first()).toHaveText('us/usps-delivery-text');
    await expect(page.locator('#pg-out .elsewhere')).toHaveCount(0);
  });

  test('a strong fit from another country shows as "Also seen in"; the choice is remembered', async ({ page }) => {
    await page.goto('/');
    await page.locator('#pg-country').selectOption('es');
    await page.locator('#pg-text').fill(USPS);
    await expect(page.locator('#pg-out .match a').first()).toHaveText(/^es\//);
    await expect(page.locator('#pg-out .elsewhere')).toContainText('Also seen in in/india-post-address');
    await expect(page.locator('#pg-out .elsewhere')).toContainText('(India)');
    await page.reload();
    await expect(page.locator('#pg-country')).toHaveValue('es');
    await page.locator('#pg-country').selectOption('');
    await page.reload();
    await expect(page.locator('#pg-country')).toHaveValue('');
  });

  test('the API button and the report form get the same country', async ({ page }) => {
    let sent;
    await page.route('**/v1/isitascam', (r) => { sent = r.request().postDataJSON(); return r.fulfill({ json: { verdict: 'suspicious', score: null, signals: [], matches: [] } }); });
    await page.goto('/');
    await page.locator('#pg-country').selectOption('ca');
    await page.locator('#pg-text').fill(USPS);
    await page.getByRole('button', { name: 'Check with the API' }).click();
    await expect(page.locator('.api-out')).toContainText('suspicious');
    expect(sent.country).toBe('ca');
    await page.locator('#pg-out [data-report]').click();
    await expect(page.locator('#rep-country')).toHaveValue('ca');
  });
});

test('the hero leads with checking and reporting; developer links come second', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.logo')).toHaveText('scamdb');
  await page.getByRole('link', { name: 'Check a message' }).click();
  await expect(page.locator('#pg-text')).toBeFocused();
  await expect(page.locator('.hero .btns').getByRole('link', { name: 'Report a scam' })).toHaveAttribute('href', '/report/');
  for (const [name, href] of [['Read the docs', '/docs/'], ['Get a free key', '/account/'], ['Browse the catalogue', '/catalogue/']])
    await expect(page.locator('.hero .dev').getByRole('link', { name })).toHaveAttribute('href', href);
});
