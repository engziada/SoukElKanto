# Task Checklist & Status — SoukElKanto Phase D

## Wave 1 — Auth Foundation
- [x] Zustand auth store (`lib/auth/store.ts`)
- [x] API auth namespace (register, verifyOtp, resend, me, kycStatus)
- [x] `/auth/login` page (phone + +20 prefix, RHF/zod, dev hint)
- [x] `/auth/verify` page (6-digit OTP, resend, change-phone)
- [x] AuthGate component (client-side redirect guard)
- [x] NavBar user chip + dropdown (formatted phone, /my link, logout)
- [x] AR/EN i18n for auth namespace
- [x] Committed → `bd198ab`

## Wave 2 — /my Dashboard Shell
- [x] `/my` layout with AuthGate + 8-tab nav (MyTabs)
- [x] `/my` overview page (greeting, KYC chip, tier chip, quick actions)
- [x] `/my/listings` — live fetch + ListingCard grid + status chips
- [x] `/my/offers` — sent/received tabs + offer rows + status chips
- [x] `/my/profile` — phone, KYC status, member-since, logout
- [x] `/my/handovers` — placeholder
- [x] `/my/favorites` — placeholder
- [x] `/my/wallet` — placeholder
- [x] `/my/trust-meter` — placeholder
- [x] AR/EN i18n for my.* namespace
- [x] Commit Wave 2 → `edb348e`

## Wave 3 — Listings Browse + Detail + Create Wizard
- [x] `/listings` browse page (server component, Suspense, filters, pagination)
- [x] `/listings/[id]` detail page (photo, trust panel, offer CTA, WhatsApp share)
- [x] `/listings/new` wizard (4-step: Photos → Details → Price → Review → Publish)
- [x] Commit Wave 3 → `edb348e`

## Wave 4 — Offer Modal (live Make Offer flow)
- [x] OfferModal component (amount input, note, token-hold checkbox, send)
- [x] Wire "Make Offer" CTA on listing detail → OfferModal (auth-guard redirect if unauthed)
- [x] AR/EN strings for offer modal (sentTitle, sentBody, done, sending, ownListing, askingIs, notePlaceholder)
- [x] Commit Wave 4 → `709bd86`

## Wave 5 — Favorites Persistence (localStorage)
- [x] Favorites store (Zustand + persist, localStorage key `kanto.favorites.v1`)
- [x] Heart toggle on ListingCard wired to store
- [x] Heart toggle on listing detail wired to store
- [x] `/my/favorites` page wired to store → renders saved listings as ListingCard grid
- [x] Commit Wave 5 → `709bd86`

## Wave 6 — TanStack Query + Data Layer
- [x] Install `@tanstack/react-query`
- [x] QueryClientProvider in root layout
- [x] Convert `/my/listings`, `/my/offers`, and `/my` (overview) to use `useQuery`
- [x] Commit Wave 6 → `e5da041`

## Wave 7 — R2 Photo Upload
- [/] API client methods (`photoUploadUrl` and `addPhoto`) in `web/src/lib/api.ts`
- [ ] Wire wizard Step 1 to upload files via presigned URL (during `handlePublish` in `new/page.tsx`)
- [ ] Commit Wave 7

---

## Current Status & Next Steps

### Point We Stopped At
* **Wave 6** is fully completed and committed (`e5da041`).
* **Wave 7** is in progress. We added two new API endpoints inside `web/src/lib/api.ts`:
  1. `api.listings.photoUploadUrl` — requests a presigned R2 PUT upload URL and an R2 key.
  2. `api.listings.addPhoto` — associates the uploaded photo (via its `r2Key`) with an existing listing ID.
* These API additions are currently saved but **uncommitted** in the workspace.

### Next Step
1. **Update Wizard Listing Creation Flow**:
   Modify `web/src/app/[locale]/listings/new/page.tsx` within the `handlePublish` function to:
   * Loop through the selected files.
   * For each file, fetch a presigned PUT URL by calling `api.listings.photoUploadUrl`.
   * Perform an HTTP `PUT` request to upload the raw binary file data directly to the received `uploadUrl`.
   * Create the listing via `api.listings.create`.
   * Attach the uploaded photos to the new listing by calling `api.listings.addPhoto` using the returned listing ID and each file's `r2Key`.
2. **Verification & Typecheck**:
   Run `npm run typecheck` and verify the compilation.
3. **Commit Wave 7**:
   Stage and commit the changes to close out Phase D.
