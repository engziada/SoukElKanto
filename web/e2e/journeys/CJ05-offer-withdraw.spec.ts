/**
 * CJ-05 · Offer Withdraw (2-user)
 *
 * U-B sends an offer. U-B then withdraws it from /my/offers Sent. U-S sees
 * status WITHDRAWN in Received and the Accept/Decline/Counter buttons are
 * gone. BE rejects a second withdraw on the same offer (idempotency / 4xx).
 */

import { test, expect } from '../fixtures/concurrent';
import { LOCALES } from '../helpers/constants';
import {
  createListingAsSeller,
  createOfferAsBuyer,
  deleteListing,
  listReceivedOffers,
  listSentOffers,
  rawApi,
  type ListingFixture,
  type OfferFixture,
} from '../helpers/factory';
import { getTestData } from '../helpers/test-data';

for (const locale of LOCALES) {
  test.describe(`[${locale.toUpperCase()}] CJ-05 — Offer withdraw (2-user)`, () => {
    let listing: ListingFixture;
    let offer: OfferFixture;

    test.beforeEach(async () => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
      listing = await createListingAsSeller({
        title: `CJ-05 ${locale.toUpperCase()} Stroller ${unique}`,
        askingPrice: 2200,
        category: 'BABY_MATERNITY',
      });
      offer = await createOfferAsBuyer(listing.id, { amount: 1500 });
    });

    test.afterEach(async () => {
      if (listing?.id) await deleteListing(listing.id);
    });

    test('buyer withdraws → seller sees WITHDRAWN, actions disappear', async ({
      sellerPage,
      buyerPage,
    }) => {
      // ── 1. Buyer goes to Sent tab, clicks Withdraw ───────────────────
      await buyerPage.goto(`/${locale}/my/offers`, { waitUntil: 'domcontentloaded' });
      await buyerPage.waitForSelector('[role="tab"]', { timeout: 15_000 });

      const sentTab = buyerPage
        .locator('[role="tab"]')
        .filter({ hasText: /sent|اللي بعتها/i });
      await sentTab.first().click();

      const buyerRow = buyerPage
        .locator('[class*="list"] > [class*="row"]')
        .filter({ hasText: listing.title })
        .first();
      await expect(buyerRow).toBeVisible({ timeout: 15_000 });

      const withdrawBtn = buyerRow
        .locator('button')
        .filter({ hasText: /withdraw|اسحب/i })
        .first();
      await expect(withdrawBtn).toBeVisible();
      await withdrawBtn.click();

      // Status chip flips to WITHDRAWN
      await expect(buyerRow.locator('[class*="statusChip"]')).toHaveText(
        /withdrawn|ملغي/i,
        { timeout: 10_000 },
      );

      // ── 2. Seller refreshes Received — sees WITHDRAWN, no actions ────
      await sellerPage.goto(`/${locale}/my/offers`, { waitUntil: 'domcontentloaded' });
      await sellerPage.waitForSelector('[role="tab"]', { timeout: 15_000 });

      const sellerRow = sellerPage
        .locator('[class*="list"] > [class*="row"]')
        .filter({ hasText: listing.title })
        .first();
      await expect(sellerRow).toBeVisible({ timeout: 15_000 });
      await expect(sellerRow.locator('[class*="statusChip"]')).toHaveText(
        /withdrawn|ملغي/i,
        { timeout: 10_000 },
      );

      // Accept/Decline/Counter all gone
      for (const pattern of [/accept|اقبل/i, /decline|ارفض/i, /counter|عرض مضاد/i]) {
        await expect(
          sellerRow.locator('button').filter({ hasText: pattern }),
        ).toHaveCount(0);
      }

      // ── 3. BE confirms ───────────────────────────────────────────────
      const received = await listReceivedOffers();
      const srvOffer = received.find((o) => o.id === offer.id);
      expect(srvOffer?.status).toBe('WITHDRAWN');
    });

    test('double-withdraw is rejected by BE (4xx, not 5xx)', async () => {
      // First withdraw — succeeds.
      const first = await rawApi(
        `/api/v1/offers/${offer.id}/withdraw`,
        { method: 'PATCH' },
        getTestData().buyerToken,
      );
      expect(first.ok).toBe(true);

      // Second withdraw — must be deterministic (4xx, not crash).
      const second = await rawApi(
        `/api/v1/offers/${offer.id}/withdraw`,
        { method: 'PATCH' },
        getTestData().buyerToken,
      );
      expect(second.status).toBeGreaterThanOrEqual(400);
      expect(second.status).toBeLessThan(500);
    });

    test('seller cannot accept a WITHDRAWN offer', async () => {
      // Withdraw via API first.
      const { withdrawOffer } = await import('../helpers/factory');
      await withdrawOffer(offer.id);

      // Seller attempts accept — must be 4xx.
      const res = await rawApi(
        `/api/v1/offers/${offer.id}/accept`,
        { method: 'PATCH' },
        getTestData().sellerToken,
      );
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(500);

      // BE state unchanged: still WITHDRAWN.
      const sent = await listSentOffers();
      expect(sent.find((o) => o.id === offer.id)?.status).toBe('WITHDRAWN');
    });
  });
}
