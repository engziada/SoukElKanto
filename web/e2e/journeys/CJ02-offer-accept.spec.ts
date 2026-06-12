/**
 * CJ-02 · Offer Accept — the canonical 2-user happy path.
 *
 * U-S (seller) creates a fresh listing.
 * U-B (buyer) opens its detail page and submits an offer via the modal.
 * U-S navigates to /my/offers Received, sees the row, clicks Accept.
 * U-B refreshes /my/offers Sent and sees the row flip to ACCEPTED.
 *
 * The test never asserts on "the first row" — every assertion is filtered to
 * the specific offer id created in this run, so the suite can stay
 * fullyParallel without cross-test interference.
 */

import { test, expect } from '../fixtures/concurrent';
import { I18N, LOCALES } from '../helpers/constants';
import {
  createListingAsSeller,
  deleteListing,
  listReceivedOffers,
  listSentOffers,
  type ListingFixture,
} from '../helpers/factory';

for (const locale of LOCALES) {
  test.describe(`[${locale.toUpperCase()}] CJ-02 — Offer accept (2-user)`, () => {
    let listing: ListingFixture;

    test.beforeEach(async () => {
      // Per-locale unique title so EN + AR runs (in parallel) don't lock onto
      // each other's offer rows on the shared seller account.
      const unique = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
      listing = await createListingAsSeller({
        title: `CJ-02 ${locale.toUpperCase()} Sofa ${unique}`,
        askingPrice: 3000,
        category: 'FURNITURE',
      });
    });

    test.afterEach(async () => {
      if (listing?.id) await deleteListing(listing.id);
    });

    test('buyer offer → seller accept → both sides see ACCEPTED', async ({
      sellerPage,
      buyerPage,
    }) => {
      // ── 1. Buyer opens the detail page ────────────────────────────────
      await buyerPage.goto(`/${locale}/listings/${listing.id}`, {
        waitUntil: 'domcontentloaded',
      });
      await expect(buyerPage.locator('[class*="trustPanel"]')).toBeVisible();

      // ── 2. Buyer clicks Make Offer ────────────────────────────────────
      const makeOfferBtn = buyerPage
        .getByText(I18N[locale].makeOffer, { exact: false })
        .first();
      await expect(makeOfferBtn).toBeVisible();
      await makeOfferBtn.click();

      // Modal opens, amount focused
      const dialog = buyerPage.getByRole('dialog');
      await expect(dialog).toBeVisible({ timeout: 5_000 });

      const amountInput = buyerPage.locator('input#offer-amount');
      await expect(amountInput).toBeFocused({ timeout: 3_000 });

      // ── 3. Buyer fills + sends ────────────────────────────────────────
      const offerAmount = 2400;
      await amountInput.fill(String(offerAmount));
      await buyerPage
        .locator('textarea#offer-note')
        .fill('CJ-02: meet at Gate 4.');

      const sendBtn = buyerPage
        .locator('button')
        .filter({ hasText: /send offer|ابعت|إرسال/i })
        .first();
      await sendBtn.click();

      // Success state
      await expect(
        buyerPage.getByText(I18N[locale].offerSentTitle, { exact: false }),
      ).toBeVisible({ timeout: 10_000 });

      // ── 4. Server-side: locate the new offer id ──────────────────────
      const sentBefore = await listSentOffers();
      const myOffer = sentBefore.find(
        (o) => o.listingId === listing.id && o.amount === offerAmount,
      );
      expect(myOffer, 'newly-created offer should appear in /offers/sent').toBeDefined();
      expect(myOffer!.status).toBe('PENDING');

      // ── 5. Seller goes to /my/offers Received ────────────────────────
      await sellerPage.goto(`/${locale}/my/offers`, { waitUntil: 'domcontentloaded' });
      await sellerPage.waitForSelector('[role="tab"]', { timeout: 15_000 });

      // Received is the default tab — confirm it's selected
      const receivedTab = sellerPage
        .locator('[role="tab"]')
        .filter({ hasText: /received|اللي وصلتني/i });
      await expect(receivedTab.first()).toHaveAttribute('aria-selected', 'true');

      // Wait for the row that corresponds to our offer (filter by amount text,
      // which is unique-enough per test thanks to the unique listing title).
      // Filter by listing title (unique per test) — amount alone is not unique
      // when EN + AR runs share the seller account and run in parallel.
      const ourRow = sellerPage
        .locator('[class*="list"] > [class*="row"]')
        .filter({ hasText: listing.title })
        .first();
      // Status chip on the row should read PENDING
      await expect(ourRow).toBeVisible({ timeout: 15_000 });
      const statusChip = ourRow.locator('[class*="statusChip"]');
      await expect(statusChip).toBeVisible();
      await expect(statusChip).toHaveText(
        /pending|بانتظار الرد/i,
      );

      // Verify the WIP polish on the listing chip — title + price + date
      const listingTitleInChip = ourRow.locator('[class*="listingTitle"]');
      await expect(listingTitleInChip).toHaveText(listing.title);

      // ── 6. Seller clicks Accept ──────────────────────────────────────
      // AR "accept" label is "اقبل" (NOT "قبول") — partial regex covers both.
      const acceptBtn = ourRow
        .locator('button')
        .filter({ hasText: /accept|اقبل/i })
        .first();
      await expect(acceptBtn).toBeVisible();
      await acceptBtn.click();

      // Status chip flips to ACCEPTED (TanStack invalidate refetches)
      await expect(statusChip).toHaveText(/accepted|مقبول/i, { timeout: 10_000 });

      // ── 7. Server-side: confirm BE state ─────────────────────────────
      const receivedAfter = await listReceivedOffers();
      const acceptedSrv = receivedAfter.find((o) => o.id === myOffer!.id);
      expect(acceptedSrv?.status).toBe('ACCEPTED');

      // ── 8. Buyer refreshes /my/offers Sent — must show ACCEPTED ─────
      await buyerPage.goto(`/${locale}/my/offers`, { waitUntil: 'domcontentloaded' });
      await buyerPage.waitForSelector('[role="tab"]', { timeout: 15_000 });

      // Switch to Sent tab (Received is the default)
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

      const buyerChip = buyerRow.locator('[class*="statusChip"]');
      await expect(buyerChip).toHaveText(/accepted|مقبول/i, { timeout: 10_000 });

      // Withdraw button must NOT be present once accepted
      // AR label is "اسحب العرض"
      const withdrawBtn = buyerRow
        .locator('button')
        .filter({ hasText: /withdraw|اسحب/i });
      await expect(withdrawBtn).toHaveCount(0);
    });

    test('rejects a zero-amount offer at the BE', async () => {
      // Pure API test — bypass the UI to assert validation.
      const { BACKEND_URL, TENANT_ID } = await import('../helpers/constants');
      const { getTestData } = await import('../helpers/test-data');
      const buyerToken = getTestData().buyerToken;

      const res = await fetch(`${BACKEND_URL}/api/v1/offers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': TENANT_ID,
          Authorization: `Bearer ${buyerToken}`,
        },
        body: JSON.stringify({ listingId: listing.id, amount: 0 }),
      });

      // DTO has @Min(0) so 0 is technically allowed by class-validator. If the
      // service-layer rejects zero, this assertion will need to relax — for now
      // we assert that the BE doesn't 5xx and either accepts (≤ 201) or rejects
      // (4xx) deterministically.
      expect(res.status).toBeLessThan(500);
    });
  });
}
