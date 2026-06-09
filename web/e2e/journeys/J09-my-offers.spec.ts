/**
 * J-09 · My Offers (Sent / Received)
 * Verifies tab switching, offer rows, and status chips on /my/offers.
 */

import { test, expect } from '@playwright/test';
import { LOCALES, AUTH_STATE_PATH } from '../helpers/constants';

const OFFER_STATUS_PATTERN = /pending|accepted|declined|countered|withdrawn|expired|بانتظار الرد|مقبول|مرفوض|عرض مضاد|ملغي|انتهت صلاحيته/i;

for (const locale of LOCALES) {
  test.describe(`[${locale.toUpperCase()}] J-09 — My Offers`, () => {
    test.use({ storageState: AUTH_STATE_PATH });

    test('default tab is "Received" and offers load', async ({ page }) => {
      await page.goto(`/${locale}/my/offers`, { waitUntil: 'domcontentloaded' });
      // Wait for page to finish loading (tabs appear once AuthGate resolves)
      await page.waitForSelector('[role="tab"]', { timeout: 15_000 });

      // "Received" tab must be the active default
      const receivedTab = page.locator('[role="tab"][aria-selected="true"]');
      await expect(receivedTab.first()).toBeVisible();
      const activeTabText = await receivedTab.first().textContent();
      expect(activeTabText ?? '').toMatch(/received|اللي وصلتني/i);
    });

    test('switching to "Sent" tab shows sent offers or empty state', async ({ page }) => {
      await page.goto(`/${locale}/my/offers`, { waitUntil: 'domcontentloaded' });
      // Wait for tabs to render before clicking
      await page.waitForSelector('[role="tab"]', { timeout: 10_000 });

      // Click the Sent tab
      const sentTab = page.locator('[role="tab"]').filter({ hasText: /sent|اللي بعتها/i });
      await sentTab.first().click();

      // Sent tab must become active
      await expect(sentTab.first()).toHaveAttribute('aria-selected', 'true', { timeout: 3_000 });

      // Wait for Sent-tab content to load (list or empty state, not loading spinner)
      await page.waitForSelector('[class*="list"], [class*="empty"]:not([aria-busy="true"])', { timeout: 15_000 });
      // Either offers list or empty state must render
      const content = page.locator('[class*="list"], [class*="empty"]');
      await expect(content.first()).toBeVisible();
    });

    test('offer rows show amount and status chip', async ({ page }) => {
      await page.goto(`/${locale}/my/offers`, { waitUntil: 'domcontentloaded' });
      // Wait for content to load: either list or non-loading empty state
      await page.waitForSelector('[class*="list"], [class*="empty"]:not([aria-busy="true"])', { timeout: 15_000 });

      // Use a more specific selector: rows inside the offers list only
      const rows = page.locator('[class*="list"] > [class*="row"]');
      const rowCount = await rows.count();
      if (rowCount === 0) {
        // No offers seeded for the seller — skip gracefully
        test.skip();
        return;
      }

      // First row must contain an amount value
      const firstRow = rows.first();
      const amountEl = firstRow.locator('[class*="amountValue"]');
      await expect(amountEl).toBeVisible();

      // First row must contain a status chip
      const statusChip = firstRow.locator('[class*="statusChip"]');
      await expect(statusChip).toBeVisible();
      const chipText = await statusChip.textContent();
      expect(chipText ?? '').toMatch(OFFER_STATUS_PATTERN);
    });

    test('tab badge count matches number of offer rows', async ({ page }) => {
      await page.goto(`/${locale}/my/offers`, { waitUntil: 'domcontentloaded' });

      // Wait for content to load
      await page.waitForSelector('[class*="list"], [class*="empty"]:not([aria-busy="true"])', { timeout: 15_000 });

      // Count badge on the Received tab
      const receivedBadge = page
        .locator('[role="tab"]')
        .filter({ hasText: /received|اللي وصلتني/i })
        .locator('[class*="count"]');

      if (await receivedBadge.count() === 0) {
        // No badge shown — likely no offers
        test.skip();
        return;
      }

      const badgeText = await receivedBadge.textContent();
      const badgeNum = parseInt(badgeText ?? '0', 10);

      // Count the actual rows (inside the list only)
      const rows = page.locator('[class*="list"] > [class*="row"]');
      const rowCount = await rows.count();

      expect(badgeNum).toBe(rowCount);
    });
  });
}
