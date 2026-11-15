import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PAGES = ['/', '/catalogue/', '/catalogue/ar/whatsapp-codigo/', '/docs/', '/contribute/'];

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
  await page.getByRole('button', { name: 'PAMI code' }).click();
  const link = page.locator('#pg-out .match a').first();
  await expect(link).toHaveText('ar/whatsapp-codigo');
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

test('the API is served as JSON', async ({ request }) => {
  const res = await request.get('/v1/ar/scams.json');
  expect(res.status()).toBe(200);
  expect((await res.json()).data.length).toBe(20);
});
