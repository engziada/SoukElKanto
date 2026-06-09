/**
 * Playwright globalSetup — runs once before the entire test suite.
 *
 * Responsibilities:
 *  1. Verify CoreMesh backend is reachable (hard-fail if not).
 *  2. Obtain a JWT for the test user via OTP flow.
 *  3. Seed one test listing and one offer, write IDs to .test-data.json.
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const BACKEND = 'http://localhost:3000';
const TENANT = 'kanto';
const TEST_PHONE = '+201000000001';
const TEST_PHONE_BUYER = '+201000000002';
const TEST_OTP = '000000';
const DATA_PATH = join(__dirname, '.test-data.json');
const AUTH_DIR = join(__dirname, '.auth');

const BUYER_AUTH_STATE_PATH = join(AUTH_DIR, 'buyer.json');

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface LoginResult {
  token: string;
  user: Record<string, unknown>;
}

async function backendFetch<T>(
  path: string,
  init: RequestInit = {},
  token?: string,
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('x-tenant-id', TENANT);
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${BACKEND}${path}`, { ...init, headers });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`[globalSetup] ${init.method ?? 'GET'} ${path} → ${res.status}: ${body}`);
  }
  const json = (await res.json()) as unknown;
  if (json && typeof json === 'object' && 'data' in json && 'success' in json) {
    return (json as ApiResponse<T>).data;
  }
  return json as T;
}

/** Login a phone via OTP and return JWT + user payload */
async function loginPhone(phone: string): Promise<LoginResult> {
  // Step 1: register/send OTP
  try {
    await backendFetch('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber: phone }),
    });
  } catch {
    // idempotent — 409 conflict means already registered, continue
  }
  // Step 2: verify OTP
  const result = await backendFetch<LoginResult>('/api/v1/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ phoneNumber: phone, code: TEST_OTP }),
  });
  return result;
}

/** Write a Playwright storageState JSON with Zustand auth persisted in localStorage */
function writeStorageState(filePath: string, token: string, user: Record<string, unknown>): void {
  const zustandState = JSON.stringify({
    state: { token, user, isAuthenticated: true },
    version: 0,
  });
  const storageState = {
    cookies: [],
    origins: [
      {
        origin: 'http://localhost:3001',
        localStorage: [
          { name: 'kanto.auth.v1', value: zustandState },
        ],
      },
    ],
  };
  writeFileSync(filePath, JSON.stringify(storageState, null, 2), 'utf8');
}

export default async function globalSetup(): Promise<void> {
  console.log('[globalSetup] Checking CoreMesh backend health…');

  // ── 1. Health check ────────────────────────────────────────────────────
  const healthRes = await fetch(`${BACKEND}/api/v1/health`, {
    headers: { 'x-tenant-id': TENANT },
  }).catch(() => null);

  if (!healthRes || healthRes.status !== 200) {
    throw new Error(
      '[globalSetup] CoreMesh backend is not reachable at http://localhost:3000.\n' +
      'Run: pwsh ./stack-up.ps1   (in f:\\Web-Projects\\MadinatyAI\\Codes\\)',
    );
  }
  console.log('[globalSetup] Backend healthy ✓');

  // ── 2. Obtain tokens for seller + buyer ────────────────────────────────
  console.log('[globalSetup] Logging in test users…');
  const sellerLogin = await loginPhone(TEST_PHONE);
  const buyerLogin = await loginPhone(TEST_PHONE_BUYER);
  const sellerToken = sellerLogin.token;
  const buyerToken = buyerLogin.token;
  console.log('[globalSetup] Test users authenticated ✓');

  // ── 3. Seed a test listing (as seller) ────────────────────────────────
  console.log('[globalSetup] Seeding test listing…');
  const listing = await backendFetch<{ id: string }>(
    '/api/v1/listings',
    {
      method: 'POST',
      body: JSON.stringify({
        title: 'E2E Test Sofa',
        description: 'Playwright test listing — do not delete manually.',
        category: 'FURNITURE',
        condition: 'GOOD',
        askingPrice: 2500,
        district: 'B5',
      }),
    },
    sellerLogin.token,
  );
  console.log(`[globalSetup] Listing seeded: ${listing.id} ✓`);

  // ── 4. Seed an offer (as buyer) ────────────────────────────────────────
  console.log('[globalSetup] Seeding test offer…');
  let offerId = 'unknown';
  try {
    const offer = await backendFetch<{ id: string }>(
      '/api/v1/offers',
      {
        method: 'POST',
        body: JSON.stringify({
          listingId: listing.id,
          amount: 2000,
          note: 'E2E test offer',
        }),
      },
      buyerLogin.token,
    );
    offerId = offer.id;
    console.log(`[globalSetup] Offer seeded: ${offerId} ✓`);
  } catch (err) {
    console.warn('[globalSetup] Offer seed failed (non-fatal):', err);
  }

  // ── 5. Persist test data ───────────────────────────────────────────────
  mkdirSync(AUTH_DIR, { recursive: true });

  // Write buyer Playwright storageState so J05 can use buyer context directly
  writeStorageState(BUYER_AUTH_STATE_PATH, buyerLogin.token, buyerLogin.user);
  console.log(`[globalSetup] Buyer storage state written ✓`);
  writeFileSync(
    DATA_PATH,
    JSON.stringify({
      listingId: listing.id,
      offerId,
      sellerToken,
      buyerToken,
    }, null, 2),
    'utf8',
  );
  console.log(`[globalSetup] Test data written to ${DATA_PATH} ✓`);
}
