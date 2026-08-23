import { test, expect } from '@playwright/test';

test.describe('Sprint 14 — Stakeholder Pages', () => {
  test('creditor portal loads with KPI cards', async ({ page }) => {
    await page.goto('/creditor-portal');
    await expect(page.getByText('Creditor Portal')).toBeVisible();
    await expect(page.getByText('Active Cases')).toBeVisible();
  });
  test('creditor portal shows cases table', async ({ page }) => {
    await page.goto('/creditor-portal');
    await expect(page.getByText('Morrison')).toBeVisible();
  });
  test('adviser workspace loads', async ({ page }) => {
    await page.goto('/adviser-workspace');
    await expect(page.getByText('Money Adviser')).toBeVisible();
  });
  test('adviser workspace shows clients', async ({ page }) => {
    await page.goto('/adviser-workspace');
    await expect(page.getByText('Active Clients')).toBeVisible();
  });
  test('workflow engine shows state diagram', async ({ page }) => {
    await page.goto('/admin/workflow-engine');
    await expect(page.getByText('Workflow')).toBeVisible();
    await expect(page.getByText('Draft')).toBeVisible();
    await expect(page.getByText('Submitted')).toBeVisible();
  });
  test('MI reports shows KPIs', async ({ page }) => {
    await page.goto('/admin/mi-reports');
    await expect(page.getByText('Management Information')).toBeVisible();
    await expect(page.getByText('SLA Compliance')).toBeVisible();
  });
  test('secure messages page loads', async ({ page }) => {
    await page.goto('/my-application/messages');
    await expect(page.getByText('Secure Messages')).toBeVisible();
  });
  test('messages show thread', async ({ page }) => {
    await page.goto('/my-application/messages');
    await expect(page.getByText('application has been received')).toBeVisible();
  });
  test('integration monitor shows 6 systems', async ({ page }) => {
    await page.goto('/admin/integration-monitor');
    await expect(page.getByText('BASYS')).toBeVisible();
    await expect(page.getByText('eDEN')).toBeVisible();
  });
  test('correspondence scheduler shows rules', async ({ page }) => {
    await page.goto('/admin/correspondence-scheduler');
    await expect(page.getByText('Scheduler')).toBeVisible();
    await expect(page.getByText('Automation Rules')).toBeVisible();
  });
  test('all sprint 14 admin pages accessible from hub', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.getByText('Workflow Engine')).toBeVisible();
    await expect(page.getByText('MI Reports')).toBeVisible();
    await expect(page.getByText('Integration Monitor')).toBeVisible();
  });
  test('creditor can vote on proposal', async ({ page }) => {
    await page.goto('/creditor-portal');
    await expect(page.getByRole('button', { name: /accept/i })).toBeVisible();
  });
  test('adviser workspace has search', async ({ page }) => {
    await page.goto('/adviser-workspace');
    await expect(page.getByPlaceholder(/search/i)).toBeVisible();
  });
  test('MI reports has export buttons', async ({ page }) => {
    await page.goto('/admin/mi-reports');
    await expect(page.getByText(/export/i)).toBeVisible();
  });
  test('messages has reply input', async ({ page }) => {
    await page.goto('/my-application/messages');
    await expect(page.getByPlaceholder(/message/i).or(page.locator('textarea'))).toBeVisible();
  });
});
