import { test, expect } from '@playwright/test';

test.describe('Global Search Page', () => {
  test('loads with search input and suggestions', async ({ page }) => {
    await page.goto('/search');
    await expect(page.locator('text=Search Cases')).toBeVisible();
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();
    await expect(page.locator('text=Quick searches')).toBeVisible();
  });

  test('quick search buttons populate input', async ({ page }) => {
    await page.goto('/search');
    await page.click('button:text("Morrison")');
    const input = page.locator('input[placeholder*="Search"]');
    await expect(input).toHaveValue('Morrison');
  });

  test('searching by name returns results', async ({ page }) => {
    await page.goto('/search');
    await page.fill('input[placeholder*="Search"]', 'Morrison');
    // Wait for debounced search
    await page.waitForTimeout(500);
    await expect(page.locator('text=Alistair Morrison')).toBeVisible();
  });

  test('searching by reference returns results', async ({ page }) => {
    await page.goto('/search');
    await page.fill('input[placeholder*="Search"]', 'IAAS-2026-00012');
    await page.waitForTimeout(500);
    await expect(page.locator('text=IAAS-2026-00012')).toBeVisible();
  });

  test('no results shows empty state', async ({ page }) => {
    await page.goto('/search');
    await page.fill('input[placeholder*="Search"]', 'ZZZZZNONEXISTENT');
    await page.waitForTimeout(500);
    await expect(page.locator('text=No cases found')).toBeVisible();
  });

  test('status filter dropdown works', async ({ page }) => {
    await page.goto('/search');
    await page.selectOption('select', 'approved');
    await page.waitForTimeout(500);
    // Should show results filtered to approved
    await expect(page.locator('text=result')).toBeVisible();
  });

  test('results link to case detail', async ({ page }) => {
    await page.goto('/search');
    await page.fill('input[placeholder*="Search"]', 'Morrison');
    await page.waitForTimeout(500);
    const link = page.locator('a[href*="/case/IAAS-2026"]').first();
    await expect(link).toBeVisible();
  });
});
