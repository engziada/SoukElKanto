/**
 * J-05 · Make Offer
 * Tests the full offer modal flow: happy path, own-listing guard, unauthenticated
 * redirect, and invalid amount validation.
 */

import { test, expect } from '@playwright/test';
import {
  LOCALES,
  I18N,
  AUTH_STATE_PATH,
  BUYER_AUTH_STATE_PATH,
  AUTH_STORAGE_KEY,
} from '../helpers/constants';
import { getTestData } from '../helpers/test-data';

for (const locale of LOCALES) {
  test.describe(`[${locale.toUpperCase()}] J-05 — Make Offer`, () => {

    // ── Unauthenticated: clicking Make Offer redirects to login ─────────
    test('unauthenticated Make Offer redirects to login', async ({ page }) => {
      const { listingId } = getTestData();
      await page.goto(`/${locale}/listings/${listingId}`, { waitUntil: 'domcontentloaded' });
      // Ensure not logged in
      await page.evaluate((key: string) => localStorage.removeItem(key), AUTH_STORAGE_KEY);
      await page.reload();
      // Wait for listing data to load after reload
      await expect(page.locator('[class*="trustPanel"]')).toBeVisible();

      const offerBtn = page.getByText(I18N[locale].makeOffer, { exact: false }).first();
      await expect(offerBtn).toBeVisible();
      await offerBtn.click();

      // Must redirect to login — NOT open the modal
      await expect(page).toHaveURL(/\/auth\/login/, { timeout: 8_000 });
    });

    // ── Authenticated buyer: full modal happy path ──────────────────────
    test('authenticated buyer can send offer and see success state', async ({ browser }) => {
      // Use BUYER context (buyer != seller, so own-listing guard does NOT fire)
      const ctx = await browser.newContext({ storageState: BUYER_AUTH_STATE_PATH });
      const page = await ctx.newPage();

      const { listingId } = getTestData();
      await page.goto(`/${locale}/listings/${listingId}`);

      // Click Make Offer — modal should open (buyer is different from seller)
      const offerBtn = page.getByText(I18N[locale].makeOffer, { exact: false }).first();
      await expect(offerBtn).toBeVisible();
      await offerBtn.click();

      // Modal must be open
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible({ timeout: 5_000 });

      // Amount input must receive focus
      const amountInput = page.locator('input#offer-amount');
      await expect(amountInput).toBeFocused({ timeout: 3_000 });

      // Enter amount
      await amountInput.fill('1800');

      // Enter optional note
      await page.locator('textarea#offer-note').fill('Happy to meet at the Safe Spot.');

      // Send Offer button (locale-aware)
      const sendBtn = page.locator('button').filter({ hasText: /send offer|ابعت|إرسال/i }).first();
      await sendBtn.click();

      // Success state must show
      await expect(page.getByText(I18N[locale].offerSentTitle, { exact: false })).toBeVisible({
        timeout: 10_000,
      });

      // Click Done to close modal
      const doneBtn = page.locator('button').filter({ hasText: /done|تمام/i }).first();
      await doneBtn.click();

      // Modal must be closed
      await expect(page.getByRole('dialog')).toBeHidden({ timeout: 3_000 });

      await ctx.close();
    });

    // ── Invalid amount: submit with blank amount shows error ────────────
    test('invalid amount (blank) shows validation error', async ({ browser }) => {
      // Use buyer context for this test too
      const ctx = await browser.newContext({ storageState: BUYER_AUTH_STATE_PATH });
      const page = await ctx.newPage();

      const { listingId } = getTestData();
      await page.goto(`/${locale}/listings/${listingId}`);

      const offerBtn = page.getByText(I18N[locale].makeOffer, { exact: false }).first();
      await expect(offerBtn).toBeVisible();
      await offerBtn.click();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible({ timeout: 5_000 });

      // Leave amount blank and click Send
      const sendBtn = page.locator('button').filter({ hasText: /send offer|ابعت|إرسال/i }).first();
      await sendBtn.click();

      // Validation error must appear
      const amountError = page.locator('[role="alert"]').first();
      await expect(amountError).toBeVisible({ timeout: 3_000 });

      await ctx.close();
    });

    // ── Own-listing guard (R-07): page-level CTAs change for the seller ───
    // The page guard is the primary defense — sellers never see "Make Offer"
    // on their own listing. The OfferModal carries a defense-in-depth warning
    // block as a safety net for any code path that could force-open it.
    test('own-listing guard: seller sees Review Offers + Edit, not Make Offer', async ({ browser }) => {
      const ctx = await browser.newContext({ storageState: AUTH_STATE_PATH });
      const page = await ctx.newPage();

      const { listingId } = getTestData();
      await page.goto(`/${locale}/listings/${listingId}`);

      // Trust panel renders → page hydrated.
      await expect(page.locator('[class*="trustPanel"]')).toBeVisible();

      // Make Offer must NOT be present (page-level guard active).
      const makeOfferBtn = page.getByText(I18N[locale].makeOffer, { exact: true });
      await expect(makeOfferBtn).toHaveCount(0);

      // Alternate CTAs must be present.
      // "Review Offers" (EN) / "راجع العروض" or "عروض إعلانك" (AR).
      const reviewOffersBtn = page
        .locator('button, a')
        .filter({ hasText: /review offers|شوف العروض/i });
      await expect(reviewOffersBtn.first()).toBeVisible();

      // "Edit" (EN) / "تعديل" (AR).
      const editBtn = page.locator('button, a').filter({ hasText: /^edit$|تعديل/i });
      await expect(editBtn.first()).toBeVisible();

      // The defense-in-depth OfferModal warning block (.ownListingGate) must
      // NOT be currently visible because the page guard prevented modal open.
      const ownListingGate = page.locator('[class*="ownListingGate"]');
      await expect(ownListingGate).toHaveCount(0);

      await ctx.close();
    });
  });
}
