import { test, expect } from '@playwright/test';

test.describe('Debtor Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    // Select Debtor role
    await page.click('button:has-text("Debtor")');
  });

  test('shows application card with recommendation', async ({ page }) => {
    await expect(page.locator('text=IAAS-2024-00001')).toBeVisible();
    await expect(page.locator('text=Debt Arrangement Scheme')).toBeVisible();
    await expect(page.locator('text=£12,700')).toBeVisible();
  });

  test('shows progress timeline', async ({ page }) => {
    await expect(page.locator('text=Application Progress')).toBeVisible();
    await expect(page.locator('text=Application Submitted')).toBeVisible();
    await expect(page.locator('text=Awaiting Your Decision')).toBeVisible();
  });

  test('Upload Documents panel opens and shows upload zone', async ({ page }) => {
    await page.click('button:has-text("Upload Additional Documents")');
    await expect(page.locator('text=Drop files here')).toBeVisible();
    await expect(page.locator('text=ClamAV')).toBeVisible();
    await expect(page.locator('text=Previously uploaded')).toBeVisible();
  });

  test('Update Contact Details panel opens with form', async ({ page }) => {
    await page.click('button:has-text("Update Contact Details")');
    await expect(page.locator('text=Email address')).toBeVisible();
    await expect(page.locator('text=Primary phone')).toBeVisible();
    await expect(page.locator('text=Save Changes')).toBeVisible();
  });

  test('View Recommendation panel shows full DAS details', async ({ page }) => {
    await page.click('button:has-text("View Full Recommendation")');
    await expect(page.locator('text=Why we recommend DAS')).toBeVisible();
    await expect(page.locator('text=What happens next')).toBeVisible();
    await expect(page.locator('text=Download as PDF')).toBeVisible();
  });

  test('Contact Adviser panel shows messaging', async ({ page }) => {
    await page.click('button:has-text("Contact Money Adviser")');
    await expect(page.locator('text=Fiona Campbell')).toBeVisible();
    await expect(page.locator('text=Message History')).toBeVisible();
    await expect(page.locator('text=Send Message')).toBeVisible();
  });

  test('panels close when close button clicked', async ({ page }) => {
    await page.click('button:has-text("Upload Additional Documents")');
    await expect(page.locator('text=Drop files here')).toBeVisible();
    await page.click('button:has-text("Close")');
    await expect(page.locator('text=Drop files here')).not.toBeVisible();
  });
});
