import { defineConfig, devices } from '@playwright/test';

// Read-only smoke tests: they load pages and sign in, but never submit, approve or change data.
// Run against production (default) or any deployment: E2E_BASE_URL=https://preview-url npm run test:e2e
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  retries: 1,
  reporter: [['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'https://seebu.prannsss.dev',
    trace: 'off',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
});
