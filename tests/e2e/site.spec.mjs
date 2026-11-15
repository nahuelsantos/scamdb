import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const EN = ['/', '/catalogue/', '/catalogue/ar/whatsapp-codigo/', '/docs/', '/contribute/'];
const PAGES = [...EN, ...EN.map((p) => `/es${p}`)];

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

test('the Spanish playground answers in Spanish', async ({ page }) => {
  await page.goto('/es/');
  await expect(page.locator('#pg-out .stamp')).toHaveText('estafa');
  await page.getByRole('button', { name: 'Turno con la dentista' }).click();
  await expect(page.locator('#pg-out .stamp')).toHaveText('no lo reconocemos');
  await page.locator('#pg-text').fill('Tenés una encomienda, seguí el envío: [enlace]');
  await expect(page.locator('#pg-out .stamp')).toHaveText('sospechoso');
  await page.getByRole('button', { name: 'Código de PAMI' }).click();
  await expect(page.locator('#pg-out .match a').first()).toHaveAttribute('href', '/es/catalogue/ar/whatsapp-codigo/');
});

test('the language switch goes to the same page', async ({ page }) => {
  await page.goto('/docs/');
  await page.getByRole('link', { name: 'ES', exact: true }).click();
  await expect(page).toHaveURL(/\/es\/docs\/$/);
  await expect(page.locator('h1')).toHaveText('Documentación');
});
