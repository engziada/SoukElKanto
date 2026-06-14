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

/**
 * R-11 F-15 — auth is now carried by the httpOnly `madinaty.access` cookie
 * scoped to `/api`. We send `credentials: 'include'` on every request so the
 * cookie travels through the Next dev-rewrite proxy (browser sees same-origin
 * `localhost:3001`, so the cookie set by the proxy on the BE response is
 * stored under `localhost:3001` and replayed on every `/api/*` call).
 *
 * Legacy `Authorization: Bearer` fallback: during the migration window, if
 * `localStorage['kanto.auth.v1'].state.token` is still present (set by a
 * pre-cookie-migration login), we ALSO send it as a Bearer header so existing
 * sessions don't get kicked. The BE prefers the cookie when both are present.
 * This fallback is removed once a few release cycles pass.
 */
function getLegacyToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem('kanto.auth.v1');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: { token?: string | null } };
    return parsed?.state?.token ?? null;
  } catch {
    return null;
  }
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

  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('x-tenant-id', TENANT_ID);

  // R-11 F-15 — legacy localStorage token fallback (back-compat for pre-cookie
  // sessions). Goes away once persistent migration window closes.
  const legacy = getLegacyToken();
  if (legacy) {
    headers.set('Authorization', `Bearer ${legacy}`);
  }

  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers,
      credentials: 'include', // R-11 F-15 — send madinaty.access cookie
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

export interface OfferHandover {
  id?: string;
  buyerConfirmedAt?: string | null;
  sellerConfirmedAt?: string | null;
  bothConfirmedAt?: string | null;
  ratingWindowEndsAt?: string | null;
}

export interface OfferRatingSummary {
  id: string;
  raterId: string;
  score: number;
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
  listing?: Listing;
  parentOfferId?: string | null;
  handover?: OfferHandover | null;
  ratings?: OfferRatingSummary[];
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
  photos?: Array<{ r2Key: string; position: number; url?: string }>;
}

/** Response from POST /listings/photo-upload-url */
export interface PhotoUploadUrlResponse {
  uploadUrl: string;     // presigned R2 PUT URL
  r2Key: string;        // key to include in the listing create DTO
  publicUrl: string;    // public CDN URL after upload
  expiresInSeconds: number;
}

export interface AuthUserPayload {
  id: string;
  phoneNumber: string;
  role: 'USER' | 'PROVIDER' | 'TENANT_ADMIN' | 'PLATFORM_ADMIN';
  isVerified?: boolean;
  trustScore?: number;
  metadata?: Record<string, unknown>;
  // Flattened profile fields — the BE /me + /users/me/profile both return
  // these alongside metadata for FE convenience.
  fullName?: string;
  gender?: string;
  birthdate?: string;
  address?: string;
  madinatyGroup?: string;
  buildingNo?: string;
  aptNo?: string;
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
  fullName?: string;
}

export interface TokenTransaction {
  activityType: 'CREDIT' | 'DEBIT' | string;
  tokenType: 'individual' | 'business' | string;
  amount: number;
  description: string;
  referenceId?: string | null;
  createdAt: string;
}

export interface TokenAllocation {
  amount: number;
  reason?: string;
  expiresAt?: string | null;
  createdAt?: string;
  [key: string]: unknown;
}

export interface TokenWallet {
  userId: string;
  businessTokens: number;
  individualTokens: number;
  allocations: TokenAllocation[];
  recentTransactions: TokenTransaction[];
}

export type TrustMeterTier = 'NEW' | 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

export interface TrustMeterSummary {
  userId: string;
  total: number;
  tier: TrustMeterTier;
  tierReachedAt?: string | null;
  highestTotal: number;
  nextTier?: TrustMeterTier | null;
  pointsToNextTier?: number | null;
}

export interface TrustMeterBonusGrant {
  id: string;
  tier: TrustMeterTier;
  amount: number;
  tokenType: 'individual' | 'business';
  grantedAt: string;
  reason?: string | null;
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
    /**
     * R-11 F-15/F-16 — revoke the current JWT + clear the `madinaty.access`
     * cookie. Returns 204 No Content; we ignore the body.
     */
    logout: () =>
      fetchJson<void>('/api/v1/auth/logout', { method: 'POST' }).catch(
        (e: unknown) => {
          // Best-effort: a network failure on logout shouldn't block client-side
          // session teardown. The cookie is httpOnly so the browser holds it
          // until expiry, but the next /me call will still fail — UI clears state.
          if (e instanceof ApiError && e.status === 0) return;
          throw e;
        },
      ),
  },
  users: {
    kycStatus: () => fetchJson<KycStatus>('/api/v1/users/me/kyc-status'),
    updateProfile: (dto: { fullName?: string; gender?: string; birthdate?: string; address?: string; madinatyGroup?: string; buildingNo?: string; aptNo?: string }) =>
      fetchJson<AuthUserPayload>('/api/v1/users/me/profile', {
        method: 'PATCH',
        body: JSON.stringify(dto),
      }),
    submitKyc: (dto: { fullName: string; idNumber: string; documentBase64: string }) =>
      fetchJson<{ id: string; status: string }>('/api/v1/users/me/kyc', {
        method: 'POST',
        body: JSON.stringify(dto),
      }),
  },
  listings: {
    list: (params?: Record<string, string>) =>
      fetchJson<PaginatedListings>(
        `/api/v1/listings?${new URLSearchParams(params ?? {}).toString()}`,
      ),
    /**
     * Activity page (#8) — current user's listings across every status
     * (ACTIVE / RESERVED / REMOVED / EXPIRED), newest first. Bearer/cookie
     * auth required.
     */
    listMine: () =>
      fetchJson<Array<Listing & { _count?: { offers: number } }>>(
        '/api/v1/listings/mine',
      ),
    get: (id: string) => fetchJson<Listing>(`/api/v1/listings/${id}`),
    update: (id: string, dto: Partial<CreateListingDto>) =>
      fetchJson<Listing>(`/api/v1/listings/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(dto),
      }),
    remove: (id: string) =>
      fetchJson<void>(`/api/v1/listings/${id}`, { method: 'DELETE' }),
    create: (dto: CreateListingDto) =>
      fetchJson<Listing>('/api/v1/listings', {
        method: 'POST',
        body: JSON.stringify(dto),
      }),
    /**
     * Request a presigned R2 PUT URL for a photo.
     * Call this once per file, PUT the raw file bytes to uploadUrl,
     * then call addPhoto with the returned r2Key.
     */
    photoUploadUrl: (filename: string, contentType: string, bytes: number) =>
      fetchJson<PhotoUploadUrlResponse>('/api/v1/listings/photo-upload-url', {
        method: 'POST',
        body: JSON.stringify({ filename, contentType, bytes }),
      }),
    /**
     * Photos are attached inline during listing creation via the
     * `photos: [{r2Key, position}]` field on CreateListingDto.
     */
  },
  offers: {
    listSent: () => fetchJson<Offer[]>('/api/v1/offers/sent'),
    listReceived: () => fetchJson<Offer[]>('/api/v1/offers/received'),
    create: (dto: { listingId: string; amount: number; note?: string }) =>
      fetchJson<Offer>('/api/v1/offers', {
        method: 'POST',
        body: JSON.stringify(dto),
      }),
    /** Seller accepts a received offer. */
    accept: (id: string) =>
      fetchJson<Offer>(`/api/v1/offers/${id}/accept`, { method: 'PATCH' }),
    /** Seller declines a received offer (optional reason). */
    decline: (id: string, reason?: string) =>
      fetchJson<Offer>(`/api/v1/offers/${id}/decline`, {
        method: 'PATCH',
        body: JSON.stringify({ reason }),
      }),
    /** Seller counters with a new amount. */
    counter: (id: string, amount: number) =>
      fetchJson<Offer>(`/api/v1/offers/${id}/counter`, {
        method: 'PATCH',
        body: JSON.stringify({ amount }),
      }),
    /** Buyer withdraws a sent offer. */
    confirmHandover: (id: string) =>
      fetchJson<{ buyerConfirmedAt?: string; sellerConfirmedAt?: string }>(`/api/v1/handover/${id}/confirm`, { method: 'POST' }),
    withdraw: (id: string) =>
      fetchJson<Offer>(`/api/v1/offers/${id}/withdraw`, { method: 'PATCH' }),
    // ── R-02: buyer-side actions on seller-initiated counters ─────────
    /** Buyer accepts a seller's counter (offer.parentOfferId must be set). */
    buyerAccept: (id: string) =>
      fetchJson<Offer>(`/api/v1/offers/${id}/buyer-accept`, { method: 'PATCH' }),
    /** Buyer declines a seller's counter (optional reason). */
    buyerDecline: (id: string, reason?: string) =>
      fetchJson<Offer>(`/api/v1/offers/${id}/buyer-decline`, {
        method: 'PATCH',
        body: JSON.stringify({ reason }),
      }),
    /** Buyer counter-counters with a new amount; creates a grandchild offer. */
    buyerCounter: (id: string, amount: number) =>
      fetchJson<Offer>(`/api/v1/offers/${id}/buyer-counter`, {
        method: 'PATCH',
        body: JSON.stringify({ amount }),
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
      fetchJson<TokenWallet>('/api/v1/tokens/wallet/me'),
  },
  trustMeter: {
    me: () => fetchJson<TrustMeterSummary>('/api/v1/trust-meter/me'),
    bonusGrants: () =>
      fetchJson<TrustMeterBonusGrant[]>('/api/v1/trust-meter/me/bonus-grants'),
  },
  // R-03a / R-09 — ratings + reports (BE already wired)
  ratings: {
    /** Submit a post-handover rating (1-5 score, optional comment). */
    create: (offerId: string, score: number, comment?: string) =>
      fetchJson<{
        id: string;
        offerId: string;
        raterId: string;
        targetId: string;
        score: number;
        comment?: string | null;
      }>('/api/v1/ratings', {
        method: 'POST',
        body: JSON.stringify({ offerId, score, comment }),
      }),
  },
  reports: {
    /**
     * R-09 — file a report against a listing.
     *
     * The BE wraps the response as `{ report: {...}, trust: {...} }` where
     * `trust` is the updated trust-score snapshot for the offender.
     */
    createListingReport: (
      listingId: string,
      dto: {
        incidentType: ReportIncidentType;
        severity: number;
        reason: string;
        evidencePhotoR2Key?: string;
      },
    ) =>
      fetchJson<{
        report: {
          id: string;
          reporterId: string;
          offenderId: string;
          incidentType: ReportIncidentType;
          severity: number;
          isPlatformWideBanned: boolean;
          originSubdomain: string;
          createdAt: string;
        };
        trust: {
          score: number;
          isBanned: boolean;
          penalty: number;
          ageBonus: number;
        };
      }>(`/api/v1/listings/${listingId}/report`, {
        method: 'POST',
        body: JSON.stringify(dto),
      }),
  },
};

/** R-09 — Mirrors the closed enum on the BE (DTO `ReportIncidentType`). */
export type ReportIncidentType =
  | 'SCAM'
  | 'SPAM'
  | 'FRAUD'
  | 'POLICY_VIOLATION'
  | 'OTHER';
