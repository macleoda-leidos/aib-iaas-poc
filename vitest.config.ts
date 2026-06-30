import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: [
      'packages/*/src/__tests__/**/*.test.ts',
      'services/*/src/__tests__/**/*.test.ts',
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
        // Exclude infrastructure/wiring code (no business logic to test)
        '**/db/**',
        '**/scanner/clamav.ts',
        '**/data/synthetic-cases.ts',
        // Exclude test data generators
        'packages/test-data/**',
        // Exclude route handlers that are pure HTTP glue
        'services/notification-service/**',
        'services/organisation-service/**',
        'services/identity-service/**',
        'services/document-service/**',
        'services/payment-service/**',
        'services/audit-service/**',
        'services/integration-orchestrator/**',
        // Exclude consolidated-api (deployment wiring only)
        'services/consolidated-api/**',
      ],
      thresholds: {
        // POC thresholds — these become gates for FAT/UAT deployment in production
        statements: 25,
        branches: 25,
        functions: 25,
        lines: 25,
      },
    },
  },
});
