/**
 * CJ-03 · Offer Decline (2-user)
 *
 * U-B sends an offer on U-S's listing. U-S declines it (with a reason) from
 * /my/offers Received. Both sides see status DECLINED. Buyer can still
 * re-offer with a new amount — declined offers don't lock the listing.
 */

import { test, expect } from '../fixtures/concurrent';
import { I18N, LOCALES } from '../helpers/constants';
import {
  createListingAsSeller,
  createOfferAsBuyer,
  deleteListing,
  listReceivedOffers,
  listSentOffers,
  type ListingFixture,
  type OfferFixture,
} from '../helpers/factory';

for (const locale of LOCALES) {
  test.describe(`[${locale.toUpperCase()}] CJ-03 — Offer decline (2-user)`, () => {
    let listing: ListingFixture;
    let offer: OfferFixture;

    test.beforeEach(async () => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
      listing = await createListingAsSeller({
        title: `CJ-03 ${locale.toUpperCase()} Bookshelf ${unique}`,
        askingPrice: 4000,
        category: 'FURNITURE',
      });
      // Seed the offer via API so the UI test starts at the decline action.
      offer = await createOfferAsBuyer(listing.id, { amount: 2500 });
    });

    test.afterEach(async () => {
      if (listing?.id) await deleteListing(listing.id);
    });

    test('seller declines pending offer → both sides see DECLINED', async ({
      sellerPage,
      buyerPage,
    }) => {
      // ── 1. Seller opens /my/offers (Received default) ────────────────
      await sellerPage.goto(`/${locale}/my/offers`, { waitUntil: 'domcontentloaded' });
      await sellerPage.waitForSelector('[role="tab"]', { timeout: 15_000 });

      const ourRow = sellerPage
        .locator('[class*="list"] > [class*="row"]')
        .filter({ hasText: listing.title })
        .first();
      await expect(ourRow).toBeVisible({ timeout: 15_000 });

      // ── 2. Seller clicks Decline ─────────────────────────────────────
      // AR label is "ارفض" (not "رفض")
      const declineBtn = ourRow
        .locator('button')
        .filter({ hasText: /decline|ارفض/i })
        .first();
      await expect(declineBtn).toBeVisible();
      await declineBtn.click();

      // Status chip flips to DECLINED
      const chip = ourRow.locator('[class*="statusChip"]');
      await expect(chip).toHaveText(/declined|مرفوض/i, { timeout: 10_000 });

      // Action buttons must disappear (no Accept/Counter/Decline once declined)
      const accept = ourRow.locator('button').filter({ hasText: /accept|اقبل/i });
      await expect(accept).toHaveCount(0);

      // ── 3. BE confirms DECLINED ──────────────────────────────────────
      const receivedAfter = await listReceivedOffers();
      const declinedSrv = receivedAfter.find((o) => o.id === offer.id);
      expect(declinedSrv?.status).toBe('DECLINED');

      // ── 4. Buyer sees DECLINED in Sent tab ───────────────────────────
      await buyerPage.goto(`/${locale}/my/offers`, { waitUntil: 'domcontentloaded' });
      await buyerPage.waitForSelector('[role="tab"]', { timeout: 15_000 });

      const sentTab = buyerPage
        .locator('[role="tab"]')
        .filter({ hasText: /sent|اللي بعتها/i });
      await sentTab.first().click();
      await expect(sentTab.first()).toHaveAttribute('aria-selected', 'true');

      const buyerRow = buyerPage
        .locator('[class*="list"] > [class*="row"]')
        .filter({ hasText: listing.title })
        .first();
      await expect(buyerRow).toBeVisible({ timeout: 15_000 });
      await expect(buyerRow.locator('[class*="statusChip"]')).toHaveText(
        /declined|مرفوض/i,
        { timeout: 10_000 },
      );

      // Withdraw must NOT be present on declined offers
      const withdraw = buyerRow
        .locator('button')
        .filter({ hasText: /withdraw|اسحب/i });
      await expect(withdraw).toHaveCount(0);
    });

    test('buyer can re-offer after decline (declined ≠ locked)', async ({
      buyerPage,
    }) => {
      // Decline the existing offer via API (UI flow already covered above).
      const { declineOffer } = await import('../helpers/factory');
      await declineOffer(offer.id, 'too low');

      // ── Buyer opens the listing detail and sends a SECOND offer ──────
      await buyerPage.goto(`/${locale}/listings/${listing.id}`, {
        waitUntil: 'domcontentloaded',
      });
      await expect(buyerPage.locator('[class*="trustPanel"]')).toBeVisible();

      const offerBtn = buyerPage
        .getByText(I18N[locale].makeOffer, { exact: false })
        .first();
      await offerBtn.click();

      const dialog = buyerPage.getByRole('dialog');
      await expect(dialog).toBeVisible({ timeout: 5_000 });

      const newAmount = 2800;
      await buyerPage.locator('input#offer-amount').fill(String(newAmount));
      await buyerPage
        .locator('button')
        .filter({ hasText: /send offer|ابعت|إرسال/i })
        .first()
        .click();

      await expect(
        buyerPage.getByText(I18N[locale].offerSentTitle, { exact: false }),
      ).toBeVisible({ timeout: 10_000 });

      // BE: now TWO offers on this listing — original DECLINED + new PENDING.
      const sent = await listSentOffers();
      const onThisListing = sent.filter((o) => o.listingId === listing.id);
      expect(onThisListing.length).toBeGreaterThanOrEqual(2);
      const statuses = onThisListing.map((o) => o.status).sort();
      expect(statuses).toEqual(expect.arrayContaining(['DECLINED', 'PENDING']));
    });
  });
}
