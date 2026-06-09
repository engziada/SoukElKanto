/**
 * J-10 · Favorites Persistence (localStorage)
 * Verifies heart toggle persists across reloads and /my/favorites shows saved listings.
 */

import { test, expect } from '@playwright/test';
import { LOCALES, FAVORITES_STORAGE_KEY, AUTH_STATE_PATH } from '../helpers/constants';
import { getTestData } from '../helpers/test-data';

// Serial across locales prevents EN+AR from concurrently hammering the listing API
test.describe('J-10 — Favorites (serial)', () => {
  test.describe.configure({ mode: 'serial' });

  for (const locale of LOCALES) {
    test.describe(`[${locale.toUpperCase()}] J-10 — Favorites`, () => {
    // Auth is required so /my/favorites passes AuthGate; favorites themselves are localStorage-based.
    test.use({ storageState: AUTH_STATE_PATH });

    test.beforeEach(async ({ page }) => {
      // Clear favorites before each test; use fast navigation to avoid long page load timeouts
      await page.goto(`/${locale}`, { waitUntil: 'domcontentloaded' });
      await page.evaluate((key: string) => localStorage.removeItem(key), FAVORITES_STORAGE_KEY);
    });

    test('heart toggle fills on click', async ({ page }) => {
      const { listingId } = getTestData();
      await page.goto(`/${locale}/listings/${listingId}`, { waitUntil: 'domcontentloaded' });
      // Confirm listing data loaded (trustPanel renders after API resolves)
      await expect(page.locator('[class*="trustPanel"]')).toBeVisible({ timeout: 20_000 });

      // Find the Save heart button (aria-pressed="false" means not saved)
      const heartBtn = page.locator('button[aria-pressed]').first();
      await expect(heartBtn).toBeVisible();
      await expect(heartBtn).toHaveAttribute('aria-pressed', 'false');

      // Click to save
      await heartBtn.click();

      // Heart must now be active
      await expect(heartBtn).toHaveAttribute('aria-pressed', 'true', { timeout: 3_000 });
    });

    test('heart state persists across hard reload', async ({ page }) => {
      const { listingId } = getTestData();
      await page.goto(`/${locale}/listings/${listingId}`, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('[class*="trustPanel"]')).toBeVisible({ timeout: 20_000 });

      const heartBtn = page.locator('button[aria-pressed]').first();
      await heartBtn.click();
      await expect(heartBtn).toHaveAttribute('aria-pressed', 'true');

      // Hard reload the page
      await page.reload();

      // Heart must still be filled after reload (localStorage persists).
      // Listing data re-fetches after reload — allow enough time for the button to appear.
      const heartBtnAfterReload = page.locator('button[aria-pressed]').first();
      await expect(heartBtnAfterReload).toBeVisible();
      await expect(heartBtnAfterReload).toHaveAttribute('aria-pressed', 'true');
    });

    test('/my/favorites shows saved listing card', async ({ page }) => {
      const { listingId } = getTestData();

      // Save the listing
      await page.goto(`/${locale}/listings/${listingId}`, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('[class*="trustPanel"]')).toBeVisible({ timeout: 20_000 });
      const heartBtn = page.locator('button[aria-pressed]').first();
      await heartBtn.click();
      await expect(heartBtn).toHaveAttribute('aria-pressed', 'true');

      // Navigate to favorites page
      await page.goto(`/${locale}/my/favorites`);

      // The listing card must appear in the favorites grid
      const card = page.locator('[class*="listingCard"], [class*="card"]').first();
      await expect(card).toBeVisible({ timeout: 8_000 });
    });

    test('unsaving removes listing from /my/favorites', async ({ page }) => {
      const { listingId } = getTestData();

      // Save the listing
      await page.goto(`/${locale}/listings/${listingId}`, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('[class*="trustPanel"]')).toBeVisible({ timeout: 20_000 });
      const heartBtn = page.locator('button[aria-pressed]').first();
      await heartBtn.click();
      await expect(heartBtn).toHaveAttribute('aria-pressed', 'true');

      // Unsave
      await heartBtn.click();
      await expect(heartBtn).toHaveAttribute('aria-pressed', 'false', { timeout: 3_000 });

      // Navigate to favorites — no cards should be present
      await page.goto(`/${locale}/my/favorites`);
      const cards = page.locator('[class*="listingCard"]');
      const cardCount = await cards.count();
      expect(cardCount).toBe(0);
    });
  }); // end locale describe
  } // end for
}); // end serial wrapper
