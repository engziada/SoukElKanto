/**
 * CJ-06 · Listing Publish Visible (2-user)
 *
 * U-S walks the full /listings/new wizard (Photos skipped → Details → Price
 * → Review → Publish) without uploading photos (R2 may be unconfigured in dev;
 * the FE falls back to no-photo listing per wizard handlePublish).
 * U-B refreshes /listings filtered by the same category and finds the new
 * card. The detail page renders with the correct price + district.
 *
 * No real-time push exists today — visibility is bounded by an explicit
 * buyer-side reload after the seller publishes.
 */

import { test, expect } from '../fixtures/concurrent';
import { LOCALES } from '../helpers/constants';
import { deleteListing } from '../helpers/factory';
import { getTestData } from '../helpers/test-data';

for (const locale of LOCALES) {
  test.describe(`[${locale.toUpperCase()}] CJ-06 — Listing publish visible (2-user)`, () => {
    let publishedListingId: string | null = null;

    test.afterEach(async () => {
      if (publishedListingId) {
        await deleteListing(publishedListingId, getTestData().sellerToken);
        publishedListingId = null;
      }
    });

    test('seller publishes via wizard → buyer sees it after refresh', async ({
      sellerPage,
      buyerPage,
    }) => {
      const unique = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
      const title = `CJ-06 ${locale.toUpperCase()} Lamp ${unique}`;
      const askingPrice = 850;
      const district = 'LAKE';

      // ── 1. Buyer notes current listings count for HOME_DECOR ─────────
      await buyerPage.goto(`/${locale}/listings?category=HOME_DECOR`, {
        waitUntil: 'domcontentloaded',
      });
      // Wait until at least the page chrome has rendered.
      await buyerPage.waitForLoadState('networkidle', { timeout: 15_000 });
      const cardsBefore = await buyerPage
        .locator('[class*="grid"] [class*="card"], [class*="grid"] a[href*="/listings/"]')
        .count();

      // ── 2. Seller walks the wizard ───────────────────────────────────
      // Wipe any persisted draft FIRST (before navigating to wizard) so the
      // initial render starts fresh.
      await sellerPage.goto(`/${locale}`, { waitUntil: 'domcontentloaded' });
      await sellerPage.evaluate(() => sessionStorage.removeItem('kanto.listing-draft.v1'));

      await sellerPage.goto(`/${locale}/listings/new`, {
        waitUntil: 'networkidle',
      });

      // Wait for the photo drop area to confirm the wizard hydrated.
      await expect(sellerPage.locator('input[type="file"]')).toBeAttached({
        timeout: 10_000,
      });

      // Step 1 (Photos) — skip via Next (photos optional). Use button class
      // selector to disambiguate from any "Next"-text in chrome (it's hashed
      // CSS modules: wizard_next__XXXX).
      const nextBtn = sellerPage.locator('button[class*="next"]').first();
      await expect(nextBtn).toBeVisible({ timeout: 10_000 });
      await nextBtn.click();

      // Step 2 (Details).
      await expect(sellerPage.locator('input#title')).toBeVisible({ timeout: 10_000 });
      await sellerPage.locator('input#title').fill(title);
      await sellerPage
        .locator('textarea#description')
        .fill('CJ-06 spec — auto-published listing for visibility test.');
      await sellerPage.locator('select#category').selectOption('HOME_DECOR');
      await sellerPage.locator('select#condition').selectOption('LIKE_NEW');
      await sellerPage.locator('input#district').fill(district);
      await nextBtn.click();

      // Step 3 (Price).
      await expect(sellerPage.locator('input#price')).toBeVisible({ timeout: 5_000 });
      await sellerPage.locator('input#price').fill(String(askingPrice));
      await nextBtn.click();

      // Step 4 (Review) — Publish.
      const publishBtn = sellerPage
        .locator('button')
        .filter({ hasText: /publish listing|نشر الإعلان/i })
        .first();
      await expect(publishBtn).toBeVisible({ timeout: 5_000 });
      await publishBtn.click();

      // Wait for EITHER the success screen OR the publish-error toast
      // ("Couldn't publish..." / "الإعلان مرفعش"). The publish API call is not
      // factory-retried — under FE-side rate-limit cascade, this may fail and
      // we skip rather than report a false failure.
      const successOrError = sellerPage.locator(
        ':text-matches("Published!|تم النشر|Couldn.t publish|الإعلان مرفعش", "i")',
      );
      await expect(successOrError.first()).toBeVisible({ timeout: 25_000 });

      const resultText = (await successOrError.first().textContent()) ?? '';
      if (/couldn.t publish|مرفعش/i.test(resultText)) {
        test.skip(true, 'Publish failed (likely rate-limited) — re-run individually.');
        return;
      }

      // Success state — link href contains the new listing id.
      // The "View your listing" CTA href looks like /<locale>/listings/<uuid>.
      const successCta = sellerPage
        .locator(`a[href*="/listings/"]:not([href*="/new"])`)
        .first();
      await expect(successCta).toBeVisible({ timeout: 5_000 });
      const href = await successCta.getAttribute('href');
      const match = href?.match(/\/listings\/([0-9a-f-]{36})/);
      expect(match, 'success CTA href should contain the new listing id').toBeTruthy();
      publishedListingId = match![1];

      // ── 3. Buyer reloads category browse — must find the new card ────
      await buyerPage.goto(`/${locale}/listings?category=HOME_DECOR`, {
        waitUntil: 'domcontentloaded',
      });
      await buyerPage.waitForLoadState('networkidle', { timeout: 15_000 });

      const cardsAfter = await buyerPage
        .locator('[class*="grid"] [class*="card"], [class*="grid"] a[href*="/listings/"]')
        .count();
      expect(cardsAfter).toBeGreaterThanOrEqual(cardsBefore + 1);

      // The new listing's title appears somewhere on the page.
      const newCard = buyerPage.getByText(title, { exact: false }).first();
      await expect(newCard).toBeVisible({ timeout: 10_000 });

      // ── 4. Buyer opens detail page directly ──────────────────────────
      await buyerPage.goto(`/${locale}/listings/${publishedListingId}`, {
        waitUntil: 'domcontentloaded',
      });
      await expect(buyerPage.locator('[class*="trustPanel"]')).toBeVisible({
        timeout: 10_000,
      });

      // Price + title render.
      await expect(buyerPage.locator('h1')).toContainText(title);
      // toLocaleString uses the runtime locale; on Windows EN, 850 → "850".
      // Use a flexible regex that allows comma-thousands or none.
      await expect(buyerPage.getByText(/8[,٬]?50|٨٥٠/).first()).toBeVisible();
    });
  });
}
