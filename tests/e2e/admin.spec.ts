import { test, expect } from '@playwright/test';

test.describe('Admin Portal', () => {
  test.use({ baseURL: 'http://localhost:3010' });

  test('dashboard loads with application table', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Application Dashboard')).toBeVisible();
    await expect(page.locator('text=IAAS-2024-00001')).toBeVisible();
  });

  test('can filter by status', async ({ page }) => {
    await page.goto('/');
    await page.selectOption('select', 'submitted');
    await expect(page.locator('text=submitted')).toBeVisible();
  });

  test('organisations page loads with hierarchy', async ({ page }) => {
    await page.goto('/organisations');
    await expect(page.locator('text=Organisation Management')).toBeVisible();
    await expect(page.locator('text=Accountant in Bankruptcy')).toBeVisible();
  });

  test('users page loads with user table', async ({ page }) => {
    await page.goto('/users');
    await expect(page.locator('text=User Management')).toBeVisible();
    await expect(page.locator('text=Karen MacLeod')).toBeVisible();
  });

  test('users page shows RBAC matrix', async ({ page }) => {
    await page.goto('/users');
    await expect(page.locator('text=Role-Based Access Control Matrix')).toBeVisible();
    await expect(page.locator('text=Create Application')).toBeVisible();
  });

  test('application detail page loads for valid ID', async ({ page }) => {
    await page.goto('/applications/1');
    await expect(page.locator('text=IAAS-2024-00001')).toBeVisible();
  });
});
