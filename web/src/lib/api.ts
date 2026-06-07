/**
 * CoreMesh API client.
 * Injects x-tenant-id and Authorization headers on every request.
 */

/**
 * Different bases for server vs browser:
 *   - SSR (server components, route handlers): absolute URL — `node fetch` needs one.
 *     Falls back to CORE_MESH_URL or the dev default.
 *   - Browser: relative `/api/...` so the Next dev rewrite proxies to CoreMesh
 *     without triggering CORS preflight against :3000.
 */
const API_BASE =
  typeof window === 'undefined'
    ? process.env.CORE_MESH_URL || 'http://localhost:3000'
    : process.env.NEXT_PUBLIC_API_BASE || '';
const TENANT_ID = 'kanto';

import { getAuthToken } from './auth/store';

function getToken(): string | null {
  return getAuthToken();
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
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

  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers,
    });
  } catch (e) {
    throw new ApiError(
      e instanceof Error ? e.message : 'network error',
      0,
      'NETWORK',
    );
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message =
      (body && (body.error?.message ?? body.message)) ?? `HTTP ${res.status}`;
    const code = body?.error?.code;
    throw new ApiError(message, res.status, code);
  }

  const payload = (await res.json()) as unknown;

  // Unwrap global response envelope: { success, data, meta }
  if (
    payload &&
    typeof payload === 'object' &&
    'data' in payload &&
    'success' in payload
  ) {
    return (payload as { data: T }).data;
  }

  return payload as T;
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

export interface CreateListingDto {
  title: string;
  description: string;
  category: string;
  condition: string;
  askingPrice: number;
  district: string;
}

export interface AuthUserPayload {
  id: string;
  phoneNumber: string;
  role: 'USER' | 'PROVIDER' | 'TENANT_ADMIN' | 'PLATFORM_ADMIN';
  isVerified?: boolean;
  trustScore?: number;
  metadata?: Record<string, unknown>;
  kyc?: unknown;
  createdAt?: string;
}

export interface VerifyOtpResponse {
  user: AuthUserPayload;
  token: string;
  expiresIn?: number;
}

export interface KycStatus {
  isVerified: boolean;
  status: 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED' | string;
  submittedAt?: string | null;
  reviewedAt?: string | null;
}

export const api = {
  auth: {
    /** Register OR re-send OTP if the phone already exists. BE is idempotent. */
    register: (phoneNumber: string) =>
      fetchJson<{ phoneNumber: string }>('/api/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify({ phoneNumber }),
      }),
    /** Trade phone + 6-digit code for a JWT. */
    verifyOtp: (phoneNumber: string, code: string) =>
      fetchJson<VerifyOtpResponse>('/api/v1/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ phoneNumber, code }),
      }),
    /** Resend OTP via /auth/login (existing user path). */
    resend: (phoneNumber: string) =>
      fetchJson<{ phoneNumber: string }>('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ phoneNumber }),
      }),
    me: () => fetchJson<AuthUserPayload>('/api/v1/auth/me'),
  },
  users: {
    kycStatus: () => fetchJson<KycStatus>('/api/v1/users/me/kyc-status'),
  },
  listings: {
    list: (params?: Record<string, string>) =>
      fetchJson<PaginatedListings>(
        `/api/v1/listings?${new URLSearchParams(params ?? {}).toString()}`,
      ),
    get: (id: string) => fetchJson<Listing>(`/api/v1/listings/${id}`),
    create: (dto: CreateListingDto) =>
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
  tokens: {
    walletMe: () =>
      fetchJson<{
        userId: string;
        businessTokens: number;
        individualTokens: number;
        allocations: unknown[];
        recentTransactions: unknown[];
      }>('/api/v1/tokens/wallet/me'),
  },
};
