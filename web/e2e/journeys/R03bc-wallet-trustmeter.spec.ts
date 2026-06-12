/**
 * R-03b / R-03c — /my/wallet + /my/trust-meter smoke tests
 *
 * Replaces the placeholder pages with real read-only views:
 *   - /my/wallet renders the two balance pills, the closed-loop policy
 *     banner, and the recent-activity section (empty or populated).
 *   - /my/trust-meter renders the tier ribbon with the BE-reported tier,
 *     the score number, the progress block, and the 5-rung ladder.
 *
 * These are smoke tests — they verify the page renders the BE data without
 * crashing, not the deeper semantics (which the BE unit tests cover).
 */

import { test, expect } from '../fixtures/concurrent';
import { LOCALES } from '../helpers/constants';

for (const locale of LOCALES) {
  test.describe(`[${locale.toUpperCase()}] R-03b — /my/wallet`, () => {
    test('wallet page renders two balance pills + closed-loop note', async ({
      buyerPage,
    }) => {
      await buyerPage.goto(`/${locale}/my/wallet`, { waitUntil: 'networkidle' });

      // Closed-loop policy banner exists (the v1 stance copy).
      const banner = buyerPage.locator('[class*="policyBanner"]');
      await expect(banner).toBeVisible({ timeout: 15_000 });

      // Both balance pills render.
      const balances = buyerPage.locator('[class*="balance"][class*="balanceValue"], [class*="balance"] > [class*="balanceValue"]');
      // CSS module hashes the class — just count balance value spans.
      const balanceValues = buyerPage.locator('[class*="balanceValue"]');
      await expect(balanceValues).toHaveCount(2, { timeout: 5_000 });

      // Both labels render too — one for individualTokens, one for businessTokens.
      const labels = buyerPage.locator('[class*="balanceLabel"]');
      await expect(labels).toHaveCount(2);

      // Recent activity section header is present (even if empty).
      const recent = buyerPage.getByRole('heading', {
        name: /recent activity|آخر المعاملات/i,
      });
      await expect(recent).toBeVisible();
    });
  });

  test.describe(`[${locale.toUpperCase()}] R-03c — /my/trust-meter`, () => {
    test('trust-meter renders tier ribbon, score, ladder', async ({
      buyerPage,
    }) => {
      await buyerPage.goto(`/${locale}/my/trust-meter`, { waitUntil: 'networkidle' });

      // Tier ribbon (any of the 5 tiers) is present.
      const ribbon = buyerPage.locator('[class*="ribbon"]').first();
      await expect(ribbon).toBeVisible({ timeout: 15_000 });

      // Score value (a number) renders.
      const scoreValue = buyerPage.locator('[class*="scoreValue"]');
      await expect(scoreValue).toBeVisible();
      const txt = (await scoreValue.textContent()) ?? '';
      // Accept en or ar-EG numerals + locale separators (٬ is U+066C, the
      // Arabic thousands separator).
      expect(txt).toMatch(/^[\d٠-٩,،٬\s.]+$/u);

      // Tier ladder lists exactly 5 tiers (li children of the ladder ul).
      const ladderItems = buyerPage.locator('[class*="tierLadder"] > li');
      await expect(ladderItems).toHaveCount(5);

      // Bonus grants section header exists (empty list is OK).
      const grantsHeader = buyerPage.getByRole('heading', {
        name: /bonus grants|مكافآتك/i,
      });
      await expect(grantsHeader).toBeVisible();
    });
  });
}
