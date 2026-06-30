import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'npm run dev:web',
      cwd: '../..',
      port: 3000,
      timeout: 30000,
      reuseExistingServer: true,
    },
  ],
  projects: [
    { name: 'web-portal', testMatch: /.*(?<!admin)\.spec\.ts/ },
    {
      name: 'admin-portal',
      testMatch: /admin\.spec\.ts/,
      use: { baseURL: 'http://localhost:3010' },
    },
  ],
});
