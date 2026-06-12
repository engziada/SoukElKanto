/**
 * concurrent.ts — Playwright fixture for two-user concurrent journeys.
 *
 * Gives a test access to TWO pages in TWO browser contexts, both pre-authed
 * via saved storageState. Use for CJ-## journeys where seller and buyer must
 * be simultaneously logged in to observe cross-user state transitions.
 *
 *   import { test, expect } from '../fixtures/concurrent';
 *
 *   test('seller sees buyer offer', async ({ sellerPage, buyerPage }) => { ... });
 *
 * The single-user `authenticatedPage` / `buyerPage` fixtures in ./auth.ts still
 * exist for non-concurrent specs; prefer this file when the test exercises
 * both sides of a cross-user flow.
 */

import { test as base, type BrowserContext, type Page } from '@playwright/test';
import {
  AUTH_STATE_PATH,
  BUYER_AUTH_STATE_PATH,
  THIRD_AUTH_STATE_PATH,
} from '../helpers/constants';

interface ConcurrentFixtures {
  sellerCtx: BrowserContext;
  buyerCtx: BrowserContext;
  /** U-X — third user (a second/competing buyer). Only spun up for tests
   *  that actually request it; otherwise no resource cost. */
  thirdCtx: BrowserContext;
  sellerPage: Page;
  buyerPage: Page;
  thirdPage: Page;
}

export const test = base.extend<ConcurrentFixtures>({
  sellerCtx: async ({ browser }, use) => {
    const ctx = await browser.newContext({ storageState: AUTH_STATE_PATH });
    await use(ctx);
    await ctx.close();
  },

  buyerCtx: async ({ browser }, use) => {
    const ctx = await browser.newContext({ storageState: BUYER_AUTH_STATE_PATH });
    await use(ctx);
    await ctx.close();
  },

  thirdCtx: async ({ browser }, use) => {
    const ctx = await browser.newContext({ storageState: THIRD_AUTH_STATE_PATH });
    await use(ctx);
    await ctx.close();
  },

  sellerPage: async ({ sellerCtx }, use) => {
    const page = await sellerCtx.newPage();
    await use(page);
  },

  buyerPage: async ({ buyerCtx }, use) => {
    const page = await buyerCtx.newPage();
    await use(page);
  },

  thirdPage: async ({ thirdCtx }, use) => {
    const page = await thirdCtx.newPage();
    await use(page);
  },
});

export { expect } from '@playwright/test';
