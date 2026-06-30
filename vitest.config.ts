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
        '**/index.ts', // Entry points (mostly wiring)
      ],
      thresholds: {
        statements: 40,
        branches: 30,
        functions: 40,
        lines: 40,
      },
    },
  },
});
