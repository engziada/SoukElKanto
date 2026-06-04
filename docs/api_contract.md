# Souk ElKanto — REST API Contract

> Versioned under `/api/v1/`. Hosted on CoreMesh gateway.
> Tenant context auto-injected via `x-tenant-id: kanto` header (preferred) or `kanto.madinatyai.com` subdomain.
> All responses follow CoreMesh global error/success envelope.

---

## 0. Conventions

### Headers (all requests)

| Header | Required | Value |
|--------|----------|-------|
| `Authorization` | Yes (except `/health`) | `Bearer <jwt>` |
| `x-tenant-id` | Yes | `kanto` |
| `Content-Type` | for POST/PATCH | `application/json` |
| `Accept-Language` | optional | `ar` (default) or `en` |

### Success envelope

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional human message"
}
```

### Error envelope

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR | NOT_FOUND | UNAUTHORIZED | FORBIDDEN | CONFLICT | INTERNAL_ERROR | INSUFFICIENT_TRUST | TOKEN_HOLD_FAILED | LISTING_PHOTO_DUPLICATE",
    "message": "Human-readable",
    "details": [{ "field": "...", "reason": "..." }]
  }
}
```

### Pagination

`?page=1&limit=20` — max limit 50. Response:

```json
{
  "success": true,
  "data": [ ... ],
  "pagination": { "page": 1, "limit": 20, "total_items": 437, "total_pages": 22 }
}
```

---

## 1. Listings

### `GET /api/v1/listings`
List active listings with filters.

**Query params**

| Param | Type | Description |
|-------|------|-------------|
| `category` | enum | One of `SoukCategory` |
| `condition` | enum | One of `SoukCondition` |
| `district` | string | Madinaty district code |
| `minPrice` | int | EGP |
| `maxPrice` | int | EGP |
| `q` | string | Full-text search |
| `semantic` | bool | If true, use pgvector embedding search |
| `sort` | enum | `newest` (default) / `price_asc` / `price_desc` / `popular` |
| `page` | int | 1 |
| `limit` | int | 20 |

**Response 200**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Like-new IKEA Hemnes crib",
      "category": "KIDS_GEAR",
      "condition": "LIKE_NEW",
      "askingPrice": 1800,
      "currency": "EGP",
      "district": "B5",
      "thumbnailUrl": "https://cdn.madinatyai.com/.../thumb.jpg",
      "photoCount": 6,
      "isPhotoStale": false,
      "createdAt": "2026-06-01T10:00:00Z",
      "seller": {
        "id": "uuid",
        "displayName": "Ahmed M.",
        "trustScore": 87,
        "isVerified": true,
        "memberSince": "2025-09-12"
      }
    }
  ],
  "pagination": { ... }
}
```

---

### `GET /api/v1/listings/:id`
Get a single listing (full detail).

**Response 200** — same shape as list item plus `description`, `photos[]`, `viewCount`, `favoriteCount`, `boostedUntil`.

**Seller summary now includes TrustMeter:**

```json
{
  "seller": {
    "id": "uuid",
    "displayName": "Ahmed M.",
    "isVerified": true,
    "memberSince": "2025-09-12",
    "trustMeter": {
      "total": 612,
      "tier": "SILVER",
      "tierReachedAt": "2026-03-22T18:42:00Z",
      "highestTotal": 720
    }
  }
}
```

> TrustScore is internal and **not** returned via this endpoint. It only gates listing creation (403 INSUFFICIENT_TRUST if ≤ 20).

---

### `POST /api/v1/listings`
Create a listing.

**Body**

```json
{
  "title": "Like-new IKEA Hemnes crib",
  "description": "Bought 14 months ago, barely used. Comes with mattress.",
  "category": "KIDS_GEAR",
  "condition": "LIKE_NEW",
  "askingPrice": 1800,
  "district": "B5",
  "photos": [
    { "r2Key": "uploads/u-123/abcd.jpg", "position": 0 },
    { "r2Key": "uploads/u-123/efgh.jpg", "position": 1 }
  ]
}
```

**Errors**

- 400 `VALIDATION_ERROR` — missing/invalid fields.
- 403 `INSUFFICIENT_TRUST` — seller TrustScore ≤ 20.
- 422 `LISTING_PHOTO_DUPLICATE` — phash matches recent listing.

**Response 201** — full listing object + `aiSuggestions` block (suggested category if AI detects a different one, suggested price range).

---

### `PATCH /api/v1/listings/:id`
Update own listing (owner-only).

**Body** — partial fields from create.

**Response 200** — updated listing.

---

### `DELETE /api/v1/listings/:id`
Soft-delete (status=`REMOVED`).

**Response 204**

---

### `POST /api/v1/listings/:id/report`
Report a listing.

**Body**

```json
{
  "severity": 3,
  "incidentType": "SCAM | SPAM | FRAUD | POLICY_VIOLATION | OTHER",
  "reason": "Photo stolen from Pinterest",
  "evidencePhotoR2Key": "uploads/u-456/proof.jpg"
}
```

**Response 201** — `{ reportId }`. Wraps existing `EcosystemSharedReport` model.

---

### `POST /api/v1/listings/photo-upload-url`
Returns a presigned R2 PUT URL.

**Body**

```json
{ "filename": "crib.jpg", "contentType": "image/jpeg", "bytes": 1248273 }
```

**Response 200**

```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://r2.cloudflarestorage.com/...?X-Amz-Signature=...",
    "r2Key": "uploads/u-123/2026-06-01/abcd.jpg",
    "expiresInSeconds": 300
  }
}
```

---

## 2. Offers

### `POST /api/v1/offers`
Make an offer.

**Body**

```json
{
  "listingId": "uuid",
  "amount": 1600,
  "note": "Can pick up tomorrow afternoon",
  "tokenHoldAmount": 5
}
```

**Response 201** — offer + `safeMeetSpotSuggestion` (auto-attached on accept, but client gets a preview).

---

### `PATCH /api/v1/offers/:id/accept`
Seller accepts.

**Body** — empty.

**Response 200** — updated offer with `safeMeetSpot` populated + `tokenHoldExpiresAt`.

Side effects:
- Listing → `RESERVED`.
- Buyer tokens locked (if `tokenHoldAmount` set).
- Event emitted.

---

### `PATCH /api/v1/offers/:id/decline`
Seller declines.

**Body**

```json
{ "reason": "Too low" }
```

**Response 200**

---

### `PATCH /api/v1/offers/:id/counter`
Seller counters with a new amount.

**Body**

```json
{ "amount": 1750 }
```

**Response 200** — new offer with `parentOfferId` set; parent offer status → `COUNTERED`.

---

### `PATCH /api/v1/offers/:id/withdraw`
Buyer withdraws.

**Response 200**

---

### `GET /api/v1/offers/sent`
Buyer's outgoing offers.

### `GET /api/v1/offers/received`
Seller's incoming offers.

---

## 3. Handover

### `POST /api/v1/handover/:offerId/confirm`
Either party confirms handover.

**Response 200**

```json
{
  "success": true,
  "data": {
    "offerId": "uuid",
    "buyerConfirmedAt": "2026-06-03T14:30:00Z",
    "sellerConfirmedAt": null,
    "bothConfirmedAt": null,
    "ratingWindowEndsAt": null
  }
}
```

When both sides have confirmed, `bothConfirmedAt` is set, listing → `SOLD`, token hold released, rating window opens.

---

## 4. Ratings

### `POST /api/v1/ratings`
Rate counterparty post-handover (within 24h window).

**Body**

```json
{
  "offerId": "uuid",
  "score": 5,
  "comment": "Smooth handover, item as described."
}
```

**Response 201** — `{ ratingId, mappedSeverity, targetUserTrustScoreNew }`.

---

## 5. Categories & Safe Meet Spots

### `GET /api/v1/categories`
Returns category enum values with localized labels.

```json
{
  "success": true,
  "data": [
    { "value": "KIDS_TOYS", "labelEn": "Kids' Toys", "labelAr": "ألعاب الأطفال", "icon": "puzzle" },
    ...
  ]
}
```

### `GET /api/v1/safe-meet-spots`
List active Safe Meet Spots.

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Madinaty Club Reception",
      "nameAr": "استقبال نادي مدينتي",
      "district": "CLUB",
      "latitude": 30.1025,
      "longitude": 31.621
    }
  ]
}
```

### `GET /api/v1/safe-meet-spots/nearest?lat=30.10&lng=31.62`
Returns top 3 nearest spots, sorted by Haversine distance.

---

## 6. Favorites

### `POST /api/v1/favorites/:listingId`
Add to favorites.

### `DELETE /api/v1/favorites/:listingId`
Remove from favorites.

### `GET /api/v1/favorites`
List user's favorites.

---

## 7. AI helpers

### `POST /api/v1/ai/suggest-category`
Returns top-3 category enum suggestions with confidence (LOW complexity → Ollama).

**Body**

```json
{ "title": "BabyZen Yoyo stroller, gray, very good condition", "firstPhotoR2Key": "uploads/u-123/abcd.jpg" }
```

**Response 200**

```json
{
  "success": true,
  "data": {
    "suggestions": [
      { "category": "KIDS_GEAR", "confidence": 0.94 },
      { "category": "BABY_MATERNITY", "confidence": 0.81 },
      { "category": "MOVING_BUNDLE", "confidence": 0.12 }
    ]
  }
}
```

### `POST /api/v1/ai/suggest-price`
Returns a fair EGP range (HIGH complexity → Gemini + pgvector comparable lookup).

**Body**

```json
{
  "title": "...",
  "category": "KIDS_GEAR",
  "condition": "LIKE_NEW",
  "district": "B5",
  "photos": ["uploads/u-123/abcd.jpg"]
}
```

**Response 200**

```json
{
  "success": true,
  "data": {
    "suggestedRangeEgp": { "min": 1500, "median": 1750, "max": 2000 },
    "comparablesCount": 7,
    "rationaleAr": "...",
    "rationaleEn": "..."
  }
}
```

---

## 8. Health & Metrics

### `GET /api/v1/health`
Always 200 if module is wired correctly.

```json
{ "success": true, "data": { "status": "ok", "module": "soukelkanto", "version": "0.1.0" } }
```

---

## 9. Rate Limits

| Endpoint | Limit |
|----------|-------|
| `POST /listings` | 10 / hour / user |
| `POST /offers` | 30 / hour / user |
| `POST /listings/photo-upload-url` | 60 / hour / user |
| `POST /ai/suggest-*` | 30 / hour / user |
| `POST /listings/:id/report` | 20 / day / user |
| All others | 100 / minute / user (CoreMesh default) |

Returns `429 Too Many Requests` with `Retry-After` header.

---

## 10. TrustMeter Integration (read-only consumption)

Souk ElKanto does **not** own TrustMeter endpoints. They live in CoreMesh under `/api/v1/trust-meter/*`. The frontend consumes:

| Endpoint | When |
|----------|------|
| `GET /api/v1/trust-meter/users/:userId` | On listing detail render, offer screen render |
| `GET /api/v1/trust-meter/me` | On dashboard load |
| `GET /api/v1/trust-meter/me/bonus-grants` | On dashboard wallet tab |

Souk ElKanto's **listings, offers, handovers, ratings, and reports** all emit BullMQ events (per `architecture.md §3.6`) that the TrustMeter event-listener consumes server-side. **No direct writes from Souk ElKanto to TrustMeter — ever.**

Domain events Souk ElKanto MUST emit (payload contracts in `CoreMesh/docs/trust-meter.md §5.6`):

| Event | Payload core fields |
|-------|--------------------|
| `souk.handover.confirmed` | `{ offerId, listingId, buyerId, sellerId, confirmedAt }` |
| `souk.rating.received` | `{ offerId, raterId, targetId, score }` |
| `souk.listing.sold.within30d` | `{ listingId, sellerId, soldAt, listedAt }` |
| `souk.listing.unlisted.under24h` | `{ listingId, sellerId, unlistedAt, listedAt }` |
| `souk.listing.expired` | `{ listingId, sellerId, expiredAt }` |
| `souk.offer.noshow` | `{ offerId, userId, role: 'buyer' \| 'seller' }` |
| `souk.report.verified` | `{ reportId, targetId, severity }` |

The event-listener guarantees idempotency on `(serviceSubdomain='kanto', actionType, referenceType, referenceId)`, so safe-to-retry semantics on the emitter side.

---

## 11. Webhooks (outbound)

Optional, off by default. When enabled per tenant, fires to admin URL:

| Event | Payload |
|-------|---------|
| `souk.listing.flagged` | listingId, reason, severity |
| `souk.user.suspended` | userId, reason |
| `souk.handover.completed` | offerId, listingId, amount |

Signed with `WEBHOOK_SECRET` matching Platform/ convention.
