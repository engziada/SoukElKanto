/**
 * R-11 Batch A — auth config + open redirect regression tests.
 *
 *   F-08 / F-09 are covered by Jest unit tests on the BE side
 *   (libs/common/src/config/configuration.spec.ts). This file targets the
 *   FE-side fixes:
 *
 *   F-10 — open redirect on /auth/verify?next=
 *     Pre-fix: `router.replace(next.startsWith('/') ? next : ...)` accepted
 *     `//evil.com/foo` because `'//evil.com/foo'.startsWith('/')` is true.
 *     Post-fix: same-origin + locale-prefix gate; bad `next` falls back to
 *     the locale root.
 */

import { test, expect } from '@playwright/test';
import { LOCALES, TEST_PHONE_LOCAL, TEST_OTP } from '../helpers/constants';

for (const locale of LOCALES) {
  test.describe(`[${locale.toUpperCase()}] R-11 F-10 — Open redirect protection`, () => {
    test('protocol-relative next (//evil.com) is ignored, falls back to /<locale>', async ({ page }) => {
      // Land directly on /auth/verify with a malicious next. globalSetup already
      // issued an OTP for the seller phone so verify-otp succeeds.
      const phone = `+20${TEST_PHONE_LOCAL}`;
      const nextEvil = '//evil.com/steal';
      await page.goto(
        `/${locale}/auth/verify?phone=${encodeURIComponent(phone)}&next=${encodeURIComponent(nextEvil)}`,
      );

      // Page must render — sanitisation is silent (we don't surface "ignored
      // next" to the user, just fall back).
      await expect(page.locator('input#code')).toBeVisible({ timeout: 10_000 });

      await page.fill('input#code', TEST_OTP);
      await page.click('button[type="submit"]');

      // After successful OTP, the URL must be /<locale> (or /<locale>/...) —
      // NEVER off-origin.
      await page.waitForURL((url) => {
        // The redirect lands on the locale root.
        return url.pathname === `/${locale}` || url.pathname.startsWith(`/${locale}/`);
      }, { timeout: 15_000 });

      // Absolute defence: the host must still be localhost.
      const url = new URL(page.url());
      expect(url.host).toBe('localhost:3001');
    });

    test('javascript: URI is ignored', async ({ page }) => {
      const phone = `+20${TEST_PHONE_LOCAL}`;
      const nextJs = 'javascript:alert(1)';
      await page.goto(
        `/${locale}/auth/verify?phone=${encodeURIComponent(phone)}&next=${encodeURIComponent(nextJs)}`,
      );
      await expect(page.locator('input#code')).toBeVisible({ timeout: 10_000 });
      await page.fill('input#code', TEST_OTP);
      await page.click('button[type="submit"]');
      await page.waitForURL((url) => url.pathname.startsWith(`/${locale}`), { timeout: 15_000 });
      expect(new URL(page.url()).host).toBe('localhost:3001');
    });

    test('valid in-app next is preserved (positive case)', async ({ page }) => {
      const phone = `+20${TEST_PHONE_LOCAL}`;
      const nextOk = `/${locale}/my`;
      await page.goto(
        `/${locale}/auth/verify?phone=${encodeURIComponent(phone)}&next=${encodeURIComponent(nextOk)}`,
      );
      await expect(page.locator('input#code')).toBeVisible({ timeout: 10_000 });
      await page.fill('input#code', TEST_OTP);
      await page.click('button[type="submit"]');
      await page.waitForURL((url) => url.pathname.startsWith(`/${locale}/my`), { timeout: 15_000 });
    });
  });
}
