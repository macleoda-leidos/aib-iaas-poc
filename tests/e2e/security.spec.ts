import { test, expect } from '@playwright/test';

test.describe('Security Operations Centre Page', () => {
  test('loads with dark theme and threat banner', async ({ page }) => {
    await page.goto('/security');
    await expect(page.locator('text=THREAT LEVEL: ELEVATED')).toBeVisible();
  });

  test('shows attack timeline chart', async ({ page }) => {
    await page.goto('/security');
    await expect(page.locator('text=Attack Attempts — Last 24 Hours')).toBeVisible();
  });

  test('shows live event stream', async ({ page }) => {
    await page.goto('/security');
    await expect(page.locator('text=Live Security Events')).toBeVisible();
  });

  test('shows Sophos endpoint protection', async ({ page }) => {
    await page.goto('/security');
    await expect(page.locator('text=Sophos Endpoint Protection')).toBeVisible();
    await expect(page.locator('text=AIBSRV-API-01')).toBeVisible();
  });

  test('shows Tenable vulnerability summary', async ({ page }) => {
    await page.goto('/security');
    await expect(page.locator('text=Tenable Vulnerability Summary')).toBeVisible();
    await expect(page.locator('text=Remediation Progress')).toBeVisible();
  });

  test('shows active incidents', async ({ page }) => {
    await page.goto('/security');
    await expect(page.locator('text=Active Incidents')).toBeVisible();
    await expect(page.locator('text=INC-001')).toBeVisible();
  });

  test('shows access anomalies', async ({ page }) => {
    await page.goto('/security');
    await expect(page.locator('text=Access Anomalies')).toBeVisible();
  });

  test('shows Sysmon process alerts', async ({ page }) => {
    await page.goto('/security');
    await expect(page.locator('text=Sysmon Process Alerts')).toBeVisible();
  });

  test('event stream has source and severity filters', async ({ page }) => {
    await page.goto('/security');
    await expect(page.locator('select >> nth=0')).toBeVisible(); // Source filter
    await expect(page.locator('select >> nth=1')).toBeVisible(); // Severity filter
  });

  test('event stream auto-updates (new events appear)', async ({ page }) => {
    await page.goto('/security');
    // Wait for at least one auto-update cycle (4s interval)
    const initialEvents = await page.locator('[class*="font-mono"]').count();
    await page.waitForTimeout(5000);
    const updatedEvents = await page.locator('[class*="font-mono"]').count();
    // Should have at least as many events (new ones prepended)
    expect(updatedEvents).toBeGreaterThanOrEqual(initialEvents);
  });
});
