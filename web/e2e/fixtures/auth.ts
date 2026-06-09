/**
 * auth.ts — Playwright fixture extensions.
 *
 * Provides:
 *   - `authenticatedPage`  — page pre-loaded with seller storage state
 *   - `buyerPage`          — separate browser context logged in as buyer
 *   - `unauthenticatedPage`— page with cleared localStorage (no session)
 */

import { test as base, expect, type Page } from '@playwright/test';
import {
  AUTH_STATE_PATH,
  AUTH_STORAGE_KEY,
  TEST_PHONE_BUYER_LOCAL,
  TEST_OTP,
} from '../helpers/constants';

interface AuthFixtures {
  authenticatedPage: Page;
  buyerPage: Page;
  unauthenticatedPage: Page;
}

export const test = base.extend<AuthFixtures>({
  /** Page with seller already logged in via saved storage state */
  authenticatedPage: async ({ browser }, use) => {
    const ctx = await browser.newContext({
      storageState: AUTH_STATE_PATH,
    });
    const page = await ctx.newPage();
    await use(page);
    await ctx.close();
  },

  /** Page logged in as buyer (logs in via UI fresh each time) */
  buyerPage: async ({ browser }, use) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();

    await page.goto('/en/auth/login');
    await page.fill('input#phone', TEST_PHONE_BUYER_LOCAL);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/auth\/verify/);
    await page.fill('input#code', TEST_OTP);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/en$/);

    await use(page);
    await ctx.close();
  },

  /** Page with explicitly cleared auth (no session) */
  unauthenticatedPage: async ({ page }, use) => {
    await page.evaluate((key) => localStorage.removeItem(key), AUTH_STORAGE_KEY);
    await use(page);
  },
});

export { expect };
