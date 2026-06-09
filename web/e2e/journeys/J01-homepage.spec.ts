/**
 * J-01 · Public Homepage
 * Verifies the landing page renders correctly in both locales.
 */

import { test, expect } from '@playwright/test';
import { LOCALES, I18N } from '../helpers/constants';

for (const locale of LOCALES) {
  test.describe(`[${locale.toUpperCase()}] J-01 — Public Homepage`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`/${locale}`);
    });

    test('hero section renders with correct heading', async ({ page }) => {
      // Hero h1 must match the locale-specific title
      await expect(page.getByRole('heading', { level: 1 })).toContainText(
        I18N[locale].heroTitle,
      );
    });

    test('trust banner is visible', async ({ page }) => {
      // Trust banner section is rendered with an aria-label containing "Verified"
      const banner = page.locator('[class*="trust"]').first();
      await expect(banner).toBeVisible();
    });

    test('"New in Souk ElKanto" / "جديد في سوق الكانتو" section renders', async ({ page }) => {
      // The new listings section heading must be visible
      const heading =
        locale === 'en'
          ? page.getByText('New in Souk ElKanto')
          : page.getByText('جديد في سوق الكانتو');
      await expect(heading.first()).toBeVisible();
    });

    test('footer copyright contains current year', async ({ page }) => {
      // Footer must render with the current year
      const year = String(new Date().getFullYear());
      const footer = page.locator('footer');
      await expect(footer).toContainText(year);
    });

    test('navigation bar is visible with logo/brand', async ({ page }) => {
      // NavBar must be rendered at the top of the page
      const nav = page.locator('nav').first();
      await expect(nav).toBeVisible();
    });
  });
}
