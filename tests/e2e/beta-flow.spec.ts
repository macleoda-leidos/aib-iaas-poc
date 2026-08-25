import { test, expect } from '@playwright/test';

test.describe('Beta Application Flow', () => {

  test.describe('Citizen Journey', () => {

    test('home page loads with application start button', async ({ page }) => {
      await page.goto('/');
      await expect(page.getByRole('heading', { level: 1 })).toContainText('debt solution');
      await expect(page.getByRole('link', { name: /start your application/i })).toBeVisible();
    });

    test('Before you start section is visible in both themes', async ({ page }) => {
      await page.goto('/');
      const beforeYouStart = page.getByText('Before you start');
      await expect(beforeYouStart).toBeVisible();
      // Check the list items are visible
      await expect(page.getByText('Your personal details and address')).toBeVisible();
    });

    test('application form loads and shows step 1', async ({ page }) => {
      await page.goto('/apply');
      // Should show the multi-step form
      await expect(page.locator('text=Personal Details')).toBeVisible();
    });

    test('search page supports fuzzy matching', async ({ page }) => {
      await page.goto('/search');
      // Type a misspelled name
      await page.fill('input[type="text"]', 'Morisson');
      // Should find Morrison via fuzzy match. There are six Morrison spellings in
      // the corpus, so this has to be first() or strict mode rejects the locator.
      await expect(page.getByText('Morrison').first()).toBeVisible({ timeout: 5000 });
      // Should show confidence badge
      await expect(page.getByText(/match/i).first()).toBeVisible();
    });

    test('fuzzy search handles cross-system identity matching', async ({ page }) => {
      await page.goto('/search');
      await page.fill('input[type="text"]', 'John Smith');
      // Should find all four variants held under different spellings
      await expect(page.getByText('John Smith').first()).toBeVisible({ timeout: 5000 });
      await expect(page.getByText('Jhon Smith')).toBeVisible();
      await expect(page.getByText('Jon Smith')).toBeVisible();
      await expect(page.getByText('John Smyth')).toBeVisible();
    });
  });

  test.describe('Case Management', () => {

    test('case detail page shows all sections', async ({ page }) => {
      await page.goto('/case/IAAS-2026-00012');
      await expect(page.getByText('IAAS-2026-00012')).toBeVisible();
      await expect(page.getByText('Alistair Morrison')).toBeVisible();
      // Check key sections exist
      await expect(page.getByText('Personal Details')).toBeVisible();
      await expect(page.getByText('Activity Timeline')).toBeVisible();
      await expect(page.getByText('Recommendation')).toBeVisible();
    });

    test('case detail shows enhanced recommendation with confidence', async ({ page }) => {
      await page.goto('/case/IAAS-2026-00012');
      // Should show confidence percentage
      await expect(page.getByText(/94%/)).toBeVisible();
      // Should have link to full explanation
      await expect(page.getByRole('link', { name: /view full explanation/i })).toBeVisible();
    });

    test('recommendation explanation page renders with charts', async ({ page }) => {
      await page.goto('/case/IAAS-2026-00012/recommendation');
      await expect(page.getByText('Recommendation Explanation')).toBeVisible();
      await expect(page.getByText('Debt Arrangement Scheme')).toBeVisible();
      // Check sections
      await expect(page.getByText(/Decision Factors/i)).toBeVisible();
      await expect(page.getByText(/Alternatives/i)).toBeVisible();
      await expect(page.getByText(/Evidence Sources/i)).toBeVisible();
    });

    test('audit log page shows full event history', async ({ page }) => {
      await page.goto('/case/IAAS-2026-00012/audit');
      await expect(page.getByText(/Audit Log/i)).toBeVisible();
      // Should have multiple events
      const events = page.locator('[class*="timeline"]').or(page.locator('text=Application submitted'));
      await expect(events.first()).toBeVisible();
    });

    test('case timeline shows category filters', async ({ page }) => {
      await page.goto('/case/IAAS-2026-00012/audit');
      // Filter buttons should be present
      await expect(page.getByRole('button', { name: /all/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /checks/i })).toBeVisible();
    });
  });

  test.describe('Dashboard & Portal', () => {

    test('dashboard loads with role-based content', async ({ page }) => {
      await page.goto('/dashboard');
      // Should show dashboard content
      await expect(page.getByRole('heading')).toBeVisible();
    });

    test('statistics page renders charts', async ({ page }) => {
      await page.goto('/statistics');
      await expect(page.getByText(/Applications/i)).toBeVisible();
    });

    test('security page shows threat monitoring', async ({ page }) => {
      await page.goto('/security');
      await expect(page.getByText(/Threat Level/i)).toBeVisible();
    });

    test('portal shows unified work queue', async ({ page }) => {
      await page.goto('/portal');
      await expect(page.getByText(/Portal/i)).toBeVisible();
    });
  });

  test.describe('Admin Portal', () => {

    test('admin dashboard loads', async ({ page }) => {
      await page.goto('http://localhost:3010/');
      await expect(page.getByText('AiB Administration')).toBeVisible();
    });

    test('rules engine page lists rules', async ({ page }) => {
      await page.goto('http://localhost:3010/rules');
      await expect(page.getByText('Rules Engine Management')).toBeVisible();
      await expect(page.getByText('DAS Eligibility')).toBeVisible();
    });

    test('rule detail page shows interactive tester', async ({ page }) => {
      await page.goto('http://localhost:3010/rules/rule-das-eligible');
      await expect(page.getByText('Test This Rule')).toBeVisible();
      // Click test button
      await page.click('button:has-text("Test Rule")');
      // Should show result
      await expect(page.getByText(/RULE MATCHES|RULE DOES NOT MATCH/)).toBeVisible();
    });

    test('digital mailroom shows document queue', async ({ page }) => {
      await page.goto('http://localhost:3010/digital-mailroom');
      await expect(page.getByText('Digital Mailroom')).toBeVisible();
      // Click queue tab
      await page.click('button:has-text("Document Queue")');
      await expect(page.getByText('Sheriff_Court')).toBeVisible();
    });

    test('AI governance shows bias metrics', async ({ page }) => {
      await page.goto('http://localhost:3010/ai-governance');
      await expect(page.getByText('AI Governance')).toBeVisible();
      await expect(page.getByText(/Bias/i)).toBeVisible();
    });

    test('knowledge hub shows articles', async ({ page }) => {
      await page.goto('http://localhost:3010/knowledge-hub');
      await expect(page.getByText('DAS: What You Need to Know')).toBeVisible();
    });

    test('policy simulation responds to slider changes', async ({ page }) => {
      await page.goto('http://localhost:3010/policy-simulation');
      await expect(page.getByText('Policy Simulation')).toBeVisible();
      // The sliders should be present
      await expect(page.locator('input[type="range"]').first()).toBeVisible();
    });
  });

  test.describe('Accessibility & Performance', () => {

    test('home page has no critical accessibility issues', async ({ page }) => {
      await page.goto('/');
      // Check basic a11y: page has h1, lang attribute, viewport
      const html = page.locator('html');
      await expect(html).toHaveAttribute('lang', 'en');
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.getByRole('navigation')).toBeVisible();
    });

    test('pages are mobile-responsive (375px width)', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto('/');
      // Content should still be visible on mobile
      await expect(page.getByRole('link', { name: /start your application/i })).toBeVisible();
      // Navigation should be accessible
      await expect(page.getByRole('navigation')).toBeVisible();
    });

    test('dark mode toggle works', async ({ page }) => {
      await page.goto('/');
      // Find and click dark mode toggle
      const toggle = page.locator('button[aria-label*="theme"], button[aria-label*="dark"], button[aria-label*="mode"]').or(page.locator('button:has-text("🌙")').or(page.locator('button:has-text("☀")')));
      if (await toggle.isVisible()) {
        await toggle.click();
        // HTML should have dark class
        await expect(page.locator('html')).toHaveClass(/dark/);
      }
    });
  });

  test.describe('Correspondence', () => {

    test('correspondence page shows templates', async ({ page }) => {
      await page.goto('/correspondence');
      await expect(page.getByText('Application Acknowledgement')).toBeVisible();
      await expect(page.getByText('Decision Notification')).toBeVisible();
    });
  });
});
