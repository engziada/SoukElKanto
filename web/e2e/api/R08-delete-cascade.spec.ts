/**
 * R-08 (G5) · Listing delete cascade (API)
 *
 * When the seller deletes a listing with open offers, those offers must be
 * expired with reason `listing_removed_by_seller`. GET /listings/:id on the
 * deleted listing must return 410 Gone (not 404 — the listing did exist).
 * Browse must omit REMOVED listings.
 */

import { test, expect } from '@playwright/test';
import {
  createListingAsSeller,
  createOfferAsBuyer,
  listSentOffers,
  rawApi,
  type ListingFixture,
  type OfferFixture,
} from '../helpers/factory';
import { getTestData } from '../helpers/test-data';

test.describe('R-08 G5 — Listing delete cascade (API)', () => {
  let listing: ListingFixture;
  let offer: OfferFixture;

  test.beforeEach(async () => {
    const unique = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
    listing = await createListingAsSeller({
      title: `R-08 Delete ${unique}`,
      askingPrice: 1800,
    });
    offer = await createOfferAsBuyer(listing.id, { amount: 1500 });
  });

  test('seller delete with open offer → offer EXPIRED, listing 410', async () => {
    // Delete via API
    const deleteRes = await rawApi(
      `/api/v1/listings/${listing.id}`,
      { method: 'DELETE' },
      getTestData().sellerToken,
    );
    expect(deleteRes.ok).toBe(true);

    // GET /listings/:id should now be 410 Gone
    const getRes = await rawApi(`/api/v1/listings/${listing.id}`, { method: 'GET' });
    expect(getRes.status).toBe(410);

    // Buyer's offer must be EXPIRED with the cascade reason
    const sent = await listSentOffers();
    const myOffer = sent.find((o) => o.id === offer.id);
    expect(myOffer?.status).toBe('EXPIRED');
    const myOfferFull = myOffer as unknown as { declineReason?: string | null };
    expect(myOfferFull.declineReason).toBe('listing_removed_by_seller');
  });

  test('browse excludes REMOVED listings', async () => {
    // Confirm the listing is present in browse BEFORE delete.
    const before = await rawApi(
      `/api/v1/listings?limit=50`,
      { method: 'GET' },
    );
    const beforeBody = (await before.json()) as { data: { data: ListingFixture[] } };
    const beforeIds = beforeBody.data.data.map((l) => l.id);
    expect(beforeIds).toContain(listing.id);

    // Delete.
    await rawApi(
      `/api/v1/listings/${listing.id}`,
      { method: 'DELETE' },
      getTestData().sellerToken,
    );

    // After delete, browse should NOT include it.
    const after = await rawApi(`/api/v1/listings?limit=50`, { method: 'GET' });
    const afterBody = (await after.json()) as { data: { data: ListingFixture[] } };
    const afterIds = afterBody.data.data.map((l) => l.id);
    expect(afterIds).not.toContain(listing.id);
  });

  test('non-seller cannot delete', async () => {
    const res = await rawApi(
      `/api/v1/listings/${listing.id}`,
      { method: 'DELETE' },
      getTestData().buyerToken,
    );
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  test('GET /listings/:id with an unknown id returns 404 (not 410)', async () => {
    const res = await rawApi(
      `/api/v1/listings/00000000-0000-0000-0000-000000000000`,
      { method: 'GET' },
    );
    expect(res.status).toBe(404);
  });
});
