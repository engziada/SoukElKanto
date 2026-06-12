/**
 * CJ-08 · Handover two-tap confirmation (API-only)
 *
 * `/my/handovers` is a UI placeholder. Backend POST /api/v1/handover/:offerId/confirm
 * is wired. This spec exercises the BE state machine directly so we can ship
 * the contract test before the UI catches up.
 *
 * Flow:
 *   - U-S creates listing, U-B offers, U-S accepts (precondition).
 *   - U-B confirms handover → buyerConfirmedAt set, sellerConfirmedAt null.
 *   - U-S confirms handover → both timestamps set.
 *   - U-X (third party) confirm attempt → 4xx.
 *   - Idempotent re-confirm should not crash (200 or 4xx — either is fine).
 */

import { test, expect } from '@playwright/test';
import {
  acceptOffer,
  confirmHandover,
  createListingAsSeller,
  createOfferAsBuyer,
  deleteListing,
  rawApi,
  type ListingFixture,
  type OfferFixture,
} from '../helpers/factory';
import { getTestData } from '../helpers/test-data';

test.describe('CJ-08 — Handover two-tap (API)', () => {
  let listing: ListingFixture;
  let offer: OfferFixture;

  test.beforeEach(async () => {
    const unique = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
    listing = await createListingAsSeller({
      title: `CJ-08 Crib ${unique}`,
      askingPrice: 3500,
      category: 'BABY_MATERNITY',
    });
    offer = await createOfferAsBuyer(listing.id, { amount: 3000 });
    await acceptOffer(offer.id);
  });

  test.afterEach(async () => {
    if (listing?.id) await deleteListing(listing.id);
  });

  test('two-tap confirm: buyer first then seller; both timestamps populated', async () => {
    const { buyerToken, sellerToken } = getTestData();

    // ── 1. Buyer confirms ─────────────────────────────────────────────
    const afterBuyer = await confirmHandover(offer.id, buyerToken);
    expect(afterBuyer.buyerConfirmedAt).toBeTruthy();
    // Seller hasn't tapped yet
    expect(afterBuyer.sellerConfirmedAt ?? null).toBeNull();

    // ── 2. Seller confirms ────────────────────────────────────────────
    const afterSeller = await confirmHandover(offer.id, sellerToken);
    expect(afterSeller.buyerConfirmedAt).toBeTruthy();
    expect(afterSeller.sellerConfirmedAt).toBeTruthy();
  });

  test('non-party (anonymous JWT-less) request is rejected', async () => {
    // Hit the endpoint without an Authorization header.
    const res = await rawApi(`/api/v1/handover/${offer.id}/confirm`, { method: 'POST' });
    expect(res.status).toBeGreaterThanOrEqual(401);
    expect(res.status).toBeLessThan(500);
  });

  test('re-confirm after both confirmed: idempotent or 4xx (not 5xx)', async () => {
    const { buyerToken, sellerToken } = getTestData();
    await confirmHandover(offer.id, buyerToken);
    await confirmHandover(offer.id, sellerToken);

    // Buyer re-confirms — must be deterministic (200 idempotent OR 4xx).
    const replay = await rawApi(
      `/api/v1/handover/${offer.id}/confirm`,
      { method: 'POST' },
      buyerToken,
    );
    expect(replay.status).toBeLessThan(500);
  });

  test('confirm on non-ACCEPTED offer is rejected', async () => {
    // Create a fresh PENDING offer on a different listing.
    const otherListing = await createListingAsSeller({
      title: `CJ-08 Other ${Date.now()}`,
      askingPrice: 1000,
    });
    const pendingOffer = await createOfferAsBuyer(otherListing.id, { amount: 800 });

    const res = await rawApi(
      `/api/v1/handover/${pendingOffer.id}/confirm`,
      { method: 'POST' },
      getTestData().buyerToken,
    );
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);

    await deleteListing(otherListing.id);
  });
});
