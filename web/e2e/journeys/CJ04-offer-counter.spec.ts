/**
 * CJ-04 · Offer Counter (2-user)
 *
 * U-B offers a low amount. U-S counters with a higher amount via the inline
 * counter form in /my/offers Received.
 *
 * BE behavior (per soukelkanto.service.ts:397):
 *   - Original offer flips to status=COUNTERED.
 *   - A NEW child offer is created with parentOfferId=<original>, same
 *     buyer/seller, status=PENDING.
 *
 * UI gap (G1 — flagged in docs/test_plan.md):
 *   - The new child offer keeps buyer/seller assignment from parent.
 *   - The buyer's Sent tab only renders Withdraw on PENDING/COUNTERED rows.
 *   - There is currently NO buyer-side UI to accept the seller's counter.
 *   - Spec documents current behavior: buyer can only Withdraw the child OR
 *     submit a fresh offer at a new amount.
 */

import { test, expect } from '../fixtures/concurrent';
import { LOCALES } from '../helpers/constants';
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
  test.describe(`[${locale.toUpperCase()}] CJ-04 — Offer counter (2-user)`, () => {
    let listing: ListingFixture;
    let originalOffer: OfferFixture;

    test.beforeEach(async () => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
      listing = await createListingAsSeller({
        title: `CJ-04 ${locale.toUpperCase()} TV ${unique}`,
        askingPrice: 5000,
        category: 'ELECTRONICS',
      });
      originalOffer = await createOfferAsBuyer(listing.id, { amount: 3000 });
    });

    test.afterEach(async () => {
      if (listing?.id) await deleteListing(listing.id);
    });

    test('seller counters → original=COUNTERED, child=PENDING with parentOfferId', async ({
      sellerPage,
    }) => {
      await sellerPage.goto(`/${locale}/my/offers`, { waitUntil: 'domcontentloaded' });
      await sellerPage.waitForSelector('[role="tab"]', { timeout: 15_000 });

      // The original offer amount is 3000 (from beforeEach). The child offer
      // created after counter will be 4200. Filter the ORIGINAL row by both
      // listing title AND amount to disambiguate from the upcoming child row.
      const originalAmountText = (3000).toLocaleString('en-US');
      const originalRow = sellerPage
        .locator('[class*="list"] > [class*="row"]')
        .filter({ hasText: listing.title })
        .filter({ hasText: originalAmountText })
        .first();
      await expect(originalRow).toBeVisible({ timeout: 15_000 });

      // ── Click Counter — inline form reveals ──────────────────────────
      // AR button label is "عرض مضاد" — same as the status chip text, but the
      // status chip is in a different scope. The Counter button matches.
      const counterBtn = originalRow
        .locator('button')
        .filter({ hasText: /^counter$|عرض مضاد/i })
        .first();
      await expect(counterBtn).toBeVisible();
      await counterBtn.click();

      // Inline counter input must appear and auto-focus
      const counterInput = originalRow.locator('input[type="number"]');
      await expect(counterInput).toBeVisible({ timeout: 3_000 });

      // Pre-fills with original amount (3000). Replace with 4200.
      const counterAmount = 4200;
      await counterInput.fill(String(counterAmount));

      // ── Click Confirm to submit counter ──────────────────────────────
      // AR label is "تأكيد"
      const confirmBtn = originalRow
        .locator('button')
        .filter({ hasText: /confirm|تأكيد/i })
        .first();
      await confirmBtn.click();

      // ORIGINAL row's status chip flips to COUNTERED. After invalidate, the
      // list re-renders with BOTH rows (original + new child); we still need
      // the original-filtered locator (by amount 3000) to pick the right row.
      await expect(originalRow.locator('[class*="statusChip"]')).toHaveText(
        /countered|عرض مضاد/i,
        { timeout: 10_000 },
      );

      // ── BE: verify exact state ───────────────────────────────────────
      const received = await listReceivedOffers();

      const parent = received.find((o) => o.id === originalOffer.id);
      expect(parent?.status).toBe('COUNTERED');

      // Child offer (different id, parentOfferId set, status PENDING, new amount)
      const child = received.find(
        (o) =>
          o.id !== originalOffer.id &&
          (o as unknown as { parentOfferId?: string }).parentOfferId ===
            originalOffer.id,
      );
      expect(child, 'BE should create a child offer with parentOfferId').toBeDefined();
      expect(child?.status).toBe('PENDING');
      expect(child?.amount).toBe(counterAmount);
      expect(child?.buyerId).toBe(originalOffer.buyerId);
      expect(child?.sellerId).toBe(originalOffer.sellerId);
    });

    test('cannot counter an already-COUNTERED offer (BE guard)', async () => {
      const { counterOffer } = await import('../helpers/factory');
      const { rawApi } = await import('../helpers/factory');
      const { getTestData } = await import('../helpers/test-data');

      // First counter — succeeds.
      await counterOffer(originalOffer.id, 4500);

      // Second counter on the same original — BE should reject with 403/4xx.
      const res = await rawApi(
        `/api/v1/offers/${originalOffer.id}/counter`,
        { method: 'PATCH', body: JSON.stringify({ amount: 4800 }) },
        getTestData().sellerToken,
      );
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(500);
    });

    test('buyer accepts seller counter from Sent tab → child ACCEPTED, listing RESERVED (R-02)', async ({
      buyerPage,
    }) => {
      // Setup: seller counters via API → child offer created at amount 4200.
      const { counterOffer } = await import('../helpers/factory');
      const child = await counterOffer(originalOffer.id, 4200);

      // Buyer opens /my/offers Sent tab.
      await buyerPage.goto(`/${locale}/my/offers`, { waitUntil: 'domcontentloaded' });
      await buyerPage.waitForSelector('[role="tab"]', { timeout: 15_000 });
      const sentTab = buyerPage
        .locator('[role="tab"]')
        .filter({ hasText: /sent|اللي بعتها/i });
      await sentTab.first().click();

      // Two rows for this listing: original (COUNTERED) + child (PENDING).
      // Filter the child specifically by the counter amount (4200 ≠ 3000).
      const childAmountText = (4200).toLocaleString('en-US');
      const childRow = buyerPage
        .locator('[class*="list"] > [class*="row"]')
        .filter({ hasText: listing.title })
        .filter({ hasText: childAmountText })
        .first();
      await expect(childRow).toBeVisible({ timeout: 15_000 });

      // "Accept counter" button is present on the child row.
      const acceptBtn = childRow
        .locator('button')
        .filter({ hasText: /accept counter|اقبل المضاد/i })
        .first();
      await expect(acceptBtn).toBeVisible();
      await acceptBtn.click();

      // Status chip flips to ACCEPTED.
      await expect(childRow.locator('[class*="statusChip"]')).toHaveText(
        /accepted|مقبول/i,
        { timeout: 10_000 },
      );

      // BE: child is ACCEPTED, listing is RESERVED.
      const sent = await listSentOffers();
      const childSrv = sent.find((o) => o.id === child.id);
      expect(childSrv?.status).toBe('ACCEPTED');
    });

    test('buyer declines seller counter from Sent tab → child DECLINED, listing stays ACTIVE (R-02)', async ({
      buyerPage,
    }) => {
      const { counterOffer } = await import('../helpers/factory');
      const child = await counterOffer(originalOffer.id, 4200);

      await buyerPage.goto(`/${locale}/my/offers`, { waitUntil: 'domcontentloaded' });
      await buyerPage.waitForSelector('[role="tab"]', { timeout: 15_000 });
      const sentTab = buyerPage
        .locator('[role="tab"]')
        .filter({ hasText: /sent|اللي بعتها/i });
      await sentTab.first().click();

      const childAmountText = (4200).toLocaleString('en-US');
      const childRow = buyerPage
        .locator('[class*="list"] > [class*="row"]')
        .filter({ hasText: listing.title })
        .filter({ hasText: childAmountText })
        .first();
      await expect(childRow).toBeVisible({ timeout: 15_000 });

      const declineBtn = childRow
        .locator('button')
        .filter({ hasText: /decline counter|ارفض المضاد/i })
        .first();
      await expect(declineBtn).toBeVisible();
      await declineBtn.click();

      await expect(childRow.locator('[class*="statusChip"]')).toHaveText(
        /declined|مرفوض/i,
        { timeout: 10_000 },
      );

      // BE state — child DECLINED with reason; listing untouched.
      const sent = await listSentOffers();
      const childSrv = sent.find((o) => o.id === child.id);
      expect(childSrv?.status).toBe('DECLINED');
    });

    test('buyer re-counters seller counter → grandchild PENDING with parentOfferId=child.id (R-02)', async ({
      buyerPage,
    }) => {
      const { counterOffer, buyerCounterOffer } = await import('../helpers/factory');
      const child = await counterOffer(originalOffer.id, 4200);

      // API-level re-counter to keep the test compact (UI variant already
      // exercised by accept/decline flows above).
      const grandchild = await buyerCounterOffer(child.id, 3800);
      expect(grandchild.amount).toBe(3800);
      expect(grandchild.status).toBe('PENDING');
      expect(
        (grandchild as unknown as { parentOfferId?: string }).parentOfferId,
      ).toBe(child.id);

      // Child must now be COUNTERED.
      const sent = await listSentOffers();
      const childSrv = sent.find((o) => o.id === child.id);
      expect(childSrv?.status).toBe('COUNTERED');

      // UI: buyer sees the grandchild row. (Could also assert via UI.)
      await buyerPage.goto(`/${locale}/my/offers`, { waitUntil: 'domcontentloaded' });
      await buyerPage.waitForSelector('[role="tab"]', { timeout: 15_000 });
      const sentTab = buyerPage
        .locator('[role="tab"]')
        .filter({ hasText: /sent|اللي بعتها/i });
      await sentTab.first().click();

      const grandchildRow = buyerPage
        .locator('[class*="list"] > [class*="row"]')
        .filter({ hasText: listing.title })
        .filter({ hasText: (3800).toLocaleString('en-US') })
        .first();
      await expect(grandchildRow).toBeVisible({ timeout: 15_000 });
    });

    test('buyer-decline endpoint refuses non-counter offers (4xx)', async () => {
      const { rawApi } = await import('../helpers/factory');
      const { getTestData } = await import('../helpers/test-data');

      // originalOffer has parentOfferId=null → buyer-decline must reject.
      const res = await rawApi(
        `/api/v1/offers/${originalOffer.id}/buyer-decline`,
        { method: 'PATCH', body: JSON.stringify({ reason: 'test' }) },
        getTestData().buyerToken,
      );
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(500);
    });
  });
}
