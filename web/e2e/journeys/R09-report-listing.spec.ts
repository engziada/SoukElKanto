/**
 * R-09 · Report listing UI
 *
 * Wires the previously-placeholder Report button on listing detail to a real
 * ReportModal that posts to POST /api/v1/listings/:id/report.
 *
 * Scenarios:
 *   1. Buyer reports seller's listing: opens modal, picks fields, submits,
 *      sees success state with a report id.
 *   2. Anonymous viewer clicking Report is redirected to /auth/login with a
 *      `next=` param back to the listing detail.
 *   3. Seller clicking Report on their own listing sees an inline hint
 *      ("can't report your own listing") — the modal does NOT open.
 *   4. Client-side validation: empty reason / no severity / no incident type
 *      block submission with inline field errors.
 */

import { execSync } from 'child_process';
import { test, expect } from '../fixtures/concurrent';
import { LOCALES } from '../helpers/constants';
import {
  createListingAsSeller,
  deleteListing,
  type ListingFixture,
} from '../helpers/factory';

/**
 * R-09 specs file legitimate reports that lower the seller's trust score in
 * core.GlobalUser. Reset to 100 before every test so the suite is repeatable
 * and the seller never falls below the ban threshold (20) mid-run.
 */
function resetTrustScores() {
  try {
    execSync(
      'docker compose -f ../../CoreMesh/docker-compose.yml exec -T postgres psql -U madinaty -d madinatyai -c "UPDATE core.\\"GlobalUser\\" SET \\"trustScore\\" = 100 WHERE \\"phoneNumber\\" IN (\'+201000000001\', \'+201000000002\', \'+201000000003\');"',
      { stdio: 'pipe' },
    );
  } catch {
    // Non-fatal — the test will surface a 403 if the score is too low.
  }
}

for (const locale of LOCALES) {
  test.describe(`[${locale.toUpperCase()}] R-09 — Report listing UI`, () => {
    let listing: ListingFixture;

    test.beforeEach(async () => {
      // Each "buyer reports" run files a real report that penalises the
      // seller's trust score. Reset before every test so listing creation
      // never hits the ban threshold.
      resetTrustScores();
      const unique = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
      listing = await createListingAsSeller({
        title: `R-09 Bike ${unique}`,
        askingPrice: 1800,
        category: 'SPORTS_OUTDOOR',
      });
    });

    test.afterEach(async () => {
      if (listing?.id) await deleteListing(listing.id);
    });

    test('buyer reports → modal opens → fills → submit → success with report id', async ({
      buyerPage,
    }) => {
      await buyerPage.goto(`/${locale}/listings/${listing.id}`, {
        waitUntil: 'networkidle',
      });

      // Click Report. AR label is "بلاغ".
      const reportBtn = buyerPage
        .locator('button')
        .filter({ hasText: /^report$|^بلاغ$/i })
        .first();
      await expect(reportBtn).toBeVisible({ timeout: 15_000 });
      await reportBtn.click();

      // Modal opens
      const dialog = buyerPage.getByRole('dialog');
      await expect(dialog).toBeVisible({ timeout: 5_000 });

      // Pick incident type — use the select element directly.
      await buyerPage.locator('select#report-incident').selectOption('SCAM');

      // Pick severity 3 (medium).
      await buyerPage.locator('button[data-severity="3"]').click();

      // Fill reason.
      const reason = 'R-09 e2e: suspected misleading description.';
      await buyerPage.locator('textarea#report-reason').fill(reason);

      // Submit. The AR submit label is "ابعت البلاغ".
      const submitBtn = buyerPage
        .locator('button')
        .filter({ hasText: /submit report|ابعت البلاغ/i })
        .first();
      await submitBtn.click();

      // Success terminal state shows a report id (UUID-like).
      const reportIdValue = dialog.locator('code');
      await expect(reportIdValue).toBeVisible({ timeout: 10_000 });
      const reportIdText = (await reportIdValue.textContent()) ?? '';
      // Loose UUID match — the report id from /api/v1/listings/:id/report is a uuid.
      expect(reportIdText).toMatch(/^[0-9a-f-]{8,}$/i);
    });

    test('anonymous user → Report click redirects to /auth/login with next param', async ({
      browser,
    }) => {
      // Fresh anonymous context — no auth state.
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      await page.goto(`/${locale}/listings/${listing.id}`, {
        waitUntil: 'networkidle',
      });

      const reportBtn = page
        .locator('button')
        .filter({ hasText: /^report$|^بلاغ$/i })
        .first();
      await expect(reportBtn).toBeVisible({ timeout: 15_000 });
      await reportBtn.click();

      // URL becomes /auth/login?next=<encoded path back to detail>.
      await expect(page).toHaveURL(/\/auth\/login\?next=/, { timeout: 5_000 });
      const url = new URL(page.url());
      const next = url.searchParams.get('next');
      expect(next).toContain(`/listings/${listing.id}`);

      // The modal must NOT have opened.
      await expect(page.getByRole('dialog')).toHaveCount(0);

      await ctx.close();
    });

    test('seller on own listing → Report click shows inline hint, modal does not open', async ({
      sellerPage,
    }) => {
      await sellerPage.goto(`/${locale}/listings/${listing.id}`, {
        waitUntil: 'networkidle',
      });

      const reportBtn = sellerPage
        .locator('button')
        .filter({ hasText: /^report$|^بلاغ$/i })
        .first();
      await expect(reportBtn).toBeVisible({ timeout: 15_000 });
      await reportBtn.click();

      // Inline hint contains the "can't report your own" copy.
      const hint = sellerPage.locator('[role="status"]');
      await expect(hint.first()).toContainText(
        /can.t report your own|مش قادر تبلغ/i,
        { timeout: 5_000 },
      );

      // Modal did NOT open.
      await expect(sellerPage.getByRole('dialog')).toHaveCount(0);
    });

    test('validation: incident type, severity, and reason are all required', async ({
      buyerPage,
    }) => {
      await buyerPage.goto(`/${locale}/listings/${listing.id}`, {
        waitUntil: 'networkidle',
      });
      await buyerPage
        .locator('button')
        .filter({ hasText: /^report$|^بلاغ$/i })
        .first()
        .click();

      await expect(buyerPage.getByRole('dialog')).toBeVisible({ timeout: 5_000 });

      // Submit empty.
      await buyerPage
        .locator('button')
        .filter({ hasText: /submit report|ابعت البلاغ/i })
        .first()
        .click();

      // All three fields should show role=alert inline error messages.
      const alerts = buyerPage.getByRole('alert');
      // At least 3 alerts present (incident, severity, reason).
      await expect(alerts.first()).toBeVisible({ timeout: 5_000 });
      const alertCount = await alerts.count();
      expect(alertCount).toBeGreaterThanOrEqual(3);
    });
  });
}
