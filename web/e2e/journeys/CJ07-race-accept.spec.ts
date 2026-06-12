/**
 * CJ-07 · Two buyers race on accept (U-S + U-B + U-X)
 *
 * Scenario:
 *   U-S creates a listing.
 *   U-B offers low (4500).
 *   U-X offers higher (4800).
 *   U-S goes to /my/offers Received and accepts U-X's offer via UI.
 *
 * What this spec asserts as **current behavior** (BE has no guard today):
 *   - Both offers are visible on U-S's Received tab as PENDING.
 *   - After U-S accepts U-X's, U-X's status becomes ACCEPTED.
 *   - U-B's offer status is NOT automatically updated — it stays PENDING.
 *   - The BE allows U-S to subsequently also accept U-B's offer
 *     (no "one accepted offer per listing" constraint).
 *
 * This documents G2 (see docs/test_plan.md §8). The spec will need to be
 * tightened once product decides the rule (auto-decline siblings on accept,
 * OR reject second accept, OR allow multiple winners). To flip:
 *   - replace the `expect(...).toBeLessThan(500)` on the second-accept call
 *     with an explicit 4xx/conflict assertion, OR
 *   - assert U-B's status flips to DECLINED/EXPIRED right after U-X is accepted.
 */

import { test, expect } from '../fixtures/concurrent';
import { LOCALES } from '../helpers/constants';
import {
  createListingAsSeller,
  createOfferAsBuyer,
  deleteListing,
  listReceivedOffers,
  rawApi,
  type ListingFixture,
  type OfferFixture,
} from '../helpers/factory';
import { getTestData } from '../helpers/test-data';

for (const locale of LOCALES) {
  test.describe(`[${locale.toUpperCase()}] CJ-07 — Race on accept (3-user)`, () => {
    let listing: ListingFixture;
    let offerB: OfferFixture; // U-B's offer
    let offerX: OfferFixture; // U-X's offer

    test.beforeEach(async () => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
      listing = await createListingAsSeller({
        title: `CJ-07 ${locale.toUpperCase()} Camera ${unique}`,
        askingPrice: 5000,
        category: 'ELECTRONICS',
      });
      // U-B offers low.
      offerB = await createOfferAsBuyer(
        listing.id,
        { amount: 4500, note: 'CJ-07 U-B' },
        getTestData().buyerToken,
      );
      // U-X offers higher.
      offerX = await createOfferAsBuyer(
        listing.id,
        { amount: 4800, note: 'CJ-07 U-X' },
        getTestData().thirdToken,
      );
    });

    test.afterEach(async () => {
      if (listing?.id) await deleteListing(listing.id);
    });

    test('seller sees both offers; accepting U-X auto-declines U-B (R-01 cascade)', async ({
      sellerPage,
    }) => {
      // ── 1. Seller opens /my/offers Received ──────────────────────────
      await sellerPage.goto(`/${locale}/my/offers`, {
        waitUntil: 'domcontentloaded',
      });
      await sellerPage.waitForSelector('[role="tab"]', { timeout: 15_000 });

      // Both rows should appear (filter by listing title — two rows result).
      const rowsForListing = sellerPage
        .locator('[class*="list"] > [class*="row"]')
        .filter({ hasText: listing.title });
      await expect(rowsForListing.first()).toBeVisible({ timeout: 15_000 });
      const initialRowCount = await rowsForListing.count();
      expect(initialRowCount, 'seller sees both U-B and U-X offers').toBeGreaterThanOrEqual(2);

      // Locate U-X's specific row by its amount (4800 is unique vs. 4500).
      const offerXAmountText = (4800).toLocaleString('en-US');
      const xRow = sellerPage
        .locator('[class*="list"] > [class*="row"]')
        .filter({ hasText: listing.title })
        .filter({ hasText: offerXAmountText })
        .first();
      await expect(xRow).toBeVisible();
      await expect(xRow.locator('[class*="statusChip"]')).toHaveText(
        /pending|بانتظار الرد/i,
      );

      // ── 2. Seller clicks Accept on U-X's row ─────────────────────────
      const acceptBtn = xRow
        .locator('button')
        .filter({ hasText: /accept|اقبل/i })
        .first();
      await expect(acceptBtn).toBeVisible();
      await acceptBtn.click();

      // U-X's status flips to ACCEPTED.
      await expect(xRow.locator('[class*="statusChip"]')).toHaveText(
        /accepted|مقبول/i,
        { timeout: 10_000 },
      );

      // ── 3. BE: U-X ACCEPTED + U-B auto-DECLINED via R-01 cascade ────
      const received = await listReceivedOffers();
      const xSrv = received.find((o) => o.id === offerX.id);
      const bSrv = received.find((o) => o.id === offerB.id);
      expect(xSrv?.status).toBe('ACCEPTED');
      // R-01: U-B's offer was auto-declined when U-X's accept fired.
      expect(bSrv?.status).toBe('DECLINED');
      // declineReason must reflect the cascade origin (raw field on the offer).
      // listReceivedOffers's typing does not include declineReason; assert via
      // a second fetch with type-cast.
      const bSrvFull = bSrv as unknown as { declineReason?: string | null };
      expect(bSrvFull.declineReason).toBe('auto_declined_listing_sold');

      // ── 4. Second accept on U-B's offer → 403 (listing now RESERVED) ──
      const secondAccept = await rawApi(
        `/api/v1/offers/${offerB.id}/accept`,
        { method: 'PATCH' },
        getTestData().sellerToken,
      );
      expect(secondAccept.status).toBeGreaterThanOrEqual(400);
      expect(secondAccept.status).toBeLessThan(500);
      // BE returns the "Offer cannot be accepted" forbidden because U-B is
      // already DECLINED. If U-B had been PENDING somehow, the listing-status
      // check would have kicked in instead. Either way, NOT a 200.
      expect(secondAccept.status).not.toBe(200);

      // U-B's status must not have flipped to ACCEPTED.
      const receivedFinal = await listReceivedOffers();
      const bSrvFinal = receivedFinal.find((o) => o.id === offerB.id);
      expect(bSrvFinal?.status).toBe('DECLINED');
    });

    test('U-X cannot withdraw U-B\'s offer (non-party rejection)', async () => {
      // U-X tries to withdraw U-B's offer via API — must be 4xx.
      const res = await rawApi(
        `/api/v1/offers/${offerB.id}/withdraw`,
        { method: 'PATCH' },
        getTestData().thirdToken,
      );
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(500);
    });

    test('U-X cannot accept (only seller can accept)', async () => {
      // U-X attempts seller-side action — must be 4xx.
      const res = await rawApi(
        `/api/v1/offers/${offerB.id}/accept`,
        { method: 'PATCH' },
        getTestData().thirdToken,
      );
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(500);
    });
  });
}
