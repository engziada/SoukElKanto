import { defineConfig, devices } from '@playwright/test';

/**
 * Souk ElKanto — Playwright E2E configuration.
 *
 * Prerequisites before running:
 *   1. pwsh ./stack-up.ps1            (in Codes\)
 *   2. npm run dev  (web\ — already on :3001)
 *   3. npx playwright install --with-deps chromium
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],

  timeout: 60_000,
  expect: { timeout: 15_000 },

  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    navigationTimeout: 60_000,
    actionTimeout: 15_000,
  },

  globalSetup: './e2e/global-setup.ts',

  projects: [
    /** Re-usable auth setup — not a test, just writes storage state */
    {
      name: 'setup',
      testMatch: '**/e2e/fixtures/auth.setup.ts',
    },

    /** Desktop Chromium — primary target */
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },

    /** Desktop Firefox */
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      dependencies: ['setup'],
    },

    /** Mobile Chrome (375 × 812) */
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
      dependencies: ['setup'],
    },

    /** Mobile Safari (375 × 812) */
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
      dependencies: ['setup'],
    },
  ],
});
