import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Prefer TypeScript sources over any stale compiled .js sitting next to them.
  // Vite's default order resolves .js first, so a leftover build artifact in
  // src/ would shadow its own source and fail as CJS requiring an ESM package.
  resolve: {
    extensions: ['.ts', '.tsx', '.mts', '.mjs', '.js', '.jsx', '.json'],
  },
  // apps/web sets jsx: "preserve" for Next to handle, so esbuild has no JSX
  // instruction of its own and falls back to the classic runtime — which fails
  // with "React is not defined" in files that don't import React (the whole
  // codebase, since Next 15 doesn't need it). Point it at the automatic runtime.
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    include: [
      'packages/*/src/__tests__/**/*.test.ts',
      'services/*/src/__tests__/**/*.test.ts',
      'tests/integration/**/*.test.ts',
      // Frontend: .tsx as well, and __tests__ may sit at any depth under src/
      // (colocated next to the component being tested rather than in one
      // top-level folder, which is the convention Next.js app-router pushes you
      // towards once routes are nested).
      'apps/*/src/**/__tests__/**/*.test.{ts,tsx}',
    ],
    exclude: ['node_modules', 'dist', '.next', 'tests/e2e'],
    // Default stays node so every backend suite is unaffected. Only files
    // matching the globs below are switched to jsdom — an opt-in list, so a new
    // backend test can never silently pick up a browser environment (which
    // would mask a genuine "this code assumed a DOM" bug). vitest 1.6 has no
    // test.projects (that arrived in v3); environmentMatchGlobs is the
    // supported mechanism at this version and keeps everything in one config
    // rather than relying on a per-file docblock that is easy to forget.
    environment: 'node',
    environmentMatchGlobs: [
      ['apps/**', 'jsdom'],
    ],
    // Guarded internally so it is inert under the node environment.
    setupFiles: ['apps/web/src/test/setup.ts'],
    globals: true,
    env: {
      DATABASE_PATH: ':memory:',
      NODE_ENV: 'test',
    },
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
