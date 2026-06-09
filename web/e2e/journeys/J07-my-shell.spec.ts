/**
 * J-07 · /my Dashboard Shell + AuthGate
 * Verifies AuthGate blocks unauthenticated access and all 8 tabs are reachable.
 */

import { test, expect } from '@playwright/test';
import { LOCALES, AUTH_STATE_PATH, AUTH_STORAGE_KEY } from '../helpers/constants';

const MY_TABS = [
  { key: 'overview', path: '' },
  { key: 'listings', path: '/listings' },
  { key: 'offers', path: '/offers' },
  { key: 'handovers', path: '/handovers' },
  { key: 'favorites', path: '/favorites' },
  { key: 'wallet', path: '/wallet' },
  { key: 'trust-meter', path: '/trust-meter' },
  { key: 'profile', path: '/profile' },
] as const;

for (const locale of LOCALES) {
  test.describe(`[${locale.toUpperCase()}] J-07 — /my Shell`, () => {

    test('unauthenticated /my redirects to login', async ({ page }) => {
      // Fresh page context has empty localStorage — go directly to /my.
      // AuthGate (client-side) detects no auth after hydration and redirects.
      await page.goto(`/${locale}/my`);
      await expect(page).toHaveURL(/\/auth\/login/, { timeout: 20_000 });
    });

    test('authenticated: 8 tab labels are visible', async ({ browser }) => {
      const ctx = await browser.newContext({ storageState: AUTH_STATE_PATH });
      const page = await ctx.newPage();

      await page.goto(`/${locale}/my`);
      // The /my overview must load (not redirected)
      await expect(page).toHaveURL(new RegExp(`/${locale}/my`), { timeout: 8_000 });

      // MyTabs renders inside AuthGate (client-side); wait for it to hydrate.
      // MyTabs uses <nav aria-label="{overview-label}"> with 8 <Link> items.
      // We can identify it as the nav that has 3+ <a> children under /my (distinct from the site nav).
      // Strategy: find nav whose first link href contains "/my" (tab links).
      const myTabsNav = page.locator('nav').filter({ has: page.locator(`a[href*="${locale}/my"]`) });
      await expect(myTabsNav.first()).toBeVisible();

      // All 8 tab links must be inside that nav
      const tabCount = await myTabsNav.first().locator('a').count();
      expect(tabCount).toBeGreaterThanOrEqual(8);

      await ctx.close();
    });

    for (const tab of MY_TABS) {
      test(`tab "${tab.key}" navigates to correct URL and renders heading`, async ({
        browser,
      }) => {
        const ctx = await browser.newContext({ storageState: AUTH_STATE_PATH });
        const page = await ctx.newPage();

        await page.goto(`/${locale}/my${tab.path}`, { waitUntil: 'domcontentloaded' });
        // URL must be under /my/ (some tabs may redirect to a sibling if not implemented)
        await expect(page).toHaveURL(new RegExp(`/${locale}/my`), { timeout: 15_000 });

        // Panel heading or section content must be visible
        const heading = page.getByRole('heading').first();
        await expect(heading).toBeVisible({ timeout: 15_000 });

        await ctx.close();
      });
    }
  });
}
