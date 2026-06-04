# Souk ElKanto — Data Model

> Prisma schema additions for the `tenant_soukelkanto` schema.
> All cross-tenant primitives (users, KYC, TrustScore, wallet, reports) **stay in the `core` schema** and are referenced by ID.

---

## 1. Tenant Schema Block (add to `CoreMesh/prisma/schema.prisma`)

```prisma
// =====================================================
// tenant_soukelkanto — Souk ElKanto P2P marketplace
// =====================================================

model SoukListing {
  id              String              @id @default(uuid()) @db.Uuid
  sellerId        String              @db.Uuid                    // FK → core.GlobalUser
  title           String              @db.VarChar(120)
  description     String              @db.Text
  category        SoukCategory
  condition       SoukCondition
  askingPrice     Int                                              // EGP, integer (no fractions)
  currency        String              @default("EGP") @db.VarChar(3)
  district        String              @db.VarChar(64)              // Madinaty district code (e.g. "B5")
  status          SoukListingStatus   @default(ACTIVE)
  isPhotoStale    Boolean             @default(false)
  embedding       Unsupported("vector(768)")?                      // pgvector for semantic search
  viewCount       Int                 @default(0)
  favoriteCount   Int                 @default(0)
  boostedUntil    DateTime?                                        // null = not boosted
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt
  removedAt       DateTime?

  photos          SoukListingPhoto[]
  offers          SoukOffer[]
  favorites       SoukFavorite[]

  @@index([sellerId])
  @@index([category])
  @@index([status])
  @@index([district])
  @@index([createdAt])
  @@map("listings")
  @@schema("tenant_soukelkanto")
}

model SoukListingPhoto {
  id           String       @id @default(uuid()) @db.Uuid
  listingId    String       @db.Uuid
  r2Key        String       @db.VarChar(256)                       // Cloudflare R2 object key
  url          String       @db.VarChar(512)                       // CDN-fronted public URL
  width        Int
  height       Int
  bytes        Int
  phash        String?      @db.VarChar(64)                        // Perceptual hash for dup detection
  exifTakenAt  DateTime?                                           // From EXIF, if present
  uploadedAt   DateTime     @default(now())                        // Server-side trusted timestamp
  position     Int          @default(0)                            // Display order

  listing      SoukListing  @relation(fields: [listingId], references: [id], onDelete: Cascade)

  @@unique([listingId, position])
  @@index([phash])
  @@map("listing_photos")
  @@schema("tenant_soukelkanto")
}

model SoukOffer {
  id                 String           @id @default(uuid()) @db.Uuid
  listingId          String           @db.Uuid
  buyerId            String           @db.Uuid                     // FK → core.GlobalUser
  sellerId           String           @db.Uuid                     // FK → core.GlobalUser (denormalized for query speed)
  amount             Int                                            // EGP offered
  note               String?          @db.Text
  status             SoukOfferStatus  @default(PENDING)
  parentOfferId      String?          @db.Uuid                     // Set when seller counters → new offer with parent link
  tokenHoldAmount    Int?                                           // Optional individual-tokens locked by buyer
  tokenHoldExpiresAt DateTime?                                      // 72h default
  acceptedAt         DateTime?
  declinedAt         DateTime?
  withdrawnAt        DateTime?
  expiredAt          DateTime?
  safeMeetSpotId     String?          @db.Uuid
  createdAt          DateTime         @default(now())
  updatedAt          DateTime         @updatedAt

  listing            SoukListing      @relation(fields: [listingId], references: [id])
  handover           SoukHandover?
  ratings            SoukRating[]
  safeMeetSpot       SoukSafeMeetSpot? @relation(fields: [safeMeetSpotId], references: [id])

  @@index([listingId])
  @@index([buyerId])
  @@index([sellerId])
  @@index([status])
  @@map("offers")
  @@schema("tenant_soukelkanto")
}

model SoukHandover {
  id                  String     @id @default(uuid()) @db.Uuid
  offerId             String     @unique @db.Uuid
  buyerConfirmedAt    DateTime?
  sellerConfirmedAt   DateTime?
  bothConfirmedAt     DateTime?                                    // Computed when both set
  ratingWindowEndsAt  DateTime?                                    // bothConfirmedAt + 24h
  createdAt           DateTime   @default(now())

  offer               SoukOffer  @relation(fields: [offerId], references: [id])

  @@map("handovers")
  @@schema("tenant_soukelkanto")
}

model SoukRating {
  id            String     @id @default(uuid()) @db.Uuid
  offerId       String     @db.Uuid
  raterId       String     @db.Uuid                                // FK → core.GlobalUser
  targetId      String     @db.Uuid                                // FK → core.GlobalUser
  score         Int                                                 // 1-5
  comment       String?    @db.Text
  mappedSeverity Int                                                // Computed 0/0/1/3/5 from score 5/4/3/2/1
  reportRowId   String?    @db.Uuid                                // FK to core.EcosystemSharedReport.id
  createdAt     DateTime   @default(now())

  offer         SoukOffer  @relation(fields: [offerId], references: [id])

  @@unique([offerId, raterId])
  @@index([targetId])
  @@map("ratings")
  @@schema("tenant_soukelkanto")
}

model SoukFavorite {
  id         String       @id @default(uuid()) @db.Uuid
  userId     String       @db.Uuid                                  // FK → core.GlobalUser
  listingId  String       @db.Uuid
  createdAt  DateTime     @default(now())

  listing    SoukListing  @relation(fields: [listingId], references: [id], onDelete: Cascade)

  @@unique([userId, listingId])
  @@index([userId])
  @@map("favorites")
  @@schema("tenant_soukelkanto")
}

model SoukSafeMeetSpot {
  id          String      @id @default(uuid()) @db.Uuid
  name        String      @db.VarChar(120)
  nameAr      String      @db.VarChar(120)
  district    String      @db.VarChar(64)
  latitude    Float
  longitude   Float
  description String?     @db.Text
  isActive    Boolean     @default(true)
  createdAt   DateTime    @default(now())

  offers      SoukOffer[]

  @@index([district])
  @@map("safe_meet_spots")
  @@schema("tenant_soukelkanto")
}

// =====================================================
// Enums
// =====================================================

enum SoukCategory {
  FURNITURE
  ELECTRONICS
  APPLIANCES
  FASHION
  KIDS_TOYS
  KIDS_CLOTHING
  KIDS_GEAR
  BOOKS_MEDIA
  SPORTS_OUTDOOR
  HOME_DECOR
  KITCHEN_DINING
  BABY_MATERNITY
  MOBILE_TABLETS
  VINTAGE_COLLECTIBLES
  MOVING_BUNDLE
  OTHER

  @@schema("tenant_soukelkanto")
}

enum SoukCondition {
  NEW_WITH_TAGS
  LIKE_NEW
  GOOD
  FAIR
  NEEDS_REPAIR
  FOR_PARTS

  @@schema("tenant_soukelkanto")
}

enum SoukListingStatus {
  ACTIVE
  RESERVED
  SOLD
  PENDING_REVIEW
  REMOVED
  EXPIRED

  @@schema("tenant_soukelkanto")
}

enum SoukOfferStatus {
  PENDING
  ACCEPTED
  DECLINED
  COUNTERED
  WITHDRAWN
  EXPIRED
  HANDOVER_PENDING
  CONFIRMED
  CLOSED
}
```

> Note: enum schema attribute follows Prisma `multiSchema` syntax. Adjust per your Prisma version if needed.

---

## 2. Cross-Schema References (in `core` schema)

These already exist in CoreMesh — no changes needed:

- `core.GlobalUser` — referenced by `sellerId`, `buyerId`, `raterId`, `targetId`, `userId` (FK enforcement is logical, not enforced at DB level due to multi-schema constraints).
- `core.KycRegistry` — read for `isVerified` chip.
- `core.GlobalUser.trustScore` — read for **internal** TrustScore check (gates listing creation; NOT displayed to users).
- `core.EcosystemSharedReport` — written into by `SoukRating` mapping.
- `core.TokenWallet` + `core.TokenAllocation` + `core.TokenTransaction` — used for buyer token hold.

**Added by TrustMeter feature** (see `CoreMesh/docs/trust-meter.md §5.2`):

- `core.TrustMeter` — one per `GlobalUser`. Souk ElKanto reads `{total, tier, tierReachedAt}` on every listing/profile render.
- `core.TrustMeterEvent` — append-only ledger. Souk ElKanto reads (via `/api/v1/trust-meter/users/:userId/events`) for the public activity feed shown on profiles. Souk ElKanto **never writes** this directly.
- `core.TrustMeterActionDefinition` — admin-editable point map. Souk ElKanto doesn't touch this at all.
- `core.TrustMeterBonusGrant` — surfaced in the user's dashboard wallet tab.

---

## 3. Indices & Performance

| Query pattern | Index |
|--------------|-------|
| Browse by category in district | `(category, district, createdAt DESC)` composite — add if traffic grows |
| Search by seller | `sellerId` (declared) |
| Find expired offers (cron) | `(status, tokenHoldExpiresAt)` — add post-launch |
| Duplicate photo detection | `phash` (declared) |
| Semantic search | pgvector IVF index on `embedding` — add after embedding column populated |

`CREATE INDEX listings_embedding_idx ON tenant_soukelkanto.listings USING ivfflat (embedding vector_cosine_ops);`

---

## 4. Migrations

Use Prisma migrations (not `db push`) for production:

```bash
cd CoreMesh
npx prisma migrate dev --name add_soukelkanto_tenant
```

Generated SQL should be reviewed for:
- pgvector extension already enabled (it is — CoreMesh uses it).
- Schema `tenant_soukelkanto` is created.
- All `@@map` table names match.

---

## 5. Seed Data

### 5.1 Safe Meet Spots (10 starter coordinates inside Madinaty)

```ts
// scripts/seed-safe-meet-spots.ts
const spots = [
  { name: "Madinaty Gate 1 - Visitor Lobby", nameAr: "بوابة مدينتي 1 - بهو الزوار", district: "GATE", latitude: 30.10861, longitude: 31.61639 },
  { name: "Madinaty Club Reception", nameAr: "استقبال نادي مدينتي", district: "CLUB", latitude: 30.10250, longitude: 31.62100 },
  { name: "Open Air Mall - Central Plaza", nameAr: "أوبن إير مول - الميدان", district: "MALL", latitude: 30.10550, longitude: 31.62800 },
  { name: "Craft Zone - Café Corner", nameAr: "كرافت زون - ركن الكافيه", district: "CRAFT", latitude: 30.10980, longitude: 31.63200 },
  // ... 6 more
];
```

### 5.2 Initial Category Suggestions Visibility

Pin top categories on home page based on initial Madinaty pattern:
1. KIDS_TOYS
2. KIDS_CLOTHING
3. FURNITURE
4. APPLIANCES
5. MOVING_BUNDLE
6. ELECTRONICS

---

## 6. Data Retention

| Table | Retention | Cleanup |
|-------|-----------|---------|
| `listings` (status=ACTIVE) | indefinite | seller deletes / marks sold |
| `listings` (status=SOLD or REMOVED) | 365 days then anonymize seller | nightly cron |
| `listing_photos` | follows parent listing | cascade |
| `offers` (status=DECLINED/WITHDRAWN/EXPIRED) | 180 days | cron |
| `handovers` | indefinite (trust history) | — |
| `ratings` | indefinite | — |
| `favorites` | indefinite | user deletes |
| `safe_meet_spots` | indefinite (admin-managed) | — |
