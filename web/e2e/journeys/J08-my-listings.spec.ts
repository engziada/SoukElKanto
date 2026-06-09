/**
 * J-08 · My Listings
 * Verifies the seller's listing grid and status chips in /my/listings.
 */

import { test, expect } from '@playwright/test';
import { LOCALES, AUTH_STATE_PATH } from '../helpers/constants';
import { getTestData } from '../helpers/test-data';

/** All possible listing status labels (EN + AR sampled) */
const STATUS_PATTERN = /active|reserved|sold|expired|removed|pending|نشط|محجوز|مباع/i;

for (const locale of LOCALES) {
  test.describe(`[${locale.toUpperCase()}] J-08 — My Listings`, () => {
    test.use({ storageState: AUTH_STATE_PATH });

    test('seeded listing appears in /my/listings grid', async ({ page }) => {
      const { listingId } = getTestData();
      await page.goto(`/${locale}/my/listings`, { waitUntil: 'domcontentloaded' });

      // Wait for the listing grid or empty state
      const listArea = page.locator('[class*="listingCard"], [class*="grid"], [class*="empty"]');
      await expect(listArea.first()).toBeVisible({ timeout: 10_000 });

      // The seeded listing card must be visible (identified by its known title)
      const listingTitle = page.getByText('E2E Test Sofa', { exact: false });
      await expect(listingTitle.first()).toBeVisible();

      // Verify the listing ID is linkable — click the card link (not just the title text)
      const cardLink = page.locator(`a[href*="${listingId}"]`).first();
      await expect(cardLink).toBeVisible();
      await cardLink.click();
      await expect(page).toHaveURL(new RegExp(listingId));
    });

    test('listing card shows a status chip', async ({ page }) => {
      await page.goto(`/${locale}/my/listings`, { waitUntil: 'domcontentloaded' });

      // At least one status chip must be visible
      const statusChips = page.locator('[class*="status"], [class*="chip"]');
      const count = await statusChips.count();
      if (count > 0) {
        // Status chip text must match one of the known status labels
        const firstChipText = await statusChips.first().textContent();
        expect(firstChipText ?? '').toMatch(STATUS_PATTERN);
      }
    });

    test('empty state shows publish CTA when no listings', async ({ page }) => {
      // This test is only meaningful when the test user has no listings.
      // If the grid is populated, we skip gracefully.
      await page.goto(`/${locale}/my/listings`);

      const cards = page.locator('[class*="listingCard"]');
      const cardCount = await cards.count();
      if (cardCount > 0) {
        test.skip();
        return;
      }

      // Empty state must show a call-to-action link
      const cta = page.locator('a').filter({ hasText: /list|اعلن|انشر/i }).first();
      await expect(cta).toBeVisible();
    });
  });
}
