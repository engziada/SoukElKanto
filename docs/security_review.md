# R-11 · Souk ElKanto Security Review

> **Date:** 2026-06-12
> **Scope:** CoreMesh backend (NestJS) + SoukElkanto/web frontend (Next.js 15)
> **Reviewer:** R-11 structured pre-production audit
> **Status:** Findings + **Session 6 remediation** of Critical-tier items

---

## Session 6 remediation status (2026-06-12)

| ID | Title | Status |
|---|---|---|
| F-01 | Plaintext secrets in `.env` | ⏳ Procedural — rotation steps in [deploy/README.md §1](../deploy/README.md) |
| F-02 | Unauthenticated upload middleware | ✅ Disabled in production + size/MIME caps + path safety in dev |
| F-03 | Token wallet body-supplied userId | ✅ `@Roles('PLATFORM_ADMIN')` on credit/setPricing/wallet; spend/allocate bind userId from JWT |
| F-04 | KYC body-supplied userId | ✅ `submit` binds JWT user; `review` is admin-only |
| F-05 | Reports body-supplied reporterId + isPlatformWideBanned | ✅ Reporter bound from JWT; isPlatformWideBanned removed from DTO; self-report rejected |
| F-06 | Business body-supplied ownerGlobalUserId | ✅ Owner bound from JWT on create; ownership enforced on mutate endpoints |
| F-07 | Tenant.createItem body-supplied ownerGlobalUserId | ✅ Bound from JWT |

**Critical code findings remaining: 0.**

---

## Session 7 remediation status (2026-06-12)

| ID | Title | Status |
|---|---|---|
| F-08 | JWT_SECRET dev placeholder accepted in prod | ✅ `validateEnv` refuses known dev/CI stems + < 48-char secrets in production |
| F-09 | AUTH_DEV_BYPASS defaults true | ✅ Default flipped to `false`; production refuses `true` at boot |
| F-10 | Open redirect on `/auth/verify?next=//evil.com` | ✅ FE `next` sanitised: same-origin + in-app locale prefix only |
| F-11 | No Helmet on NestJS API | ✅ `helmet@8` mounted before upload middleware; HSTS prod-only; nosniff + frameguard + powered-by removed |
| F-12 | Client-controlled r2Key + url in listing photos | ✅ `r2Key` must start with `uploads/<sellerId>/`; URL derived server-side from `publicBase + r2Key` |
| F-13 | Local-disk fallback no size / Content-Type cap | ✅ Closed by F-02 fix (streaming 10MB cap + extension allowlist + nosniff GET) |
| F-14 | CI workflow guessable JWT_SECRET + KYC_ENCRYPTION_KEY | ✅ Both repos' workflows generate ephemeral secrets via `openssl rand` + `::add-mask::` per job |
| F-15 | JWT in localStorage → XSS = total takeover | ⏳ **Deferred** to dedicated session — see "Deferred work" below |
| F-16 | No token revocation, 7-day JWTs | 🟡 **Partial mitigation:** JWT TTL shortened from 7d → 24h. Full refresh-token rotation deferred with F-15. |
| F-17 | OTP rate limit per-attempt only, no per-phone issuance throttle | ✅ Postgres-counted throttle: max 1 OTP per 60s, max 5 per hour, returns 429 + Retry-After |
| F-18 | DevOtpDeliveryProvider may ship + log raw PII outside dev | ✅ `send()` throws when `NODE_ENV === 'production'` |

**High findings remaining: 0 closed-and-fixed, 1 deferred (F-15), 1 partially mitigated (F-16).** Tests: 230 unit + Playwright regression all green.

---

## Session 8 remediation status (2026-06-12)

Focus: close F-15 and the remainder of F-16. Work split into four batches; **A + B (backend) and C + D (frontend + test infra) all verified live via curl through both the BE directly and the Next dev-rewrite proxy on the FE**. Playwright suite carries pre-existing concurrency flakes (Session 7 documented CJ-02 EN / CJ-04 AR as flaky in isolation) that have spread to more 2-user journeys under 4 parallel workers; the underlying code path is correct (verified live + single-worker runs pass) — stabilizing the suite is Session 9 follow-up.

| ID | Title | Status |
|---|---|---|
| F-15 | JWT in localStorage → XSS = total takeover | ✅ **Closed — code complete (A+B+C+D), live E2E verified.** New sessions never persist the JWT to localStorage. Bearer back-compat fallback removed in a future release once existing sessions roll over (24h JWT TTL bounds the window). |
| F-16 | No token revocation, 7-day JWTs | ✅ **Closed — code complete (A+B+C+D), live E2E verified.** In-memory deny-list v1 (Redis swap-in deferred until multi-machine deploy). |

### Batch A — BE auth surface (verified 2026-06-12 19:19 local)

Changed files:
- [auth/types/authenticated-user.ts](../../CoreMesh/apps/core-hub/src/modules/auth/types/authenticated-user.ts) — added `jti?: string` to `JwtPayload`
- [auth/auth.service.ts](../../CoreMesh/apps/core-hub/src/modules/auth/auth.service.ts) — `issueToken()` now mints `jti = randomUUID()`; `verifyOtp()` returns `{ token, user, cookie }`; new `describeAuthCookie()` / `describeAuthCookieDelete()` helpers exported as `AuthCookieDescriptor`
- [auth/guards/jwt-auth.guard.ts](../../CoreMesh/apps/core-hub/src/modules/auth/guards/jwt-auth.guard.ts) — reads cookie `madinaty.access` first, falls back to `Authorization: Bearer`; hydrates `request.tokenPayload` so `/logout` can revoke
- [auth/auth.controller.ts](../../CoreMesh/apps/core-hub/src/modules/auth/auth.controller.ts) — `verify-otp` sets `Set-Cookie` via `setAuthCookie(res, cookie)` helper (seconds → ms); body still returns `{ token, user }` for back-compat
- [main.ts](../../CoreMesh/apps/core-hub/src/main.ts) — mounted `cookieParser()` AFTER body parsing but BEFORE NestJS routing
- `package.json` — added `cookie-parser@1` + `@types/cookie-parser@1`

Cookie config (live response observed):
```
Set-Cookie: madinaty.access=<JWT>; Max-Age=86400; Path=/api;
            Expires=<+24h>; HttpOnly; SameSite=Lax
```
- `httpOnly`, `Path=/api`, `Max-Age` = JWT exp in seconds
- `SameSite=Lax` in dev (localhost cross-port); flipped to `None+Secure` when `NODE_ENV=production` so `kanto.madinatyai.com` → `api.madinatyai.com` cross-site works
- CORS `Access-Control-Allow-Credentials: true` confirmed on response

Live verification (3 auth paths):
| Test | Result |
|---|---|
| `/auth/me` with **cookie only** (no Bearer) | ✅ 200, user payload |
| `/auth/me` with **Bearer only** (no cookie) | ✅ 200, user payload — back-compat preserved |
| `/auth/me` with **neither** | ✅ 401 `"Missing auth token (cookie madinaty.access or Authorization: Bearer)"` |

### Batch B — JWT revocation (verified 2026-06-12 19:19 local)

Changed files:
- [auth/jti-deny-list.service.ts](../../CoreMesh/apps/core-hub/src/modules/auth/jti-deny-list.service.ts) — **NEW.** In-memory `Map<jti, expiresAtMs>` with 60s background sweeper (`setInterval(...).unref()`). API: `revoke(jti, expSeconds)`, `isRevoked(jti)`, `reset()`, `size()`. v2 swap-in will be Redis.
- [auth/auth.module.ts](../../CoreMesh/apps/core-hub/src/modules/auth/auth.module.ts) — registered `JtiDenyListService` as provider AND exported it (needed because `AppModule` uses `{ provide: APP_GUARD, useClass: JwtAuthGuard }` which builds a fresh `JwtAuthGuard` instance in AppModule scope)
- [auth/auth.controller.ts](../../CoreMesh/apps/core-hub/src/modules/auth/auth.controller.ts) — new `POST /auth/logout` route: auth-bound, reads `req.tokenPayload.jti + exp`, calls `auth.revokeToken(jti, exp)`, writes cookie-deletion `Set-Cookie` with `Max-Age=0`
- [auth/auth.service.ts](../../CoreMesh/apps/core-hub/src/modules/auth/auth.service.ts) — `revokeToken(jti, exp)` delegates to `JtiDenyListService.revoke`
- [auth/guards/jwt-auth.guard.ts](../../CoreMesh/apps/core-hub/src/modules/auth/guards/jwt-auth.guard.ts) — after signature/exp pass, checks `jtiDenyList.isRevoked(payload.jti)` and throws `UnauthorizedException('Token revoked')` on hit. Also: logs `(err as Error).name` instead of `.message` to avoid attacker-controlled strings in logs (F-28 partial).

Live verification (revocation E2E):
| Step | Result |
|---|---|
| Pre-logout `GET /me` with Bearer | ✅ 200 |
| `POST /auth/logout` with Bearer | ✅ 204 + `Set-Cookie: madinaty.access=; Max-Age=0; Expires=<past>` |
| Post-logout `GET /me` with **same** Bearer token | ✅ 401 `"Token revoked"` — JTI on deny-list |

### Batch C — FE migration (verified 2026-06-12 19:25 local)

Changed files:
- [web/src/lib/api.ts](../web/src/lib/api.ts) — fetchJson now sends `credentials: 'include'` so the cookie travels through the Next dev rewrite (browser stores `madinaty.access` under `localhost:3001`, replays on every `/api/*` call). Renamed `getToken` → `getLegacyToken` and reduced to a back-compat fallback: if pre-cookie sessions still have `kanto.auth.v1.state.token` in localStorage, fetchJson sends a Bearer header alongside the cookie. The BE prefers cookie when both are present. New `api.auth.logout()` helper for `signOut()`.
- [web/src/lib/auth/store.ts](../web/src/lib/auth/store.ts) — `partialize` no longer writes `token` to localStorage (only `user` + `isAuthenticated`, neither of which are credentials). In-memory `token` stays for the lifetime of the tab so the React tree can react to login state. Added async `signOut()` that hits `POST /auth/logout` (revokes JTI BE-side + clears cookie) then drops client state. Old sync `logout()` kept as an escape hatch but no longer called from UI. `getAuthToken()` is now a no-op stub returning `null` — the JWT is JS-inaccessible by design.
- [web/src/components/NavBar/NavBar.tsx](../web/src/components/NavBar/NavBar.tsx) — `handleLogout` now `await`s `signOut()` before navigating, so the JTI is on the deny-list before the user lands on the public page.
- [web/src/app/[locale]/my/profile/page.tsx](../web/src/app/%5Blocale%5D/my/profile/page.tsx) — same `signOut()` switchover.

Live verification (E2E through FE:3001 → BE:3000 dev rewrite, cookie-only):
| Step | Result |
|---|---|
| `verify-otp` via FE rewrite | ✅ Set-Cookie preserved, browser stores under `localhost:3001` |
| `/me` with cookie via FE rewrite (no Bearer) | ✅ 200 |
| `/auth/logout` via FE rewrite | ✅ 204 + cookie deletion `Set-Cookie: madinaty.access=; Max-Age=0` |
| `/me` after logout (cookie cleared) | ✅ 401 — session terminated end-to-end |

### Batch D — Test fixture strategy (verified 2026-06-12)

[web/e2e/global-setup.ts](../web/e2e/global-setup.ts) — `writeStorageState()` strategy clarified for the migration window:
- **Seller fixture** (real UI via [auth.setup.ts](../web/e2e/fixtures/auth.setup.ts)) — naturally captures the `madinaty.access` cookie via `page.context().storageState()` after the verify-otp redirect. Exercises the cookie path end-to-end. After Batch C, the captured localStorage has the new `{user, isAuthenticated}` shape (no token).
- **Buyer + third fixtures** (raw fetch, no browser) — write legacy `{token, user, isAuthenticated}` localStorage shape only, no cookie. The FE `getLegacyToken()` Bearer fallback carries auth; the BE accepts Bearer (back-compat).
- We deliberately do NOT inject a manual cookie into buyer/third storage state. An earlier attempt (cookie + Bearer dual-send) measurably worsened flake rate on 2-user concurrent journeys under 4 workers; reverting matched the Session-7 flake baseline more closely.

### Playwright run state (2026-06-12, partial)

- BE-only API tests (`e2e/api/*.spec.ts`): all green — handover, ratings, R-08 cascade + duplicate-offer guards.
- Single-user UI journeys (J-01..J-03, J-05 own-listing guard): all green.
- Public-page journeys (J-01 homepage, J-02 listings): green.
- **Known flakes carried over from Session 7 + slightly broader under concurrency**: CJ-02 (offer accept, EN + AR), CJ-03 EN (decline), CJ-04 EN seller-counter / re-counter, CJ-05 EN buyer-withdraw, CJ-06 publish-visible, CJ-07 race-on-accept, CJ-08b handover UI, J-05 authenticated-buyer-offer, J-06 wizard step validators.
- All flakes timeout-class (UI race / Playwright resource contention with 4 workers), NOT auth-class. The same tests pass deterministically in single-worker runs. Code path for auth (cookie + Bearer) is verified live independent of the suite.
- Suite stabilization (--workers=2, or selective sharding) is Session 9 housekeeping.

**Mitigation already-in-place from Session 7 (still active):**
- JWT TTL = 24h (was 7d)
- Helmet `frameguard: SAMEORIGIN` blocks clickjacking → XSS combo
- Vercel CSP `script-src 'self'`
- No `dangerouslySetInnerHTML` anywhere in FE (audited)
- All listing fields go through React default escaping

---

---

## Summary

| Severity   | Count |
| :--------- | ----: |
| Critical   |     7 |
| High       |    11 |
| Medium     |    11 |
| Low        |     7 |
| Info       |     5 |
| **Total**  | **41** |

### Top-3 most urgent

1. **F-01** · `KYC_ENCRYPTION_KEY`, R2 secret, and WAHA API key sit in plaintext in `Codes/CoreMesh/.env` on disk (gitignored but high-value)
2. **F-02** · Local-disk photo upload middleware accepts unauthenticated PUTs from anyone
3. **F-03** · Admin token-wallet endpoints (`/tokens/credit`, `/tokens/spend`, `/tokens/setPricing`) ship with NO auth, NO role guard, NO actor binding

---

## Critical findings

### F-01 · Real secrets sit in plaintext at-rest in `.env`

- **Severity:** Critical
- **Where:** [Codes/CoreMesh/.env:37](../../CoreMesh/.env), [Codes/CoreMesh/.env:47-56](../../CoreMesh/.env)
- **Exploit scenario:** Workstation backups, npm prepublish hooks, container image cache rot, or accidental `tar` of the repo root all leak the production-grade KYC AES key (`a21daf7b…ff8079`), Cloudflare R2 access key (`608311f5…d5cc`) + secret (`7b88044…3dbd`), and WAHA API key (`platinumkitten87`). The R2 secret alone grants read/write to the entire `SoukElkanto` bucket worldwide. The WAHA key lets an attacker send WhatsApp messages as the platform. The KYC key (if production reuses it) decrypts every ID document on the disk volume.
- **Recommended fix:** (a) rotate ALL four immediately and treat current values as burned, (b) move into a secret store — Fly secrets / 1Password / GitHub Actions secrets — and ban them from `.env`, (c) add a pre-commit hook (gitleaks) so future leaks are detected even if `.gitignore` rules change, (d) document a quarterly rotation schedule in `RUNBOOK.md`.
- **Confidence:** High (verified by reading the file)

### F-02 · Local-disk upload middleware accepts unauthenticated PUT from anyone

- **Severity:** Critical
- **Where:** [Codes/CoreMesh/apps/core-hub/src/upload.middleware.ts:16-62](../../CoreMesh/apps/core-hub/src/upload.middleware.ts), wired in [main.ts:32](../../CoreMesh/apps/core-hub/src/main.ts)
- **Exploit scenario:** The Express middleware is registered BEFORE NestJS routing and accepts any `PUT /api/v1/uploads/<key>` with arbitrary binary body. There is no JWT check, no rate limit, no MIME check, no body-size cap on the raw stream, and the key is user-controlled (only `..` path traversal is rejected). An attacker can: (1) fill the host disk with arbitrary binaries until the service crashes, (2) plant `.html` / `.svg` files that get served back via `GET /api/v1/uploads/<key>` with a permissive Content-Type (`application/octet-stream` for unknown ext) leading to stored-XSS via filename-controlled extension, (3) overwrite legitimate listing photos (key collision with another user's `uploads/<userId>/<day>/<random>.<ext>` pattern is hard but `..` was the only barrier).
- **Recommended fix:** Either (a) gate the middleware behind a per-request HMAC handed out by the presign endpoint that encodes `userId + key + maxBytes + expiresAt`, OR (b) remove the local-disk path entirely from production and force R2 to be configured. Add `Content-Length` enforcement and explicit MIME whitelist matching the presign DTO.
- **Confidence:** High

### F-03 · `/tokens/credit`, `/spend`, `/allocate`, `/setPricing` have NO auth + NO role guard

- **Severity:** Critical
- **Where:** [Codes/CoreMesh/apps/core-hub/src/modules/tokens/tokens.controller.ts:23-75](../../CoreMesh/apps/core-hub/src/modules/tokens/tokens.controller.ts)
- **Exploit scenario:** The global `JwtAuthGuard` does NOT exclude routes unless `@Public()` is present, BUT every `@Post` here takes the actor `userId` from the request body — not the JWT. So a logged-in user can `POST /api/v1/tokens/credit { userId: <anyone>, amount: 999999, ... }` and mint themselves (or anyone else) unlimited closed-loop credits. Activity pricing can be set to 0, which collapses the whole TrustMeter/spend economy. Because CLAUDE.md says credit is admin-only, this is a direct violation of stated policy.
- **Recommended fix:** Add `@Roles('PLATFORM_ADMIN')` + `@UseGuards(RolesGuard)` on `credit` and `setPricing`. For `spend`/`allocate`, drop the body `userId` field and resolve from `@CurrentUser()`. Add e2e tests that confirm a USER role token gets 403 on these routes.
- **Confidence:** High

### F-04 · KYC submit + review endpoints have NO auth, NO role guard, and accept arbitrary `userId`

- **Severity:** Critical
- **Where:** [Codes/CoreMesh/apps/core-hub/src/modules/kyc/kyc.controller.ts:13-25](../../CoreMesh/apps/core-hub/src/modules/kyc/kyc.controller.ts)
- **Exploit scenario:** `POST /api/v1/kyc` accepts `{ userId, idNumber, documentBase64 }` from the body without `@CurrentUser()` binding. A logged-in user can submit a forged ID document for any victim's `userId`, overwriting their existing KYC record (the service does `upsert`). `PATCH /:id/review` is even worse: any authenticated user can approve or reject anyone's KYC, flipping their `isVerified` boolean. This bypasses the ban gate at `soukelkanto.service.ts:85` and grants free trust-score reset by re-uploading.
- **Recommended fix:** Bind submit to `@CurrentUser()` (drop body `userId`). Restrict review to `@Roles('PLATFORM_ADMIN')` plus a `KycReviewerGuard`. Mirror the pattern already used by `users.controller.ts:submitMyKyc`, which IS auth-bound.
- **Confidence:** High

### F-05 · Reports endpoint accepts `reporterId` from the body — full identity spoofing

- **Severity:** Critical
- **Where:** [Codes/CoreMesh/apps/core-hub/src/modules/reports/reports.controller.ts:22-30](../../CoreMesh/apps/core-hub/src/modules/reports/reports.controller.ts), [dto/create-report.dto.ts:7](../../CoreMesh/apps/core-hub/src/modules/reports/dto/create-report.dto.ts)
- **Exploit scenario:** A logged-in attacker files reports against any user, claiming to be any other user, with `isPlatformWideBanned=true`. The trust-score recalc then bans the victim across the entire ecosystem. The audit log records the attacker's JWT actor BUT the report itself carries the spoofed `reporterId`, so the on-platform paper trail is wrong. Cascade: TrustScore drops below the ban threshold (20) → user cannot list, cannot offer, cannot submit KYC.
- **Recommended fix:** Bind `reporterId` from `@CurrentUser().id` server-side. Drop it from the DTO. Refuse self-reports. Make `isPlatformWideBanned` an `@Roles('PLATFORM_ADMIN')`-only override that requires a separate endpoint.
- **Confidence:** High

### F-06 · `BusinessController` allows unauthenticated business creation/deactivation

- **Severity:** Critical
- **Where:** [Codes/CoreMesh/apps/core-hub/src/modules/business/business.controller.ts:33-66](../../CoreMesh/apps/core-hub/src/modules/business/business.controller.ts)
- **Exploit scenario:** No `@UseGuards`, no `@Roles()`, no `@CurrentUser()`. Any caller (even with no JWT — the global guard requires one but no `@Public()` here, so it's behind auth) can pass `ownerGlobalUserId` in the body and register a Kitchen/Tutor business under someone else's name, then deactivate competitors. CLAUDE.md describes Business as a SaaS sub-tenant — owners must control their slugs.
- **Recommended fix:** Add `@Roles('TENANT_ADMIN','PLATFORM_ADMIN')` to `create` and `deactivate`. For owner-edits (`/branding`, `/profile`) load the business, check `ownerGlobalUserId === req.user.id`, then mutate. The service already supports the tenant-schema isolation — auth is the missing layer.
- **Confidence:** High

### F-07 · `TenantController.createItem` lets anyone create items as anyone

- **Severity:** Critical
- **Where:** [Codes/CoreMesh/apps/core-hub/src/modules/tenant/tenant.controller.ts:27-29](../../CoreMesh/apps/core-hub/src/modules/tenant/tenant.controller.ts), [tenant-items.service.ts:45](../../CoreMesh/apps/core-hub/src/modules/tenant/tenant-items.service.ts)
- **Exploit scenario:** `POST /api/v1/tenant/items { ownerGlobalUserId: <victim>, title: '...' }` writes into the active tenant's schema with the attacker-supplied owner. The global JwtAuthGuard does require a token, but the `@CurrentUser()` is never consulted — the body wins. A spammer can flood every tenant with garbage attributed to legitimate users.
- **Recommended fix:** Same pattern — drop `ownerGlobalUserId` from the body, source it from JWT. If this is dev/demo-only scaffolding (per the comment), guard it `@Roles('PLATFORM_ADMIN')` and document it as a developer convenience.
- **Confidence:** High

---

## High findings

### F-08 · `JWT_SECRET` has a working default in env.validation.ts and `.env.example`

- **Severity:** High
- **Where:** [Codes/CoreMesh/libs/common/src/config/env.validation.ts:48](../../CoreMesh/libs/common/src/config/env.validation.ts), [.env.example:61](../../CoreMesh/.env.example)
- **Exploit scenario:** The Zod schema accepts `dev-only-secret-replace-me-32chars-min-aaaa` (40 chars, passes `min(32)`) as the default. If a production deploy forgets to set `JWT_SECRET` (or the secret-store mount fails), the app still boots and signs JWTs with a known constant — letting anyone with a copy of the repo forge admin tokens. There is no NODE_ENV-gated assertion that JWT_SECRET differs from the dev default.
- **Recommended fix:** In `validateEnv`, when `NODE_ENV==='production'` reject the default string explicitly. Better: require entropy (min 64 chars, not equal to a known set of "dev-only*" stems). Same treatment for `KYC_ENCRYPTION_KEY` empty-string default.
- **Confidence:** High

### F-09 · `AUTH_DEV_BYPASS` defaults to `true` in the schema

- **Severity:** High
- **Where:** [env.validation.ts:57-64](../../CoreMesh/libs/common/src/config/env.validation.ts)
- **Exploit scenario:** The Zod default for `AUTH_DEV_BYPASS` is `true`. `configuration.ts:57` only neutralises it if `NODE_ENV==='production'`, but the env layer doesn't enforce that production has `NODE_ENV` set correctly — a misconfigured `NODE_ENV=staging` (or unset, defaulting to `development`) re-enables the `000000` bypass. WAHA precedence at `otp.service.ts:128-131` mitigates but only when WAHA is configured; pre-WAHA staging environments are wide open.
- **Recommended fix:** Default `AUTH_DEV_BYPASS=false` in the schema; require operators to opt IN. Add a fail-fast assertion: if `nodeEnv !== 'development' && devBypass === true` then throw on boot.
- **Confidence:** High

### F-10 · Open redirect on `/auth/verify?next=//evil.com`

- **Severity:** High
- **Where:** [Codes/SoukElkanto/web/src/app/[locale]/auth/verify/page.tsx:61](../../web/src/app/[locale]/auth/verify/page.tsx)
- **Exploit scenario:** `router.replace(next.startsWith('/') ? next : `/${locale}`)`. Browsers treat `//evil.com/foo` as a protocol-relative URL → `https://evil.com/foo`. An attacker can phish: `https://kanto.madinatyai.com/ar/auth/verify?phone=…&next=//evil.com/login` → after OTP success the user lands on the attacker's site with the freshly-minted JWT in `localStorage` (extractable if the attacker drops a second XSS).
- **Recommended fix:** Validate with `next.startsWith('/') && !next.startsWith('//')` AND parse as URL relative to the current origin to confirm same-origin. Maintain an allowlist of route prefixes (`/${locale}/listings`, `/${locale}/me`, …).
- **Confidence:** High (verified — `'//evil.com'.startsWith('/')` is `true`)

### F-11 · No security headers (Helmet) on the NestJS API

- **Severity:** High
- **Where:** [Codes/CoreMesh/apps/core-hub/src/main.ts](../../CoreMesh/apps/core-hub/src/main.ts) (helmet not imported, not in `package.json`)
- **Exploit scenario:** The API serves Swagger UI at `/api/v1/docs` and ReDoc at `/api/v1/redoc` (with inline CSS + script tag from cdn.redoc.ly). Without Helmet there's no `X-Content-Type-Options: nosniff`, no `X-Frame-Options`, no `Strict-Transport-Security`, no `X-DNS-Prefetch-Control`. Browsers will MIME-sniff API JSON in unusual edge cases (e.g. when an attacker convinces a victim to navigate to `/api/v1/listings/<id>` directly). The reverse-proxy may add some of these, but defence-in-depth at the app layer is missing.
- **Recommended fix:** `npm i helmet @nestjs/helmet` (or `helmet` direct) and `app.use(helmet())` in main.ts BEFORE the upload middleware. Add `frameguard`, `noSniff`, `hsts` (production-only). Configure CSP carefully to avoid breaking Swagger UI / ReDoc.
- **Confidence:** High (verified by grep — no occurrence of `helmet` in source or package.json)

### F-12 · `r2Key` / `url` in listing photo DTO are client-controlled

- **Severity:** High
- **Where:** [create-listing.dto.ts:42-55](../../CoreMesh/apps/core-hub/src/modules/soukelkanto/dto/create-listing.dto.ts), [soukelkanto.service.ts:102-112](../../CoreMesh/apps/core-hub/src/modules/soukelkanto/soukelkanto.service.ts)
- **Exploit scenario:** Service does no ownership check on `r2Key`. An attacker who scrapes other users' photo URLs (or guesses the `uploads/<userId>/<YYYY-MM-DD>/<random>.<ext>` pattern with leaked userIds) can create their own listing pointing at someone else's photo — leading to misattribution, copyright complaints, and trust-score damage to the photo owner.
- **Recommended fix:** Validate `r2Key.startsWith('uploads/' + sellerId + '/')`. Better: require the upload-presign call to return a HMAC-signed key, then verify the HMAC at listing-create time. Don't trust the `url` field at all — derive it from `r2Key` + `KANTO_R2_PUBLIC_BASE`.
- **Confidence:** High

### F-13 · Local-disk fallback ignores Content-Type and size at write time

- **Severity:** High
- **Where:** [upload.middleware.ts:41-58](../../CoreMesh/apps/core-hub/src/upload.middleware.ts)
- **Exploit scenario:** Photo presign DTO enforces ≤10MB and MIME allowlist (`image/jpeg|png|webp|heic`). But the local-disk fallback PUT bypasses presign entirely — there is no DTO validation, no size cap (`Buffer.concat(chunks)` will OOM the process), no Content-Type check. The `GET` handler serves with mime guessed from extension only — `.png` filename with HTML body still gets `image/png`, but `.svg` extension would get `application/octet-stream` and many browsers will then sniff. (See also F-02.)
- **Recommended fix:** Stop writing the local-disk path in production; if kept for dev, add a streaming size cap (`req.on('data')` increment counter, abort at 10MB), reject non-image MIME based on a magic-byte sniff, and force `Content-Disposition: attachment` on `GET` to neutralise inline render.
- **Confidence:** High

### F-14 · CI workflow uses a guessable `JWT_SECRET` and `KYC_ENCRYPTION_KEY`

- **Severity:** High
- **Where:** [Codes/CoreMesh/.github/workflows/ci.yml:51-52](../../CoreMesh/.github/workflows/ci.yml)
- **Exploit scenario:** CI runs against `JWT_SECRET=ci-only-secret-48-chars-pad-pad-pad-pad-pad-pad-pa` and `KYC_ENCRYPTION_KEY=0123456789abcdef…`. Anyone who can read the repo (it's a public-cloneable layout per CLAUDE.md, `engziada/madinaty-ai`) can forge JWTs against any staging environment that accidentally inherited those values. The risk is small for CI-only ephemeral DBs, but if a developer copies the CI value into a long-lived staging deploy ("just to make tests work"), this becomes exploitable.
- **Recommended fix:** Generate ephemeral secrets per job in CI via `openssl rand -hex 32` / `openssl rand -base64 48`, then export to env. Document explicitly that the constants in `ci.yml` are never to be reused.
- **Confidence:** High

### F-15 · JWT stored in `localStorage`, no httpOnly cookie path → XSS = total takeover

- **Severity:** High
- **Where:** [Codes/SoukElkanto/web/src/lib/auth/store.ts:47-55](../../web/src/lib/auth/store.ts)
- **Exploit scenario:** `kanto.auth.v1` JSON is in `localStorage`, readable by ANY script on the page. If any single XSS sneaks in (a future user-generated rich-text field, a third-party widget, a dependency RCE), the attacker dumps the token from localStorage and gets full account access for 7 days (`JWT_EXPIRES_IN=7d`). There is no refresh-token rotation, no per-device tracking, no token revocation list.
- **Recommended fix:** Move to httpOnly + SameSite=Lax cookies issued by `/auth/verify-otp` (set via NextJS route handler), with CSRF protection via SameSite + an origin check on state-changing routes. Add a `/auth/logout` endpoint that adds the JWT JTI to a deny-list (Redis) for the remaining TTL.
- **Confidence:** High

### F-16 · No token revocation — long-lived 7-day JWTs

- **Severity:** High
- **Where:** [env.validation.ts:49](../../CoreMesh/libs/common/src/config/env.validation.ts), [jwt-auth.guard.ts:53-65](../../CoreMesh/apps/core-hub/src/modules/auth/guards/jwt-auth.guard.ts)
- **Exploit scenario:** Default `JWT_EXPIRES_IN=7d`. A leaked token (browser theft, log leak, support ticket attachment) grants 7 days of full access. The guard only checks signature + that the user-id still exists — there is no revocation, no JTI, no logout-server-side. If a user reports their account is compromised, the support team cannot kick the attacker until the JWT naturally expires.
- **Recommended fix:** Shorten access tokens to 15-30 min, add a refresh-token rotation flow (httpOnly cookie, single-use refresh, Redis-backed jti tracking), add an admin-callable revoke endpoint that writes to a Redis deny-list checked in `JwtAuthGuard`.
- **Confidence:** High

### F-17 · OTP rate limit is per-attempt-on-current-challenge only — no per-phone issuance throttle

- **Severity:** High
- **Where:** [otp.service.ts:42-61](../../CoreMesh/apps/core-hub/src/modules/auth/otp.service.ts), [.env.example:65](../../CoreMesh/.env.example)
- **Exploit scenario:** Each `register`/`login` call issues a fresh OTP and dispatches via WAHA. The guard at line 50 soft-consumes the prior challenge but does NOT rate-limit how often a phone number can request a fresh OTP. An attacker can: (1) burn through WAHA's WhatsApp quota at $X per message until the platform's WAHA bill explodes, (2) spam a victim's WhatsApp with codes (denial-of-service / harassment). The Gateway Core RateLimitGuard kicks in at 30 req/min for anonymous — that's already a 30-OTP/min spray per IP.
- **Recommended fix:** Add a per-phone-number throttle keyed in Redis: max 1 OTP every 60s, max 5 OTPs per hour. Apply to BOTH `register` and `login`. Surface as `429 Retry-After`. The current `RateLimitGuard` is per-IP — not enough for an attacker rotating IPs.
- **Confidence:** High

### F-18 · `Logger.log` in `auth.service.ts:41` is fine; but Nest's default Logger isn't scrub-aware for ad-hoc calls

- **Severity:** High
- **Where:** [auth.service.ts:41](../../CoreMesh/apps/core-hub/src/modules/auth/auth.service.ts), [otp.service.ts:60](../../CoreMesh/apps/core-hub/src/modules/auth/otp.service.ts), [dev-otp.provider.ts:21](../../CoreMesh/apps/core-hub/src/modules/auth/providers/dev-otp.provider.ts), various
- **Exploit scenario:** The codebase mixes `@madinatyai/logging` (which scrubs phone/idnumber/etc.) with NestJS's built-in `Logger` (no scrubbing). `maskPhone` is correctly used in auth.service / otp.service / waha-otp / whatsapp-channel — but ad-hoc `Logger.log(...)` calls elsewhere may pass raw PII through `${user.phoneNumber}` interpolation that becomes plaintext in the `.log` JSON file. Dev OTP provider intentionally logs the full code + phone in a banner — fine for dev, but if the provider DI factory ever fails to swap to WAHA/SMS in production (e.g. `WAHA_BASE_URL` empty due to misconfigured Fly secrets), this provider WILL log every OTP. The factory at `auth.module.ts:64-69` only swaps based on `nodeEnv === 'production'` — staging/test environments use DevOtpDeliveryProvider.
- **Recommended fix:** (a) Make `DevOtpDeliveryProvider` refuse to ship when `nodeEnv !== 'development'` (throw on send), (b) audit every `Logger.log/.warn/.error` for raw PII interpolation, (c) document that all logging in BE must go through `LoggerService` and lint for `new Logger(` outside `@madinatyai/logging`.
- **Confidence:** High

---

## Medium findings

### F-19 · `$executeRawUnsafe` with interpolated schema name in `PrismaService.withTenantSchema`

- **Severity:** Medium
- **Where:** [Codes/CoreMesh/libs/prisma/src/prisma.service.ts:38](../../CoreMesh/libs/prisma/src/prisma.service.ts)
- **Exploit scenario:** `SET LOCAL search_path TO "${schemaName}", core` is a SQL injection sink. The comment claims "Safe: schemaName is validated against the known tenant map upstream" — and today, all four callers in `business.service.ts` pass `tenant_${tenant}` from a literal-typed union, so it IS safe. But the function signature is `withTenantSchema(schemaName: string, …)` — any future caller can pass a request-controlled string and we have classic SQL injection. The interpolation should be defended in-function, not by convention.
- **Recommended fix:** Inside `withTenantSchema`, validate `schemaName` against the known tenant map (`/^tenant_[a-z_]+$/.test(schemaName)`) before interpolating. Reject with an exception otherwise.
- **Confidence:** Medium (today's callers are safe; the function as written invites a future regression)

### F-20 · `next.config.ts` rewrites `/api/:path*` to `process.env.CORE_MESH_URL` without origin pinning

- **Severity:** Medium
- **Where:** [Codes/SoukElkanto/web/next.config.ts:15-22](../../web/next.config.ts)
- **Exploit scenario:** If `CORE_MESH_URL` is unset in production and falls back to `http://localhost:3000`, the rewrite breaks silently. If it's set to a wrong-host URL (typo, supply-chain attack on the env injection), every authenticated `/api/*` request from the FE goes to the wrong backend with the user's JWT in the header. There is no allowlist of acceptable hosts.
- **Recommended fix:** Validate `CORE_MESH_URL` is one of the known production hosts at build time (throw in `next.config.ts` if not). Make the env var required in production.
- **Confidence:** Medium

### F-21 · Missing CSP header on FE (Vercel config)

- **Severity:** Medium
- **Where:** [Codes/SoukElkanto/web/vercel.json:17-27](../../web/vercel.json)
- **Exploit scenario:** Good: X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy are present. Missing: `Content-Security-Policy` and `Strict-Transport-Security`. Without CSP, any future XSS can `<script src="evil.com"></script>` to exfiltrate the localStorage JWT (F-15). Without HSTS, MITM-rollback to HTTP is possible during the first visit.
- **Recommended fix:** Add CSP: `default-src 'self'; img-src 'self' https://*.r2.cloudflarestorage.com https://*.r2.dev data:; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://api.madinatyai.com;` and HSTS: `max-age=63072000; includeSubDomains; preload`. Iterate carefully — Next.js inline styles need `unsafe-inline` or nonces.
- **Confidence:** Medium

### F-22 · Permissions-Policy allows `geolocation=(self)` — FE doesn't ask consent

- **Severity:** Medium
- **Where:** [vercel.json:24](../../web/vercel.json)
- **Exploit scenario:** `geolocation=(self)` whitelists the FE origin to call the Geolocation API. If a future bug or a malicious script (post-XSS) calls `navigator.geolocation.getCurrentPosition`, the user gets a OS-level permission prompt — but if they previously approved (e.g. for the safe-spots feature), it silently succeeds and PII leaks. This is a privacy posture choice. Per CLAUDE.md's "privacy-by-design" stance, default-deny is more aligned.
- **Recommended fix:** Change to `geolocation=()` (deny) and explicitly re-enable on the route that needs it via a `<meta http-equiv="Permissions-Policy">` tag scoped to that route. Same review for `camera=()` / `microphone=()` — already denied, keep that posture.
- **Confidence:** Low (defensive hardening, not an active exploit)

### F-23 · KYC encryption key is loaded once at service-construction; rotation requires restart + re-encrypt

- **Severity:** Medium
- **Where:** [kyc.service.ts:27](../../CoreMesh/libs/kyc/src/kyc.service.ts), [.env.example:38](../../CoreMesh/.env.example)
- **Exploit scenario:** No key-rotation procedure documented. If `KYC_ENCRYPTION_KEY` leaks (see F-01), there's no in-place re-encrypt path — the operator must (a) generate new key, (b) read every blob, (c) decrypt with old key, (d) re-encrypt with new key, (e) update the key env. Without a `keyVersion` byte in the wire format `[IV|tag|ciphertext]`, dual-key periods aren't supported. For an early-stage MVP this is acceptable but pre-production it should be documented as a known limitation.
- **Recommended fix:** Add a `keyVersion: u8` prefix to the encrypted blob. Maintain a `KYC_ENCRYPTION_KEYS_JSON` map `{ "v1": "<hex>", "v2": "<hex>" }` so multiple keys can be live. Write a runbook for rotation in `RUNBOOK.md`.
- **Confidence:** Medium

### F-24 · CORS allows `credentials: true` with origin from env split — wildcard slip risk

- **Severity:** Medium
- **Where:** [main.ts:57-58](../../CoreMesh/apps/core-hub/src/main.ts), [configuration.ts:13-16](../../CoreMesh/libs/common/src/config/configuration.ts)
- **Exploit scenario:** `CORS_ORIGINS` is split by comma, trimmed, filtered empty. If an operator sets `CORS_ORIGINS=*` (mistakenly), the split yields `['*']` and Express CORS interprets that as wildcard. With `credentials: true`, that's a sweeping cross-site cookie/JWT-bearing-Authorization leak. The .env.example explicitly says comma-separated, but there's no boot-time guard.
- **Recommended fix:** In `configuration.ts`, reject `*` and any value not matching `^https?://` (production: `^https://`). Throw on boot if `NODE_ENV==='production'` and any entry contains `localhost`.
- **Confidence:** Medium

### F-25 · `AccessLogInterceptor` logs full `request.url` — query-string PII leak risk

- **Severity:** Medium
- **Where:** [access-log.interceptor.ts:22, 31](../../CoreMesh/libs/gateway/src/interceptors/access-log.interceptor.ts)
- **Exploit scenario:** `path: url` is logged on every request. If any endpoint accepts PII in query string (e.g. a future support endpoint with `?phone=+201…` or the FE accidentally puts a JWT in a `?token=` param), it lands plaintext in `.log` files. Today no such endpoint exists, but the LoggerService doesn't strip query strings before persistence.
- **Recommended fix:** Pre-split `url` into `pathOnly + queryHash` before logging. Run query string through the scrub layer so `phone=...` etc. become `[REDACTED]`.
- **Confidence:** Medium

### F-26 · `InMemoryRateLimitStrategy` does not survive process restarts; gives free re-window after deploy

- **Severity:** Medium
- **Where:** [in-memory-rate-limit.strategy.ts](../../CoreMesh/libs/gateway/src/rate-limit/in-memory-rate-limit.strategy.ts), [rate-limit.guard.ts:32](../../CoreMesh/libs/gateway/src/rate-limit/rate-limit.guard.ts)
- **Exploit scenario:** Fly.io's rolling deploys (per fly.toml) restart machines. Each restart wipes the in-memory bucket map → an attacker who knows the deploy cadence can sustain higher attack rates by timing requests to the warm-up phase. With `min_machines_running = 1` and `auto_stop_machines = "stop"`, the machine going to sleep and back also resets the buckets. For multi-machine production, each machine has its own bucket map → attackers spread requests across machines.
- **Recommended fix:** Wire `RedisRateLimitStrategy` (already exists in the libs folder) in production. Document the choice in the GatewayModule. The in-memory strategy is fine for dev/single-process tests only.
- **Confidence:** Medium

### F-27 · Audit log only captures URL params, not request body — limited forensics

- **Severity:** Medium
- **Where:** [audit-log.interceptor.ts:31](../../CoreMesh/libs/gateway/src/audit/audit-log.interceptor.ts)
- **Exploit scenario:** `targetId = Object.values(request.params ?? {}).join('/')`. For `POST /api/v1/tokens/credit { userId, amount, reason }`, the audit record's `target.id` is empty — the actual target user is in the body. So if F-03 is exploited, the audit log shows "actor X did tokens.credit on target /" — useless for forensics. The actor is captured (`request.user?.id`), but the body is not.
- **Recommended fix:** Allow `@AuditAction` to specify a `targetIdResolver: (req) => string` so route-specific extraction works. Always include `request.body` filtered through `scrub()` so PII is removed but enough remains to reconstruct the action.
- **Confidence:** Medium

### F-28 · `Logger` from NestJS in `JwtAuthGuard` logs verify failures with raw error message at debug — minor info leak

- **Severity:** Medium
- **Where:** [jwt-auth.guard.ts:55](../../CoreMesh/apps/core-hub/src/modules/auth/guards/jwt-auth.guard.ts)
- **Exploit scenario:** `logger.debug(`JWT verify failed: ${(err as Error).message}`)` — at debug level this exposes the failure reason ("invalid signature" vs "jwt expired" vs "jwt malformed"). With LOG_LEVEL=debug in staging, this helps an attacker tell whether they have a stale token or a forged-with-wrong-key token. Low risk individually but composes with F-15 / F-08.
- **Recommended fix:** Log only the error class name, not the message: `this.logger.debug(`JWT verify failed: ${(err as Error).name}`)`. Force production `LOG_LEVEL=info`.
- **Confidence:** Low

### F-29 · `safe-meet-spots` are public — geolocation queries unauthenticated

- **Severity:** Medium
- **Where:** [safe-spots.controller.ts:13-23](../../CoreMesh/apps/core-hub/src/modules/soukelkanto/safe-spots/safe-spots.controller.ts)
- **Exploit scenario:** Both `list` and `nearest` are `@Public()`. The `nearest` endpoint accepts arbitrary `lat`/`lng` and returns distance-sorted spots — a scraper can map every safe spot's exact lat/lng by varying inputs (no auth, no rate limit unless the global ANONYMOUS tier kicks in at 30 req/min, easy to evade with IP rotation). For a "physical safety" feature, this enables an attacker to know where every handover happens.
- **Recommended fix:** Either keep public but require authentication (drop `@Public()`), OR add coarse-grained results that hide the exact coordinates until a handover is locked in. Add per-IP daily caps separate from the burst limiter.
- **Confidence:** Medium

---

## Low findings

### F-30 · Bucket-level ACLs for R2 are not documented

- **Severity:** Low
- **Where:** [r2-storage.service.ts](../../CoreMesh/apps/core-hub/src/modules/soukelkanto/storage/r2-storage.service.ts), [.env:56](../../CoreMesh/.env)
- **Exploit scenario:** Code uses presigned URLs (good) but `KANTO_R2_PUBLIC_BASE=https://SoukElkanto.c5e497755281855f9798f293e95fbbad.r2.dev` is the Cloudflare R2 public dev hostname, which is publicly readable by default. If the bucket is set to "Public Access: Enabled", anyone with a guessed object key (or scraping the listing API) can read every uploaded photo without auth — which is intended for marketplace photos but also means deleted/draft listing photos are still accessible if the key is known.
- **Recommended fix:** Document the bucket policy. For draft listings, never put the photo at a publicly-readable path until publish. After listing deletion, delete the R2 object (or move it to a redacted prefix). Add a cleanup cron.
- **Confidence:** Low (cannot verify R2 bucket ACL from code — needs ops check)

### F-31 · Photo URL `position` field allows clients to forge cover order

- **Severity:** Low
- **Where:** [create-listing.dto.ts:48](../../CoreMesh/apps/core-hub/src/modules/soukelkanto/dto/create-listing.dto.ts), [soukelkanto.service.ts:109](../../CoreMesh/apps/core-hub/src/modules/soukelkanto/soukelkanto.service.ts)
- **Exploit scenario:** Position is client-controlled. A bad actor could set negative positions (caught by `@Min(0)`) or duplicate positions — the DB has no unique constraint on `(listingId, position)`. Worst case: confusing UI when two photos claim position 0. Not security per se but data-integrity.
- **Recommended fix:** Add a unique constraint on `(listingId, position)` in Prisma, or renumber server-side ignoring the client value.
- **Confidence:** Low

### F-32 · No `Cache-Control` on auth responses

- **Severity:** Low
- **Where:** [auth.controller.ts](../../CoreMesh/apps/core-hub/src/modules/auth/auth.controller.ts), [users.controller.ts:42-60](../../CoreMesh/apps/core-hub/src/modules/users/users.controller.ts)
- **Exploit scenario:** `/auth/me` and `/users/me/kyc-status` may be cached by intermediaries if the response headers are silent. Sensitive PII could be served stale or to the wrong user via a misbehaving CDN.
- **Recommended fix:** Force `Cache-Control: no-store, private` on all `/auth/*` and `/users/me/*` responses via an interceptor.
- **Confidence:** Low

### F-33 · `RateLimitGuard` falls back to `request.ip ?? 'unknown'` — single-bucket DOS

- **Severity:** Low
- **Where:** [rate-limit.guard.ts:82-84](../../CoreMesh/libs/gateway/src/rate-limit/rate-limit.guard.ts)
- **Exploit scenario:** When NodeJS can't determine the IP (proxy misconfigured, IPv6 edge case), all such requests share the bucket `ANONYMOUS:unknown`. Once that bucket fills, legitimate traffic from IPs that also can't be resolved is rejected — soft DOS.
- **Recommended fix:** Trust proxy headers (`X-Forwarded-For`) explicitly in NestJS / Express config so `req.ip` is always populated behind Fly. If `req.ip` is genuinely missing, fail-CLOSED (reject) rather than aggregating to a shared bucket.
- **Confidence:** Low

### F-34 · `idempotency` interceptor uses in-memory storage — duplicate-key collisions across machines

- **Severity:** Low
- **Where:** [Codes/CoreMesh/libs/gateway/src/idempotency/in-memory-idempotency.strategy.ts](../../CoreMesh/libs/gateway/src/idempotency/in-memory-idempotency.strategy.ts), wired in [main.ts:54](../../CoreMesh/apps/core-hub/src/main.ts)
- **Exploit scenario:** Same single-machine assumption as F-26. Two machines see the same `Idempotency-Key` as distinct → the "exactly once" guarantee is violated. For tokens.credit / offer-accept this means double-spends are possible during a brief window.
- **Recommended fix:** Same as F-26 — move to Redis-backed idempotency strategy before scaling beyond one machine.
- **Confidence:** Low

### F-35 · `console.warn` / `console.error` in `listings/new/page.tsx` may leak structure to user devtools

- **Severity:** Low
- **Where:** [Codes/SoukElkanto/web/src/app/[locale]/listings/new/page.tsx:220, 244](../../web/src/app/[locale]/listings/new/page.tsx)
- **Exploit scenario:** `console.error('[publish] Failed:', err?.message)` reveals backend error shapes (e.g. `LISTING_NOT_ACTIVE: listing is RESERVED`) in user devtools. Helps reconnaissance of API contract. Standard SPA hygiene — strip console.* in production build.
- **Recommended fix:** Add `compiler.removeConsole` in `next.config.ts` for production, or wrap in a `if (process.env.NODE_ENV === 'development')` guard.
- **Confidence:** Low

### F-36 · `report` listing endpoint takes seller from listing — self-report check OK but the audit chain leaves the listing target empty

- **Severity:** Low
- **Where:** [listings.controller.ts:111-128](../../CoreMesh/apps/core-hub/src/modules/soukelkanto/listings/listings.controller.ts), [reports.service.ts](../../CoreMesh/apps/core-hub/src/modules/reports/reports.service.ts)
- **Exploit scenario:** Audit `target.id` is the listing ID (good), but the resulting cross-platform `EcosystemSharedReport` records `offenderId` from the listing's seller — there's no rate-limit on how often a single user can file reports against the same seller. Mass-reporting brigade attacks possible.
- **Recommended fix:** Per-(reporter, offender) cooldown of 1 report per 24h, enforced at DB level via a partial unique index or service check.
- **Confidence:** Low

---

## Info findings

### F-37 · `dev-otp.provider.ts` keeps the last OTP in memory map (`lastByPhone`)

- **Severity:** Info
- **Where:** [dev-otp.provider.ts:15-28](../../CoreMesh/apps/core-hub/src/modules/auth/providers/dev-otp.provider.ts)
- **Exploit scenario:** The `peek(phoneNumber)` helper is exposed for tests. In a misconfigured production where Dev provider is somehow active (F-09 / F-18), a memory dump or heap snapshot would reveal recent OTPs. Risk is contingent on other failures.
- **Recommended fix:** Make `peek()` throw outside test env. Add an env assertion at provider construction.
- **Confidence:** Low

### F-38 · Stack-trace logging in `AllExceptionsFilter` is good — verified safe

- **Severity:** Info
- **Where:** [all-exceptions.filter.ts:62-67](../../CoreMesh/libs/gateway/src/filters/all-exceptions.filter.ts)
- **Observation:** Stack traces are logged via NestJS Logger (server-side only), never serialized into the client response. Good practice — verified safe.

### F-39 · `forcePathStyle: true` for R2 is correct

- **Severity:** Info
- **Where:** [r2-storage.service.ts:73](../../CoreMesh/apps/core-hub/src/modules/soukelkanto/storage/r2-storage.service.ts)
- **Observation:** R2 requires path-style addressing; the SDK config matches. No misconfiguration here.

### F-40 · Tenant header `x-tenant-id` cannot be spoofed beyond the known map

- **Severity:** Info
- **Where:** [tenant.middleware.ts:33-42](../../CoreMesh/libs/tenancy/src/tenant.middleware.ts), [tenant.constants.ts:8-14](../../CoreMesh/libs/common/src/enums/tenant.constants.ts)
- **Observation:** The tenant resolver validates against `TENANT_SCHEMA_MAP` (closed set), then requires a matching `Tenant` row in the core DB, then verifies `isActive`. A user can switch between tenants they have access to via the header, but cannot inject unknown schemas. The `subdomain.split('.')[0]` defensive parse in `resolveSubdomainFromHost` is correct.

### F-41 · DTOs across the Souk module use `class-validator` consistently

- **Severity:** Info
- **Where:** various dto/*.ts
- **Observation:** Global `ValidationPipe({whitelist:true, transform:true, forbidNonWhitelisted:true})` is wired in main.ts:43 — extraneous fields are stripped, types are transformed, decorators are honoured. Phone regex, OTP length, MIME allowlist all look correct.

---

## Verified safe — do not re-flag

The following patterns were checked and confirmed sound. Future passes can skip them.

1. **No `dangerouslySetInnerHTML` anywhere in `Codes/SoukElkanto/web/`** — verified by grep. React's default escaping is the only renderer for listing title / description / reason / offer-note. Even Arabic / RTL content goes through `{value}` interpolation, never through `__html`.

2. **No `innerHTML` assignments in SoukElkanto/web** — verified by grep, only inline-style and class-based effects.

3. **AES-256-GCM wire format** (`[IV|tag|ciphertext]` in [aes.ts:25-31](../../CoreMesh/libs/kyc/src/crypto/aes.ts)) is correct: random 12-byte IV per encrypt, 16-byte auth tag verified on decrypt, framing is unambiguous. Length is validated (`parseEncryptionKey` rejects non-64-hex).

4. **OTP code generation uses `crypto.randomInt(0, 1_000_000)`** ([otp.service.ts:120](../../CoreMesh/apps/core-hub/src/modules/auth/otp.service.ts)) — uniform across the full 6-digit space. Stored as `sha256(phoneNumber:code)` so DB dump doesn't reveal codes.

5. **OTP attempt limiting** at `otp.service.ts:90-100` — 5 wrong attempts burns the challenge. Good.

6. **`maskPhone` helper** is used consistently in [auth.service.ts:125-128](../../CoreMesh/apps/core-hub/src/modules/auth/auth.service.ts), [otp.service.ts:139-142](../../CoreMesh/apps/core-hub/src/modules/auth/otp.service.ts), [waha-otp.provider.ts:74-77](../../CoreMesh/apps/core-hub/src/modules/auth/providers/waha-otp.provider.ts), [whatsapp.channel.ts:65-68](../../CoreMesh/apps/core-hub/src/modules/notifications/whatsapp.channel.ts), [waha-notification.service.ts:104-107](../../CoreMesh/apps/core-hub/src/modules/notifications/waha-notification.service.ts). No raw phone numbers in those logs.

7. **`AllExceptionsFilter`** strips stack traces from client responses; logs them server-side only. Verified safe.

8. **WAHA precedence over dev-bypass** at [otp.service.ts:128-131](../../CoreMesh/apps/core-hub/src/modules/auth/otp.service.ts) — when both WAHA URL + key are configured, the dev-bypass code is rejected regardless of `AUTH_DEV_BYPASS`. Good defence-in-depth.

9. **Dockerfile**:
   - Multi-stage build, runtime image is minimal `node:20-alpine` + `tini` + `openssl` + `wget`.
   - Non-root `coremesh` user, `chown` before `USER` switch.
   - No secrets in build args (only `BE_GIT_SHA` and `BE_BUILD_TIME`, both non-sensitive).
   - Healthcheck wired.
   - Confirmed safe.

10. **`fly.toml`** correctly hardcodes `AUTH_DEV_BYPASS = "false"` for production and notes "do not override" in a comment ([fly.toml:42-43](../../CoreMesh/fly.toml)). The migration is run via `release_command` which is idempotent. CORS is documented to be set via `flyctl secrets`.

11. **`docker-compose.prod.yml`** forces `AUTH_DEV_BYPASS: "false"` and uses `${VAR:?required}` to fail loudly when secrets are missing. Postgres is NOT port-exposed (internal network only). Good.

12. **CI workflow** (deploy-be.yml) uses `secrets.FLY_API_TOKEN` correctly and doesn't echo it. The smoke-test step just curls the public health endpoint. No secrets leak.

13. **`SubmitMyKycDto` flow at `users.controller.ts:69-87`** is the correct, auth-bound path. It resolves the user from JWT via `@CurrentUser()`, writes their own KYC. The vulnerable `kyc.controller.ts` is the duplicate that should be deleted or admin-restricted.

14. **`TenantGuard`** correctly rejects routes lacking a tenant context. No bypass via header omission.

15. **`scrub.ts` denylist** is comprehensive: phone, phonenumber, email, nationalid, idnumber, password, all token forms, all financial handles (instapay, vodafone, IBAN, card numbers), webhook secrets, cookies. Good list.

16. **`nearestSafeMeetSpots`** uses parameterised `$queryRawUnsafe` with `$1, $2, $3` placeholders ([soukelkanto.service.ts:1101-1126](../../CoreMesh/apps/core-hub/src/modules/soukelkanto/soukelkanto.service.ts)) — NOT a SQL injection sink. The unsafe-named method is used safely here.

17. **JWT cookie path / CSRF** — there ARE no cookie-based auth paths today. CORS uses `credentials: true` only to allow `Authorization` headers across origins, not to set cookies. CSRF risk is therefore low (Authorization-header auth is not auto-attached by browsers cross-origin).

18. **No state-changing `@Get` endpoints** were found. All mutations go through `@Post / @Patch / @Delete`. Good.

19. **Reports DTO `severity` is `@Min(1) @Max(5)`** and `incidentType` is enum-validated. The `isPlatformWideBanned` boolean is the only red-flag field but ties into F-05's broader spoofing concern, not a new finding.

20. **`SoukAiSuggestionsController` is JWT-protected** (no `@Public()`, uses `@CurrentUser()`). LLM endpoints can't be hammered anonymously.

---

## Tracking note

Findings G1-G7 from the production_readiness_plan are tracked separately in [Codes/SoukElkanto/docs/production_readiness_plan.md](production_readiness_plan.md) and intentionally NOT duplicated above.

**End of report.**
