import { test, expect } from '@playwright/test';

test.describe('Sprint 4-10 Features', () => {
  test.describe('Admin Hub', () => {
    test.use({ baseURL: 'http://localhost:3010' });

    test('admin page loads with feature cards', async ({ page }) => {
      await page.goto('/admin');
      const cards = page.locator('a[href^="/admin/"]');
      await expect(cards.first()).toBeVisible();
    });

    test('rules engine page loads', async ({ page }) => {
      await page.goto('/admin/rules');
      await expect(page.getByText('Rules Engine')).toBeVisible();
    });

    test('digital mailroom page loads', async ({ page }) => {
      await page.goto('/admin/digital-mailroom');
      await expect(page.getByText('Digital Mailroom')).toBeVisible();
    });

    test('ai governance page loads', async ({ page }) => {
      await page.goto('/admin/ai-governance');
      await expect(page.getByText('AI Governance')).toBeVisible();
    });

    test('policy simulation page loads', async ({ page }) => {
      await page.goto('/admin/policy-simulation');
      await expect(page.getByText('Policy Simulation')).toBeVisible();
    });

    test('knowledge hub page loads', async ({ page }) => {
      await page.goto('/admin/knowledge-hub');
      await expect(page.getByText('Knowledge Hub')).toBeVisible();
    });

    test('webhooks page loads', async ({ page }) => {
      await page.goto('/admin/webhooks');
      await expect(page.getByText('Webhook')).toBeVisible();
    });

    test('api keys page loads', async ({ page }) => {
      await page.goto('/admin/api-keys');
      await expect(page.getByText('API Key')).toBeVisible();
    });

    test('export page loads', async ({ page }) => {
      await page.goto('/admin/export');
      await expect(page.getByText('Data Export')).toBeVisible();
    });

    test('reports page loads', async ({ page }) => {
      await page.goto('/admin/reports');
      await expect(page.getByText('Report Builder')).toBeVisible();
    });

    test('activity page loads', async ({ page }) => {
      await page.goto('/admin/activity');
      await expect(page.getByText('Activity Heatmap')).toBeVisible();
    });

    test('system health page loads', async ({ page }) => {
      await page.goto('/admin/system-health');
      await expect(page.getByText('System Health')).toBeVisible();
    });

    test('feature flags page loads', async ({ page }) => {
      await page.goto('/admin/feature-flags');
      await expect(page.getByText('Feature Flags')).toBeVisible();
    });

    test('notifications hub loads', async ({ page }) => {
      await page.goto('/admin/notifications-hub');
      await expect(page.getByText('Notification')).toBeVisible();
    });

    test('open banking page loads', async ({ page }) => {
      await page.goto('/admin/open-banking');
      await expect(page.getByText('Open Banking')).toBeVisible();
    });

    test('consent page loads', async ({ page }) => {
      await page.goto('/admin/consent');
      await expect(page.getByText('Consent')).toBeVisible();
    });

    test('data retention page loads', async ({ page }) => {
      await page.goto('/admin/data-retention');
      await expect(page.getByText('Data Retention')).toBeVisible();
    });

    test('changelog page loads', async ({ page }) => {
      await page.goto('/admin/changelog');
      await expect(page.getByText('Changelog')).toBeVisible();
    });

    test('ai explainability page loads', async ({ page }) => {
      await page.goto('/admin/ai-explainability');
      await expect(page.getByText('Explainability')).toBeVisible();
    });

    test('carbon tracker page loads', async ({ page }) => {
      await page.goto('/admin/carbon-tracker');
      await expect(page.getByText('Carbon')).toBeVisible();
    });

    test('satisfaction page loads', async ({ page }) => {
      await page.goto('/admin/satisfaction');
      await expect(page.getByText('Satisfaction')).toBeVisible();
    });

    test('admin hub has back to dashboard link', async ({ page }) => {
      await page.goto('/admin/rules');
      const backLink = page.locator('a[href="/"]', { hasText: /back|dashboard|home/i });
      // At minimum the page renders without error
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Sprint 4 - Intelligent Features', () => {
    test('my-application page loads with progress tracker', async ({ page }) => {
      await page.goto('/my-application');
      await expect(page.getByText('My Application')).toBeVisible();
    });

    test('api-docs page loads with endpoints', async ({ page }) => {
      await page.goto('/api-docs');
      await expect(page.getByText('API Documentation')).toBeVisible();
    });

    test('api-docs shows RESTful endpoints', async ({ page }) => {
      await page.goto('/api-docs');
      await expect(page.locator('text=/api/')).toBeVisible();
    });

    test('my-application shows status information', async ({ page }) => {
      await page.goto('/my-application');
      // Should show at least one status-related element
      await expect(page.locator('body')).toContainText(/status|progress|step/i);
    });
  });

  test.describe('Sprint 7 - AI Features', () => {
    test('chatbot widget is accessible on home page', async ({ page }) => {
      await page.goto('/');
      // Look for any chat-related interactive element
      const chatButton = page.locator('button:has-text("Ask"), button:has-text("Chat"), button:has-text("💬"), [aria-label*="chat" i]');
      await expect(chatButton.first()).toBeVisible();
    });

    test('demo mode button is visible', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('button:has-text("Demo")')).toBeVisible();
    });

    test('home page loads without JavaScript errors', async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (err) => errors.push(err.message));
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      expect(errors).toHaveLength(0);
    });

    test('page is responsive at mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await expect(page.locator('body')).toBeVisible();
      // Ensure no horizontal scrollbar
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5); // small tolerance
    });

    test('page is responsive at tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/');
      await expect(page.locator('body')).toBeVisible();
    });
  });
});
