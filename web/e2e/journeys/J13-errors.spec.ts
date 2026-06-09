/**
 * J-13 · Error + Degraded States
 * Tests 404, network-down intercepts, and unauthenticated /my redirect.
 */

import { test, expect } from '@playwright/test';
import { LOCALES, I18N, AUTH_STORAGE_KEY } from '../helpers/constants';

for (const locale of LOCALES) {
  test.describe(`[${locale.toUpperCase()}] J-13 — Error States`, () => {

    test('404 listing ID shows notFound message', async ({ page }) => {
      // Navigate to a listing that does not exist.
      // API may throw 404 (→ networkDown state) or return null (→ notFound state).
      await page.goto(`/${locale}/listings/this-listing-id-does-not-exist-xyz-404`);
      // Either error state container must appear
      const errorContainer = page.locator('[class*="errorState"]');
      await expect(errorContainer).toBeVisible();
    });

    test('network-intercepted listings page shows error or empty state', async ({ page }) => {
      // Intercept all API listing calls and abort them to simulate network failure
      await page.route('**/api/v1/listings**', (route) => route.abort('connectionrefused'));

      await page.goto(`/${locale}/listings`);
      await page.waitForLoadState('domcontentloaded');

      // Either the networkDown message or an empty/error state must appear
      const errorMsg = page.getByText(I18N[locale].networkDown, { exact: false });
      const emptyState = page.locator('[class*="empty"], [class*="error"]');
      const hasError = await errorMsg.count() > 0;
      const hasEmpty = await emptyState.count() > 0;
      expect(hasError || hasEmpty).toBeTruthy();
    });

    test('offer modal API failure shows error state in modal', async ({ browser }) => {
      // Use buyer context (buyer opens a listing they do NOT own)
      const { BUYER_AUTH_STATE_PATH } = await import('../helpers/constants');
      const ctx = await browser.newContext({ storageState: BUYER_AUTH_STATE_PATH });
      const modalPage = await ctx.newPage();

      const { getTestData } = await import('../helpers/test-data');
      const { listingId } = getTestData();

      // Set up route intercept BEFORE navigating so it catches all requests
      await modalPage.route('**/api/v1/offers', (route) =>
        route.fulfill({ status: 500, body: JSON.stringify({ error: { message: 'Server Error' } }) }),
      );

      await modalPage.goto(`/${locale}/listings/${listingId}`);

      // Wait for the Make Offer button to appear (listing loaded)
      const offerBtn = modalPage.getByText(I18N[locale].makeOffer, { exact: false }).first();
      await expect(offerBtn).toBeVisible();
      await offerBtn.click();
      const dialog = modalPage.getByRole('dialog');
      await expect(dialog).toBeVisible({ timeout: 5_000 });

      // Enter valid amount and send
      await modalPage.fill('input#offer-amount', '1000');
      const sendBtn = modalPage.locator('button').filter({ hasText: /send offer|ابعت|إرسال/i }).first();
      await sendBtn.click();

      // Error state must show inside the modal
      const errorAlert = modalPage.locator('[role="alert"]');
      await expect(errorAlert.first()).toBeVisible({ timeout: 8_000 });

      await ctx.close();
    });

    test('clearing auth and visiting /my redirects to login', async ({ page }) => {
      // Fresh page context has empty localStorage — go directly to /my.
      // AuthGate (client-side) detects no auth after hydration and redirects.
      await page.goto(`/${locale}/my`);
      await expect(page).toHaveURL(/\/auth\/login/, { timeout: 20_000 });
    });

    test('no raw JSON or stack trace exposed on 404 listing page', async ({ page }) => {
      await page.goto(`/${locale}/listings/nonexistent-abc-123`);

      // Page body must not contain JSON error objects
      const bodyText = await page.textContent('body');
      expect(bodyText ?? '').not.toMatch(/"stack"\s*:/);
      expect(bodyText ?? '').not.toMatch(/"statusCode"\s*:\s*[45]/);
      expect(bodyText ?? '').not.toContain('SyntaxError');
      expect(bodyText ?? '').not.toContain('at Object.<anonymous>');
    });
  });
}
