/**
 * R-08 (G6) · One PENDING offer per (buyer, listing) (API)
 *
 * Buyer cannot have more than one PENDING offer on the same listing at a time.
 * A second create attempt returns 409 with code OFFER_ALREADY_PENDING and the
 * existing offer id. After withdrawing the first, a fresh offer succeeds.
 *
 * Note: counter-offer children (parentOfferId set) are EXCLUDED from the
 * uniqueness check so seller-initiated counters don't trip the guard.
 */

import { test, expect } from '@playwright/test';
import {
  createListingAsSeller,
  createOfferAsBuyer,
  deleteListing,
  withdrawOffer,
  rawApi,
  type ListingFixture,
  type OfferFixture,
} from '../helpers/factory';
import { getTestData } from '../helpers/test-data';

test.describe('R-08 G6 — Duplicate PENDING offer guard (API)', () => {
  let listing: ListingFixture;
  let firstOffer: OfferFixture;

  test.beforeEach(async () => {
    const unique = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
    listing = await createListingAsSeller({
      title: `R-08 Dup ${unique}`,
      askingPrice: 4000,
    });
    firstOffer = await createOfferAsBuyer(listing.id, { amount: 3000 });
  });

  test.afterEach(async () => {
    if (listing?.id) await deleteListing(listing.id);
  });

  test('second PENDING offer from same buyer → 409 CONFLICT with OFFER_ALREADY_PENDING + existingOfferId in details', async () => {
    const res = await rawApi(
      '/api/v1/offers',
      {
        method: 'POST',
        body: JSON.stringify({ listingId: listing.id, amount: 3500 }),
      },
      getTestData().buyerToken,
    );
    expect(res.status).toBe(409);
    const body = (await res.json()) as {
      success: boolean;
      error: {
        code: string;
        message: string;
        details?: Array<{
          rule?: string;
          existingOfferId?: string;
          existingAmount?: number;
        }>;
      };
    };
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('CONFLICT');
    expect(body.error.details).toBeDefined();
    expect(body.error.details!.length).toBeGreaterThan(0);

    const dup = body.error.details!.find((d) => d.rule === 'OFFER_ALREADY_PENDING');
    expect(dup, 'detail with rule=OFFER_ALREADY_PENDING must be present').toBeDefined();
    expect(dup!.existingOfferId).toBe(firstOffer.id);
    expect(dup!.existingAmount).toBe(firstOffer.amount);
  });

  test('after withdrawing first PENDING, a fresh offer is accepted', async () => {
    await withdrawOffer(firstOffer.id);

    const res = await rawApi(
      '/api/v1/offers',
      {
        method: 'POST',
        body: JSON.stringify({ listingId: listing.id, amount: 3500 }),
      },
      getTestData().buyerToken,
    );
    expect(res.status).toBeLessThan(300);
    const body = (await res.json()) as { data: { id: string; amount: number } };
    expect(body.data.amount).toBe(3500);
  });

  test('a different buyer (U-X) can still make a PENDING offer on the same listing', async () => {
    const res = await rawApi(
      '/api/v1/offers',
      {
        method: 'POST',
        body: JSON.stringify({ listingId: listing.id, amount: 3700 }),
      },
      getTestData().thirdToken,
    );
    expect(res.status).toBeLessThan(300);
  });
});
