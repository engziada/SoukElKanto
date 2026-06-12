/**
 * factory.ts — Per-test scratch-data builders that hit CoreMesh directly.
 *
 * Why we don't go through the UI:
 *   - Test setup should be deterministic and fast.
 *   - Each test gets its own listing/offer so parallel runs don't collide.
 *
 * All helpers use the seller/buyer JWTs persisted by global-setup.ts.
 */

import { BACKEND_URL, TENANT_ID } from './constants';
import { getTestData } from './test-data';

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

async function callApi<T>(
  path: string,
  init: RequestInit,
  token: string,
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('x-tenant-id', TENANT_ID);
  headers.set('Authorization', `Bearer ${token}`);

  // Gateway Core rate-limits per user. Parallel tests share the seller/buyer
  // user, so spikes are expected. Retry on 429 with exponential backoff + jitter.
  // Cap is generous (cumulative ~30s) because the BE window appears to be
  // per-minute. For tighter bounds, run the suite with --workers=1.
  const maxAttempts = 8;
  let res: Response | null = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    res = await fetch(`${BACKEND_URL}${path}`, { ...init, headers });
    if (res.status !== 429) break;
    if (attempt === maxAttempts) break;
    // 0.5, 1, 2, 4, 8, 8, 8, 8 s — clamped at 8s ceiling
    const backoff = Math.min(8000, 500 * 2 ** (attempt - 1));
    const jitter = Math.floor(Math.random() * 500);
    await new Promise((r) => setTimeout(r, backoff + jitter));
  }
  if (!res!.ok) {
    const body = await res!.text().catch(() => '');
    throw new Error(`[factory] ${init.method ?? 'GET'} ${path} → ${res!.status}: ${body}`);
  }
  const json = (await res!.json()) as unknown;
  if (json && typeof json === 'object' && 'data' in json && 'success' in json) {
    return (json as ApiEnvelope<T>).data;
  }
  return json as T;
}

// ── Listings ────────────────────────────────────────────────────────────────

export interface ListingFixture {
  id: string;
  title: string;
  askingPrice: number;
  sellerId: string;
}

export interface CreateListingOverrides {
  title?: string;
  description?: string;
  category?: string;
  condition?: string;
  askingPrice?: number;
  district?: string;
}

/**
 * Create a listing as the seller. Returns the new listing's id + key fields.
 * Token defaults to the seeded sellerToken; pass an explicit one for U-X tests.
 */
export async function createListingAsSeller(
  overrides: CreateListingOverrides = {},
  token: string = getTestData().sellerToken,
): Promise<ListingFixture> {
  const dto = {
    title: overrides.title ?? `E2E Listing ${Date.now()}`,
    description: overrides.description ?? 'Auto-created by Playwright factory.',
    category: overrides.category ?? 'FURNITURE',
    condition: overrides.condition ?? 'GOOD',
    askingPrice: overrides.askingPrice ?? 3000,
    district: overrides.district ?? 'B5',
  };
  const listing = await callApi<ListingFixture>(
    '/api/v1/listings',
    { method: 'POST', body: JSON.stringify(dto) },
    token,
  );
  return listing;
}

/** Cleanup helper — call from afterEach to keep DB tidy. */
export async function deleteListing(
  id: string,
  token: string = getTestData().sellerToken,
): Promise<void> {
  try {
    await callApi(`/api/v1/listings/${id}`, { method: 'DELETE' }, token);
  } catch {
    // Best-effort — already deleted or seller mismatch.
  }
}

// ── Offers ──────────────────────────────────────────────────────────────────

export interface OfferFixture {
  id: string;
  listingId: string;
  amount: number;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'COUNTERED' | 'WITHDRAWN' | 'EXPIRED';
  buyerId: string;
  sellerId: string;
  createdAt: string;
}

export interface CreateOfferOverrides {
  amount?: number;
  note?: string;
}

/**
 * Create an offer as the buyer against a given listingId.
 * Token defaults to the seeded buyerToken; override for U-X tests.
 */
export async function createOfferAsBuyer(
  listingId: string,
  overrides: CreateOfferOverrides = {},
  token: string = getTestData().buyerToken,
): Promise<OfferFixture> {
  const dto = {
    listingId,
    amount: overrides.amount ?? 2000,
    note: overrides.note ?? 'E2E auto offer',
  };
  return callApi<OfferFixture>(
    '/api/v1/offers',
    { method: 'POST', body: JSON.stringify(dto) },
    token,
  );
}

/** Fetch the seller's received offers (server-side; bypasses TanStack cache). */
export async function listReceivedOffers(
  token: string = getTestData().sellerToken,
): Promise<OfferFixture[]> {
  return callApi<OfferFixture[]>('/api/v1/offers/received', { method: 'GET' }, token);
}

/** Fetch the buyer's sent offers (server-side; bypasses TanStack cache). */
export async function listSentOffers(
  token: string = getTestData().buyerToken,
): Promise<OfferFixture[]> {
  return callApi<OfferFixture[]>('/api/v1/offers/sent', { method: 'GET' }, token);
}

// ── Offer state transitions ────────────────────────────────────────────────

/** Seller accepts an offer. */
export async function acceptOffer(
  offerId: string,
  token: string = getTestData().sellerToken,
): Promise<OfferFixture> {
  return callApi<OfferFixture>(
    `/api/v1/offers/${offerId}/accept`,
    { method: 'PATCH' },
    token,
  );
}

/** Seller declines an offer (optional reason). */
export async function declineOffer(
  offerId: string,
  reason?: string,
  token: string = getTestData().sellerToken,
): Promise<OfferFixture> {
  return callApi<OfferFixture>(
    `/api/v1/offers/${offerId}/decline`,
    { method: 'PATCH', body: JSON.stringify({ reason }) },
    token,
  );
}

/** Seller counter-offers with a new amount; BE creates a child offer with parentOfferId. */
export async function counterOffer(
  offerId: string,
  amount: number,
  token: string = getTestData().sellerToken,
): Promise<OfferFixture> {
  return callApi<OfferFixture>(
    `/api/v1/offers/${offerId}/counter`,
    { method: 'PATCH', body: JSON.stringify({ amount }) },
    token,
  );
}

/** Buyer withdraws own offer. */
export async function withdrawOffer(
  offerId: string,
  token: string = getTestData().buyerToken,
): Promise<OfferFixture> {
  return callApi<OfferFixture>(
    `/api/v1/offers/${offerId}/withdraw`,
    { method: 'PATCH' },
    token,
  );
}

// ── R-02: Buyer-side counter-offer actions ─────────────────────────────────

/** Buyer accepts a seller's counter-offer (requires parentOfferId set). */
export async function buyerAcceptCounter(
  offerId: string,
  token: string = getTestData().buyerToken,
): Promise<OfferFixture> {
  return callApi<OfferFixture>(
    `/api/v1/offers/${offerId}/buyer-accept`,
    { method: 'PATCH' },
    token,
  );
}

/** Buyer declines a seller's counter-offer. */
export async function buyerDeclineCounter(
  offerId: string,
  reason?: string,
  token: string = getTestData().buyerToken,
): Promise<OfferFixture> {
  return callApi<OfferFixture>(
    `/api/v1/offers/${offerId}/buyer-decline`,
    { method: 'PATCH', body: JSON.stringify({ reason }) },
    token,
  );
}

/** Buyer counter-counters the seller's counter (grandchild offer). */
export async function buyerCounterOffer(
  offerId: string,
  amount: number,
  token: string = getTestData().buyerToken,
): Promise<OfferFixture> {
  return callApi<OfferFixture>(
    `/api/v1/offers/${offerId}/buyer-counter`,
    { method: 'PATCH', body: JSON.stringify({ amount }) },
    token,
  );
}

// ── Handover ────────────────────────────────────────────────────────────────

export interface HandoverFixture {
  buyerConfirmedAt?: string | null;
  sellerConfirmedAt?: string | null;
}

/** Confirm a handover from either side. Returns updated handover timestamps. */
export async function confirmHandover(
  offerId: string,
  token: string,
): Promise<HandoverFixture> {
  return callApi<HandoverFixture>(
    `/api/v1/handover/${offerId}/confirm`,
    { method: 'POST' },
    token,
  );
}

// ── Ratings ─────────────────────────────────────────────────────────────────

export interface RatingFixture {
  id: string;
  offerId: string;
  raterId: string;   // GlobalUser id of the user submitting the rating
  targetId: string;  // GlobalUser id of the user being rated
  score: number;
  comment?: string;
  mappedSeverity: number;
  createdAt: string;
}

/** Submit a rating after handover. */
export async function createRating(
  offerId: string,
  score: number,
  token: string,
  comment?: string,
): Promise<RatingFixture> {
  return callApi<RatingFixture>(
    '/api/v1/ratings',
    { method: 'POST', body: JSON.stringify({ offerId, score, comment }) },
    token,
  );
}

// ── Raw HTTP — for tests that need to assert error shapes ─────────────────

/**
 * Direct fetch wrapper that returns the raw Response. Use for negative tests
 * where we want to assert a specific status code or error body.
 */
export async function rawApi(
  path: string,
  init: RequestInit,
  token?: string,
): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('x-tenant-id', TENANT_ID);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(`${BACKEND_URL}${path}`, { ...init, headers });
}
