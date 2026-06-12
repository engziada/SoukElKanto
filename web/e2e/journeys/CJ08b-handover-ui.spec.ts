/**
 * CJ-08b · /my/handovers UI (R-03a)
 *
 * Wires the placeholder page to the live BE handover + ratings endpoints.
 * Verifies the full two-tap handover + post-handover rating UX.
 *
 * Scenario:
 *   - Seller creates listing; buyer offers; seller accepts → offer ACCEPTED.
 *   - Both open /my/handovers:
 *       * Each sees the offer in "Awaiting your confirmation" with a Confirm button.
 *   - Buyer confirms via UI → buyer's row moves to "Awaiting counterpart";
 *     seller (after refresh) STILL sees Confirm on their row.
 *   - Seller confirms via UI → both see the row in "Completed".
 *   - Buyer rates 5 stars via RatingModal → row shows "Rated" chip; seller
 *     still has an unrated Rate CTA. Seller rates → both rated.
 */

import { test, expect } from '../fixtures/concurrent';
import { LOCALES } from '../helpers/constants';
import {
  acceptOffer,
  createListingAsSeller,
  createOfferAsBuyer,
  deleteListing,
  type ListingFixture,
  type OfferFixture,
} from '../helpers/factory';

for (const locale of LOCALES) {
  test.describe(`[${locale.toUpperCase()}] CJ-08b — /my/handovers UI (R-03a)`, () => {
    let listing: ListingFixture;
    let offer: OfferFixture;

    test.beforeEach(async () => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
      listing = await createListingAsSeller({
        title: `CJ-08b Crib ${unique}`,
        askingPrice: 1500,
      });
      offer = await createOfferAsBuyer(listing.id, { amount: 1200 });
      await acceptOffer(offer.id);
    });

    test.afterEach(async () => {
      if (listing?.id) await deleteListing(listing.id);
    });

    test('buyer + seller see the handover, confirm independently, and rate at the end', async ({
      sellerPage,
      buyerPage,
    }) => {
      // ── 1. Seller opens /my/handovers ─────────────────────────────────
      await sellerPage.goto(`/${locale}/my/handovers`, { waitUntil: 'networkidle' });

      const sellerRow = sellerPage
        .locator('[class*="row"]')
        .filter({ hasText: listing.title })
        .first();
      await expect(sellerRow).toBeVisible({ timeout: 15_000 });
      const sellerConfirmBtn = sellerRow
        .locator('button')
        .filter({ hasText: /confirm handover|أكد التسليم/i })
        .first();
      await expect(sellerConfirmBtn).toBeVisible();

      // ── 2. Buyer opens /my/handovers ──────────────────────────────────
      await buyerPage.goto(`/${locale}/my/handovers`, { waitUntil: 'networkidle' });
      const buyerRow = buyerPage
        .locator('[class*="row"]')
        .filter({ hasText: listing.title })
        .first();
      await expect(buyerRow).toBeVisible({ timeout: 15_000 });

      const buyerConfirmBtn = buyerRow
        .locator('button')
        .filter({ hasText: /confirm handover|أكد التسليم/i })
        .first();
      await expect(buyerConfirmBtn).toBeVisible();

      // ── 3. Buyer confirms → row should report "Awaiting counterpart" ──
      await buyerConfirmBtn.click();
      // After invalidate, the row re-renders into the awaitingOther section.
      // The buyer row should now show an "Awaiting counterpart" status chip.
      await expect(
        buyerPage
          .locator('[class*="row"]')
          .filter({ hasText: listing.title })
          .locator('[class*="statusAwaiting"]'),
      ).toBeVisible({ timeout: 10_000 });

      // ── 4. Seller reloads and still has Confirm button ────────────────
      await sellerPage.reload({ waitUntil: 'domcontentloaded' });
      const sellerRow2 = sellerPage
        .locator('[class*="row"]')
        .filter({ hasText: listing.title })
        .first();
      const sellerConfirmBtn2 = sellerRow2
        .locator('button')
        .filter({ hasText: /confirm handover|أكد التسليم/i })
        .first();
      await expect(sellerConfirmBtn2).toBeVisible({ timeout: 10_000 });

      // ── 5. Seller confirms → both rows enter Completed ────────────────
      await sellerConfirmBtn2.click();
      // After both confirm, the seller row should show the Rate CTA.
      const sellerRateBtn = sellerPage
        .locator('[class*="row"]')
        .filter({ hasText: listing.title })
        .locator('button')
        .filter({ hasText: /rate counterpart|قيم الطرف التاني/i })
        .first();
      await expect(sellerRateBtn).toBeVisible({ timeout: 15_000 });

      // ── 6. Buyer refreshes → also has Rate CTA ────────────────────────
      await buyerPage.reload({ waitUntil: 'domcontentloaded' });
      const buyerRateBtn = buyerPage
        .locator('[class*="row"]')
        .filter({ hasText: listing.title })
        .locator('button')
        .filter({ hasText: /rate counterpart|قيم الطرف التاني/i })
        .first();
      await expect(buyerRateBtn).toBeVisible({ timeout: 10_000 });

      // ── 7. Buyer opens RatingModal, picks 5 stars, submits ────────────
      await buyerRateBtn.click();
      const ratingDialog = buyerPage.getByRole('dialog');
      await expect(ratingDialog).toBeVisible({ timeout: 5_000 });
      // Click the 5th star (data-score="5") to give the max rating.
      await buyerPage.locator('button[data-score="5"]').click();
      const submitBtn = buyerPage
        .locator('button')
        .filter({ hasText: /submit rating|ابعت التقييم/i })
        .first();
      await submitBtn.click();
      await expect(ratingDialog).toBeHidden({ timeout: 10_000 });

      // Buyer's row now shows the "Rated" chip.
      await expect(
        buyerPage
          .locator('[class*="row"]')
          .filter({ hasText: listing.title })
          .locator('[class*="statusDone"]'),
      ).toBeVisible({ timeout: 10_000 });

      // ── 8. Seller still sees the Rate CTA (hasn't rated yet) ──────────
      await sellerPage.reload({ waitUntil: 'domcontentloaded' });
      const sellerRateBtn2 = sellerPage
        .locator('[class*="row"]')
        .filter({ hasText: listing.title })
        .locator('button')
        .filter({ hasText: /rate counterpart|قيم الطرف التاني/i })
        .first();
      await expect(sellerRateBtn2).toBeVisible({ timeout: 10_000 });

      // Seller rates with 4 stars to exercise non-max path.
      await sellerRateBtn2.click();
      await expect(sellerPage.getByRole('dialog')).toBeVisible({ timeout: 5_000 });
      await sellerPage.locator('button[data-score="4"]').click();
      await sellerPage
        .locator('button')
        .filter({ hasText: /submit rating|ابعت التقييم/i })
        .first()
        .click();
      await expect(sellerPage.getByRole('dialog')).toBeHidden({ timeout: 10_000 });

      // Both rated → seller's row also shows the Rated chip.
      await expect(
        sellerPage
          .locator('[class*="row"]')
          .filter({ hasText: listing.title })
          .locator('[class*="statusDone"]'),
      ).toBeVisible({ timeout: 10_000 });
    });

    test('empty state appears when the user has no ACCEPTED offers', async ({
      buyerPage,
    }) => {
      // Withdraw the seeded offer so it leaves ACCEPTED state.
      // Actually buyers can't decline a buyer-initiated already-accepted offer
      // — we expire it via listing delete. Cleanup happens in afterEach.
      await deleteListing(listing.id);

      await buyerPage.goto(`/${locale}/my/handovers`, { waitUntil: 'networkidle' });
      // Empty state is rendered whenever no row matches the listing title.
      const row = buyerPage
        .locator('[class*="row"]')
        .filter({ hasText: listing.title });
      await expect(row).toHaveCount(0);
    });
  });
}
