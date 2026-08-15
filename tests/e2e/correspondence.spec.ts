import { test, expect } from '@playwright/test';

test.describe('Correspondence & Letter Generator', () => {
  test('loads with template selection', async ({ page }) => {
    await page.goto('/correspondence');
    await expect(page.locator('text=Correspondence')).toBeVisible();
    await expect(page.locator('text=Choose Template')).toBeVisible();
    await expect(page.locator('text=Application Acknowledgement')).toBeVisible();
    await expect(page.locator('text=Request for Additional Information')).toBeVisible();
    await expect(page.locator('text=Decision Notification — Approved')).toBeVisible();
  });

  test('shows case selection', async ({ page }) => {
    await page.goto('/correspondence');
    await expect(page.locator('text=Select Case')).toBeVisible();
    await expect(page.locator('text=Alistair Morrison')).toBeVisible();
  });

  test('selecting template and case generates letter preview', async ({ page }) => {
    await page.goto('/correspondence');
    // Select template
    await page.click('button:has-text("Application Acknowledgement")');
    // Select case
    await page.click('button:has-text("Alistair Morrison")');
    // Should show preview
    await expect(page.locator('text=Preview & Send')).toBeVisible();
    await expect(page.locator('text=Dear Alistair Morrison')).toBeVisible();
    await expect(page.locator('text=IAAS-2026-00012')).toBeVisible();
  });

  test('letter preview shows AiB letterhead', async ({ page }) => {
    await page.goto('/correspondence');
    await page.click('button:has-text("Decision Notification — Approved")');
    await page.click('button:has-text("Eleanor MacPherson")');
    await expect(page.locator('text=Accountant in Bankruptcy')).toBeVisible();
    await expect(page.locator('text=Pennyburn Road')).toBeVisible();
  });

  test('send button works (simulated)', async ({ page }) => {
    await page.goto('/correspondence');
    await page.click('button:has-text("Application Acknowledgement")');
    await page.click('button:has-text("Alistair Morrison")');
    await page.click('button:has-text("Send via Email")');
    await expect(page.locator('text=Sent!')).toBeVisible();
  });

  test('shows sent correspondence log', async ({ page }) => {
    await page.goto('/correspondence');
    await expect(page.locator('text=Sent Correspondence')).toBeVisible();
    await expect(page.locator('text=Karen MacLeod')).toBeVisible();
  });
});
