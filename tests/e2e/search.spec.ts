import { test, expect } from '@playwright/test';

test.describe('Global Search Page', () => {
  test('loads with search input and suggestions', async ({ page }) => {
    await page.goto('/search');
    await expect(page.locator('text=Search Cases')).toBeVisible();
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();
    await expect(page.locator('text=Try fuzzy search')).toBeVisible();
  });

  test('quick search buttons populate input', async ({ page }) => {
    await page.goto('/search');
    await page.click('[data-demo="search-tile-morisson"]');
    const input = page.locator('input[placeholder*="Search"]');
    await expect(input).toHaveValue('Morisson');
  });

  test('fuzzy matching clusters the Smith variants and the switch collapses them', async ({ page }) => {
    await page.goto('/search');
    await page.click('[data-demo="search-tile-john-smith"]');
    // 300 ms debounce plus the 2.5 s API deadline before results settle.
    await page.waitForTimeout(3500);

    const rows = page.locator('[data-demo="search-results"] a[href*="/case/IAAS-2026"]');
    await expect(rows).toHaveCount(4);
    await expect(page.locator('text=letters transposed').first()).toBeVisible();

    // Off leaves only the record spelled exactly as typed.
    await page.click('[data-demo="search-fuzzy-toggle"]');
    await expect(rows).toHaveCount(1);
    await expect(page.locator('text=near matches').first()).toBeVisible();

    await page.click('[data-demo="search-fuzzy-toggle"]');
    await expect(rows).toHaveCount(4);
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
