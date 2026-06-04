# Souk ElKanto — Architecture (Business + Technical)

> Tenant under MadinatyAI Ecosystem Hub (CoreMesh).
> Last updated: 2026-06-01

---

## 1. Where Souk ElKanto Sits in the Ecosystem

Souk ElKanto is **a tenant**, not a new platform. It plugs into the existing CoreMesh gateway via subdomain `kanto.madinatyai.com` and PostgreSQL schema `tenant_soukelkanto`.

```mermaid
graph TB
  subgraph Edge
    USR[Madinaty Resident]
  end
  subgraph SoukElkanto_Frontend
    WEB[Next.js 15 Web - v1]
    MOB[Flutter Mobile - v2]
  end
  subgraph CoreMesh_Shared
    GW[API Gateway + TenantMiddleware]
    AUTH[Auth and JWT]
    KYC[KYC Engine]
    TRUST[TrustScore]
    WALLET[Token Wallet]
    EV[BullMQ Events]
  end
  subgraph SoukElkanto_BE
    SEK[Souk ElKanto Module - new]
  end
  subgraph DB
    CORE[(core schema)]
    TSEK[(tenant_soukelkanto)]
    OTHER[(other tenant schemas - souq / kitchen / tutor / timebank)]
  end
  USR --> WEB
  USR --> MOB
  WEB -->|x-tenant-id kanto| GW
  MOB -->|x-tenant-id kanto| GW
  GW --> AUTH
  GW --> KYC
  GW --> TRUST
  GW --> WALLET
  GW --> EV
  GW --> SEK
  AUTH --> CORE
  KYC --> CORE
  TRUST --> CORE
  WALLET --> CORE
  SEK --> TSEK
  EV -.cross-platform.-> OTHER
```

---

## 2. Business Architecture

### 2.1 Stakeholders and Value Flows

```mermaid
graph TB
  subgraph Residents
    SELLER[Resident Seller - moving / outgrown / upgrade]
    BUYER[Resident Buyer - bargain / sustainable]
  end
  subgraph SoukElkanto
    LIST[Listings + Categories]
    OFFER[Offer / Counter-offer]
    HANDOVER[Two-tap Handover]
    RATE[Rating]
  end
  subgraph Trust_Layer_CoreMesh
    KYC_B[KYC Verified Badge]
    TM[TrustMeter Tier + Total - public engagement reputation]
    TS[TrustScore 0-100 - internal safety floor / ban gate]
    REP[Report Flow]
    HOLD[Optional Token Hold]
    SMS[Safe Meet Spots]
    BONUS[Bonus Token Grant on Tier Up]
  end
  SELLER -->|posts| LIST
  BUYER -->|browses| LIST
  BUYER -->|makes offer| OFFER
  SELLER -->|accepts / counters| OFFER
  OFFER -->|on accept| HOLD
  OFFER -->|on accept| SMS
  HANDOVER --> RATE
  HANDOVER -.+10 points each.-> TM
  RATE -.severity-graded.-> REP
  RATE -.score-graded.-> TM
  REP --> TS
  REP --> TM
  KYC_B -.shown on.-> LIST
  TM -.shown on.-> LIST
  TM -.tier up.-> BONUS
```

### 2.2 Value Proposition Canvas (compressed)

| Resident pain (today) | Souk ElKanto solution |
|-----------------------|------------------------|
| Scattered Facebook groups / WhatsApp | One curated marketplace inside Madinaty |
| Anonymous strangers | KYC-verified neighbors only |
| No reputation signal | Portable **TrustMeter** tier + points (public) + TrustScore (safety floor, internal) — both from CoreMesh |
| No reason to behave well | Bonus token grants on tier upgrades — rewards repeat good citizenship |
| Stolen photos / fake listings | Server-side photo timestamping |
| Random meetup spots = safety risk | Designated Safe Meet Spots inside city |
| No-show buyers / sellers | Optional commitment token hold |
| Disputes have no recourse | Report flow → TrustScore penalty AND TrustMeter point deduction |

### 2.3 Revenue Model (v1 → v3)

| Phase | Mechanism | Source |
|-------|-----------|--------|
| v1 | Free — pure trust-building | (no direct revenue) |
| v2 | Featured listings | Individual tokens (closed-loop) |
| v2 | Boost in category | Individual tokens |
| v3 | Power-seller verification badge | Business tokens (subscription) |
| v3 | Cross-tenant analytics for retailers | Business tokens |

**Broker stance kept throughout:** all "revenue" is closed-loop token consumption, never cash on platform.

---

## 3. Technical Architecture

### 3.1 Module Layout (inside CoreMesh monorepo)

```
CoreMesh/
├── apps/core-hub/src/modules/
│   └── soukelkanto/                  ← NEW
│       ├── soukelkanto.module.ts
│       ├── listings/
│       │   ├── listings.controller.ts
│       │   ├── listings.service.ts
│       │   └── dto/
│       ├── offers/
│       │   ├── offers.controller.ts
│       │   ├── offers.service.ts
│       │   └── dto/
│       ├── handover/
│       │   ├── handover.controller.ts
│       │   └── handover.service.ts
│       ├── categories/
│       │   └── categories.controller.ts
│       └── safe-spots/
│           └── safe-spots.controller.ts
├── libs/                              (no new libs — reuses everything)
└── prisma/schema.prisma               ← tenant_soukelkanto block added
```

### 3.2 Request Lifecycle

```mermaid
sequenceDiagram
  participant C as Client (web/mobile)
  participant GW as CoreMesh Gateway
  participant TM as TenantMiddleware
  participant Auth as JWT Guard
  participant TG as TenantGuard
  participant SEK as Souk ElKanto Module
  participant CORE as core schema
  participant TSEK as tenant_soukelkanto

  C->>GW: POST /api/v1/listings (Bearer JWT, x-tenant-id=kanto)
  GW->>TM: resolve tenant
  TM->>CORE: SELECT Tenant WHERE subdomain='kanto'
  TM->>TM: bind TenantContext (schemaName=tenant_soukelkanto)
  GW->>Auth: verify JWT
  Auth->>CORE: load GlobalUser, role
  Auth-->>GW: req.user
  GW->>TG: route requires tenant?
  TG->>SEK: handle()
  SEK->>CORE: check KYC.isVerified (soft requirement)
  SEK->>CORE: read TrustScore
  SEK->>TSEK: INSERT Listing
  SEK->>EV: emit ListingCreated event
  SEK-->>C: 201 { listing }
```

### 3.3 Lightweight Protection — Flow Detail

```mermaid
graph LR
  A[Offer Accepted] --> B{Buyer opts in to Token Hold?}
  B -->|Yes| C[POST /api/v1/tokens/allocate - 72h TTL]
  B -->|No| D[Skip hold]
  C --> E[Safe Meet Spot suggested]
  D --> E
  E --> F[Both parties meet]
  F --> G[Two-tap Handover confirmed]
  G --> H[Release token hold]
  G --> I[Both rate each other 1-5]
  I --> J[Rating maps to EcosystemSharedReport severity]
  J --> K[TrustScore recalculated]
  F -.no-show.-> L[Auto-expire after 72h]
  L --> M[Release hold + log incident]
  M --> J
```

### 3.4 Data Plane

```mermaid
graph LR
  subgraph tenant_soukelkanto
    L[Listing]
    LP[ListingPhoto]
    LC[ListingCategory enum]
    OF[Offer]
    HV[Handover]
    RT[Rating]
    FAV[Favorite]
    SMS[SafeMeetSpot]
  end
  subgraph core_schema_reused
    GU[GlobalUser]
    KR[KycRegistry]
    TS[TrustScore on GlobalUser]
    TW[TokenWallet]
    ESR[EcosystemSharedReport]
    ECM[EcosystemCrossMatches]
  end
  L -->|sellerId FK| GU
  OF -->|buyerId FK| GU
  OF -->|listingId FK| L
  HV -->|offerId FK| OF
  RT -->|reporterId, targetId FK| GU
  RT -.severity-weighted.-> ESR
  FAV -->|userId FK| GU
  FAV -->|listingId FK| L
  OF -.token hold.-> TW
  L -.photo timestamps.-> LP
```

### 3.5 AI Usage (Hybrid via CoreMesh AI Router)

| Use case | Complexity | Provider |
|----------|-----------|----------|
| Listing description spam / abuse moderation | LOW | Ollama llama3:8b |
| Auto-categorization suggestion from title + photo | LOW | Ollama llama3:8b |
| Duplicate / re-used photo detection | LOW | Ollama llama3:8b (image hash compare) |
| "Suggest fair price" from category + condition + photos | HIGH | Gemini 1.5 Pro |
| Semantic search (buyer query → similar listings) | HIGH | Gemini embeddings → pgvector |
| Cross-tenant recommendations (saw on Souq → suggest on Kanto) | HIGH | pgvector similarity |

### 3.6 Events Emitted

| Event | Trigger | Consumed by |
|-------|---------|----------|
| `souk.listing.created` | Seller posts a listing | Analytics ledger, semantic indexer |
| `souk.listing.unlisted.under24h` | Seller removes a listing < 24h after posting | TrustMeter listener (-2 pts) |
| `souk.listing.expired` | Listing reaches 90 days with no offer accepted | TrustMeter listener (-1 pt) |
| `souk.listing.sold.within30d` | Listing transitions to SOLD < 30 days after posting | TrustMeter listener (+5 pts seller) |
| `souk.offer.accepted` | Seller accepts an offer | Token-hold scheduler, notification |
| `souk.offer.noshow` | 72h after `ACCEPTED` with no handover confirm | TrustMeter listener (-8 pts buyer or seller as applicable) |
| `souk.handover.confirmed` | Both parties tap confirm | TrustScore recalc, rating prompt, **TrustMeter listener (+10 pts each)** |
| `souk.rating.received` | A user receives a rating | TrustScore (via report), **TrustMeter listener (score-mapped delta)** |
| `souk.report.verified` | Admin verifies a report against a user | TrustScore recalc (existing), **TrustMeter listener (severity-mapped negative)** |

All routed through CoreMesh BullMQ → `EcosystemCrossMatches` + new `@madinatyai/trust-meter` event consumer. See `CoreMesh/docs/trust-meter.md` §5.6 for the event-to-action mapping.

### 3.7 TrustMeter Integration

Souk ElKanto is a **producer** of TrustMeter signals. It emits domain events through BullMQ; the `@madinatyai/trust-meter` library's event listener (lives in CoreMesh core) translates them into `TrustMeterEvent` ledger rows and updates the user's running total.

**The Souk ElKanto module never calls TrustMeter APIs directly to write.** It only:

1. **Emits domain events** (see §3.6 list).
2. **Reads** the public `GET /api/v1/trust-meter/users/:userId` endpoint to display tier + total on listings, offers, and profile screens.

This separation keeps Souk ElKanto decoupled from TrustMeter internals — if point values change in admin config, no Souk code changes.

**Display contract for Souk ElKanto:** Every place that today shows TrustScore (listing detail, offer modal, profile) now ALSO shows TrustMeter tier + total. TrustScore stays internal (only used to block sub-20 users from listing creation per `PRD §1.5`). TrustMeter is the user-visible badge.

---

## 4. Tenant Provisioning Checklist (CoreMesh side)

- [ ] Add `kanto` row to `Tenant` table (`subdomain=kanto`, `tier=STANDARD`, `isActive=true`).
- [ ] Add `'soukelkanto': 'tenant_soukelkanto'` to `TENANT_SCHEMA_MAP`.
- [ ] Add `tenant_soukelkanto` block to `prisma/schema.prisma`.
- [ ] Run `prisma db push` to materialize the schema.
- [ ] Add `kanto.madinatyai.com` DNS A-record / Vercel domain alias.
- [ ] Seed initial `ListingCategory` enum values.
- [ ] Seed Safe Meet Spots (lat/lng for ~10 designated locations).
- [ ] Seed `ActivityPricing` for `kanto_listing_boost_7d` (token wallet).

---

## 5. Out of Scope for v1 (kept here so they don't sneak in)

- Auctions / timed bidding.
- In-app messaging beyond offer notes (use WhatsApp deep link from `GlobalUser.metadata.whatsapp`).
- Delivery / shipping logistics.
- Payment processing of any kind.
- Multi-currency or international shipping.
- Merchant tier / pro stalls.
- Native mobile app (web responsive first).
