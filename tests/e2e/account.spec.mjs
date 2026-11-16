import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const me = (over = {}) => ({ login: 'ana', hasKey: false, prefix: null, createdAt: null, usageToday: { reports: 0 }, limits: { reports: 200 }, ...over });

test('signed out shows the GitHub sign-in link', async ({ page }) => {
  await page.route('**/v1/keys/me', (r) => r.fulfill({ status: 401, json: { error: 'not_signed_in' } }));
  await page.goto('/account/');
  await expect(page.getByRole('link', { name: 'Sign in with GitHub' })).toHaveAttribute('href', '/auth/github');
});

test('signed in shows the login as text even when it contains HTML', async ({ page }) => {
  const evil = '<img src=x onerror=alert(1)>';
  await page.route('**/v1/keys/me', (r) => r.fulfill({ json: me({ login: evil }) }));
  await page.goto('/account/');
  await expect(page.locator('#acc-login')).toHaveText(evil);
  await expect(page.locator('#acc-login img')).toHaveCount(0);
});

test('creating a key shows it once', async ({ page }) => {
  let created = false;
  await page.route('**/v1/keys/me', (r) => r.fulfill({ json: created ? me({ hasKey: true, prefix: 'sk_abcd…' }) : me() }));
  await page.route('**/v1/keys', (r) => { created = true; return r.fulfill({ status: 201, json: { key: 'sk_' + 'a'.repeat(43), prefix: 'sk_abcd…' } }); });
  await page.goto('/account/');
  await page.getByRole('button', { name: 'Create key' }).click();
  await expect(page.locator('#acc-new-key')).toHaveText('sk_' + 'a'.repeat(43));
  await expect(page.locator('#acc-key')).toContainText('sk_abcd…');
  await expect(page.getByRole('button', { name: 'Replace key' })).toBeVisible();
});

test('the Spanish account page is in Spanish', async ({ page }) => {
  await page.route('**/v1/keys/me', (r) => r.fulfill({ status: 401, json: {} }));
  await page.goto('/es/account/');
  await expect(page.getByRole('link', { name: 'Entrar con GitHub' })).toBeVisible();
});

test('a GitHub error is explained', async ({ page }) => {
  await page.route('**/v1/keys/me', (r) => r.fulfill({ status: 401, json: {} }));
  await page.goto('/account/?error=github');
  await expect(page.locator('#acc-err')).toBeVisible();
});

for (const scheme of ['light', 'dark']) {
  test(`account passes axe (${scheme})`, async ({ page }) => {
    await page.route('**/v1/keys/me', (r) => r.fulfill({ json: me({ hasKey: true, prefix: 'sk_abcd…' }) }));
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto('/account/');
    await expect(page.locator('#acc-login')).toHaveText('ana');
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(r.violations.filter((v) => ['serious', 'critical'].includes(v.impact)).map((v) => v.id)).toEqual([]);
  });
}
