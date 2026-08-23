import { test, expect } from '@playwright/test';

const PAGES = [
  { path: '/', title: 'Home' },
  { path: '/apply', title: 'Apply' },
  { path: '/dashboard', title: 'Dashboard' },
  { path: '/portal', title: 'Portal' },
  { path: '/statistics', title: 'Statistics' },
  { path: '/security', title: 'Security' },
  { path: '/search', title: 'Search' },
  { path: '/correspondence', title: 'Digital Mailroom' },
  { path: '/login', title: 'Login' },
  { path: '/my-application', title: 'My Application' },
  { path: '/architecture', title: 'Architecture' },
  { path: '/api-docs', title: 'API Docs' },
  { path: '/admin', title: 'Admin' },
  { path: '/admin/rules', title: 'Rules' },
  { path: '/admin/digital-mailroom', title: 'Digital Mailroom' },
  { path: '/admin/ai-governance', title: 'AI Governance' },
  { path: '/admin/policy-simulation', title: 'Policy Simulation' },
  { path: '/admin/knowledge-hub', title: 'Knowledge Hub' },
  { path: '/admin/users', title: 'Users' },
  { path: '/admin/organisations', title: 'Organisations' },
  { path: '/admin/webhooks', title: 'Webhooks' },
  { path: '/admin/api-keys', title: 'API Keys' },
  { path: '/admin/export', title: 'Export' },
  { path: '/admin/reports', title: 'Reports' },
  { path: '/admin/activity', title: 'Activity' },
  { path: '/admin/system-health', title: 'System Health' },
  { path: '/admin/feature-flags', title: 'Feature Flags' },
  { path: '/admin/security-headers', title: 'Security Headers' },
  { path: '/admin/notifications-hub', title: 'Notifications' },
  { path: '/admin/open-banking', title: 'Open Banking' },
  { path: '/admin/digital-signature', title: 'Signature' },
  { path: '/admin/consent', title: 'Consent' },
  { path: '/admin/data-retention', title: 'Retention' },
  { path: '/admin/accessibility-checker', title: 'Accessibility' },
  { path: '/admin/performance', title: 'Performance' },
  { path: '/admin/changelog', title: 'Changelog' },
  { path: '/admin/voice-input', title: 'Voice' },
  { path: '/admin/qr-login', title: 'QR' },
  { path: '/admin/biometric', title: 'Biometric' },
  { path: '/admin/document-scanner', title: 'Scanner' },
  { path: '/admin/collaboration', title: 'Collaboration' },
  { path: '/admin/ai-explainability', title: 'Explainability' },
  { path: '/admin/carbon-tracker', title: 'Carbon' },
  { path: '/admin/satisfaction', title: 'Satisfaction' },
  { path: '/case/IAAS-2026-00012', title: 'Case' },
  { path: '/case/IAAS-2026-00012/recommendation', title: 'Recommendation' },
  { path: '/case/IAAS-2026-00012/audit', title: 'Audit' },
];

test.describe('Full Regression — All Pages Load', () => {
  for (const page of PAGES) {
    test(`${page.path} loads without error`, async ({ page: p }) => {
      const response = await p.goto(page.path);
      expect(response?.status()).toBeLessThan(400);
      await expect(p.locator('body')).not.toBeEmpty();
    });
  }
});
