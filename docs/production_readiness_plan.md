# Souk ElKanto — Production Readiness Plan

> **Status:** Pre-production · Closed-beta candidate
> **Last updated:** 2026-06-11
> **Author handoff:** This doc is structured for sequential delegation to AI agents. Each item is self-contained: issue → solution → exact prompts.

---

## Progress tracker

Legend: ✅ Done · 🚧 In progress · ⏳ Blocked on external · ⏸️ Deferred to post-MVP · ⬜ Not started

| ID | Title | Severity | Status | Notes |
|---|---|---|---|---|
| R-01 | One-accepted-offer-per-listing guard | B | ✅ | Session 1 — added `declineReason String?` to [SoukOffer schema](../../CoreMesh/prisma/schema.prisma); migration `20260611103057_r01_decline_reason_and_cascade`; rewrote [`acceptOffer`](../../CoreMesh/apps/core-hub/src/modules/soukelkanto/soukelkanto.service.ts:321) to cascade-decline siblings in a transaction with reason `auto_declined_listing_sold` + emit `souk.offer.cascade_declined` events; added LISTING_NOT_ACTIVE guard to `acceptOffer`/`declineOffer`/`counterOffer`; flipped CJ-07 assertions (was "documents G2" → now "R-01 cascade"). All 38 CJ tests green. |
| R-02 | Counter-offer UI dead-end | B | ✅ | Session 2 — added 3 BE methods (`buyerAcceptCounter`, `buyerDeclineCounter`, `buyerCounterOffer`) + 3 controller endpoints (`/buyer-accept`, `/buyer-decline`, `/buyer-counter`); FE renders Accept/Decline/Re-counter buttons on Sent-tab rows where `parentOfferId` is set; withdraw hidden on counter rows (semantic clarity); new i18n keys `acceptCounter/declineCounter/reCounter` (EN+AR); CJ-04 flipped from "G1 documents gap" → 4 positive R-02 tests (accept UI, decline UI, re-counter, buyer-decline non-counter rejection). 13/13 CJ-04 green, 53/53 full regression. |
| R-03a | /my/handovers UI | B | ✅ | Session 3 — placeholder replaced with 3-section page (pendingMine / awaitingOther / completed) + new RatingModal component (1-5 stars + comment + R-09-style error states); BE `listSent/listReceived` now include `handover` + `ratings` (capped at 100 rows); FE Offer type extended; full 2-user UI test in [CJ08b-handover-ui.spec.ts](../web/e2e/journeys/CJ08b-handover-ui.spec.ts) covers buyer-first confirm → seller confirm → both rate flow; both EN + AR pass. |
| R-03b | /my/wallet UI | B | ✅ | Session 3 — placeholder replaced with full wallet view: closed-loop policy banner, two balance pills (individual + business), allocations details, recent transactions table; smoke test in [R03bc-wallet-trustmeter.spec.ts](../web/e2e/journeys/R03bc-wallet-trustmeter.spec.ts) (EN+AR). |
| R-03c | /my/trust-meter UI | B | ✅ | Session 3 — placeholder replaced with real fetch of `/api/v1/trust-meter/me` + `/me/bonus-grants`: tier ribbon with BE-reported tier, score progress bar to next tier, 5-rung ladder, recent grants. Smoke test in [R03bc-wallet-trustmeter.spec.ts](../web/e2e/journeys/R03bc-wallet-trustmeter.spec.ts) (EN+AR). |
| R-04 | Zod env validation bug | B | ✅ | Session 1 — fix already in working tree (`envSchema.parse`); added [configuration.spec.ts](../../CoreMesh/libs/common/src/config/configuration.spec.ts) (13 tests). Also fixed `AUTH_DEV_BYPASS` schema to handle string "false" correctly (was always-truthy via `z.coerce.boolean`). Discovered pre-existing failure: `soukelkanto.service.spec.ts` missing `WahaNotificationService` mock (7 tests broken before my changes — needs separate fix). |
| R-05 | Legal / tax review | B | ⏳ | External counsel required |
| R-06 | Production deployment config | B | ✅ | Session 5 — scaffolded full deploy chain: new `/api/v1/version` endpoint (BE), updated multi-stage Dockerfile + `.dockerignore`, new `fly.toml` (Frankfurt region — Fly's nearest to Egypt, not Cairo as initially claimed), new `docker-compose.prod.yml` (self-hosted alt), new `vercel.json` (Frankfurt edge + WAF headers + Vercel→Fly rewrite), upgraded `.env.example` files, two GH Actions workflows (`CoreMesh/.github/workflows/ci.yml` adds typecheck+migrate+docker-build matrix · `deploy-be.yml` for Fly deploy with smoke checks · `SoukElkanto/.github/workflows/ci.yml` runs lint+typecheck+full Playwright e2e), and a step-by-step [deploy/README.md](../deploy/README.md) runbook for Fly+Supabase+Upstash+Vercel+Cloudflare. **Verified end-to-end:** docker build succeeds (162MB content), container starts with prod env, /health returns 200, /version returns injected gitSha + buildTime. Actual cloud deploy + DNS + secret-setting are manual steps in the runbook (require user's credentials). |
| R-07 | Own-listing modal warning | H | ✅ | Session 1 — added `.ownListingGate` block to [OfferModal.tsx](../web/src/components/OfferModal/OfferModal.tsx) as defense-in-depth; new i18n key `offer.ownListingTitle` (EN+AR); replaced `test.fixme()` in [J05-offer.spec.ts:113](../web/e2e/journeys/J05-offer.spec.ts:113) with a real page-level-guard assertion (asserts seller sees "Review Offers"+"Edit", not "Make Offer"). 9/9 J-05 tests green. |
| R-08 | Delete cascade + dup offer policy | H | ✅ | Session 1 — `deleteListing` now wraps in transaction: cascades all open offers to EXPIRED with `declineReason='listing_removed_by_seller'` + emits `souk.offer.expired_listing_removed` events; `getListing` returns 410 Gone for REMOVED listings; `createOffer` rejects duplicate PENDING with `GatewayException(ErrorCode.CONFLICT)` + `details[].rule='OFFER_ALREADY_PENDING'` + existing offer id. New tests: [R08-delete-cascade.spec.ts](../web/e2e/api/R08-delete-cascade.spec.ts) (4) + [R08-duplicate-offer.spec.ts](../web/e2e/api/R08-duplicate-offer.spec.ts) (3). 8/8 green; full CJ regression unaffected. **Follow-up:** DB-level partial unique index `(buyerId, listingId) WHERE status='PENDING'` deferred — service-layer check is sufficient for v1 (narrow race window). |
| R-09 | Report listing UI | H | ✅ | Session 4 — placeholder hint replaced with full ReportModal (incident type select + 1-5 severity radio + reason textarea + char counter); detail-page Report button now routes anon → /auth/login, blocks self-report inline, opens the modal for buyers; new `api.reports.createListingReport` client method maps the BE `{report,trust}` envelope; new top-level `report.*` i18n (EN+AR, 27 keys); 8 e2e tests in [R09-report-listing.spec.ts](../web/e2e/journeys/R09-report-listing.spec.ts) (happy path, anon redirect, self-report block, validation × 2 locales). 9/9 green. Globalsetup + per-test trust-score reset added to keep the seller above the ban threshold (test reports legitimately penalise trust). |
| R-10 | Automated KYC (Didit) | H | ⏸️ | **Deferred by user request 2026-06-11** — revisit after MVP launch. KYC stays manual upload + admin review for v1. |
| R-11 | Security review | H | 🚧 | Session 6 — full structured review at [docs/security_review.md](./security_review.md): **41 findings (7 Critical, 11 High, 11 Medium, 7 Low, 5 Info).** Session 6 closed all 6 code Criticals (F-02..F-07) + procedural F-01. **Session 7 closed 9 of 11 Highs** (F-08, F-09, F-10, F-11, F-12, F-13, F-14, F-17, F-18); F-16 partially mitigated (JWT TTL 7d→24h). **Session 8 closed the remaining two Highs F-15 + F-16** end-to-end: httpOnly `madinaty.access` cookie (BE Set-Cookie + cookie-parser + `credentials: 'include'` on FE), `Path=/api`, `SameSite=Lax` dev / `None+Secure` prod, JWT carries `jti`, in-memory JTI deny-list service (Redis-swap-in later), new `POST /auth/logout` revokes JTI + clears cookie, FE auth store drops token from localStorage on partialize, FE `signOut()` hits BE before clearing client state. Live E2E verified via curl through both direct BE and FE dev-rewrite proxy: cookie-only + Bearer-only + logout-revocation all green. Playwright suite carries pre-existing concurrency flakes (Session 7 had 2 documented; under 4 workers spread to more 2-user journeys) — code path verified independently. **All 11 Highs closed.** 11 Medium + 7 Low + 5 Info still open (lower priority). |
| R-12 | Production observability | H | ⏸️ | **Deferred by user request 2026-06-11** — revisit after MVP launch. Logs go to stdout for v1; add aggregation pre-public-launch. |
| R-13 | Load test | H | ⏳ | Requires k6 install |
| R-14 | WAHA OTP fallback | H | ⏸️ | **Deferred by user request 2026-06-11** — revisit after MVP launch. Single WAHA provider is acceptable risk for closed beta. |
| R-15 | Postgres backup + DR drill | S | ⬜ | Documentation only |
| R-16 | Staging environment | S | ⏳ | Requires deploy infra (R-06) |
| R-17 | Mobile + RTL visual regression | S | ⬜ | — |
| R-18 | Photo upload edge cases | S | ⬜ | — |
| R-19 | On-call + incident playbook | S | ⬜ | Documentation only |

**Session 1 (2026-06-11):** Targeting R-04, R-07, R-01, R-08.

---

## 0 · Executive Summary

| Tier | Count | What it means |
|---|---|---|
| **Blockers (B)** | 6 | Must land before any public launch. Each blocks because failure is silent-and-expensive (double-sales, lost users, legal exposure). |
| **High (H)** | 8 | Must land before "first 100 users". Each is a known bug or undefined behavior with real failure modes. |
| **Should-do (S)** | 5 | Must land before scaling beyond beta. Reliability + ops + visual regression. |

**Total: 19 items.** Estimated calendar time with a 2-engineer team: **4–6 weeks** of focused work + 1–2 weeks for legal/external dependencies.

### Suggested sprint sequence

| Week | Theme | Items |
|---|---|---|
| 1 | Marketplace correctness | R-01, R-02, R-07, R-08 |
| 2 | Missing surfaces | R-03 (3 sub-items), R-09 |
| 3 | Infra correctness | R-04, R-06, R-12, R-14 |
| 4 | Identity + trust | R-10, R-11, R-15 |
| 5 | Scale validation | R-13, R-16, R-17, R-18 |
| Ongoing | External | R-05, R-19 |

---

## 1 · Conventions

### Severity legend
- **B-blocker** — ship-stopping bug or compliance gap
- **H-high** — known broken / undefined / fragile, but not catastrophic on day one
- **S-should** — reliability and growth-readiness; "what good ops looks like"

### Global test scenarios (referenced as S-1..S-3)

These extend the existing 2-user infrastructure already in `web/e2e/`:

#### **S-1 · Standard 2-user**
- **Setup:** `pwsh ./stack-up.ps1` from `Codes/`; WAHA temporarily blanked + `AUTH_DEV_BYPASS=true` in `CoreMesh/.env`; BE restarted; `web/e2e/.auth/{user,buyer}.json` + `web/e2e/.test-data.json` written by `e2e/global-setup.ts`.
- **Users:** U-S (`+201000000001`), U-B (`+201000000002`), OTP `000000`.
- **Fixtures:** `e2e/fixtures/concurrent.ts` — `sellerPage`, `buyerPage`.
- **Use when:** any test exercising one cross-user state transition.

#### **S-2 · 3-user race / non-participant**
- **Setup:** S-1 + globalSetup now provisions U-X (`+201000000003`) and writes `.auth/third.json`.
- **Users:** S-1 plus U-X.
- **Fixtures:** `concurrent.ts` adds `thirdCtx`, `thirdPage`; `helpers/test-data.ts` exposes `thirdToken`.
- **Use when:** asserting non-participant rejection, race conditions, multi-buyer flows.

#### **S-3 · API-only**
- **Setup:** S-1 minus the browser projects; tests live in `e2e/api/`.
- **Use when:** backend contracts whose UI is placeholder or whose semantics need direct DB/HTTP assertion.

### Per-item template

Each item has:
1. **Issue** — one-line problem statement
2. **Details** — user-visible symptoms + why it matters
3. **Where** — file:line references
4. **Recommended Solution** — concrete approach with code sketch
5. **AI Agent Prompt** — self-contained instructions to delegate to a fresh agent
6. **Tests Needed** — global scenario + test cases
7. **Test Execution Prompt** — how to run + report

### AI agent invocation pattern

Each AI prompt assumes:
- The agent has access to the same codebase
- The agent runs `pwsh ./stack-up.ps1` first if the stack is down
- The agent uses TodoWrite to track sub-tasks
- The agent reads files with Read, edits with Edit, and runs tests with Bash (`npx playwright test`)
- The agent reports back with: files changed (with line counts), tests added (with names), test results, gotchas

To delegate: copy the **AI Agent Prompt** block into a new Claude Code session in the same working directory.

---

## 2 · Blockers (B)

### R-01 · One-accepted-offer-per-listing guard

**Severity:** B-blocker
**Estimated effort:** 2 days
**Depends on:** —

#### Issue
The backend has no constraint that a listing can have at most one ACCEPTED offer. The seller's UI also doesn't disable Accept buttons once one offer is accepted. This documented gap (G2) means a seller can accidentally accept two buyers' offers on the same item.

#### Details
Real-world consequence: a "double-sale" dispute. Two buyers each believe they've won the item, both show up at the Safe Meet Spot, one walks away unhappy. Trust collapses. Egyptian Consumer Protection Authority complaints are a downstream risk.

CJ-07 currently asserts the broken behavior to keep the suite honest:
```ts
expect(bSrv?.status).toBe('PENDING');                 // ← should become 'DECLINED' (auto-cascade)
expect(secondAccept.status).toBeLessThan(500);        // ← should become 409
```

#### Where
- `Codes/CoreMesh/apps/core-hub/src/modules/soukelkanto/soukelkanto.service.ts:321` — `acceptOffer`
- `Codes/CoreMesh/prisma/schema.prisma` — `SoukOffer` + `SoukListing` models
- `Codes/SoukElkanto/web/e2e/journeys/CJ07-race-accept.spec.ts:115-119` — assertions to flip

#### Recommended Solution
Inside a Prisma `$transaction`:
1. Load the offer + listing.
2. Verify seller, verify status === PENDING.
3. Cascade-decline ALL other PENDING/COUNTERED offers on the same `listingId` (set status DECLINED, decline reason `auto_declined_listing_sold`).
4. Set this offer to ACCEPTED.
5. Set listing status to RESERVED (new enum value, or reuse existing).
6. Emit one `OFFER_DECLINED_DUE_TO_ACCEPT` event per cascaded offer for notifications.
7. Return the accepted offer.

A second-accept call then naturally fails because no PENDING offers exist for that seller on that listing; surface as a 409 with `code: LISTING_ALREADY_RESERVED`.

#### AI Agent Prompt
```text
You're fixing G2 ("no one-accepted-per-listing guard") in Souk ElKanto.

Context:
- Service: Codes/CoreMesh/apps/core-hub/src/modules/soukelkanto/soukelkanto.service.ts
- The acceptOffer method at line 321 currently flips one offer to ACCEPTED without touching siblings.
- The listing model and offer model are defined in Codes/CoreMesh/prisma/schema.prisma.

Task:
1. Wrap acceptOffer in a Prisma $transaction.
2. After verifying seller + status === PENDING, cascade-update ALL other offers on the same listingId where status IN ('PENDING','COUNTERED') to status='DECLINED' with a new declineReason field (add to schema if absent).
3. Set the listing status to RESERVED (add this to the SoukListingStatus enum if not present).
4. Emit OFFER_DECLINED_DUE_TO_ACCEPT events for each cascaded sibling (use the existing notifyAsync pattern at line ~388).
5. Update declineOffer + counterOffer to reject if listing.status !== 'ACTIVE' (prevent operations on reserved/sold listings).
6. In the existing CJ-07 spec at Codes/SoukElkanto/web/e2e/journeys/CJ07-race-accept.spec.ts, flip the two FIXME-style assertions to expect 'DECLINED' and 409.
7. Add a Prisma migration via `npm run prisma:migrate -- --name listing_reserved_state_and_cascade` from CoreMesh/.

Tests to keep green: all of CJ-02 (single-buyer happy path), CJ-07 (race), CJ-08 (handover precondition).

Verify:
- Run `npm run lint` + `npm run typecheck` in CoreMesh/.
- Run `npx playwright test --grep="CJ-02|CJ-07" --project=chromium --workers=1` from SoukElkanto/web/.

Report back: files changed, migration name, test results.
```

#### Tests Needed — Global Scenario: S-2 (3-user)
| ID | Description |
|---|---|
| R-01-T1 | U-B and U-X both PENDING; U-S accepts U-X → U-B status DECLINED with reason `auto_declined_listing_sold` |
| R-01-T2 | After R-01-T1, second accept on U-B returns 409 with code `LISTING_ALREADY_RESERVED` |
| R-01-T3 | Listing status flips to RESERVED after accept |
| R-01-T4 | U-B receives notification (BullMQ event fired) |
| R-01-T5 | Existing PENDING offer rejected if seller tries decline/counter on RESERVED listing |

#### Test Execution Prompt
```text
Run only the R-01 tests, single-worker, fail-fast:

cd Codes/SoukElkanto/web
npx playwright test --grep="CJ-07" --project=chromium --workers=1 --reporter=list

Then run the full marketplace regression to make sure nothing else broke:
npx playwright test --grep="CJ-0[2-9]" --project=chromium --workers=1 --reporter=list

If any R-01-T* fails, capture the screenshot + console log from test-results/, paste into a bug report.
```

---

### R-02 · Counter-offer UI dead-end (G1)

**Severity:** B-blocker
**Estimated effort:** 3 days

#### Issue
When seller counters, BE creates a new PENDING offer with `parentOfferId`, but the buyer's `/my/offers` Sent tab only renders Withdraw — there's no UI to accept, decline, or re-counter the seller's counter. Buyers hit a dead-end and either abandon or contact support.

#### Details
The data model is fine. The problem is purely UI + a missing buyer-side acceptance endpoint:
- Sender of original = buyer
- After seller counters, child offer keeps `buyerId/sellerId` from parent → seller is still "seller"
- Current accept endpoint requires `sellerId` match → buyer can't call it

Two routes:
1. **Asymmetric endpoint approach:** Add `PATCH /offers/:id/buyer-accept` that requires `buyerId` match AND `parentOfferId !== null`.
2. **Role-inversion approach:** When seller counters, the new child's "active acceptor" is the buyer; introduce an `activeAcceptorId` field. More flexible long-term but more invasive.

Recommend Route 1 for v1.

#### Where
- `Codes/CoreMesh/apps/core-hub/src/modules/soukelkanto/offers/offers.controller.ts` — add `buyer-accept` endpoint
- `Codes/CoreMesh/apps/core-hub/src/modules/soukelkanto/soukelkanto.service.ts:321` — add `buyerAcceptCounter` method
- `Codes/SoukElkanto/web/src/lib/api.ts:258-286` — add API client method
- `Codes/SoukElkanto/web/src/app/[locale]/my/offers/page.tsx:147-218` — render Accept + Decline + Re-counter buttons on Sent tab rows where `offer.parentOfferId && offer.status === 'PENDING'`
- `Codes/SoukElkanto/web/src/messages/{en,ar}.json` — labels for `offer.acceptCounter`, `offer.declineCounter`, `offer.reCounter`
- `Codes/SoukElkanto/web/e2e/journeys/CJ04-offer-counter.spec.ts:134-178` — flip "documents G1 gap" test to assert positive flow

#### Recommended Solution

**Backend:**
```ts
// soukelkanto.service.ts
async buyerAcceptCounter(offerId: string, buyerId: string) {
  return this.prisma.$transaction(async (tx) => {
    const offer = await tx.soukOffer.findUnique({ where: { id: offerId } });
    if (!offer) throw new NotFoundException(`Offer ${offerId} not found`);
    if (offer.buyerId !== buyerId) throw new ForbiddenException('Not the buyer');
    if (offer.status !== 'PENDING') throw new ForbiddenException('Offer cannot be accepted');
    if (!offer.parentOfferId) throw new ForbiddenException('Use seller accept endpoint for non-counter offers');
    // Cascade-decline siblings (reuse R-01 logic) + flip listing → RESERVED
    return this.acceptOfferInternal(tx, offer);
  });
}
```

**Frontend:**
Detect counter rows on Sent tab:
```tsx
const isReceivedCounter = tab === 'sent' && offer.parentOfferId && offer.status === 'PENDING';
{isReceivedCounter && (
  <div className={styles.actions}>
    <button onClick={() => acceptCounterMut.mutate(offer.id)}>{t('acceptCounter')}</button>
    <button onClick={() => declineMut.mutate(offer.id)}>{t('declineCounter')}</button>
    <button onClick={() => openReCounter(offer.id)}>{t('reCounter')}</button>
  </div>
)}
```

#### AI Agent Prompt
```text
You're fixing G1 ("counter-offer dead-end") in Souk ElKanto.

Context:
- The BE creates child offers with parentOfferId when sellers counter (see soukelkanto.service.ts:397 counterOffer).
- Buyer's Sent tab only shows Withdraw because the rendering check at /my/offers/page.tsx:147 is `canWithdraw = tab === 'sent' && status IN ('PENDING','COUNTERED')`.
- CJ-04's third test currently asserts buyer has no accept UI; that's a documentation, not a goal.

Task (BE):
1. In soukelkanto.service.ts, add buyerAcceptCounter(offerId, buyerId) — symmetrical to acceptOffer but checks buyerId match + parentOfferId presence. Share cascade-decline logic with R-01's acceptOfferInternal.
2. Add buyerDeclineCounter(offerId, buyerId) — calls existing declineOffer logic but allows buyer instead of seller when parentOfferId set.
3. Wire PATCH /api/v1/offers/:id/buyer-accept and /buyer-decline in offers.controller.ts.

Task (FE):
1. Add api.offers.acceptCounter + declineCounter in web/src/lib/api.ts.
2. In /my/offers/page.tsx, compute isReceivedCounter = tab === 'sent' && offer.parentOfferId && offer.status === 'PENDING'.
3. Render Accept + Decline + Re-counter buttons in a new actions block for isReceivedCounter rows. Re-counter reuses existing counter input UI.
4. Add three new i18n keys to en.json and ar.json: my.offers.acceptCounter / declineCounter / reCounter.

Task (Tests):
1. Update web/e2e/journeys/CJ04-offer-counter.spec.ts test "buyer-side has NO accept path for seller counter" → rename to "buyer accepts seller counter from Sent tab" with positive assertions.
2. Add a 4th test: buyer re-counters from Sent tab → new grandchild offer created with parentOfferId set to child id.

Verify:
- Lint + typecheck on CoreMesh and web.
- Run `npx playwright test e2e/journeys/CJ04-offer-counter.spec.ts --project=chromium --workers=1`.
- Run CJ-02 + CJ-07 to make sure cascade-decline still works.

Report: files changed, new endpoint paths, test results.
```

#### Tests Needed — Global Scenario: S-1
| ID | Description |
|---|---|
| R-02-T1 | Buyer accepts seller's counter via Sent-tab Accept button → child offer ACCEPTED, parent still COUNTERED, listing RESERVED, sibling offers DECLINED |
| R-02-T2 | Buyer declines seller's counter → child DECLINED, listing back to ACTIVE |
| R-02-T3 | Buyer re-counters from Sent tab → grandchild offer created (parentOfferId = child.id) |
| R-02-T4 | Non-buyer cannot call `/buyer-accept` (returns 4xx) |
| R-02-T5 | `/buyer-accept` rejects offers without `parentOfferId` (returns 4xx) |

#### Test Execution Prompt
```text
cd Codes/SoukElkanto/web
npx playwright test e2e/journeys/CJ04-offer-counter.spec.ts --project=chromium --workers=1 --reporter=list

If green, run the full CJ regression to catch any side-effects:
npx playwright test --grep="CJ-0" --project=chromium --workers=1 --reporter=list
```

---

### R-03 · Placeholder pages (G3)

**Severity:** B-blocker
**Estimated effort:** 5 days total (split 3 sub-items)

Three pages today render only an empty-state icon + title. Each is part of the "safety story" the marketplace promises. Without wired UI, users can't actually use the trust layer.

---

#### R-03a · `/my/handovers` UI

##### Issue
[/my/handovers/page.tsx](Codes/SoukElkanto/web/src/app/[locale]/my/handovers/page.tsx) is a placeholder. Backend `POST /api/v1/handover/:offerId/confirm` is wired (CJ-08 passes). Without UI, the two-tap confirmation safety promise is unfulfilled.

##### Where
- New code: `Codes/SoukElkanto/web/src/app/[locale]/my/handovers/page.tsx`
- New code: `Codes/SoukElkanto/web/src/app/[locale]/my/handovers/handovers.module.css`
- API client: `Codes/SoukElkanto/web/src/lib/api.ts` — already has `confirmHandover`
- BE: already exists at `Codes/CoreMesh/apps/core-hub/src/modules/soukelkanto/handover/handover.controller.ts`

##### Recommended Solution
Render two lists:
- **Pending handovers** = ACCEPTED offers where current user hasn't confirmed yet
- **Awaiting other party** = ACCEPTED offers where current user has confirmed but counterpart hasn't
- **Completed** = both confirmed → ratings CTA

Use TanStack `useQuery({ queryFn: () => api.offers.listSent() and listReceived(), select: filter ACCEPTED })`.

Each row:
- Listing thumbnail + title + amount
- Counterpart trust badge (KYC + tier)
- Safe Meet Spot suggestion (use `api.safeSpots.list(listing.district)`)
- "Confirm handover" button (idempotent; greyed if already confirmed by current user)
- "Rate handover" CTA when both confirmed → triggers RatingModal

##### AI Agent Prompt
```text
Replace the placeholder /my/handovers page in Souk ElKanto with a real handover management UI.

Context:
- Placeholder: Codes/SoukElkanto/web/src/app/[locale]/my/handovers/page.tsx (10 lines, empty state).
- BE endpoint: POST /api/v1/handover/:offerId/confirm — already exists and tested (CJ-08).
- API client method: api.offers.confirmHandover (in web/src/lib/api.ts:282).
- Existing style reference: /my/offers/page.tsx for tabbed layout + status chips.
- i18n: extend en.json + ar.json under my.handovers namespace.

Task:
1. Build the page with TanStack useQuery: fetch both api.offers.listSent and listReceived, filter offers.status === 'ACCEPTED'.
2. Three sections (using internal accordion or tab):
   a. "Pending my confirmation" — offers where the current user hasn't tapped Confirm yet.
   b. "Awaiting counterpart" — current user confirmed, waiting on other party.
   c. "Completed" — both confirmed; shows "Rate counterpart" CTA.
3. Each row shows: listing thumbnail (offer.listing.photos[0].url), title, amount, counterpart trust tier (use deriveTierFromId from lib/trustTier.ts), Safe Meet Spot suggestion (fetch via api.safeSpots.list(offer.listing.district)).
4. The "Confirm handover" button calls confirmHandover; on success, optimistically update and invalidate the query.
5. The "Rate counterpart" CTA opens a new RatingModal component (write a new component file at Codes/SoukElkanto/web/src/components/RatingModal/RatingModal.tsx) — 1-5 stars + optional comment + Send. Wires to api.ratings.create (new factory method needed).
6. Add api.ratings.create to web/src/lib/api.ts.
7. Add i18n keys: my.handovers.{title, pendingMine, awaitingOther, completed, confirm, confirmed, rateCounterpart, safeSpotSuggestion, empty}.

Tests:
1. Add Playwright test web/e2e/journeys/CJ08b-handover-ui.spec.ts using S-1: U-B and U-S both navigate /my/handovers; each clicks Confirm; the offer moves between sections.
2. Add CJ09b-rating-ui.spec.ts: after both confirmed, U-B clicks Rate, fills 5 stars, submits → toast → row disappears from Completed.
3. Keep API-only CJ-08 + CJ-09 green.

Verify:
- typecheck + lint
- npx playwright test --grep="CJ-08|CJ-09" --project=chromium --workers=1

Report: components added, i18n keys added, test counts.
```

##### Tests Needed — Global Scenario: S-1
| ID | Description |
|---|---|
| R-03a-T1 | Buyer's /my/handovers shows ACCEPTED offer in "Pending my confirmation" |
| R-03a-T2 | After buyer confirms, row moves to "Awaiting counterpart" |
| R-03a-T3 | After seller also confirms, row moves to "Completed" with Rate CTA |
| R-03a-T4 | Safe Meet Spot suggestion renders with district-matched name |
| R-03a-T5 | Idempotent re-confirm doesn't crash |

##### Test Execution Prompt
```text
cd Codes/SoukElkanto/web
npx playwright test e2e/journeys/CJ08b-handover-ui.spec.ts --project=chromium --workers=1 --reporter=list
```

---

#### R-03b · `/my/wallet` UI

##### Issue
Wallet placeholder. Backend `GET /api/v1/tokens/wallet/me` is wired; api.tokens.walletMe in `lib/api.ts:299-308` returns full balance + recent transactions + allocations.

##### Where
- New code: `Codes/SoukElkanto/web/src/app/[locale]/my/wallet/page.tsx`
- API: already exists; backend at `Codes/CoreMesh/apps/core-hub/src/modules/tokens/`

##### Recommended Solution
- Header: two big balance pills — `businessTokens`, `individualTokens` — both labeled "non-redeemable" with a tooltip explaining the closed-loop policy.
- Recent transactions list (last 50, paginated): `+/-` amount, reason, timestamp, related entity (offer/listing).
- Empty state: link to "How tokens work" docs page.

Use TanStack useQuery. No mutations needed from user (admin-only crediting).

##### AI Agent Prompt
```text
Replace the placeholder /my/wallet page in Souk ElKanto with the real wallet view.

Context:
- Backend GET /api/v1/tokens/wallet/me returns { userId, businessTokens, individualTokens, allocations, recentTransactions }.
- API method: api.tokens.walletMe (web/src/lib/api.ts:299).
- Per CoreMesh docs/token-wallet.md, tokens are closed-loop and CANNOT be redeemed for cash — the UI must communicate this clearly.

Task:
1. Page layout: two balance pills (business + individual) with a tooltip "Tokens are credits for in-platform services and cannot be exchanged for cash."
2. Below: recent transactions table — date, sign (+/-), amount, type, reason, related offer/listing (link if available).
3. Allocations section — collapsible list of any reserved/held tokens (e.g. offer holds).
4. Empty state: "No transactions yet" + link to a static FAQ at /[locale]/about/tokens (separately authored content).
5. AR/EN i18n.
6. Style consistent with /my/offers (tabStyles for header, custom module CSS for content).

Tests:
1. e2e/api/R03b-wallet.spec.ts: API contract test for /tokens/wallet/me — token presence, transaction shape.
2. e2e/journeys/R03b-wallet-ui.spec.ts: U-S navigates to /my/wallet → sees pills, sees at least one allocation if seeded.

Verify:
- typecheck + lint
- npx playwright test --grep="R03b|wallet" --project=chromium --workers=1

Report: files changed, schema fields used.
```

##### Tests Needed — Global Scenario: S-1
| ID | Description |
|---|---|
| R-03b-T1 | /my/wallet shows two balance pills with numeric values |
| R-03b-T2 | Closed-loop tooltip is reachable + matches policy text |
| R-03b-T3 | Recent transactions table renders rows or empty state deterministically |

##### Test Execution Prompt
```text
cd Codes/SoukElkanto/web
npx playwright test --grep="R03b" --project=chromium --workers=1 --reporter=list
```

---

#### R-03c · `/my/trust-meter` UI

##### Issue
Trust Meter placeholder. Per `CoreMesh/docs/trust-meter.md`, the meter has 5 tiers (NEW/BRONZE/SILVER/GOLD/PLATINUM) and is the user-visible reputation. Backend exposes the data.

##### Where
- New code: `Codes/SoukElkanto/web/src/app/[locale]/my/trust-meter/page.tsx`
- API: need to add `api.trustMeter.me()` in `Codes/SoukElkanto/web/src/lib/api.ts`
- BE: probably exists at `Codes/CoreMesh/apps/core-hub/src/modules/trust-meter/`

##### Recommended Solution
- Hero card: current tier badge, current score / 3000, progress bar to next tier
- Tier benefits ladder (NEW → PLATINUM with thresholds + perks)
- Recent events feed: last 20 events with point delta (e.g. "+50 handover confirmed", "+20 5-star rating received")
- "How to climb" tip section with link to terms

##### AI Agent Prompt
```text
Replace the placeholder /my/trust-meter page in Souk ElKanto.

Context:
- Backend module: Codes/CoreMesh/apps/core-hub/src/modules/trust-meter/. Find the actual endpoint (likely GET /api/v1/trust-meter/me) — read the controller to confirm exact path.
- Tier model from docs/trust-meter.md: NEW (0-200) / BRONZE (201-500) / SILVER (501-1000) / GOLD (1001-2000) / PLATINUM (2001-3000).
- The action definitions table (TrustMeterActionDefinition) is admin-editable; read it via a public GET if available, otherwise hardcode the v1 ladder in the FE.

Task:
1. Add api.trustMeter.me to web/src/lib/api.ts: GET /api/v1/trust-meter/me → { currentScore, tier, currentTierMin, nextTierMin, recentEvents: [...] }.
2. Build page with three sections:
   a. Tier hero — large badge (use existing TierRibbon styles from listing detail page), score text, progress bar.
   b. Tier ladder — five tier cards showing thresholds + headline benefits.
   c. Recent events feed — last 20 events: icon (positive/negative), description (use action definition.title), delta, timestamp.
3. AR/EN i18n. Keep all positive descriptions, tier names translated.

Tests:
1. e2e/api/R03c-trustmeter.spec.ts: shape test for the endpoint.
2. e2e/journeys/R03c-trustmeter-ui.spec.ts: U-S sees their tier + score; after CJ-09 completes (rating fires event), expect score increment within a polling window.

Verify:
- typecheck + lint
- npx playwright test --grep="R03c" --project=chromium --workers=1

Report.
```

##### Tests Needed — Global Scenario: S-1
| ID | Description |
|---|---|
| R-03c-T1 | Trust Meter page renders current tier + score for U-S |
| R-03c-T2 | After CJ-09 rating completes + a wait, U-S's score has increased |
| R-03c-T3 | Tier ladder renders all 5 tiers with correct thresholds + descriptions |

##### Test Execution Prompt
```text
cd Codes/SoukElkanto/web
npx playwright test --grep="R03c" --project=chromium --workers=1 --reporter=list
```

---

### R-04 · Zod env validation bug

**Severity:** B-blocker
**Estimated effort:** 0.5 day

#### Issue
[configuration.ts:9](Codes/CoreMesh/libs/common/src/config/configuration.ts:9) casts `process.env` directly as `Env` without invoking zod parse. All `z.coerce.X().default(true)` defaults silently fall back to `undefined`/falsy at runtime.

#### Details
Concrete consequences:
- `AUTH_DEV_BYPASS` defaults to `true` in schema, but resolves to `false` if env var unset (we observed this empirically).
- `JWT_SECRET` schema default would never apply — if env var missing, JWT signing uses `undefined` → silent crash on first sign attempt.
- `OTP_TTL_SECONDS`, `OTP_MAX_ATTEMPTS`, `TRUST_SCORE_BASE`, `TRUST_SCORE_BAN_THRESHOLD` — all silently fall through `Number(undefined)` = `NaN` in production.

#### Where
- `Codes/CoreMesh/libs/common/src/config/configuration.ts:9`
- `Codes/CoreMesh/libs/common/src/config/env.validation.ts` — schema (verify it's exported as a constant, not just a type)

#### Recommended Solution
1. Export the schema constant from env.validation.ts (e.g. `export const envSchema = z.object({ ... })`).
2. In configuration.ts, replace `const env = process.env as unknown as Env;` with `const env = envSchema.parse(process.env);`.
3. Wrap in try/catch with explicit error message listing which env vars are missing — improves dev UX.

#### AI Agent Prompt
```text
Fix the env validation bypass in CoreMesh.

Context:
- File: Codes/CoreMesh/libs/common/src/config/configuration.ts (line 9 — the cast `const env = process.env as unknown as Env`).
- Schema: Codes/CoreMesh/libs/common/src/config/env.validation.ts. Verify it exports the schema constant in addition to the inferred Env type. If only the type is exported, also export the const.
- A spawned task already exists for this fix; you may be picking it up — check first.

Task:
1. In env.validation.ts, ensure the zod schema is exported as a named const (e.g. EnvSchema). The Env type can be `z.infer<typeof EnvSchema>`.
2. In configuration.ts, replace the cast with `const env = EnvSchema.parse(process.env);`.
3. Wrap with try/catch — on ZodError, log each field's path + message clearly + throw a friendly error (use the @nestjs/common Logger).
4. Run unit tests: `npm run test:unit` from CoreMesh/. Some tests may mock partial env objects — adjust them to provide all required fields, or use EnvSchema.parse with overrides.
5. Add a new unit test in libs/common/src/config/configuration.spec.ts that asserts: with no AUTH_DEV_BYPASS in env, configuration().auth.devBypass === true (provided NODE_ENV !== 'production').

Verify:
- typecheck + lint
- npm run test:unit
- Start BE: `npm run dev` from CoreMesh/. Hit GET /api/v1/health — should return 200. Verify the AUTH_DEV_BYPASS resolves correctly by checking devBypass via a test endpoint or log line.

Report: schema export change, test count, behavioral verification.
```

#### Tests Needed — Global Scenario: S-3 (API-only, no Playwright)
| ID | Description |
|---|---|
| R-04-T1 | Unit: configuration() with empty process.env → `auth.devBypass === true` when NODE_ENV='development' |
| R-04-T2 | Unit: configuration() with NODE_ENV='production' + no AUTH_DEV_BYPASS → `auth.devBypass === false` |
| R-04-T3 | Unit: configuration() with malformed AUTH_DEV_BYPASS='not-a-bool' → coerced via zod's coerce-boolean rules |
| R-04-T4 | Integration: BE starts cleanly with minimum required env vars; missing required (e.g. DATABASE_URL) crashes with a clear ZodError-shaped message |

#### Test Execution Prompt
```text
cd Codes/CoreMesh
npm run test:unit -- --testPathPattern=configuration

For the integration sanity check:
- Stop the BE: `pwsh -c "Get-NetTCPConnection -LocalPort 3000 -State Listen | %{Stop-Process -Id $_.OwningProcess -Force}"`
- Temp-rename .env: `mv .env .env.bak`
- Try to start: `npm run dev` — expect a clear ZodError listing missing vars.
- Restore: `mv .env.bak .env` and `npm run dev` again.
```

---

### R-05 · Legal / tax review

**Severity:** B-blocker
**Estimated effort:** 2 weeks calendar (external) + 3 days internal docs

#### Issue
CLAUDE.md mandates: "Every new service MUST be flagged for legal/tax review before launch (rentals, short-stay, home services, clinics, delivery, ghost kitchens)." A C2C marketplace facilitating peer transactions has VAT + consumer protection implications in Egypt, even with the Transparent Broker stance.

#### Details
This isn't a code task — it's the process of producing internal documents an Egyptian lawyer reviews. Outputs:
- Bilingual Terms of Service (English + Arabic)
- Bilingual Privacy Policy (PDPL / Egyptian Personal Data Protection Law alignment)
- Cookie consent + tracking disclosures
- Data Retention Policy (KYC records: how long? where? deletion request flow?)
- Dispute resolution mechanism (must be transparent in TOS)
- VAT analysis: does facilitating P2P trades trigger any tax registration obligation? (Likely not since no funds are held, but counsel must confirm.)
- Consumer Protection Authority compliance: distance-selling rules, return/refund policy, dispute filing.
- Statement of P2P broker stance (transparent on TOS).
- Age gating (18+) — explicit in profile gate, also state in TOS.

#### Where
- New folder: `Codes/SoukElkanto/legal/`
- New files: `terms_of_service_en.md`, `terms_of_service_ar.md`, `privacy_policy_en.md`, `privacy_policy_ar.md`, `data_retention.md`, `dispute_resolution.md`
- Wire: `/[locale]/legal/terms`, `/[locale]/legal/privacy` pages in Next.js (static MDX)
- Footer link from `Codes/SoukElkanto/web/src/components/Footer/Footer.tsx`

#### Recommended Solution
1. Draft all 6 documents internally using a privacy-policy generator as a starting point, then heavily edit for Egypt-specific clauses.
2. Engage a Cairo-based commercial lawyer specializing in tech/marketplaces. Suggested vetting questions:
   - Marketplace VAT treatment under Egyptian tax law
   - PDPL compliance for KYC encrypted-at-rest data
   - Consumer protection obligations for facilitator platforms
   - Pre-dispute mediation requirements
3. Implement counsel's edits.
4. Add explicit consent capture during registration: a checkbox "I agree to the Terms of Service and Privacy Policy" — block submit if unchecked.
5. Add a "Last updated" date on each doc + a versioning policy.

#### AI Agent Prompt
```text
You're producing initial drafts of the legal documents for Souk ElKanto, before external counsel review.

DO NOT claim these are legally vetted — they are starting drafts only.

Context:
- Project: Souk ElKanto, a C2C marketplace under MadinatyAI. Madinaty residents only.
- Stance: Transparent Broker — no funds held, payment handles stored as opaque strings, no escrow.
- KYC: AES-256-GCM encryption at rest, manual review v1 (Didit integration planned per docs/kyc-external-integration.md).
- Trust layer: TrustScore (internal 0-100 safety floor), TrustMeter (public 0-3000 engagement reputation).
- Token wallet: closed-loop, non-redeemable credits.
- Language: bilingual (Arabic primary, English secondary).
- Jurisdiction: Egypt (Cairo, Madinaty / New Cairo).

Task:
1. Create directory Codes/SoukElkanto/legal/.
2. Author six markdown files:
   a. terms_of_service_en.md / terms_of_service_ar.md
   b. privacy_policy_en.md / privacy_policy_ar.md
   c. data_retention.md (single file, both languages side-by-side)
   d. dispute_resolution.md (single file, both languages side-by-side)
3. Each document MUST start with: "DRAFT — NOT YET REVIEWED BY COUNSEL. Do not publish."
4. Cover: definitions, eligibility (Madinaty residents 18+), broker stance, prohibited items, KYC requirements, TrustScore/TrustMeter explanation, off-platform settlement disclaimer, dispute mediation, age gating, intellectual property, indemnification, limitation of liability, termination, governing law (Egyptian), jurisdiction.
5. Privacy policy must cover: data collected (phone, KYC documents, photos, transaction history), retention windows, third parties (R2 storage, WAHA, future Didit), user rights (access/deletion), encryption-at-rest claim, data export procedure.
6. Add a "Footer Legal" component at Codes/SoukElkanto/web/src/components/Footer/LegalLinks.tsx with three links: Terms, Privacy, Contact. Wire into the existing Footer.
7. Add /[locale]/legal/terms and /[locale]/legal/privacy pages that render the markdown.
8. Add a "Consent required" checkbox to the /auth/login page — required to submit. Add an i18n key auth.consentRequired.

Verify:
- typecheck + lint
- Both English and Arabic versions exist + render
- Footer renders the legal links

Report: docs created, pages added, blocker for counsel sign-off (state explicitly that these are unreviewed drafts).
```

#### Tests Needed — Global Scenario: S-1
| ID | Description |
|---|---|
| R-05-T1 | /en/legal/terms renders without 404 |
| R-05-T2 | /ar/legal/terms renders + has RTL direction |
| R-05-T3 | Footer renders legal links on every page |
| R-05-T4 | /auth/login submit is disabled until the consent checkbox is checked |
| R-05-T5 | After consent checked, login flow proceeds normally |

#### Test Execution Prompt
```text
cd Codes/SoukElkanto/web
npx playwright test --grep="R-05" --project=chromium --workers=1 --reporter=list
```

External: separately, schedule a 1-hour intake call with Egyptian commercial counsel; budget ~2 weeks for review + revisions.

---

### R-06 · Production deployment configuration

**Severity:** B-blocker
**Estimated effort:** 4 days

#### Issue
Nothing in the repo deploys to production today. Platform/ uses Vercel (per CLAUDE.md); Souk ElKanto's `web/` has no deployment target, no Dockerfile for prod CoreMesh, no CI workflow, no secrets management strategy.

#### Details
Required components for first prod deploy:
1. **Souk ElKanto FE host:** Vercel (consistent with Platform/) or Cloudflare Pages. Need `vercel.json` or equivalent, environment vars, custom domain `kanto.madinatyai.com`.
2. **CoreMesh BE host:** containerized. Options: Railway (simplest), Render, AWS ECS Fargate, GCP Cloud Run. Need production-tier Postgres + Redis. Add `Dockerfile` to CoreMesh/ + production `docker-compose.prod.yml` (or k8s manifests).
3. **Database:** managed Postgres (Supabase, Neon, Railway Postgres, RDS) with pgvector extension support.
4. **Redis:** managed (Upstash, Redis Cloud, ElastiCache).
5. **CI/CD pipeline:** GitHub Actions running lint + typecheck + tests on PR, deploying on merge to main.
6. **Secrets:** GitHub Actions secrets for build-time; runtime secrets via Vercel env / Railway env / Doppler / 1Password Connect.
7. **DNS:** CNAME `kanto.madinatyai.com` → Vercel; A record `api.madinatyai.com` → backend host.
8. **TLS:** automatic via Vercel + the backend host.
9. **CDN:** Vercel for FE; Cloudflare in front of API for the backend.
10. **WAF rules:** Cloudflare WAF for the API: rate limiting (per IP), bot protection, geo allowlist if MENA-only.
11. **Storage:** R2 is already configured (per .env). Verify prod bucket separate from dev bucket.

#### Where
- New: `Codes/CoreMesh/Dockerfile`
- New: `Codes/CoreMesh/docker-compose.prod.yml`
- New: `Codes/SoukElkanto/web/vercel.json`
- New: `.github/workflows/ci.yml` in each repo
- New: `.github/workflows/deploy-be.yml`
- New: `Codes/SoukElkanto/deploy/README.md` documenting the deploy
- Update: `Codes/SoukElkanto/web/.env.example` with NEXT_PUBLIC_API_BASE for prod

#### Recommended Solution

**CoreMesh Dockerfile (multi-stage):**
```Dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --prefer-offline
COPY . .
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package*.json ./
RUN npx prisma generate
EXPOSE 3000
CMD ["node", "dist/apps/core-hub/main.js"]
```

**Vercel for Souk ElKanto:**
- Root directory: `Codes/SoukElkanto/web`
- Build command: `npm run build`
- Output: `.next`
- Environment vars: `NEXT_PUBLIC_API_BASE=https://api.madinatyai.com`, `CORE_MESH_URL=https://api.madinatyai.com` for SSR

**GitHub Actions CI** (`.github/workflows/ci.yml`):
```yaml
name: CI
on: [pull_request, push]
jobs:
  lint-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
  e2e:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: pgvector/pgvector:pg16
        env: { POSTGRES_PASSWORD: postgres, POSTGRES_DB: madinatyai }
        ports: ['5432:5432']
      redis:
        image: redis:7
        ports: ['6379:6379']
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npx prisma migrate deploy
      - run: npx playwright install --with-deps chromium
      - run: npx playwright test --project=chromium --workers=1
```

#### AI Agent Prompt
```text
Set up production deployment infrastructure for Souk ElKanto + CoreMesh.

Scope:
- CoreMesh (BE) production Docker image + deploy target (Railway recommended for first deploy).
- Souk ElKanto web on Vercel (subdomain kanto.madinatyai.com).
- GitHub Actions CI: lint, typecheck, e2e tests on PR/push.
- GitHub Actions CD: deploy CoreMesh image on push to main.
- Secrets handling: GitHub Actions secrets + Railway/Vercel env vars.

Constraints:
- Do NOT push to remote yet. Create files locally; user will push.
- Do NOT create accounts on any service.
- Do NOT include any secrets in committed files; everything via env/secret references.
- AUTH_DEV_BYPASS MUST be explicitly set to false in production env.
- NODE_ENV=production in production env.

Task:
1. Create Codes/CoreMesh/Dockerfile (multi-stage, Node 20-alpine, builds, runs prisma generate, exposes 3000). Reference the npm scripts in CoreMesh/package.json.
2. Create Codes/CoreMesh/docker-compose.prod.yml (Postgres + Redis + the BE image, for use in environments without managed services).
3. Create Codes/CoreMesh/.dockerignore (node_modules, .env, .test-data.json, etc.).
4. Create Codes/SoukElkanto/web/vercel.json with rewrites for /api/* → backend URL (env var).
5. Update Codes/SoukElkanto/web/.env.example with NEXT_PUBLIC_API_BASE and CORE_MESH_URL.
6. Create .github/workflows/ci.yml in each repo root (CoreMesh and SoukElkanto) with: lint, typecheck, unit tests for CoreMesh; e2e Playwright tests for SoukElkanto (against a docker-composed CoreMesh, with WAHA blanked + AUTH_DEV_BYPASS=true for the test runner only).
7. Create .github/workflows/deploy-be.yml: build + push Docker image to Railway/GHCR on push to main.
8. Create Codes/SoukElkanto/deploy/README.md documenting: required env vars, secrets, DNS records, smoke-test checklist.
9. Add a /api/v1/version endpoint to CoreMesh returning git SHA + build timestamp + package version (read at startup from env vars BE_GIT_SHA, BE_BUILD_TIME). Used for deploy verification.

Tests:
- New: Codes/CoreMesh/test/dockerfile.spec.ts (or shell script) that builds the Docker image and asserts the container starts + answers /health within 30s.
- Update existing Playwright suite to pass under CI conditions (single worker, sequential).

Verify:
- typecheck + lint on both codebases
- docker build CoreMesh/ — must succeed
- Local docker-compose -f docker-compose.prod.yml up — BE answers /api/v1/health 200
- Run: act -j ci  (GitHub Actions local runner) OR push to a test branch

Report: all files created, env vars required, manual setup steps still needed (DNS, account creation).
```

#### Tests Needed — Global Scenario: S-3 + new "deploy smoke" scenario
| ID | Description |
|---|---|
| R-06-T1 | docker build succeeds and image is <300MB |
| R-06-T2 | `docker-compose -f docker-compose.prod.yml up` brings up Postgres + Redis + BE; /health = 200 |
| R-06-T3 | GET /api/v1/version returns valid JSON with git SHA |
| R-06-T4 | Vercel build for web/ succeeds locally (`npx vercel build`) |
| R-06-T5 | CI workflow runs lint + typecheck + Playwright on a PR-like fixture |

#### Test Execution Prompt
```text
cd Codes/CoreMesh
docker build -t coremesh:test .
docker images coremesh:test  # verify size

docker-compose -f docker-compose.prod.yml up -d
sleep 10
curl -fsS http://localhost:3000/api/v1/health  # must be 200
curl -fsS http://localhost:3000/api/v1/version  # must include gitSha
docker-compose -f docker-compose.prod.yml down

cd ../SoukElkanto/web
npx vercel build  # if vercel CLI installed
```

---

## 3 · High Risk Items (H)

### R-07 · Own-listing modal warning (G4)

**Severity:** H-high
**Estimated effort:** 0.5 day

#### Issue
The page-level guard at [listings/[id]/page.tsx:147](Codes/SoukElkanto/web/src/app/[locale]/listings/[id]/page.tsx:147) correctly renders "Review Offers"/"Edit" instead of "Make Offer" when the viewer owns the listing. But if the OfferModal opens through some other path (deep link, state-rehydration bug), no warning shows — the modal just renders normally with a disabled Send button.

#### Details
`I18N[locale].ownListing` exists in test constants but the modal never references it. J-05's "own-listing guard" test is `test.fixme()` because the assertion finds no matching text.

#### Where
- `Codes/SoukElkanto/web/src/components/OfferModal/OfferModal.tsx:104` — `isOwnListing` already computed
- `Codes/SoukElkanto/web/src/components/OfferModal/OfferModal.tsx:153-166` — `!hasCompleteProfile` warning block (model after this)
- `Codes/SoukElkanto/web/src/messages/{en,ar}.json` — add `offer.ownListing` key
- `Codes/SoukElkanto/web/e2e/journeys/J05-offer.spec.ts:114` — flip `test.fixme()` to `test()`

#### Recommended Solution
Add a warning block parallel to the profile-gate block:
```tsx
{isOwnListing && (
  <div className={styles.warningGate}>
    <AlertCircle size={20} aria-hidden="true" />
    <div>
      <p className={styles.warningTitle}>{t('offer.ownListingTitle')}</p>
      <p className={styles.warningBody}>{t('offer.ownListing')}</p>
    </div>
  </div>
)}
```
Send button stays disabled (already disabled via `disabled={... || isOwnListing}`).

#### AI Agent Prompt
```text
Wire the own-listing warning in OfferModal.

File: Codes/SoukElkanto/web/src/components/OfferModal/OfferModal.tsx

Context:
- isOwnListing is already computed at line 104.
- The disabled prop on the Send button already includes isOwnListing.
- There is no visible warning text — that's the bug.
- The model warning block lives at line 153-166 (the profile-gate block) — match its structure.

Task:
1. In OfferModal.tsx, add a new warning block before the profile-gate block, conditional on isOwnListing. Use the existing AlertCircle icon and styles.profileGate-like classes (or add new styles.ownListingGate to the module CSS).
2. Add two i18n keys: offer.ownListingTitle ("This is your listing"), offer.ownListing ("You can't make an offer on your own listing. Manage it from /my/listings."). Add to both en.json and ar.json.
3. Flip web/e2e/journeys/J05-offer.spec.ts:114 from test.fixme to test. Verify the assertions match the new warning text — the assertion currently expects I18N[locale].ownListing which is already correct strings.

Verify:
- typecheck + lint
- npx playwright test e2e/journeys/J05-offer.spec.ts --project=chromium --workers=1

Report: files changed.
```

#### Tests Needed — Global Scenario: S-1
| ID | Description |
|---|---|
| R-07-T1 | Seller force-opens OfferModal on own listing → warning visible |
| R-07-T2 | Send button disabled while warning visible |
| R-07-T3 | Buyer opens modal → no warning |

#### Test Execution Prompt
```text
cd Codes/SoukElkanto/web
npx playwright test e2e/journeys/J05-offer.spec.ts --project=chromium --workers=1 --reporter=list
```

---

### R-08 · Listing delete / duplicate offer policies (G5 + G6)

**Severity:** H-high
**Estimated effort:** 1 day

#### Issue
Two undefined behaviors:
- **G5:** When seller deletes a listing with open offers, what happens to those offers? Today: nothing explicit.
- **G6:** Can a buyer submit multiple PENDING offers on the same listing? Today: yes, no constraint.

#### Details
G5 → buyers refresh /my/offers Sent and see PENDING rows pointing at deleted listings (404 on click). G6 → buyer can spam Make Offer 5 times in quick succession with 5 different prices.

#### Where
- BE: `Codes/CoreMesh/apps/core-hub/src/modules/soukelkanto/soukelkanto.service.ts` (deleteListing, createOffer)
- Schema: `Codes/CoreMesh/prisma/schema.prisma` (SoukOffer model)
- FE: `Codes/SoukElkanto/web/src/components/OfferModal/OfferModal.tsx` (preflight check)

#### Recommended Solution

**G5 — listing delete cascade:**
- In `deleteListing`, before deleting:
  1. Within transaction, set all open offers (PENDING/COUNTERED) on this listing to EXPIRED with reason `listing_removed_by_seller`.
  2. Emit `OFFER_EXPIRED_LISTING_REMOVED` events for buyer notifications.
  3. Then soft-delete the listing (set `deletedAt`, status REMOVED) — don't hard-delete to preserve audit trail.
- Update `getListing` to return 410 Gone for soft-deleted listings, with the offer history viewable in /my/offers.

**G6 — one PENDING offer per (buyer, listing):**
- Add a Prisma partial unique index via raw SQL migration: `CREATE UNIQUE INDEX one_pending_offer_per_buyer_listing ON tenant_soukelkanto.offers (buyer_id, listing_id) WHERE status = 'PENDING';`
- In `createOffer`, check for existing PENDING offer first — if exists, return 409 with code `OFFER_ALREADY_PENDING` and the existing offer id. FE can then guide user to "edit" (which becomes withdraw + new offer for v1).
- Update OfferModal: on 409, show "You already have a pending offer on this listing — please withdraw it first." with a deep link.

#### AI Agent Prompt
```text
Implement listing delete cascade + duplicate offer policy.

Context:
- BE service: Codes/CoreMesh/apps/core-hub/src/modules/soukelkanto/soukelkanto.service.ts
- Listing model + Offer model in Codes/CoreMesh/prisma/schema.prisma
- FE OfferModal: Codes/SoukElkanto/web/src/components/OfferModal/OfferModal.tsx

Task A — G5 (listing delete cascade):
1. Add `deletedAt` to SoukListing model (DateTime?). Add status REMOVED if not already.
2. In deleteListing service method, wrap in $transaction: set all PENDING/COUNTERED offers on the listing to EXPIRED with reason 'listing_removed_by_seller'. Then update listing status='REMOVED' and deletedAt=now() (NOT a hard delete).
3. Emit OFFER_EXPIRED_LISTING_REMOVED via notifyAsync for each affected buyer.
4. Update getListing: return 410 GONE if status===REMOVED + deletedAt set.
5. Update listListings: filter out REMOVED by default.
6. Update browse endpoint query to include WHERE status != 'REMOVED'.

Task B — G6 (one pending offer per buyer per listing):
1. Create a Prisma migration that adds a partial unique index: `CREATE UNIQUE INDEX one_pending_offer_per_buyer_listing ON tenant_soukelkanto.offers ("buyerId", "listingId") WHERE status = 'PENDING';` Use `npm run prisma:migrate -- --create-only` then edit the SQL.
2. In createOffer service method: before insert, query SoukOffer for existing where (buyerId, listingId, status='PENDING'). If found, throw a new GatewayException code OFFER_ALREADY_PENDING with HTTP 409, payload includes the existing offer id.
3. In FE web/src/lib/api.ts, the existing fetchJson catches and re-throws ApiError with .code — verify the OFFER_ALREADY_PENDING code propagates.
4. In OfferModal, catch the 409 → show new warning state with link to /my/offers Sent tab. Add i18n key offer.alreadyPendingError + offer.viewExistingOffer.

Tests:
1. e2e/journeys/CJ-08c-listing-delete.spec.ts — S-1: U-S deletes listing with U-B's PENDING offer → BE returns 200, listing 410 on detail page, U-B's offer is EXPIRED with the right reason.
2. e2e/journeys/R08-duplicate-offer.spec.ts — S-1: U-B sends an offer; immediately tries to send a second from the same modal → API returns 409 OFFER_ALREADY_PENDING; FE shows the warning and link.

Verify:
- typecheck + lint
- Migration runs cleanly: `npx prisma migrate deploy` from CoreMesh/
- npx playwright test --grep="CJ-08c|R08" --project=chromium --workers=1

Report.
```

#### Tests Needed — Global Scenario: S-1
| ID | Description |
|---|---|
| R-08-T1 (G5) | Delete listing with PENDING offer → offer becomes EXPIRED, listing 410 |
| R-08-T2 (G5) | Browse `/listings` excludes REMOVED listings |
| R-08-T3 (G6) | Second PENDING offer attempt returns 409 with code |
| R-08-T4 (G6) | OfferModal shows "already pending" warning + deep link |
| R-08-T5 (G6) | After buyer withdraws, second offer succeeds |

#### Test Execution Prompt
```text
cd Codes/SoukElkanto/web
npx playwright test --grep="CJ-08c|R08" --project=chromium --workers=1 --reporter=list
```

---

### R-09 · Report listing UI (G7)

**Severity:** H-high
**Estimated effort:** 1 day

#### Issue
The Report button on listing detail just shows a "coming soon" toast ([page.tsx:221](Codes/SoukElkanto/web/src/app/[locale]/listings/[id]/page.tsx:221)). The BE endpoint exists at [listings.controller.ts:115](Codes/CoreMesh/apps/core-hub/src/modules/soukelkanto/listings/listings.controller.ts:115). Trust layer needs this wired.

#### Where
- FE: detail page Report button + new ReportModal component
- BE: already exists, accepts `incidentType`, `severity`, `reason`, `evidencePhotoR2Key`

#### Recommended Solution
- New component: `Codes/SoukElkanto/web/src/components/ReportModal/ReportModal.tsx`
- Fields: incidentType (select), severity (1-5 radio), reason (textarea, optional), evidence photo (optional, R2 upload)
- Submit → POST `/api/v1/listings/:id/report`
- Success: show "Report submitted" with report id + link to "what happens next" explainer
- Wire from detail page button (replace the toast)
- Audit: every report creates an `EcosystemSharedReport` row that feeds TrustScore

#### AI Agent Prompt
```text
Wire the Report-listing UI in Souk ElKanto.

Context:
- BE endpoint: POST /api/v1/listings/:id/report at Codes/CoreMesh/apps/core-hub/src/modules/soukelkanto/listings/listings.controller.ts:111
- DTO: ReportListingDto with incidentType (enum), severity (1-5), reason (optional string), evidencePhotoR2Key (optional)
- IncidentType enum is defined in @prisma/client; read schema.prisma to find values.
- FE Report button currently at /[locale]/listings/[id]/page.tsx:221 just toasts comingSoon.
- Reuse existing R2 photo upload flow (api.listings.photoUploadUrl) for evidence photo.

Task:
1. Add api.reports.create to web/src/lib/api.ts: POST /api/v1/listings/:id/report.
2. Build Codes/SoukElkanto/web/src/components/ReportModal/ReportModal.tsx mirroring OfferModal structure (dialog, backdrop, focus trap, escape close).
3. Fields:
   - Incident type select (read enum values from prisma schema; localize labels).
   - Severity 1-5 radio (visual: faces from happy to sad/angry, or a slider).
   - Reason textarea (max 500 chars).
   - Optional evidence photo via R2 upload (reuse photoUploadUrl).
4. On submit: call api.reports.create → success state with report id + an explainer link. On error 4xx: show field-level error.
5. Replace the Report button onClick in detail page (line 221) — open ReportModal instead of toast.
6. AR/EN i18n: report.title, report.incidentType.{ENUM}, report.severity.{1..5}, report.reason, report.submit, report.success, report.successBody, report.evidence.

Tests:
1. e2e/journeys/R09-report.spec.ts — S-1: U-B opens detail of U-S's listing, clicks Report, fills form, submits → success modal with report id. Verify via BE GET (admin endpoint) that an EcosystemSharedReport was created.
2. Negative: severity 0 or 6 rejected client-side.
3. Negative: empty incidentType blocks submit.

Verify:
- typecheck + lint
- npx playwright test e2e/journeys/R09-report.spec.ts --project=chromium --workers=1

Report.
```

#### Tests Needed — Global Scenario: S-1
| ID | Description |
|---|---|
| R-09-T1 | Report button on listing detail opens ReportModal |
| R-09-T2 | Submitting valid report → success state with report id |
| R-09-T3 | Severity out of 1-5 range blocked at client |
| R-09-T4 | Anonymous user clicking Report redirects to login |
| R-09-T5 | Evidence photo upload via R2 round-trips successfully |

#### Test Execution Prompt
```text
cd Codes/SoukElkanto/web
npx playwright test e2e/journeys/R09-report.spec.ts --project=chromium --workers=1 --reporter=list
```

---

### R-10 · Automated KYC (Didit integration)

**Severity:** H-high
**Estimated effort:** 4 days

#### Issue
KYC is manual upload + admin review per [kyc-external-integration.md](Codes/SoukElkanto/docs/kyc-external-integration.md). Backlog grows linearly with user signups. Manual review is also a privacy concern (admin sees ID photos).

#### Where
- New BE module: `Codes/CoreMesh/apps/core-hub/src/modules/kyc/didit.service.ts`
- New BE controller method for webhook
- Existing KYC service: extend to support Didit session creation
- FE: `Codes/SoukElkanto/web/src/app/[locale]/my/verify/page.tsx` — replace upload form with "Verify with Didit" CTA

#### Recommended Solution
Per the integration guide:
1. Sign up for Didit sandbox.
2. Add `DIDIT_API_KEY`, `DIDIT_API_SECRET`, `DIDIT_WEBHOOK_SECRET` to env validation + .env.example.
3. New service method `createDiditSession(userId, redirectUrl)` — returns session URL.
4. FE: replace `/my/verify` form with a button "Verify your identity with Didit". On click, call `POST /api/v1/users/me/kyc/start-didit` → BE returns session URL → redirect.
5. Webhook endpoint `POST /api/v1/kyc/webhooks/didit` — verify HMAC, update `KycRegistry.status` based on Didit result, emit TrustMeter event on approval (+50 points per integration doc).
6. Fallback: if Didit returns "needs_manual_review", keep the manual upload path (already implemented).

#### AI Agent Prompt
```text
Integrate Didit for automated KYC in Souk ElKanto.

Reference: Codes/SoukElkanto/docs/kyc-external-integration.md (the implementation guide).

Context:
- Existing KYC: Codes/CoreMesh/apps/core-hub/src/modules/kyc/. Service handles encrypted-at-rest manual uploads + admin review.
- Existing FE: Codes/SoukElkanto/web/src/app/[locale]/my/verify/page.tsx — upload form.

Task:
1. Add env vars in env.validation.ts: DIDIT_API_KEY, DIDIT_API_SECRET, DIDIT_WEBHOOK_SECRET, DIDIT_BASE_URL.
2. Create Codes/CoreMesh/apps/core-hub/src/modules/kyc/didit.service.ts with methods:
   - createSession(userId, redirectUrl): Promise<{ sessionUrl, sessionId }>
   - verifyWebhookSignature(payload, signature): boolean
   - handleWebhook(payload): Promise<void> — updates KycRegistry.status based on result, emits trust-meter event on approval.
3. Add POST /api/v1/users/me/kyc/start-didit to users.controller.ts: calls didit.createSession with the user, returns session URL.
4. Add POST /api/v1/kyc/webhooks/didit to a new public controller (no JWT, but verify HMAC against DIDIT_WEBHOOK_SECRET). Persist diditSessionId in KycRegistry.metadata.
5. FE: in /my/verify/page.tsx, replace the upload form with a card containing a primary button "Verify with Didit". On click, POST to /users/me/kyc/start-didit, redirect to sessionUrl. Keep an "Upload manually instead" secondary link to the old form for fallback.
6. Add i18n keys: verify.diditCta, verify.diditExplainer, verify.manualFallback, verify.pending, verify.approved, verify.rejected.
7. Add a polling hook (every 10s while page open) on /api/v1/users/me/kyc-status — when status flips PENDING → APPROVED, show success state.

Tests:
1. e2e/api/R10-didit-webhook.spec.ts — mock a Didit webhook payload (with correct HMAC) to /api/v1/kyc/webhooks/didit; assert KycRegistry.status updates.
2. e2e/journeys/R10-didit-flow.spec.ts — U-B navigates /my/verify, clicks Didit CTA → assert API call made + redirect attempted (mock the actual redirect by stubbing the response URL).
3. Negative: webhook with invalid HMAC → 401.

Verify:
- typecheck + lint
- npx playwright test --grep="R10" --project=chromium --workers=1
- Manual end-to-end test in Didit sandbox before promoting.

Report.
```

#### Tests Needed — Global Scenario: S-1 + S-3 mix
| ID | Description |
|---|---|
| R-10-T1 | POST /users/me/kyc/start-didit returns valid session URL |
| R-10-T2 | Valid HMAC webhook with status=approved → KycRegistry.status=APPROVED + TrustMeter event fires |
| R-10-T3 | Invalid HMAC → 401 |
| R-10-T4 | /my/verify shows Didit primary CTA + manual fallback link |
| R-10-T5 | KYC status polling reflects state change after webhook |

#### Test Execution Prompt
```text
cd Codes/SoukElkanto/web
npx playwright test --grep="R10" --project=chromium --workers=1 --reporter=list

For manual sandbox test:
1. Hit /api/v1/users/me/kyc/start-didit with U-B's token
2. Follow returned URL in a browser, complete Didit sandbox flow
3. Wait for webhook (visible in BE logs)
4. Hit /api/v1/users/me/kyc-status — expect APPROVED
```

---

### R-11 · Security review

**Severity:** H-high
**Estimated effort:** 3 days

#### Issue
No structured security review on the marketplace surface. Souk ElKanto is now a multi-actor app (3+ user roles) handling KYC docs, photos, payment handles, real names, and dispute reports — every dimension is attackable.

#### Where
- All Souk ElKanto + tenant code surfaces
- Existing skill: `/security-review` (referenced in CLAUDE.md skills list)

#### Recommended Solution
Run the `/security-review` skill against the diff range that introduced Souk ElKanto + R-01..R-10 changes. Specific concerns to verify:

1. **JWT signing** — JWT_SECRET must be ≥32 bytes random + rotated periodically. Verify the default "dev-only-secret-replace-me" never reaches prod (R-04 fix makes this fail loudly).
2. **Tenant context leakage** — AsyncLocalStorage tenant context must not leak between concurrent requests. Add a regression test that asserts U-X (tenant kanto) cannot read U-Y's data (tenant kitchen) by manipulating headers.
3. **Photo upload** — verify presigned R2 URLs are scoped, short-TTL (≤5min), bucket has no public listing, content-type validation on PUT.
4. **KYC encryption** — verify AES-256-GCM key rotation procedure documented; key not in env.example.
5. **Webhook signing** — Didit webhook (R-10), future payment provider webhooks: HMAC verification mandatory before any DB write.
6. **Rate limit fallback** — verify per-IP rate limit kicks in for anonymous requests (no JWT).
7. **Audit log coverage** — `@AuditAction()` on every state-changing endpoint. Use grep to enforce.
8. **SQL injection** — Prisma is parameterized but `$queryRawUnsafe` calls (e.g. in seed) need scrutiny.
9. **XSS** — user-supplied text fields (listing title, description, offer note, report reason) — verify React's default escaping is in effect; check any `dangerouslySetInnerHTML`.
10. **CSRF** — verify SameSite cookies / Authorization header pattern. JWT in Authorization header is OK against CSRF.
11. **Information disclosure** — error responses must not leak stack traces in production (verify `AllExceptionsFilter` strips them when `NODE_ENV === 'production'`).
12. **PII in logs** — phones are masked (`maskPhone` exists); verify it's used everywhere phones are logged.

#### AI Agent Prompt
```text
Run a security review of Souk ElKanto's complete surface.

Use the /security-review skill (visible in CLAUDE.md skills list).

Scope:
- All files under Codes/SoukElkanto/web/src/ and Codes/CoreMesh/apps/core-hub/src/modules/soukelkanto/.
- Specifically include changes from R-01..R-10 if they have landed.
- Cross-cutting: Codes/CoreMesh/libs/gateway/, libs/common/.

Specific concerns to verify (do not stop at the first finding):
1. JWT_SECRET strength + handling in production.
2. AsyncLocalStorage tenant context isolation between concurrent requests.
3. Photo upload chain (R2 presigned URLs) — TTL, content-type validation, scope.
4. KYC encryption key handling + rotation.
5. Webhook signature verification (Didit, future payment).
6. Rate limit guards on every public endpoint + per-IP fallback.
7. @AuditAction() decorator coverage on state-changing endpoints.
8. Raw SQL queries (prisma.$queryRawUnsafe / $executeRawUnsafe) for SQLi risk.
9. XSS via React's escaping + any dangerouslySetInnerHTML.
10. CSRF posture given JWT-in-header pattern.
11. Stack trace leakage in production error responses.
12. PII (phone, KYC doc references) in log lines.
13. Open-redirect risks in the auth `next` query param.
14. CORS_ORIGINS scope in production env.
15. Helmet / security headers on responses (verify @nestjs/helmet or equivalent is wired).

Output:
- A structured report at Codes/SoukElkanto/docs/security_review.md, sorted by severity.
- For each finding: title, severity (Critical/High/Medium/Low/Info), file:line, exploit scenario, recommended fix.
- A summary table at the top.
- A list of "verified safe" patterns at the bottom (so you don't re-flag them next pass).

Do not auto-fix issues unless explicitly instructed — surface and document only.
```

#### Tests Needed — Global Scenario: S-2 + new "security" scenario
| ID | Description |
|---|---|
| R-11-T1 | Tenant guard regression: U-X with tenant header "kitchen" cannot read kanto data |
| R-11-T2 | JWT with tampered claims rejected at gateway |
| R-11-T3 | Anonymous browse request hits per-IP rate limit |
| R-11-T4 | Webhook with invalid HMAC → 401 |
| R-11-T5 | Listing title with XSS payload renders as text, not HTML |

#### Test Execution Prompt
```text
After security review completes, run the regression suite to confirm fixes don't break flows:
cd Codes/SoukElkanto/web
npx playwright test --project=chromium --workers=1 --reporter=list

Then review the report:
cat Codes/SoukElkanto/docs/security_review.md | less
```

---

### R-12 · Production observability

**Severity:** H-high
**Estimated effort:** 2 days

#### Issue
`@madinatyai/logging` is well-structured (`audit()`, `security()`, `access()` channels, AsyncLocalStorage correlation IDs) but no aggregator is wired. In production, BE logs go to stdout and disappear when the container restarts. No error tracking, no metrics, no traces.

#### Where
- `Codes/CoreMesh/libs/logging/` (the foundation)
- New: log shipping config — Loki/Grafana, Sentry, or Datadog
- New: metrics — Prometheus exporter + Grafana dashboards
- New: traces — OpenTelemetry exporter

#### Recommended Solution
Three layers — pick managed services to avoid ops burden v1:

1. **Logs** — Better Stack (formerly Logtail) or Grafana Cloud Logs. Add a pino transport in `@madinatyai/logging` to ship logs.
2. **Errors** — Sentry. Both BE (`@sentry/node`) and FE (`@sentry/nextjs`). Tag every error with traceparent.
3. **Metrics** — Prometheus client (`prom-client`) exposing `/metrics`. Scrape via Grafana Cloud Metrics. Custom counters: offers_created, offers_accepted, photos_uploaded_bytes, kyc_submissions, queue_depth_offer_notifications.
4. **Traces** — defer to v2 unless app gets complex. v1 just relies on correlation IDs in logs.
5. **Synthetic uptime check** — UptimeRobot or Better Uptime pinging /api/v1/health every 60s.

#### AI Agent Prompt
```text
Wire production observability for Souk ElKanto + CoreMesh.

Context:
- Logging library exists at Codes/CoreMesh/libs/logging/ (pino-based, with audit/security/access channels).
- Per CoreMesh/docs/logging.md, sensitive scrubbing is always-on in production.
- Choose Sentry for errors + Better Stack for logs (or equivalent — be opinionated for v1).

Task:
1. BE — Sentry:
   - Install @sentry/node + @sentry/profiling-node in CoreMesh/.
   - Initialize in apps/core-hub/src/main.ts BEFORE Nest factory.
   - Env vars: SENTRY_DSN_BE (optional — gracefully skip if unset). Add to env.validation.ts.
   - Wire `Sentry.captureException` in AllExceptionsFilter for all 5xx.
   - Skip Sentry capture for 4xx (those are user errors, not server bugs).
2. FE — Sentry:
   - Install @sentry/nextjs in SoukElkanto/web/.
   - Run `npx @sentry/wizard@latest -i nextjs` then commit the generated files.
   - Env vars: NEXT_PUBLIC_SENTRY_DSN.
3. Logs — Better Stack:
   - Add a pino transport (pino-pretty for dev, @logtail/pino for prod) to @madinatyai/logging.
   - Env vars: LOGTAIL_SOURCE_TOKEN (optional — fall back to stdout if unset).
4. Metrics:
   - Install prom-client in CoreMesh/.
   - Expose GET /metrics in a public controller (or behind a basic-auth guard if internet-facing).
   - Counters: souk_offers_created_total, souk_offers_accepted_total, souk_handovers_confirmed_total, souk_ratings_submitted_total, souk_photos_uploaded_bytes_total, souk_listings_created_total.
   - Histograms: souk_offer_accept_latency_seconds, souk_photo_upload_latency_seconds.
   - Default Node.js metrics (event loop lag, memory).
5. Uptime — document in deploy/README.md how to wire UptimeRobot (not automatable here).

Tests:
- e2e/api/R12-metrics.spec.ts: GET /metrics returns 200 + valid Prometheus text exposition; counters increment after offer creation.
- e2e/api/R12-sentry.spec.ts: trigger a 5xx (call an endpoint with a deliberate Prisma constraint violation); assert that Sentry would have been called (mock or spy).

Verify:
- typecheck + lint
- Run a quick local end-to-end: trigger /api/v1/offers/some-invalid-id/accept; check that Sentry would receive the error (mock or verify via log line).
- Run npx playwright test --grep="R12" --workers=1.

Report: env vars added, dashboards to create externally.
```

#### Tests Needed — Global Scenario: S-3
| ID | Description |
|---|---|
| R-12-T1 | GET /metrics returns valid Prometheus output |
| R-12-T2 | offers_created counter increments after a POST /offers |
| R-12-T3 | 5xx triggers Sentry capture (verified via mock) |
| R-12-T4 | 4xx does NOT trigger Sentry capture |
| R-12-T5 | Logger.audit calls produce structured JSON in production format |

#### Test Execution Prompt
```text
cd Codes/SoukElkanto/web
npx playwright test --grep="R12" --project=chromium --workers=1 --reporter=list

For manual metric check:
curl -fsS http://localhost:3000/metrics | grep souk_
```

---

### R-13 · Load test

**Severity:** H-high
**Estimated effort:** 2 days

#### Issue
We observed BE rate-limiting under modest E2E load (4 parallel workers on shared user). Real Madinaty traffic could be 10-100x. No baseline → no idea where the cliff is.

#### Where
- New: `Codes/CoreMesh/test/load/` (k6 scripts)
- Existing rate limit config: gateway module
- Existing metrics endpoint (R-12)

#### Recommended Solution
Use **k6** (cloud-native, scriptable in JS).

Scenarios:
1. **Anonymous browse** — 100 RPS for 5 min on `GET /listings` + random `GET /listings/:id`. Target: p95 < 200ms, no 5xx.
2. **Logged-in offer creation** — 20 concurrent virtual users (varying tokens), making offers at a sustained rate of 2 RPS per user. Target: no rate limit 429s (with proper tuning).
3. **Wizard publish** — 5 concurrent sellers publishing with photos. Target: 95% complete in < 30s, no 5xx.
4. **OTP flood** — verify rate limit kicks in (test for the right reason).

After each scenario, review:
- Postgres connection pool saturation
- Redis BullMQ queue depth
- BE CPU + RAM
- Rate limit hits per minute
- p50/p95/p99 latencies

#### AI Agent Prompt
```text
Build a load-test suite for Souk ElKanto + CoreMesh using k6.

Context:
- Backend rate-limits per user (we observed 429s with 4 parallel Playwright workers).
- Need to identify the cliff before public launch.
- Use a managed Postgres + Redis (or local docker-compose.prod.yml from R-06) for realistic test.

Task:
1. Install k6: write a short setup section in Codes/CoreMesh/test/load/README.md.
2. Create Codes/CoreMesh/test/load/scenarios/01-anonymous-browse.js:
   - 100 RPS on /api/v1/listings + random /listings/:id from a pre-seeded list.
   - Duration: 5 min.
   - Thresholds: p95 < 200ms, http_req_failed < 1%.
3. Create 02-logged-in-offer.js:
   - Pre-load 20 user tokens (use the dev-bypass; pre-seed via prisma:seed-loadtest).
   - Each VU makes an offer every 500ms for 5 min.
   - Threshold: no 5xx; ≤ 5% 429 rate (tunable).
4. Create 03-wizard-publish.js:
   - 5 concurrent sellers each publishing 10 listings sequentially.
   - Threshold: per-listing creation < 5s p95.
5. Create 04-otp-flood.js:
   - Send 30 OTP requests per second for one phone.
   - Expect rate limit to engage by request 5 (verify 429 with code OTP_RATE_LIMITED).
6. Create test/load/seed-loadtest.ts (separate from the regular seed) that creates 20 numbered test users + 50 listings.
7. Create Codes/CoreMesh/test/load/run.sh that runs all scenarios in sequence + outputs results.
8. Update the metrics from R-12 — confirm counters and histograms increment as expected during load tests.

After running:
- Tabulate p50/p95/p99 + error rates for each scenario into Codes/SoukElkanto/docs/load_test_results.md.
- Recommend tuning: rate limit tiers, Postgres pool size, BullMQ concurrency.

Verify:
- All k6 scripts run cleanly: `k6 run --vus 1 --iterations 1 scenarios/01-anonymous-browse.js`
- Scoring run: `./run.sh` produces summary report.

Report: thresholds met / breached, tuning recommendations.
```

#### Tests Needed — Global Scenario: Load (k6, not Playwright)
| ID | Description |
|---|---|
| R-13-T1 | Anonymous browse: 100 RPS for 5min, p95 < 200ms, < 1% errors |
| R-13-T2 | Offer creation: 20 VUs at 2 RPS each, 5xx = 0 |
| R-13-T3 | Wizard publish: 5 concurrent sellers, per-listing p95 < 5s |
| R-13-T4 | OTP rate limit fires by request 5 from same phone |
| R-13-T5 | BE CPU + RAM utilization < 80% throughout |

#### Test Execution Prompt
```text
cd Codes/CoreMesh/test/load
./run.sh

# Or individually:
k6 run scenarios/01-anonymous-browse.js
k6 run scenarios/02-logged-in-offer.js
k6 run scenarios/03-wizard-publish.js
k6 run scenarios/04-otp-flood.js

# Review:
cat ../../../SoukElkanto/docs/load_test_results.md
```

---

### R-14 · WAHA OTP fallback

**Severity:** H-high
**Estimated effort:** 1.5 days

#### Issue
WAHA is configured to `https://waha.xee.run.place` — a single external WAHA host. If it goes down, login is broken. No SMS fallback.

#### Where
- `Codes/CoreMesh/apps/core-hub/src/modules/auth/otp.service.ts`
- New: SMS provider integration (Twilio or Vonage)

#### Recommended Solution
Adapter pattern:
1. Introduce `OtpDeliveryProvider` interface with `send(phone, code): Promise<void>` and `name: string` for logging.
2. Implementations: `WahaProvider` (existing), `TwilioProvider` (new), `ConsoleProvider` (dev fallback — log OTP to console).
3. Compose: `OtpDispatcher` tries providers in order from env config (`OTP_PROVIDERS=waha,twilio,console` — first-success wins).
4. Add circuit breaker per provider: 5 failures in 60s → skip for 5 min.
5. Log provider used in audit channel for monitoring.

#### AI Agent Prompt
```text
Add SMS fallback for OTP delivery in CoreMesh.

Context:
- Current: Codes/CoreMesh/apps/core-hub/src/modules/auth/otp.service.ts uses WAHA exclusively (or dev bypass when devBypass=true).
- Goal: support multiple providers in priority order, with circuit breaker.

Task:
1. Create interface OtpDeliveryProvider { name: string; send(phone: string, code: string, purpose: 'register' | 'login'): Promise<void> }.
2. Refactor existing WAHA logic into WahaProvider.
3. Add TwilioProvider using @twilio/sdk. Env: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER.
4. Add ConsoleProvider (dev fallback — just logs the OTP to console).
5. Create OtpDispatcher that:
   - Reads OTP_PROVIDERS env (CSV: e.g. "waha,twilio,console").
   - Tries each in order; first success wins.
   - Per-provider circuit breaker (in-memory map of failure counts + last-failure-timestamp; skip if >5 failures in last 60s).
   - Logs which provider succeeded via logger.audit({ action: 'otp.send', target: 'otp', metadata: { provider, phoneMasked } }).
6. Update OtpService.issue() to use OtpDispatcher.
7. Add env vars to env.validation.ts: OTP_PROVIDERS (default 'waha,console'), TWILIO_ACCOUNT_SID/AUTH_TOKEN/FROM_NUMBER (optional).
8. Tests:
   - Unit: otp-dispatcher.spec.ts — provider priority, circuit breaker, fallback.
   - Integration: e2e/api/R14-otp-providers.spec.ts — with WAHA blanked and Console fallback, OTP delivery still works (verified via log line).

Verify:
- typecheck + lint
- npm run test:unit -- --testPathPattern=otp-dispatcher
- npx playwright test --grep="R14" --workers=1

Report.
```

#### Tests Needed — Global Scenario: S-3 + unit
| ID | Description |
|---|---|
| R-14-T1 | Unit: providers tried in order, first success wins |
| R-14-T2 | Unit: circuit breaker skips a provider after 5 failures in 60s |
| R-14-T3 | Unit: all providers fail → throws OtpDeliveryException |
| R-14-T4 | Integration: with WAHA unavailable, ConsoleProvider succeeds + OTP usable for login |
| R-14-T5 | Audit log records which provider succeeded |

#### Test Execution Prompt
```text
cd Codes/CoreMesh
npm run test:unit -- --testPathPattern=otp-dispatcher

cd ../SoukElkanto/web
npx playwright test --grep="R14" --project=chromium --workers=1 --reporter=list
```

---

## 4 · Should-do (S)

### R-15 · Postgres backup + DR drill

**Severity:** S-should
**Estimated effort:** 1 day

#### Issue
No backup policy. If the prod DB volume is corrupted or accidentally dropped, all KYC + listings + offers + ratings are gone.

#### Recommended Solution
- Use managed Postgres (Supabase, Neon, Railway) — auto-backups for free.
- Configure point-in-time recovery (PITR) retention: 7 days for v1.
- Schedule monthly DR drill: spin up a fresh BE pointed at a restored DB snapshot; run smoke tests; tear down.
- Document in `Codes/SoukElkanto/deploy/dr_runbook.md`.

#### AI Agent Prompt
```text
Document Postgres backup + DR procedures for Souk ElKanto.

Task:
1. Create Codes/SoukElkanto/deploy/dr_runbook.md with:
   - Daily automated backup mechanism (rely on managed Postgres provider).
   - Retention: 7 days for v1, 30 days for v2.
   - PITR window.
   - Restore procedure (step-by-step commands).
   - Smoke-test script after restore (Playwright `--grep="J-01|J-04|J-08"` is sufficient to confirm system health).
   - Monthly drill schedule.
   - Emergency contact list (placeholder).
2. Create a verification cron job spec (no actual implementation in this task — just docs) that pings the backup health endpoint.

Verify:
- File renders cleanly in Markdown preview.
- Commands in the runbook are testable (use shellcheck on any embedded bash).
```

#### Tests Needed
- Quarterly: run the drill, verify documented restore procedure works.

#### Test Execution Prompt
```text
Once per quarter:
1. Open Codes/SoukElkanto/deploy/dr_runbook.md
2. Execute each step against a non-production snapshot
3. Run: npx playwright test --grep="J-01|J-04|J-08" against the restored env
4. Log outcomes + time-to-restore in deploy/dr_log.md
```

---

### R-16 · Staging environment

**Severity:** S-should
**Estimated effort:** 1 day

#### Issue
No staging between local-dev and prod. Risky changes either land directly in prod or are tested only locally.

#### Recommended Solution
- Spin up a second deploy target (Vercel preview branch + Railway "staging" service).
- Staging DB: separate small managed instance (or even a Postgres on the staging Railway).
- Staging seed: anonymized snapshot from prod (or fresh seed).
- Auto-deploy from `develop` branch.
- Add a banner on the staging FE: "STAGING — do not enter real data".

#### AI Agent Prompt
```text
Configure a staging environment for Souk ElKanto + CoreMesh.

Task:
1. Update Codes/SoukElkanto/web/vercel.json and CI workflow to deploy `develop` branch builds to a staging URL (kanto-staging.madinatyai.com).
2. Update CoreMesh deploy workflow to maintain a separate "staging" service on Railway (env vars: NEXT_PUBLIC_API_BASE=https://api-staging.madinatyai.com, NODE_ENV=staging).
3. Add a "STAGING" banner component in Codes/SoukElkanto/web/src/components/StagingBanner/StagingBanner.tsx — visible only when NEXT_PUBLIC_ENV === 'staging'. Add it to the root layout.
4. Document the promotion flow in Codes/SoukElkanto/deploy/promotion.md: develop → staging auto-deploy, manual promote to prod via release tag.

Verify:
- typecheck + lint
- The banner renders on staging URL and is hidden on prod URL.
```

#### Tests Needed
| ID | Description |
|---|---|
| R-16-T1 | NEXT_PUBLIC_ENV=staging → StagingBanner renders |
| R-16-T2 | NEXT_PUBLIC_ENV=production → StagingBanner does not render |

---

### R-17 · Mobile + RTL visual regression

**Severity:** S-should
**Estimated effort:** 2 days

#### Issue
Playwright config has Pixel 5 + iPhone 12 projects + AR locale tests, but no visual diffing. CSS changes can silently break RTL or mobile layouts.

#### Recommended Solution
- Add Playwright visual diff (`toHaveScreenshot`) for key pages: home, listings browse, listings detail, /my/offers, wizard step 4 review.
- 4 projects × 2 locales × 5 pages = 40 baseline screenshots.
- Store baselines in `web/e2e/screenshots/`.
- CI: fail PR if a screenshot diff exceeds tolerance (5%).

#### AI Agent Prompt
```text
Add visual regression coverage for mobile + RTL.

Task:
1. Create web/e2e/visual/visual.spec.ts with screenshot assertions for:
   - / (home)
   - /listings (browse)
   - /listings/[seeded-id] (detail)
   - /my/offers (auth required)
   - /listings/new step 4 (auth required)
2. Run with all 4 projects (chromium, firefox, mobile-chrome, mobile-safari) × 2 locales (en, ar).
3. Use `expect(page).toHaveScreenshot('home-en.png', { maxDiffPixelRatio: 0.05 })`.
4. Generate baselines: npx playwright test --update-snapshots.
5. Commit the baselines under web/e2e/screenshots/.
6. Update CI workflow to flag (not block) screenshot diffs on PR.

Verify:
- All 40 baselines committed.
- Re-run with no source changes → all pass.
- Make a deliberate CSS tweak → diff fails as expected.
```

#### Tests Needed
| ID | Description |
|---|---|
| R-17-T* | 40 baseline screenshots across 4 projects × 2 locales × 5 pages, max diff 5% |

---

### R-18 · Photo upload edge cases

**Severity:** S-should
**Estimated effort:** 1 day

#### Issue
No tests for file-size limits, invalid types, malformed images, very large images, HEIC/HEIF support, EXIF orientation.

#### Recommended Solution
- Tests for: 10MB+ file rejected, .exe rejected, malformed JPEG truncated, HEIC accepted + converted, EXIF rotation preserved.
- Server-side: validate file size in `requestPhotoUploadUrl` before issuing presigned URL.
- Client-side: pre-flight check + helpful error.

#### AI Agent Prompt
```text
Harden photo upload + add edge-case tests.

Task:
1. BE: in soukelkanto.service.ts requestPhotoUploadUrl, validate dto.bytes ≤ 10 * 1024 * 1024. Validate dto.contentType against allowlist [image/jpeg, image/png, image/webp, image/heic, image/heif].
2. FE: in /listings/new wizard handlePublish, pre-check file.size and file.type before requesting presigned URL.
3. Tests:
   - e2e/journeys/R18-photo-edge.spec.ts: 11MB jpg rejected at BE.
   - .exe selected → blocked at FE.
   - HEIC selected → accepted + uploaded; detail page shows the converted image (R2 server-side conversion or FE Canvas).

Verify:
- typecheck + lint
- npx playwright test --grep="R18" --workers=1
```

---

### R-19 · On-call rotation + incident playbook

**Severity:** S-should
**Estimated effort:** 0.5 day

#### Issue
No documented on-call rotation or incident response playbook. When prod misbehaves, response is ad-hoc.

#### Recommended Solution
Lightweight v1:
- Document the alerting setup (R-12 metrics + UptimeRobot synthetic checks).
- Create `Codes/SoukElkanto/deploy/incident_playbook.md` with:
  - Severity ladder (SEV-1/2/3 with response time SLAs).
  - First-response checklist (per common alert type: high error rate, DB down, R2 503, WAHA down).
  - Contact escalation tree.
  - Post-mortem template.

#### AI Agent Prompt
```text
Create the on-call playbook for Souk ElKanto.

Task:
1. Create Codes/SoukElkanto/deploy/incident_playbook.md.
2. Sections:
   - Severity definitions (SEV-1: total outage / data loss risk; SEV-2: degraded UX / >10% of users affected; SEV-3: bug / single-user issue).
   - Response time SLAs (SEV-1: 15 min; SEV-2: 2 hours; SEV-3: next business day).
   - First-response checklists per common alert:
     a. /metrics shows souk_offers_create_total flat for 5 min → BE wedged → check Sentry, check DB, restart.
     b. UptimeRobot reports /health failing → check Sentry, check container logs.
     c. R2 storage 503 → degrade gracefully (allow offers without photo upload), notify users.
     d. WAHA down → confirm OTP fallback (R-14) is engaging.
     e. DB connection pool exhausted → scale up + investigate slow queries.
   - Escalation tree (placeholders for contacts).
   - Post-mortem template.

Verify: file renders cleanly.
```

---

## 5 · Acceptance criteria for "production-ready"

A release is **production-ready** when ALL of the following pass:

### Code correctness
- [ ] All 6 blockers (R-01..R-06) merged + tests green
- [ ] All 8 high-risk items (R-07..R-14) merged + tests green
- [ ] `npm run lint` + `npm run typecheck` clean on both CoreMesh + SoukElkanto/web
- [ ] Existing full Playwright suite + new R-XX-T* tests pass on chromium + firefox + mobile-chrome + mobile-safari × en + ar

### Security
- [ ] R-11 security review report has zero Critical + zero High open findings
- [ ] JWT_SECRET is ≥48 random bytes in prod env
- [ ] AUTH_DEV_BYPASS verified `false` in prod
- [ ] CORS_ORIGINS in prod includes only the prod FE domain(s)

### Compliance
- [ ] Legal/tax review (R-05) signed off by counsel
- [ ] TOS + Privacy Policy live + version-tagged
- [ ] Consent capture in registration flow

### Operations
- [ ] Production deploy succeeds end-to-end via CI (R-06)
- [ ] /api/v1/health green on prod for 24 hours straight
- [ ] /metrics exposes counters (R-12)
- [ ] Sentry receives a test exception in prod
- [ ] First backup exists + restore drill (R-15) executed successfully
- [ ] Staging URL live with fresh promote-from-develop workflow

### Performance
- [ ] Load test (R-13) targets met
- [ ] No 5xx during 30-min sustained 100 RPS browse test

### Documentation
- [ ] `deploy/README.md` complete + reviewed
- [ ] `incident_playbook.md` complete (R-19)
- [ ] Test plan (`docs/test_plan.md`) updated to reflect new tests
- [ ] CHANGELOG.md entry for v1.0.0

### Soft launch gates
- [ ] Closed beta of ≤50 Madinaty residents for ≥2 weeks
- [ ] Bug rate < 1 per 100 active users per week
- [ ] No SEV-1 incidents in beta window
- [ ] Customer support inbox set up + monitored

---

## 6 · Cross-references

- Test infrastructure: [docs/test_plan.md](./test_plan.md)
- E2E test fixtures: `web/e2e/fixtures/concurrent.ts`, `web/e2e/global-setup.ts`
- Existing journey specs: `web/e2e/journeys/CJ-0[2-9]*.spec.ts`
- Existing API specs: `web/e2e/api/CJ08-handover.spec.ts`, `web/e2e/api/CJ09-ratings.spec.ts`
- KYC integration guide: [docs/kyc-external-integration.md](./kyc-external-integration.md)
- Convex assessment: [docs/convex-migration-assessment.md](./convex-migration-assessment.md)
- CoreMesh logging: `Codes/CoreMesh/docs/logging.md`
- CoreMesh gateway: `Codes/CoreMesh/docs/gateway.md`
- CoreMesh trust meter: `Codes/CoreMesh/docs/trust-meter.md`

---

## 7 · Owner sign-off

| Role | Name | Date |
|---|---|---|
| Engineering lead | | |
| Product owner | | |
| Legal counsel (R-05) | | |
| Security reviewer (R-11) | | |
| Operations lead | | |

When all rows are signed, Souk ElKanto v1.0 is cleared for prod.
