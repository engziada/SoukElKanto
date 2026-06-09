/**
 * auth.setup.ts — Playwright project "setup".
 *
 * Logs in the seller test user via the real UI and saves the browser storage
 * state to .auth/user.json so subsequent test projects can reuse it without
 * re-authenticating on every test.
 */

import { test as setup, expect } from '@playwright/test';
import { AUTH_STATE_PATH, TEST_PHONE_LOCAL, TEST_OTP } from '../helpers/constants';

setup('authenticate seller user', async ({ page }) => {
  // Navigate to login page
  await page.goto('/en/auth/login');
  await expect(page.locator('h1')).toBeVisible();

  // Enter phone number (local digits only — the +20 prefix is already shown)
  await page.fill('input#phone', TEST_PHONE_LOCAL);
  await page.click('button[type="submit"]');

  // Wait for the verify page
  await expect(page).toHaveURL(/\/auth\/verify/);
  await expect(page.locator('h1')).toBeVisible();

  // Enter dev OTP
  await page.fill('input#code', TEST_OTP);
  await page.click('button[type="submit"]');

  // Wait for redirect to home
  await expect(page).toHaveURL(/\/en$/);

  // Save storage state (includes localStorage with kanto.auth.v1)
  await page.context().storageState({ path: AUTH_STATE_PATH });
});
