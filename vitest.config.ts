import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: [
      'packages/*/src/__tests__/**/*.test.ts',
      'services/*/src/__tests__/**/*.test.ts',
      'tests/integration/**/*.test.ts',
    ],
    exclude: ['node_modules', 'dist', '.next', 'tests/e2e'],
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html', 'lcov'],
      include: [
        'packages/*/src/**/*.ts',
        'services/*/src/**/*.ts',
      ],
      exclude: [
        '**/node_modules/**',
        '**/__tests__/**',
        '**/dist/**',
        '**/index.ts',
        // Genuinely untestable without infrastructure
        '**/db/**',
        '**/scanner/clamav.ts',
        '**/data/synthetic-cases.ts',
        'packages/test-data/**',
        // Deployment wiring (not business logic)
        'services/consolidated-api/**',
        // Services with only route handlers (no business logic to unit-test)
        'services/notification-service/**',
        'services/organisation-service/**',
        'services/identity-service/**',
        'services/document-service/**',
        'services/payment-service/**',
        'services/audit-service/**',
        'services/integration-orchestrator/**',
      ],
      thresholds: {
        // Quality gate — enforced in CI
        statements: 50,
        branches: 45,
        functions: 45,
        lines: 50,
      },
    },
  },
});
