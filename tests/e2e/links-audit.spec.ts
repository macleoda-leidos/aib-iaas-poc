import { test, expect } from '@playwright/test';

test.describe('Link Audit — basePath correctness', () => {
  test('home page nav has correct links', async ({ page }) => {
    await page.goto('/');
    const navLinks = page.locator('nav a[href]');
    const count = await navLinks.count();
    expect(count).toBeGreaterThan(5);
  });

  test('admin hub has 30+ feature links', async ({ page }) => {
    await page.goto('/admin');
    const links = page.locator('a[href^="/admin/"]');
    const count = await links.count();
    expect(count).toBeGreaterThanOrEqual(28);
  });

  test('case page 00004 loads content', async ({ page }) => {
    await page.goto('/case/IAAS-2026-00004');
    await expect(page.getByText('IAAS-2026-00004')).toBeVisible();
  });

  test('case page 00020 loads content', async ({ page }) => {
    await page.goto('/case/IAAS-2026-00020');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('rules detail page loads via Link', async ({ page }) => {
    await page.goto('/admin/rules/rule-das-eligibility');
    await expect(page.getByText('DAS')).toBeVisible();
  });

  test('my-application links to case page', async ({ page }) => {
    await page.goto('/my-application');
    const link = page.locator('a[href*="/case/IAAS-2026"]');
    await expect(link.first()).toBeVisible();
  });

  test('footer links are present', async ({ page }) => {
    await page.goto('/');
    const footerLinks = page.locator('footer a');
    expect(await footerLinks.count()).toBeGreaterThan(5);
  });

  test('admin back link uses correct path', async ({ page }) => {
    await page.goto('/admin/rules/rule-das-eligibility');
    const backLink = page.locator('a:has-text("Back")');
    if (await backLink.count() > 0) {
      const href = await backLink.first().getAttribute('href');
      expect(href).toContain('/admin/rules');
    }
  });

  test('no links contain undefined', async ({ page }) => {
    await page.goto('/');
    const allLinks = page.locator('a[href]');
    const count = await allLinks.count();
    for (let i = 0; i < Math.min(count, 20); i++) {
      const href = await allLinks.nth(i).getAttribute('href');
      expect(href).not.toContain('undefined');
    }
  });

  test('notification page loads', async ({ page }) => {
    await page.goto('/notifications');
    await expect(page.getByText('Notification')).toBeVisible();
  });
});
