# Souk ElKanto — End-to-End Test Plan

> **Last updated:** 2026-06-11
> **Scope:** Phase D (frontend) + the marketplace surface of CoreMesh (`tenant_soukelkanto`).
> **Primary lens:** two simultaneously logged-in users — **U-S** (Seller / owner who posts an ad) and **U-B** (potential buyer). Every cross-user state transition must be observable in both sessions.

---

## 1. Goals & scope

This plan covers every user-facing journey reachable today on `http://localhost:3001` and the CoreMesh `/api/v1/*` endpoints it depends on.

**In scope**
- Public / anonymous browsing
- Auth: register, OTP verify, resend, logout
- Profile + KYC submission
- Listings: browse, filter, search, paginate, detail
- Listing lifecycle: create wizard (4 steps), edit, delete/withdraw (owner-only)
- Photo upload via presigned R2 URL
- Offers: create, sent/received lists, accept, decline, counter, withdraw
- Handover: backend endpoint reachable (UI not wired yet — gap)
- Ratings: backend endpoint reachable (UI not wired yet — gap)
- Favorites (localStorage, per-browser)
- AR/EN i18n + RTL + theme toggle
- Error states: 401, 404, network down
- **Two-user concurrent flows** — the cross-user state machine

**Out of scope (placeholders / coming soon)**
- `/my/handovers` — UI placeholder, backend exists. Covered in API-only tests.
- `/my/wallet` — UI placeholder. Tokens module is wired in API.
- `/my/trust-meter` — UI placeholder. Backend wired.
- Report UI — clicking "Report" only shows a "coming soon" hint today; backend exists.
- KYC external integration (Didit) — not yet wired.
- Real-time push (chat/notifications) — see `convex-migration-assessment.md`.
- Admin surface (`/admin`).

---

## 2. Test infrastructure (what exists, what we extend)

### 2.1 What exists

Path: `Codes/SoukElkanto/web/`

| Artifact | Purpose |
|---|---|
| [playwright.config.ts](../web/playwright.config.ts) | 4 projects: chromium, firefox, mobile-chrome, mobile-safari; all depend on the `setup` project. 60s test timeout, 15s expect, traces on first retry. |
| [e2e/global-setup.ts](../web/e2e/global-setup.ts) | Hard-fails if BE health ≠ 200. Registers + verifies BOTH test phones via OTP. Seeds one listing (as seller) + one offer (as buyer). Writes `.test-data.json` + buyer's Playwright `storageState` to `.auth/buyer.json`. |
| [e2e/fixtures/auth.setup.ts](../web/e2e/fixtures/auth.setup.ts) | UI login as seller → saves `.auth/user.json`. Runs once before every test project. |
| [e2e/fixtures/auth.ts](../web/e2e/fixtures/auth.ts) | Three custom fixtures: `authenticatedPage` (seller via storageState), `buyerPage` (fresh UI login per test — slow), `unauthenticatedPage`. |
| [e2e/helpers/constants.ts](../web/e2e/helpers/constants.ts) | Phone numbers, OTPs, storage keys, I18N text samples for AR + EN. |
| [e2e/helpers/test-data.ts](../web/e2e/helpers/test-data.ts) | Reads `.test-data.json` → exposes seeded `listingId`, `offerId`, `sellerToken`, `buyerToken`. |
| `e2e/journeys/J01..J13` | 13 existing single-user journey specs (homepage, listings, detail, auth, offer, wizard, my-shell, my-listings, my-offers, favorites, whatsapp, i18n-rtl, errors). |

### 2.2 What we extend

1. **Add a `concurrentTest` fixture** (`e2e/fixtures/concurrent.ts`) that gives a test access to **two `Page` objects in two separate `BrowserContext`s** in one shot — seller + buyer — both pre-authed via saved `storageState`. This is the linchpin for every CJ-## test below. Avoids the cost of re-logging the buyer through the UI every test (which `buyerPage` does today).

2. **Add per-test data factory** (`e2e/helpers/factory.ts`):
   - `createListingAsSeller(token, overrides?)` → returns the new listing's id
   - `createOfferAsBuyer(token, listingId, overrides?)` → returns offer id
   - Lets each CJ start from a clean, deterministic state — no test relies on order.

3. **Add the new `journeys/CJ##-*.spec.ts` files** described in §6.

4. **Add an API contract test layer** (`e2e/api/*.spec.ts`) — uses Playwright's `request` fixture to hit `/api/v1/*` directly with seller/buyer tokens. This is how we cover backend-only flows (handover, ratings, reports) while their UI is still a placeholder.

---

## 3. Test users + data

### 3.1 Users (created on demand via OTP)

| Alias | Phone | Local digits | Dev OTP | Default role |
|---|---|---|---|---|
| **U-S** Seller | `+201000000001` | `1000000001` | `000000` | USER, owns the listing under test |
| **U-B** Buyer | `+201000000002` | `1000000002` | `000000` | USER, makes the offer |
| U-X Third party (rare) | `+201000000003` | `1000000003` | `000000` | for "non-participant can't act" tests |
| U-Anon | — | — | — | unauthenticated context |

All four phones authenticate via the same dev OTP (`000000`). The CoreMesh auth service accepts that as the magic-bypass code in non-prod env.

### 3.2 Seeded data (from `prisma/seed.ts`, owner = `+201000000000`)

- 8 sample listings (Arabic titles, mixed categories: FURNITURE, MOBILE_TABLETS, SPORTS_OUTDOOR, KITCHEN_DINING, FASHION, ELECTRONICS, BABY_MATERNITY). Districts: B5, C1, GATE, MALL, CLUB, WEST, PARK, LAKE.
- 10 safe meet spots (district-tagged).
- 5 tenants, 2 kitchen businesses, 2 tutor businesses.

> **Important:** Sample listings are owned by `+201000000000`, NOT by U-S. Tests that need U-S to own the listing under test must create one through `factory.createListingAsSeller(sellerToken)`.

### 3.3 Per-test scratch data

Every concurrent journey **creates its own listing** at the start so that tests can run in parallel without colliding on shared state. The teardown step deletes the listing (and cascade-deletes its offers).

---

## 4. Coverage status at a glance

Legend: ✅ already in `e2e/journeys/` · △ partial (gap noted) · ❌ missing · 🔒 out of scope (placeholder)

| # | Area | Status | Lives in |
|---|---|---|---|
| J-01 | Homepage hero + categories + grid | ✅ | J01-homepage.spec.ts |
| J-02 | Listings browse + filters + pagination | ✅ | J02-listings.spec.ts |
| J-03 | Listing detail (trust panel, photo, chips) | ✅ | J03-detail.spec.ts |
| J-04 | Auth login + verify + resend | ✅ | J04-auth.spec.ts |
| J-05 | OfferModal — happy + unauthed + invalid amount | △ own-listing FIXME | J05-offer.spec.ts |
| J-06 | /listings/new 4-step wizard | ✅ | J06-wizard.spec.ts |
| J-07 | /my dashboard shell + tab nav | ✅ | J07-my-shell.spec.ts |
| J-08 | /my/listings — own listings grid | ✅ | J08-my-listings.spec.ts |
| J-09 | /my/offers — Sent/Received tabs, badges | ✅ | J09-my-offers.spec.ts |
| J-10 | Favorites localStorage round-trip | ✅ | J10-favorites.spec.ts |
| J-11 | WhatsApp share link composition | ✅ | J11-whatsapp.spec.ts |
| J-12 | AR/EN i18n + RTL direction | ✅ | J12-i18n-rtl.spec.ts |
| J-13 | Error states: 404 + network down | ✅ | J13-errors.spec.ts |
| J-14 | Profile editing (fullName, gender, birthdate, address) | ❌ | (new) |
| J-15 | KYC submission (`/my/verify` → `/users/me/kyc`) | ❌ | (new) |
| J-16 | Listing edit (owner) — `/listings/[id]/edit` | ❌ | (new) |
| J-17 | Listing delete / withdraw | ❌ | (new) |
| J-18 | Photo upload via presigned R2 (already wired Wave-7) | ❌ | (new) |
| J-19 | Theme toggle persistence | ❌ | (new) |
| J-20 | NavBar user chip + logout | ❌ | (new) |
| **CJ-01** | **Anon → register → first offer (U-B alone)** | ❌ | (new) |
| **CJ-02** | **Offer accept happy path (U-S + U-B)** | ❌ | (new) |
| **CJ-03** | **Offer decline (U-S + U-B)** | ❌ | (new) |
| **CJ-04** | **Counter-offer round-trip (U-S + U-B)** | ❌ | (new) |
| **CJ-05** | **Buyer withdraw (U-S + U-B)** | ❌ | (new) |
| **CJ-06** | **Listing publish visible to buyer in real time-ish (U-S → U-B)** | ❌ | (new) |
| **CJ-07** | **Two buyers, one listing — race on accept (U-S + U-B + U-X)** | ❌ | (new) |
| **CJ-08** | **Handover two-tap confirmation (API-only until UI ships)** | ❌ | (new, api/) |
| **CJ-09** | **Post-handover ratings (API-only)** | ❌ | (new, api/) |
| **CJ-10** | **Own-listing guard — seller can't offer on self** | △ FIXME | (extend J-05) |
| Token wallet balance read | 🔒 | (api/ only) |
| TrustMeter tier read | 🔒 | (api/ only) |
| /my/handovers UI | 🔒 placeholder | — |
| /my/wallet UI | 🔒 placeholder | — |
| /my/trust-meter UI | 🔒 placeholder | — |
| Report listing UI | 🔒 placeholder | — |
| `/admin` | 🔒 | — |

---

## 5. Single-user journeys (J-01 … J-20)

These confirm individual pages work. They are the foundation; CJ-## journeys assume the surfaces below are solid.

### 5.1 J-14 · Profile editing (new)

**User:** U-B (any logged-in user). **Page:** `/[locale]/my/profile`.

| Step | Action | Expected |
|---|---|---|
| 1 | GET `/en/my/profile` | Phone, KYC chip (NOT_SUBMITTED), member-since visible |
| 2 | Click "Edit" | Form reveals `fullName`, `gender` (radio), `birthdate` (date picker), `madinatyGroup`, `buildingNo`, `aptNo` |
| 3 | Submit with `fullName="Mohamed Ahmed"`, `gender="MALE"`, `birthdate="1990-01-01"` | PATCH `/api/v1/users/me/profile` → 200; toast `profileSaved` |
| 4 | Reload page | Saved values render in display mode |
| 5 | Submit with `birthdate` making user < 18 | Validation: `mustBe18` error |
| 6 | Switch locale to AR | Same form, RTL direction, AR placeholders |

### 5.2 J-15 · KYC submission (new)

**User:** U-B. **Page:** `/[locale]/my/verify`.

| Step | Action | Expected |
|---|---|---|
| 1 | GET `/en/my/verify` | Sees document upload form |
| 2 | Submit `fullName`, `idNumber=29001011234567`, fake `documentBase64` | POST `/api/v1/users/me/kyc` → 201, status = PENDING |
| 3 | GET `/en/my/profile` | KYC chip = `kycPending` |
| 4 | Submit again while PENDING | Server should reject re-submission (409 / 422); UI surfaces error toast |

> **Note:** auto-approval path doesn't exist in dev. Manual admin review is out of scope.

### 5.3 J-16 · Listing edit (new)

**User:** U-S (owns the listing). **Page:** `/[locale]/listings/[id]/edit`.

| Step | Action | Expected |
|---|---|---|
| 1 | Seller GETs own listing detail page | Sees "Edit" sub-CTA instead of "Make Offer" |
| 2 | Click Edit | Navigates to `/listings/[id]/edit` |
| 3 | Change title + price; submit | PATCH `/api/v1/listings/:id` → 200; redirect or toast |
| 4 | Reload detail page | New title + price render |
| 5 | A non-owner tries to GET `/listings/[id]/edit` | Redirect or 403 surfaced |

### 5.4 J-17 · Listing delete/withdraw (new)

**User:** U-S. **Page:** `/my/listings` or detail.

| Step | Action | Expected |
|---|---|---|
| 1 | Click Delete on a listing | Confirm dialog |
| 2 | Confirm | DELETE `/api/v1/listings/:id` → 204 |
| 3 | Refresh `/listings` (anon) | Listing no longer visible |
| 4 | Any open offer for it shows status EXPIRED in `/my/offers` (assuming BE policy) — flag as gap if not |

### 5.5 J-18 · Photo upload (R2 presigned) (new)

**User:** U-S, within the wizard `/listings/new`.

| Step | Action | Expected |
|---|---|---|
| 1 | Wizard Step 1, click "Add Photos", pick a 1MB jpg | Thumbnail appears |
| 2 | Click Next, complete remaining steps, click Publish | (a) POST `/api/v1/listings/photo-upload-url` for each photo → returns `{uploadUrl, r2Key, publicUrl}` (b) PUT raw bytes to `uploadUrl` → 200 (c) POST `/api/v1/listings` with `photos:[{r2Key, position}]` → 201 |
| 3 | GET `/listings/[id]` for the new listing | Image renders from `publicUrl` |
| 4 | Try to upload a >5MB file (or whatever max) | Validation error in BE → UI surfaces toast; no half-created listing |

### 5.6 J-19 · Theme toggle persistence (new)

**User:** anon. **Component:** ThemeToggle (NavBar).

| Step | Action | Expected |
|---|---|---|
| 1 | Default `[data-theme]` on `<html>` is light | Tokens reflect Sunny Horizon |
| 2 | Click ThemeToggle | `[data-theme="dark"]` set; tokens switch to Aurora Night |
| 3 | Reload | Theme persists (localStorage key check) |

### 5.7 J-20 · NavBar user chip + logout (new)

**User:** U-S. **Component:** NavBar.

| Step | Action | Expected |
|---|---|---|
| 1 | Visit `/en` | User chip shows formatted phone, dropdown opens on click |
| 2 | Click Logout | `kanto.auth.v1` cleared from localStorage; chip replaced by Login button |
| 3 | Visit `/en/my` | Redirected to `/en/auth/login?next=/en/my` by AuthGate |

---

## 6. Two-user concurrent journeys — the main event

These are the journeys where the seller and buyer are simultaneously logged in and one party's action must be visible to the other.

### 6.1 Concurrent test scaffold

A custom Playwright fixture provides both contexts in one shot:

```ts
// e2e/fixtures/concurrent.ts
import { test as base, type BrowserContext, type Page } from '@playwright/test';
import { AUTH_STATE_PATH, BUYER_AUTH_STATE_PATH } from '../helpers/constants';

interface ConcurrentFixtures {
  sellerCtx: BrowserContext;
  buyerCtx: BrowserContext;
  sellerPage: Page;
  buyerPage: Page;
}

export const test = base.extend<ConcurrentFixtures>({
  sellerCtx: async ({ browser }, use) => {
    const ctx = await browser.newContext({ storageState: AUTH_STATE_PATH });
    await use(ctx);
    await ctx.close();
  },
  buyerCtx: async ({ browser }, use) => {
    const ctx = await browser.newContext({ storageState: BUYER_AUTH_STATE_PATH });
    await use(ctx);
    await ctx.close();
  },
  sellerPage: async ({ sellerCtx }, use) => { await use(await sellerCtx.newPage()); },
  buyerPage:  async ({ buyerCtx },  use) => { await use(await buyerCtx.newPage());  },
});
export { expect } from '@playwright/test';
```

### 6.2 Cross-user state-machine reference

```
                   ┌──────────────────────────────────────────┐
   U-S creates ────▶ LISTING.status = ACTIVE                  │
                   │                                          │
   U-B opens detail │                                          │
        │          │                                          │
        ▼          │                                          │
   U-B sends offer ▶ OFFER.status = PENDING (parentOfferId=∅) │
                   │                                          │
   U-S sees in /my/offers Received tab                        │
        │                                                     │
        ├─ accept ──▶ OFFER.status = ACCEPTED ──┐             │
        ├─ decline ─▶ OFFER.status = DECLINED   │             │
        ├─ counter ─▶ OFFER.status = COUNTERED  │             │
        │            new OFFER (PENDING)        │             │
        │            with parentOfferId         │             │
        │            same buyer/seller          │             │
        ▼                                       ▼             │
   U-B sees status flip in /my/offers Sent tab                │
        │                                                     │
        ├─ withdraw (only if PENDING/COUNTERED)                │
        │           ──▶ OFFER.status = WITHDRAWN              │
        ▼                                                     │
   If ACCEPTED → both can POST /api/v1/handover/:offerId/confirm│
        │ (UI not yet wired — API-only test for now)           │
        ▼                                                     │
   When BOTH have confirmed → both can POST /api/v1/ratings ──┘
        │ (UI not yet wired — API-only)
        ▼
   TrustScore / TrustMeter update via BullMQ event (async)
```

---

### CJ-01 · Anonymous browse → register → first offer

**Actors:** U-Anon → becomes a brand-new U-B'.
**Why:** Captures the most common new-user funnel.

**Preconditions**
- Stack up.
- At least one ACTIVE listing exists owned by U-S (from seed or factory).

**Steps**
| # | Page | Action | Expected |
|---|---|---|---|
| 1 | `/en` | Anonymous lands on home, sees listings grid | At least 1 ListingCard |
| 2 | `/en/listings/[id]` | Click card → detail page | Trust panel + "Make Offer" CTA visible (no auth-only treatment) |
| 3 | — | Click "Make Offer" | Redirect to `/en/auth/login?next=/en/listings/[id]` |
| 4 | `/en/auth/login` | Enter local digits `1000000099` (new phone), submit | POST `/auth/register` → 201; redirect to `/auth/verify` |
| 5 | `/en/auth/verify` | Enter `000000`, submit | POST `/auth/verify-otp` → 200; token stored; redirect to `next` param → back at detail page |
| 6 | `/en/listings/[id]` | Click "Make Offer" | OfferModal opens; amount input focused |
| 7 | OfferModal | Fill amount=1500 + note, click Send | But: **profile gate** must fire if `fullName/gender/birthdate` empty → modal shows "Complete your profile" with a link |
| 8 | `/en/my/profile` | Fill profile, save | PATCH `/users/me/profile` 200 |
| 9 | Back to detail, re-open OfferModal | Send 1500 | Success state; toast/dialog `offer.sentTitle` |

**Assertions**
- localStorage `kanto.auth.v1` populated post-step-5.
- After step 9: `GET /api/v1/offers/sent` (with U-B' token) returns ≥ 1 offer with `amount=1500, status=PENDING`.

**Edge cases to cover in the same spec**
- Re-using an existing phone in step 4 (already registered) → still flows through `/auth/verify` (idempotent BE).
- Entering wrong OTP `999999` → BE rejects, error toast.
- Closing the verify page mid-flow → revisiting `/auth/login` re-sends OTP via Resend.

---

### CJ-02 · Offer accept (the canonical happy path)

**Actors:** U-S + U-B simultaneously.
**Goal:** Buyer offer → seller sees it within a sane refresh → seller accepts → buyer sees ACCEPTED.

**Preconditions**
- Both users logged in (storageState).
- Test creates a fresh listing as U-S via factory (`title="E2E CJ-02 Sofa"`, `askingPrice=3000`).

**Steps (interleaved)**
| # | Page | Who | Action | Expected |
|---|---|---|---|---|
| 1 | factory | U-S | Create listing via API | Returns `listingId` |
| 2 | `/en/listings/[id]` | U-B | Open detail | Trust panel + Make Offer |
| 3 | OfferModal | U-B | Send offer amount=2400, note="meet at gate" | Success state |
| 4 | `/en/my/offers` | U-S | Navigate to Received tab | After re-fetch (TanStack invalidate or refresh), 1 row shows amount 2400, status PENDING, listing thumb + title + price + date (the WIP polish) |
| 5 | `/en/my/offers` | U-S | Click Accept | PATCH `/offers/:id/accept` 200; row's chip flips to ACCEPTED; toast `acceptedToast` |
| 6 | `/en/my/offers` | U-B | Switch to Sent tab and refresh | Same offer now ACCEPTED; Withdraw button no longer present |

**Assertions**
- BE: `GET /offers/received` (seller) — offer is ACCEPTED.
- BE: `GET /offers/sent` (buyer) — same.
- A WhatsApp notification was enqueued for U-B (BullMQ side effect: assertable via log/queue inspection — log-grep is acceptable in v1).

**Negative paths in same spec**
- Buyer tries to send a second offer on the same listing while the first is PENDING → BE behavior should be verified (currently allowed? rejected?). **Flag this — likely no constraint in the schema.**
- Buyer offer amount = 0 → BE returns 400, UI error.

---

### CJ-03 · Offer decline

Same setup as CJ-02. After buyer sends offer:

| # | Who | Action | Expected |
|---|---|---|---|
| 1 | U-S | Click Decline (no reason) | PATCH `/offers/:id/decline` 200; status DECLINED in seller view |
| 2 | U-B | Refresh Sent tab | Status DECLINED; Withdraw gone |
| 3 | U-B | Re-offer with new amount | New PENDING offer created (separate id); does NOT resurrect declined one |
| 4 | U-S | Decline with reason="too low" | DTO accepts reason; persisted as audit/log (verify via DB or audit log) |

---

### CJ-04 · Counter-offer round-trip

The trickiest flow because counter creates a **new offer row** with `parentOfferId`, not a mutation of the original.

| # | Who | Action | Expected |
|---|---|---|---|
| 1 | U-B | Send offer 1500 on a 3000-listing | PENDING offer A |
| 2 | U-S | Click Counter on A, type 2200, confirm | A → COUNTERED; new offer B (PENDING) created with `parentOfferId=A.id`, same buyer/seller |
| 3 | U-B | Refresh `/my/offers` Sent | Two rows visible: A (COUNTERED, no actions), B (PENDING, but the current Sent-tab UI only offers Withdraw on PENDING/COUNTERED — buyer cannot accept the counter directly from this UI) |
| 4 | U-B | **Gap** documented: buyer accepts counter B — currently impossible from UI. API path: PATCH `/offers/B/accept` should be 403 because buyer ≠ seller. **Flag for product.** |
| 5 | U-B | Withdraw B from Sent tab | B → WITHDRAWN |
| 6 | U-S | Refresh Received | A still COUNTERED, B now WITHDRAWN. No actionable buttons. |

**Assertions / Gaps to log**
- ❌ Counter-acceptance has no UI path. The product must decide whether (a) the Sent tab grows accept/decline for COUNTERED-but-PENDING rows where seller initiated, (b) a new "Counter received from seller" notification appears, or (c) counter inverts buyer/seller roles. **Until decided, the spec asserts the BE side and ends in WITHDRAWN.**
- ❌ Counter on already-COUNTERED offer should be rejected (BE has `status !== 'PENDING'` guard at [soukelkanto.service.ts:404](../../CoreMesh/apps/core-hub/src/modules/soukelkanto/soukelkanto.service.ts:404)).

---

### CJ-05 · Buyer withdraw

| # | Who | Action | Expected |
|---|---|---|---|
| 1 | U-B | Send offer | PENDING |
| 2 | U-B | `/my/offers` Sent → Withdraw | PATCH `/offers/:id/withdraw` 200; row chip = WITHDRAWN |
| 3 | U-S | `/my/offers` Received refresh | Same row shows WITHDRAWN; Accept/Decline/Counter buttons gone |
| 4 | U-S | Tries `PATCH /offers/:id/accept` via API (should fail) | 403 / 409 — already WITHDRAWN |
| 5 | U-B | Tries to withdraw again | 403 / 409 — already WITHDRAWN |

---

### CJ-06 · Listing publish visible to buyer

**Actors:** U-S + U-B in two tabs of two contexts.

| # | Who | Action | Expected |
|---|---|---|---|
| 1 | U-B | Opens `/en/listings` and notes the count of FURNITURE items | N items |
| 2 | U-S | Walks the full create wizard (Photos → Details → Price → Review → Publish) with category=FURNITURE | Listing created, U-S lands on its detail page |
| 3 | U-B | Refreshes `/en/listings?category=FURNITURE` | N+1 items; new card visible; clicking it shows the brand-new detail (price, district, photos) |
| 4 | U-S | `/en/my/listings` | Sees the new listing in own grid |
| 5 | U-B | Adds new listing to favorites (heart on card) | localStorage `kanto.favorites.v1` includes the id; survives reload |

**Note:** No real-time push today. The "visibility" is bounded by a manual refresh or TanStack staleTime. Spec asserts state after explicit `page.reload()` only.

---

### CJ-07 · Two buyers race on accept

**Actors:** U-S + U-B + U-X.
**Why:** Marketplace UX — first-accepted-wins. Validates the BE doesn't let the seller accept multiple offers on the same listing.

| # | Who | Action | Expected |
|---|---|---|---|
| 1 | U-S | Create listing 5000 | OK |
| 2 | U-B | Offer 4500 | PENDING |
| 3 | U-X | Offer 4800 | PENDING |
| 4 | U-S | Received tab shows BOTH offers | Two rows |
| 5 | U-S | Accept U-X's offer | U-X's row → ACCEPTED |
| 6 | U-S | Try to Accept U-B's offer | **Open question:** does BE auto-decline siblings? Or does it allow two ACCEPTED offers on one listing? Currently no guard — flag. |

**Assertions / Gaps**
- ❌ No BE guard for one-accepted-per-listing. Spec asserts current behavior and **logs a product question** at the top of the test file.

---

### CJ-08 · Handover two-tap confirmation (API-only)

**Why API-only:** `/my/handovers` is a UI placeholder ([page.tsx](../web/src/app/[locale]/my/handovers/page.tsx)). Backend `POST /api/v1/handover/:offerId/confirm` is wired.

| # | Who | Action | Expected |
|---|---|---|---|
| 1 | (precondition) | An offer in ACCEPTED state | from CJ-02 setup |
| 2 | U-B | `POST /handover/:offerId/confirm` (with buyer JWT) | 200; response shape `{ buyerConfirmedAt, sellerConfirmedAt: null }` |
| 3 | U-S | `POST /handover/:offerId/confirm` (with seller JWT) | 200; both timestamps set |
| 4 | U-X | `POST /handover/:offerId/confirm` | 403 — not a party |
| 5 | U-B | `POST` again after both confirmed | idempotent or 409 — verify spec, document choice |

---

### CJ-09 · Post-handover ratings (API-only)

| # | Who | Action | Expected |
|---|---|---|---|
| 1 | (precondition) | Both parties confirmed handover | from CJ-08 |
| 2 | U-B | `POST /ratings` `{offerId, score:5, comment:"great"}` | 201 |
| 3 | U-S | `POST /ratings` `{offerId, score:4}` | 201 |
| 4 | Both | `POST /ratings` again on same offer | 409 — only one rating per party per offer |
| 5 | U-X | `POST /ratings` | 403 — not a party |
| 6 | After 1-2s (BullMQ propagation) | `GET /api/v1/trust-meter/me` for U-B and U-S | Tier may bump per [trust-meter docs](../../CoreMesh/docs/trust-meter.md). Score-delta exact values are not asserted (anti-gaming + daily caps); spec only asserts the meter *changed*. |

---

### CJ-10 · Own-listing guard (existing FIXME)

Currently `J05-offer.spec.ts:114` is `test.fixme(...)`. The page-level guard works (seller sees "Review Offers / Edit"), but if the modal is forced open the warning text doesn't render. The spec should:

1. Confirm page-level guard works (seller sees the alternate CTAs).
2. Force-open the modal via direct state manipulation or by visiting as buyer first, then logging in as seller in same tab → confirm `ownListing` warning renders OR un-fixme after [OfferModal.tsx:153-165](../web/src/components/OfferModal/OfferModal.tsx:153) is extended with an own-listing branch.

> Recommend: extend OfferModal with an `isOwnListing` block parallel to `!hasCompleteProfile`. Add the i18n key under `offer.ownListing` (already exists in `I18N` constants — currently used only by the test).

---

## 7. Cross-cutting test matrix

These run as `.use()` overrides on top of existing journeys, not new files.

| Concern | How to cover | Notes |
|---|---|---|
| **AR + EN parity** | Every journey loops `for (const locale of LOCALES)`. Already standard in existing tests. | Keep this pattern in CJ-## journeys too. |
| **RTL direction** | J-12 already asserts `<html dir="rtl">` on `/ar/*`. | Re-assert in CJ-04 + CJ-06 because the offer + wizard UIs are content-heavy. |
| **Theme** | J-19 covers persistence. Visual diffs out of scope. | One screenshot per locale per theme in CJ-02 if we want visual regression. |
| **Mobile viewports** | `playwright.config.ts` already runs all tests on Pixel 5 + iPhone 12. | Don't add separate mobile specs — the matrix already does it. |
| **401 handling** | Each `/my/*` page redirects to login if token missing. Asserted by J-07. | Add: when JWT expires mid-session, API client throws ApiError(401) — spec a single representative case (try after deliberately corrupting the token). |
| **Network down** | J-13 already covers. | Extend to OfferModal: BE 5xx returns `phase='error'` with message. |
| **Slow network** | Use `page.route('**/*', route => setTimeout(() => route.continue(), 800))` for CJ-02 only — confirm "sending" intermediate state visible. |

---

## 8. Known gaps & blockers (surface for product decisions)

| # | Gap | Where surfaced | Suggested resolution |
|---|---|---|---|
| G1 | Counter-offer from seller has no buyer-side accept path | CJ-04 step 4 | Either invert roles when seller counters, OR add accept/decline to Sent tab for child offers whose initiator is seller. |
| G2 | No "one accepted offer per listing" guard | CJ-07 step 6 | Add BE constraint OR cascade-decline siblings on accept. |
| G3 | Handover/ratings UI is placeholder | CJ-08, CJ-09 | Wire `/my/handovers` to call `confirmMut` (already imported but unused in `/my/offers`) and add a ratings modal. |
| G4 | Own-listing FIXME | CJ-10 | Extend OfferModal as described in §6.11. |
| G5 | Listing delete impact on open offers | J-17 step 4 | Define BE policy + test. |
| G6 | Duplicate-offer-per-listing | CJ-02 negative path | Define product policy. |
| G7 | Report listing UI shows "coming soon" toast | (FE) | Wire `POST /listings/:id/report` (BE exists at [listings.controller.ts:115](../../CoreMesh/apps/core-hub/src/modules/soukelkanto/listings/listings.controller.ts:115)). |

These gaps don't block writing the tests — the tests are the proof. Each gap is asserted as **current behavior** and tagged `test.fixme()` once product confirms the desired behavior diverges.

---

## 9. How to run

```bash
# 1. From Codes/ — boot the stack (idempotent)
pwsh ./stack-up.ps1

# 2. From SoukElkanto/web/ — install browsers once
cd SoukElkanto/web
npx playwright install --with-deps chromium firefox

# 3. Run everything
npm run test:e2e                # alias for: npx playwright test

# 4. Single suite
npx playwright test e2e/journeys/CJ02-offer-accept.spec.ts

# 5. Only the concurrent journeys, only on chromium
npx playwright test e2e/journeys/CJ --project=chromium

# 6. Headed (visual debugging)
npx playwright test --headed --workers=1

# 7. HTML report
npx playwright show-report
```

**Tear-down** (only when you want a fully clean slate):

```bash
pwsh ./stack-down.ps1 -Volumes   # nukes Postgres + Redis volumes
```

This drops the seeded test users and listings. The next `stack-up.ps1 → globalSetup` will re-seed.

---

## 10. Appendix A — API endpoint cheat-sheet

All routes are prefixed with `/api/v1` and require `x-tenant-id: kanto`. Auth routes are `@Public()`; everything else needs `Authorization: Bearer <jwt>`.

| Method | Path | Auth | Used by |
|---|---|---|---|
| GET | `/health` | – | globalSetup |
| POST | `/auth/register` | – | OTP send (first time) |
| POST | `/auth/login` | – | OTP resend (existing) |
| POST | `/auth/verify-otp` | – | Exchange OTP → JWT |
| GET | `/auth/me` | JWT | NavBar, profile |
| GET | `/users/me/kyc-status` | JWT | profile chip |
| POST | `/users/me/kyc` | JWT | J-15 |
| PATCH | `/users/me/profile` | JWT | J-14 |
| GET | `/listings` | – | browse |
| GET | `/listings/:id` | – | detail |
| POST | `/listings` | JWT | wizard publish |
| PATCH | `/listings/:id` | JWT (owner) | J-16 |
| DELETE | `/listings/:id` | JWT (owner) | J-17 |
| POST | `/listings/photo-upload-url` | JWT | J-18 |
| POST | `/listings/:id/report` | JWT | (UI gap G7) |
| GET | `/categories` | – | wizard step 2 |
| GET | `/safe-meet-spots?district=…` | – | post-accept hint |
| POST | `/offers` | JWT | OfferModal |
| GET | `/offers/sent` | JWT | /my/offers Sent |
| GET | `/offers/received` | JWT | /my/offers Received |
| PATCH | `/offers/:id/accept` | JWT (seller) | Received row Accept |
| PATCH | `/offers/:id/decline` | JWT (seller) | Received row Decline |
| PATCH | `/offers/:id/counter` | JWT (seller) | Received row Counter |
| PATCH | `/offers/:id/withdraw` | JWT (buyer) | Sent row Withdraw |
| POST | `/handover/:offerId/confirm` | JWT (party) | CJ-08 |
| POST | `/ratings` | JWT (party) | CJ-09 |
| GET | `/tokens/wallet/me` | JWT | (UI gap — wallet placeholder) |

---

## 11. Appendix B — Stable selectors used in specs

Conventions kept in sync with existing E2E suite:

| Surface | Selector |
|---|---|
| Auth phone input | `input#phone` |
| Auth OTP input | `input#code` |
| Listing card | inside `[class*="grid"] [class*="card"]` (existing pattern) |
| Trust panel on detail | `[class*="trustPanel"]` |
| Make Offer CTA | `getByText(I18N[locale].makeOffer, { exact: false })` |
| OfferModal dialog | `page.getByRole('dialog')` |
| OfferModal amount | `input#offer-amount` |
| OfferModal note | `textarea#offer-note` |
| OfferModal send | `button.filter({ hasText: /send offer\|ابعت\|إرسال/i })` |
| /my/offers tab | `[role="tab"]` |
| /my/offers list rows | `[class*="list"] > [class*="row"]` |
| /my/offers status chip | `[class*="statusChip"]` |
| /my/offers listing chip (WIP polish) | `[class*="listingInfo"] [class*="listingMeta"]` |

> Avoid relying on translated labels alone — every text-based selector should fall back to a class-pattern or role attribute. This is already the convention; preserve it in new specs.

---

## 12. Sign-off criteria

The plan is "implemented" when:

1. All J-14..J-20 specs land and pass on chromium + firefox + mobile-chrome + mobile-safari in both locales.
2. All CJ-01..CJ-10 specs land and pass with the same matrix.
3. Every Gap (G1..G7) has a tracking issue and is either fixed or wrapped in `test.fixme()` with a link to that issue.
4. `npm run test:e2e` in CI mode passes with `retries=2, workers=2`.

The release the plan unblocks: tagging Phase D as "test-covered" and starting Phase E (handover UI + ratings UI).
