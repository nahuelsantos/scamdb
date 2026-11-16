import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const me = (over = {}) => ({ login: 'ana', hasKey: false, viewable: over.hasKey ?? false, prefix: null, createdAt: null, usageToday: { reports: 0 }, limits: { reports: 200 }, ...over });

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

test('the key is masked like a password; the eye shows it and the copy button copies it', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const KEY = 'sk_' + 'b'.repeat(43);
  await page.route('**/v1/keys/me', (r) => r.fulfill({ json: me({ hasKey: true, prefix: 'sk_bbbb…' }) }));
  let revealHeader;
  await page.route('**/v1/keys/me/reveal', (r) => { revealHeader = r.request().headers()['x-requested-with']; return r.fulfill({ json: { key: KEY } }); });
  await page.goto('/account/');
  const input = page.locator('#acc-key');
  await expect(input).toHaveAttribute('type', 'password');
  await expect(input).not.toHaveValue(KEY);
  await page.getByRole('button', { name: 'Show key' }).click();
  await expect(input).toHaveAttribute('type', 'text');
  await expect(input).toHaveValue(KEY);
  expect(revealHeader).toBe('scamdb');
  await page.getByRole('button', { name: 'Hide key' }).click();
  await expect(input).toHaveAttribute('type', 'password');
  await page.getByRole('button', { name: 'Copy' }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(KEY);
});

test('a key that cannot be shown again has no show or copy buttons, just how to fix it', async ({ page }) => {
  await page.route('**/v1/keys/me', (r) => r.fulfill({ json: me({ hasKey: true, viewable: false, prefix: 'sk_old…' }) }));
  await page.goto('/account/');
  await expect(page.locator('#acc-key')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Show key' })).toBeHidden();
  await expect(page.getByRole('button', { name: 'Copy' })).toBeHidden();
  await expect(page.locator('#acc-hint')).toContainText('Replace it');
});

test('if showing the key fails, the show and copy buttons go away', async ({ page }) => {
  await page.route('**/v1/keys/me', (r) => r.fulfill({ json: me({ hasKey: true, prefix: 'sk_old…' }) }));
  await page.route('**/v1/keys/me/reveal', (r) => r.fulfill({ status: 404, json: { error: 'key_not_viewable' } }));
  await page.goto('/account/');
  await page.getByRole('button', { name: 'Show key' }).click();
  await expect(page.getByRole('button', { name: 'Show key' })).toBeHidden();
  await expect(page.getByRole('button', { name: 'Copy' })).toBeHidden();
  await expect(page.locator('#acc-hint')).toContainText('Replace it');
});

test('creating a key keeps it masked until you choose to see it', async ({ page }) => {
  let created = false;
  await page.route('**/v1/keys/me', (r) => r.fulfill({ json: created ? me({ hasKey: true, prefix: 'sk_aaaa…' }) : me() }));
  await page.route('**/v1/keys', (r) => { created = true; return r.fulfill({ status: 201, json: { key: 'sk_' + 'a'.repeat(43), prefix: 'sk_aaaa…' } }); });
  await page.goto('/account/');
  await page.getByRole('button', { name: 'Create key' }).click();
  await expect(page.locator('#acc-key')).toHaveAttribute('type', 'password');
  await page.getByRole('button', { name: 'Show key' }).click();
  await expect(page.locator('#acc-key')).toHaveValue('sk_' + 'a'.repeat(43));
});

test('controls never touch: at least 16 px between the key row, the actions and sign out', async ({ page }) => {
  await page.route('**/v1/keys/me', (r) => r.fulfill({ json: me({ hasKey: true, prefix: 'sk_aaaa…' }) }));
  await page.goto('/account/');
  const box = async (sel) => page.locator(sel).boundingBox();
  const secret = await box('.secret'), actions = await box('.actions'), signout = await box('#acc-signout');
  expect(actions.y - (secret.y + secret.height)).toBeGreaterThanOrEqual(16);
  expect(signout.y - (actions.y + actions.height)).toBeGreaterThanOrEqual(16);
});

test('the sign-in button never overlaps the text above it', async ({ page }) => {
  await page.route('**/v1/keys/me', (r) => r.fulfill({ status: 401, json: {} }));
  await page.setViewportSize({ width: 900, height: 800 });
  await page.goto('/account/');
  const lede = await page.locator('#acc-out .lede').boundingBox();
  const btn = await page.getByRole('link', { name: 'Sign in with GitHub' }).boundingBox();
  expect(btn.y).toBeGreaterThanOrEqual(lede.y + lede.height);
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

test('sign out posts with the CSRF header and goes back to signed out', async ({ page }) => {
  let signedIn = true, header;
  await page.route('**/v1/keys/me', (r) => r.fulfill(signedIn ? { json: me() } : { status: 401, json: {} }));
  await page.route('**/auth/logout', (r) => { header = r.request().headers()['x-requested-with']; signedIn = false; return r.fulfill({ status: 204 }); });
  await page.goto('/account/');
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page.getByRole('link', { name: 'Sign in with GitHub' })).toBeVisible();
  expect(header).toBe('scamdb');
});

test('replacing a key asks first, and cancelling does nothing', async ({ page }) => {
  let posted = false;
  await page.route('**/v1/keys/me', (r) => r.fulfill({ json: me({ hasKey: true, prefix: 'sk_abcd…' }) }));
  await page.route('**/v1/keys', (r) => { posted = true; return r.fulfill({ status: 201, json: { key: 'sk_x', prefix: 'sk_x…' } }); });
  await page.goto('/account/');
  page.once('dialog', (d) => d.dismiss());
  await page.getByRole('button', { name: 'Replace key' }).click();
  await page.waitForTimeout(300);
  expect(posted).toBe(false);
});

test('an error while signed in is shown', async ({ page }) => {
  await page.route('**/v1/keys/me', (r) => r.fulfill({ json: me() }));
  await page.route('**/v1/keys', (r) => r.fulfill({ status: 503, json: { error: 'not_configured' } }));
  await page.goto('/account/');
  await page.getByRole('button', { name: 'Create key' }).click();
  await expect(page.locator('#acc-err')).toBeVisible();
});

test('sign-in not switched on yet is explained', async ({ page }) => {
  await page.route('**/v1/keys/me', (r) => r.fulfill({ status: 503, json: { error: 'not_configured' } }));
  await page.goto('/account/?error=setup');
  await expect(page.locator('#acc-err')).toContainText('not switched on yet');
});

test('only one view shows at a time: signed out or signed in', async ({ page }) => {
  await page.route('**/v1/keys/me', (r) => r.fulfill({ status: 401, json: {} }));
  await page.goto('/account/');
  await expect(page.locator('#acc-out')).toBeVisible();
  await expect(page.locator('#acc-in')).toBeHidden();
  await page.unroute('**/v1/keys/me');
  await page.route('**/v1/keys/me', (r) => r.fulfill({ json: me({ hasKey: false }) }));
  await page.reload();
  await expect(page.locator('#acc-in')).toBeVisible();
  await expect(page.locator('#acc-out')).toBeHidden();
  await expect(page.locator('#acc-keyrow')).toBeHidden();
});
