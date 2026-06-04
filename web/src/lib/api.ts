/**
 * CoreMesh API client.
 * Injects x-tenant-id and Authorization headers on every request.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:3000';
const TENANT_ID = 'kanto';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('jwt');
}

async function fetchJson<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const token = getToken();

  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('x-tenant-id', TENANT_ID);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(url, {
    ...init,
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(err.message ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  category: string;
  condition: string;
  askingPrice: number;
  district: string;
  status: string;
  viewCount: number;
  sellerId: string;
  photos?: Array<{
    id: string;
    r2Key: string;
    url: string;
    position: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedListings {
  data: Listing[];
  pagination: {
    page: number;
    limit: number;
    total_items: number;
    total_pages: number;
  };
}

export interface Offer {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  status: string;
  note?: string;
  tokenHoldAmount?: number;
  createdAt: string;
}

export interface SafeMeetSpot {
  id: string;
  name: string;
  nameAr: string;
  district: string;
  latitude: number;
  longitude: number;
}

export const api = {
  listings: {
    list: (params?: Record<string, string>) =>
      fetchJson<PaginatedListings>(
        `/api/v1/listings?${new URLSearchParams(params ?? {}).toString()}`,
      ),
    get: (id: string) => fetchJson<Listing>(`/api/v1/listings/${id}`),
    create: (dto: Omit<Listing, 'id' | 'createdAt' | 'updatedAt' | 'viewCount'>) =>
      fetchJson<Listing>('/api/v1/listings', {
        method: 'POST',
        body: JSON.stringify(dto),
      }),
  },
  offers: {
    listSent: () => fetchJson<Offer[]>('/api/v1/offers/sent'),
    listReceived: () => fetchJson<Offer[]>('/api/v1/offers/received'),
    create: (dto: { listingId: string; amount: number; note?: string }) =>
      fetchJson<Offer>('/api/v1/offers', {
        method: 'POST',
        body: JSON.stringify(dto),
      }),
  },
  categories: {
    list: () =>
      fetchJson<
        Array<{ value: string; labelEn: string; labelAr: string }>
      >('/api/v1/categories'),
  },
  safeSpots: {
    list: (district?: string) =>
      fetchJson<SafeMeetSpot[]>(
        `/api/v1/safe-meet-spots${district ? `?district=${district}` : ''}`,
      ),
  },
};
