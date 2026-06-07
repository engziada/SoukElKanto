/**
 * lib/queries.ts — TanStack Query keys + fetcher factories.
 *
 * All query keys are typed tuples so TypeScript catches stale key references.
 * Keep fetchers thin wrappers around lib/api.ts — no business logic here.
 */

import { api } from './api';
import type { Listing, PaginatedListings, Offer, KycStatus } from './api';

/* ── Query key factory ────────────────────────────────────────────────────── */

export const qk = {
  /** List of listings with optional search/filter params */
  listings: (params?: Record<string, string>) =>
    ['listings', 'list', params ?? {}] as const,

  /** Single listing by id */
  listing: (id: string) => ['listings', 'detail', id] as const,

  /** My listings (current user as seller) */
  myListings: () => ['listings', 'mine'] as const,

  /** Sent offers for the current user */
  offersSent: () => ['offers', 'sent'] as const,

  /** Received offers for the current user */
  offersReceived: () => ['offers', 'received'] as const,

  /** KYC status for the current user */
  kycStatus: () => ['users', 'me', 'kyc'] as const,
} as const;

/* ── Fetcher factories ────────────────────────────────────────────────────── */

/** Fetch paginated listings with optional query params. */
export async function fetchListings(
  params?: Record<string, string>,
): Promise<PaginatedListings> {
  return api.listings.list(params);
}

/** Fetch a single listing by id. */
export async function fetchListing(id: string): Promise<Listing> {
  return api.listings.get(id);
}

/** Fetch all listings then filter by the authenticated user's id. */
export async function fetchMyListings(userId: string): Promise<Listing[]> {
  const res = await api.listings.list({ limit: '100' });
  return res.data.filter((l) => l.sellerId === userId);
}

/** Fetch offers the current user has sent. */
export async function fetchOffersSent(): Promise<Offer[]> {
  return api.offers.listSent();
}

/** Fetch offers the current user has received. */
export async function fetchOffersReceived(): Promise<Offer[]> {
  return api.offers.listReceived();
}

/** Fetch KYC status for the current user. */
export async function fetchKycStatus(): Promise<KycStatus> {
  return api.users.kycStatus();
}
