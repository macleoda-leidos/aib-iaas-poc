import { test, expect } from '@playwright/test';

test.describe('Statistics & Analytics Page', () => {
  test('loads and shows KPI cards', async ({ page }) => {
    await page.goto('/statistics');
    await expect(page.locator('text=Statistics & Analytics')).toBeVisible();
    await expect(page.locator('text=Total Applications')).toBeVisible();
    await expect(page.locator('text=This Week')).toBeVisible();
    await expect(page.locator('text=SLA Compliance')).toBeVisible();
  });

  test('shows application volume chart', async ({ page }) => {
    await page.goto('/statistics');
    await expect(page.locator('text=Application Volume')).toBeVisible();
  });

  test('has chart view toggles (line/area/stacked)', async ({ page }) => {
    await page.goto('/statistics');
    await expect(page.locator('button', { hasText: 'Line' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Area' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Stacked' })).toBeVisible();
  });

  test('shows status distribution section', async ({ page }) => {
    await page.goto('/statistics');
    await expect(page.locator('text=Status Distribution')).toBeVisible();
  });

  test('shows product breakdown', async ({ page }) => {
    await page.goto('/statistics');
    await expect(page.locator('text=By Recommended Product')).toBeVisible();
  });

  test('shows SLA performance gauges', async ({ page }) => {
    await page.goto('/statistics');
    await expect(page.locator('text=Processing Performance & SLA')).toBeVisible();
    await expect(page.locator('text=Submission → Review')).toBeVisible();
  });

  test('shows geographic distribution', async ({ page }) => {
    await page.goto('/statistics');
    await expect(page.locator('text=Applications by Region')).toBeVisible();
    await expect(page.locator('text=Glasgow & Clyde')).toBeVisible();
  });

  test('time range buttons work', async ({ page }) => {
    await page.goto('/statistics');
    const btn = page.locator('button', { hasText: '7d' });
    await btn.click();
    await expect(btn).toHaveClass(/bg-gov-blue/);
  });
});
