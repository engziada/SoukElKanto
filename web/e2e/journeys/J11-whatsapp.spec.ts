/**
 * J-11 · WhatsApp Share
 * Verifies the WhatsApp share link is well-formed and contains correct data.
 */

import { test, expect } from '@playwright/test';
import { LOCALES } from '../helpers/constants';
import { getTestData } from '../helpers/test-data';

for (const locale of LOCALES) {
  test.describe(`[${locale.toUpperCase()}] J-11 — WhatsApp Share`, () => {
    test('WhatsApp link is present and href starts with wa.me', async ({ page }) => {
      const { listingId } = getTestData();
      await page.goto(`/${locale}/listings/${listingId}`);

      // WhatsApp button must exist
      const whatsAppLink = page.locator('a[href*="wa.me"]');
      await expect(whatsAppLink).toBeVisible({ timeout: 8_000 });

      // href must be a valid wa.me URL
      const href = await whatsAppLink.getAttribute('href');
      expect(href).toBeTruthy();
      expect(href!).toMatch(/^https:\/\/wa\.me\/\?text=/);
    });

    test('encoded WhatsApp text contains listing title and EGP price', async ({ page }) => {
      const { listingId } = getTestData();
      await page.goto(`/${locale}/listings/${listingId}`);

      const whatsAppLink = page.locator('a[href*="wa.me"]');
      await expect(whatsAppLink).toBeVisible({ timeout: 8_000 });

      const href = await whatsAppLink.getAttribute('href');
      const url = new URL(href!);
      const decodedText = decodeURIComponent(url.searchParams.get('text') ?? '');

      // Must contain the listing title (seeded as "E2E Test Sofa")
      expect(decodedText).toContain('E2E Test Sofa');

      // Must contain the price value (2500 seeded in global-setup)
      expect(decodedText).toMatch(/2[,.]?500/);
    });

    test('WhatsApp link opens in new tab (target=_blank)', async ({ page }) => {
      const { listingId } = getTestData();
      await page.goto(`/${locale}/listings/${listingId}`);

      const whatsAppLink = page.locator('a[href*="wa.me"]');
      await expect(whatsAppLink).toBeVisible({ timeout: 8_000 });

      // Must open in new tab
      const target = await whatsAppLink.getAttribute('target');
      expect(target).toBe('_blank');

      // Must have rel="noopener noreferrer" for security
      const rel = await whatsAppLink.getAttribute('rel');
      expect(rel).toContain('noopener');
    });
  });
}
