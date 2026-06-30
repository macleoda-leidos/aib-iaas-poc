import { test, expect } from '@playwright/test';

test.describe('Money Adviser Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('button:has-text("Money Adviser")');
  });

  test('shows KPI cards', async ({ page }) => {
    await expect(page.locator('text=My Active Cases')).toBeVisible();
    await expect(page.locator('text=Pending Submission')).toBeVisible();
    await expect(page.locator('text=Approved')).toBeVisible();
  });

  test('shows client applications list', async ({ page }) => {
    await expect(page.locator('text=John Testerton')).toBeVisible();
    await expect(page.locator('text=David Minimal')).toBeVisible();
    await expect(page.locator('text=Sarah Lowdebt')).toBeVisible();
  });

  test('Upload Documents panel opens', async ({ page }) => {
    await page.click('button:has-text("Upload Documents")');
    await expect(page.locator('text=Upload for client')).toBeVisible();
    await expect(page.locator('text=Virus Scanning')).toBeVisible();
  });

  test('Run Credit Check panel opens with consent', async ({ page }) => {
    await page.click('button:has-text("Run Credit Check")');
    await expect(page.locator('text=Run credit check for')).toBeVisible();
    await expect(page.locator('text=explicit consent')).toBeVisible();
    // Button should be disabled without consent
    const btn = page.locator('button:has-text("Run Credit Check"):not(:has-text("📄"))');
    await expect(btn).toBeDisabled();
  });

  test('Client Meetings calendar opens', async ({ page }) => {
    await page.click('button:has-text("Client Meetings")');
    await expect(page.locator('text=July 2026')).toBeVisible();
    await expect(page.locator('text=John Testerton - DAS Initial Assessment')).toBeVisible();
  });

  test('Calendar appointment shows details on click', async ({ page }) => {
    await page.click('button:has-text("Client Meetings")');
    await page.click('button:has-text("John Testerton")');
    await expect(page.locator('text=DAS Initial Assessment')).toBeVisible();
    await expect(page.locator('text=Join Meeting')).toBeVisible();
  });
});
