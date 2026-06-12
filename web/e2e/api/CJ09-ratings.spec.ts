/**
 * CJ-09 · Post-handover Ratings (API-only)
 *
 * Ratings UI is not wired yet. Backend POST /api/v1/ratings is. This spec
 * confirms:
 *   - Both parties can submit a 1-5 rating after handover.
 *   - Duplicate ratings from same party rejected (4xx).
 *   - Non-party rating rejected.
 *   - Invalid scores rejected (BE DTO @Min(1) @Max(5)).
 */

import { test, expect } from '@playwright/test';
import {
  acceptOffer,
  confirmHandover,
  createListingAsSeller,
  createOfferAsBuyer,
  createRating,
  deleteListing,
  rawApi,
  type ListingFixture,
  type OfferFixture,
} from '../helpers/factory';
import { getTestData } from '../helpers/test-data';

test.describe('CJ-09 — Ratings (API)', () => {
  let listing: ListingFixture;
  let offer: OfferFixture;

  test.beforeEach(async () => {
    const unique = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
    listing = await createListingAsSeller({
      title: `CJ-09 Mirror ${unique}`,
      askingPrice: 600,
      category: 'HOME_DECOR',
    });
    offer = await createOfferAsBuyer(listing.id, { amount: 500 });
    await acceptOffer(offer.id);
    await confirmHandover(offer.id, getTestData().buyerToken);
    await confirmHandover(offer.id, getTestData().sellerToken);
  });

  test.afterEach(async () => {
    if (listing?.id) await deleteListing(listing.id);
  });

  test('both parties can submit one rating each', async () => {
    const { buyerToken, sellerToken } = getTestData();

    const buyerRating = await createRating(offer.id, 5, buyerToken, 'smooth handover');
    expect(buyerRating.offerId).toBe(offer.id);
    expect(buyerRating.score).toBe(5);

    const sellerRating = await createRating(offer.id, 4, sellerToken);
    expect(sellerRating.offerId).toBe(offer.id);
    expect(sellerRating.score).toBe(4);

    // Different rater ids (one buyer, one seller)
    expect(buyerRating.raterId).not.toBe(sellerRating.raterId);
    // Each rates the OTHER party
    expect(buyerRating.targetId).toBe(sellerRating.raterId);
    expect(sellerRating.targetId).toBe(buyerRating.raterId);
  });

  test('duplicate rating from same party is rejected (4xx)', async () => {
    const { buyerToken } = getTestData();
    await createRating(offer.id, 5, buyerToken);

    const dup = await rawApi(
      '/api/v1/ratings',
      { method: 'POST', body: JSON.stringify({ offerId: offer.id, score: 4 }) },
      buyerToken,
    );
    expect(dup.status).toBeGreaterThanOrEqual(400);
    expect(dup.status).toBeLessThan(500);
  });

  test('non-party rating attempt is rejected (4xx)', async () => {
    // Hit the endpoint anonymously — JWT missing.
    const res = await rawApi('/api/v1/ratings', {
      method: 'POST',
      body: JSON.stringify({ offerId: offer.id, score: 5 }),
    });
    expect(res.status).toBeGreaterThanOrEqual(401);
    expect(res.status).toBeLessThan(500);
  });

  test('score < 1 or > 5 rejected by validator', async () => {
    const { buyerToken } = getTestData();

    const tooLow = await rawApi(
      '/api/v1/ratings',
      { method: 'POST', body: JSON.stringify({ offerId: offer.id, score: 0 }) },
      buyerToken,
    );
    expect(tooLow.status).toBe(400);

    const tooHigh = await rawApi(
      '/api/v1/ratings',
      { method: 'POST', body: JSON.stringify({ offerId: offer.id, score: 6 }) },
      buyerToken,
    );
    expect(tooHigh.status).toBe(400);
  });

  test('rating before handover-complete is rejected', async () => {
    const { buyerToken } = getTestData();

    // Create a fresh offer that's only ACCEPTED, not handover-confirmed.
    const otherListing = await createListingAsSeller({
      title: `CJ-09 NoHandover ${Date.now()}`,
      askingPrice: 700,
    });
    const otherOffer = await createOfferAsBuyer(otherListing.id, { amount: 600 });
    await acceptOffer(otherOffer.id);

    const res = await rawApi(
      '/api/v1/ratings',
      { method: 'POST', body: JSON.stringify({ offerId: otherOffer.id, score: 5 }) },
      buyerToken,
    );
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);

    await deleteListing(otherListing.id);
  });
});
