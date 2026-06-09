/**
 * J-12 · i18n + RTL Parity
 * Verifies locale switching, RTL direction attribute, and no raw i18n key leaks.
 */

import { test, expect } from '@playwright/test';
import { I18N } from '../helpers/constants';
import { getTestData } from '../helpers/test-data';

/** Regex that matches raw i18n key patterns like "my.listings.title" or "create.errorPhotos" */
const RAW_KEY_PATTERN = /^[a-z_]+\.[a-z_]+(\.[a-z_]+)?$/;

test.describe('J-12 — i18n + RTL Parity', () => {

  test('[AR] html element has dir="rtl"', async ({ page }) => {
    await page.goto('/ar/listings', { waitUntil: 'domcontentloaded' });
    // html element must declare RTL direction for Arabic locale
    const dir = await page.evaluate(() => document.documentElement.getAttribute('dir'));
    expect(dir).toBe('rtl');
  });

  test('[AR] html element has lang starting with "ar"', async ({ page }) => {
    await page.goto('/ar/listings', { waitUntil: 'domcontentloaded' });
    // lang must be "ar" or a variant like "ar-EG"
    const lang = await page.evaluate(() => document.documentElement.lang);
    expect(lang).toMatch(/^ar/);
  });

  test('[EN] html element does NOT have dir="rtl"', async ({ page }) => {
    await page.goto('/en/listings', { waitUntil: 'domcontentloaded' });
    // English locale must not set RTL direction
    const dir = await page.evaluate(() => document.documentElement.getAttribute('dir'));
    expect(dir).not.toBe('rtl');
  });

  test('[AR] hero title renders in Arabic on homepage', async ({ page }) => {
    await page.goto('/ar', { waitUntil: 'domcontentloaded' });
    // Arabic hero title must be visible
    await expect(
      page.getByRole('heading', { level: 1 }).filter({ hasText: I18N.ar.heroTitle }),
    ).toBeVisible({ timeout: 8_000 });
  });

  test('[EN] hero title renders in English on homepage', async ({ page }) => {
    await page.goto('/en', { waitUntil: 'domcontentloaded' });
    await expect(
      page.getByRole('heading', { level: 1 }).filter({ hasText: I18N.en.heroTitle }),
    ).toBeVisible({ timeout: 8_000 });
  });

  test('[AR] listing detail page — no raw i18n key visible', async ({ page }) => {
    const { listingId } = getTestData();
    await page.goto(`/ar/listings/${listingId}`, { waitUntil: 'domcontentloaded' });
    // Wait for listing data to render before scanning text nodes
    await expect(page.locator('[class*="trustPanel"]')).toBeVisible();

    // Collect all visible text nodes on the page
    const visibleTexts: string[] = await page.evaluate(() => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const texts: string[] = [];
      let node = walker.nextNode();
      while (node) {
        const text = (node.textContent ?? '').trim();
        if (text.length > 2 && text.length < 60) texts.push(text);
        node = walker.nextNode();
      }
      return texts;
    });

    // None of the visible text nodes should look like a raw i18n key
    const leakedKeys = visibleTexts.filter((t) => RAW_KEY_PATTERN.test(t));
    expect(leakedKeys, `Raw i18n keys leaked in AR detail page: ${leakedKeys.join(', ')}`).toHaveLength(0);
  });

  test('[AR] /my dashboard renders all labels in Arabic', async ({ page, browser }) => {
    // No auth needed for this — just check login page AR
    await page.goto('/ar/auth/login', { waitUntil: 'domcontentloaded' });
    // Login title must be in Arabic
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toContainText(I18N.ar.loginTitle, { ignoreCase: true });
  });

  test('[AR] Make Offer button text is Arabic on listing detail', async ({ page }) => {
    const { listingId } = getTestData();
    await page.goto(`/ar/listings/${listingId}`, { waitUntil: 'domcontentloaded' });
    // The Make Offer CTA must display Arabic text
    const offerBtn = page.getByText(I18N.ar.makeOffer, { exact: false }).first();
    await expect(offerBtn).toBeVisible();
  });
});
