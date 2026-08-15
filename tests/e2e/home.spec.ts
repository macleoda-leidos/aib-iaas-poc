import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('loads and shows AiB branding', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('img[alt="Accountant in Bankruptcy"]')).toBeVisible();
  });

  test('has "Start your application" call to action', async ({ page }) => {
    await page.goto('/');
    const cta = page.locator('a[href="/apply"]', { hasText: 'Start your application' });
    await expect(cta).toBeVisible();
  });

  test('shows all 6 Scottish debt solutions', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Debt Arrangement Scheme')).toBeVisible();
    await expect(page.locator('text=Minimal Asset Process')).toBeVisible();
    await expect(page.locator('text=Sequestration')).toBeVisible();
    await expect(page.locator('text=Protected Trust Deed')).toBeVisible();
    await expect(page.locator('text=Moratorium')).toBeVisible();
    await expect(page.locator('text=Debt Payment Programme')).toBeVisible();
  });

  test('has BETA phase banner', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=BETA')).toBeVisible();
    await expect(page.locator('text=feedback')).toBeVisible();
  });

  test('navigation links work', async ({ page }) => {
    await page.goto('/');
    await page.click('a[href="/apply"]');
    await expect(page).toHaveURL('/apply');
    await expect(page.locator('text=Personal Details')).toBeVisible();
  });
});
