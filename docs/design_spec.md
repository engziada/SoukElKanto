# Souk ElKanto — Figma-Ready Design Spec

> Hand off this doc to a designer / Figma + AI plugin / Claude Code to generate the UI.
> Inherits the MadinatyAI "Sunny Horizon" (light) / "Aurora Night" (dark) token system from `Platform/`.

---

## 1. Brand North Star (project-specific)

| Aspect | Choice |
|--------|--------|
| Personality | Trusted neighbor · warm · uncluttered · slightly Egyptian-craft |
| Visual metaphor | Curated stalls in a covered market — not a wholesale warehouse |
| Tone of voice (AR) | كأنك بتكلم جارك على القهوة — مش رسمي، مش مبتذل |
| Tone of voice (EN) | Friendly, never salesy. "Found by neighbors, for neighbors." |
| Don't | Use red-orange "FLASH SALE" energy. Don't use ratings as scoreboards. Don't gamify excessively. |

---

## 2. Color Tokens (additions on top of MadinatyAI base)

Reuse all base tokens from `Platform/src/app/globals.css`. Souk ElKanto adds **one signature accent**: the "Kanto Coral" — warmth without aggression.

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--kanto-coral` | `#ff8366` | `#ff9a7a` | CTAs unique to Kanto (make offer, save) |
| `--kanto-coral-soft` | `#fff0eb` | `#3d1f15` | Coral-tinted surfaces |
| `--kanto-stall` | `#f5ecdc` | `#1f1a14` | "Stall-paper" background texture for cards |
| `--kanto-stall-edge` | `#e8d9bd` | `#332b1f` | Subtle stall-card edge tint |
| `--kanto-tier-new` | `#94a3b8` | `#64748b` | TrustMeter NEW (0-200) — slate |
| `--kanto-tier-bronze` | `#b45309` | `#d97706` | TrustMeter BRONZE (201-500) |
| `--kanto-tier-silver` | `#64748b` | `#94a3b8` | TrustMeter SILVER (501-1000) |
| `--kanto-tier-gold` | `#ca8a04` | `#eab308` | TrustMeter GOLD (1001-2000) |
| `--kanto-tier-platinum` | `#0e7490` | `#22d3ee` | TrustMeter PLATINUM (2001-3000) |

All other tokens (`--bg`, `--surface`, `--teal`, `--text`, etc.) inherit from MadinatyAI base.

---

## 3. Typography

Same as MadinatyAI base:
- Display: **Orbitron** (EN) / **Cairo Bold** (AR)
- Headlines: **Space Grotesk** / **Cairo SemiBold**
- Body: **Inter** / **Cairo Regular**
- Micro / labels: **Inter** / **Changa**

Souk ElKanto-specific:
- **Price tag** font: `Space Grotesk` 700, tabular nums, slightly tracked.
- **TrustMeter total**: same as price tag, but in `--kanto-tier-*` colors per active tier.
- **TrustMeter tier label**: `Inter` 600, uppercase, 0.06em tracking, micro-size.

---

## 4. Radii, Shadows, Spacing

| Token | Value | Usage |
|-------|-------|-------|
| `--r-sm` | 8px | inputs, chips |
| `--r-md` | 12px | small cards |
| `--r-lg` | 20px | listing cards (signature softer corners than Platform) |
| `--r-xl` | 28px | hero panels |
| `--r-pill` | 9999px | filter chips, buttons |
| `--shadow-card` | `0 8px 24px -6px rgb(0 0 0 / 0.08)` | listing card resting |
| `--shadow-card-hover` | `0 16px 40px -8px rgb(0 0 0 / 0.16)` | listing card hover |
| `--shadow-trust-pulse` | radial blur of `--kanto-trust-high` at 15% | TrustScore badge pulse |
| Spacing scale | 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 px |  |

---

## 5. Screens (v1)

Each screen below lists: purpose, key components, layout sketch, AR/EN notes.

### 5.1 Home (`/ar` or `/en`)

**Purpose:** Browse-mode landing. Trust-first; not a sale-blast.

**Layout (mobile-first):**

```
[NavBar — logo + locale + wallet pill]
[Hero — "اشتري واتعرف على جيرانك" + search bar + category chips horizontal scroll]
[Featured Stalls strip — 4 horizontally scrolling "Stall cards" highlighting active sellers]
[Today in Kanto — 12 newest listings grid (2 cols mobile, 4 desktop)]
[Trust banner — "✓ verified residents · safe meet spots · token holds"]
[Footer]
```

**Components:**
- `NavBar` (re-used from Platform)
- `KantoHero` (new)
- `CategoryChipScroll` (horizontal scroll, RTL-aware)
- `StallCard` (avatar + name + trust badge + listing count)
- `ListingCard` (photo, price tag, trust micro-chip, district)

**RTL note:** category scroll direction reverses; price tag stays LTR (Arabic numerals OK but `1,800 ج.م` not `ج.م 1,800`).

---

### 5.2 Listings grid (`/listings`)

**Purpose:** Power-browse with filters.

**Layout (desktop):**
```
[NavBar]
[Filter sidebar (256px) — category tree, price range, district, condition, KYC-only toggle, sort]
[Result grid (3-4 cols) + sticky filter summary chip bar on top]
```

**Mobile:** filter button opens bottom-sheet drawer.

**Empty state:** illustrated stall stallholder with line art, "ما لقيناش حاجة بالمواصفات دي. جرب فلتر أوسع." with "Clear filters" CTA.

---

### 5.3 Listing detail (`/listings/[id]`)

**Purpose:** Decision + offer.

**Layout (desktop):**
```
[Breadcrumb: الرئيسية / kids gear / IKEA Hemnes crib]
[2-col grid:
   Left: photo carousel (large, lightboxable)
   Right:
     [Price tag — large, --kanto-coral]
     [Title h1]
     [TrustPanel — KYC chip + TrustMeterBadge (md size) + tier-progress bar + member-since + district]
     [Description]
     [Category + Condition chips]
     [Photo timestamp warning if isPhotoStale]
     [CTA: "اعرض سعر" / "Make Offer" — primary, --kanto-coral]
     [Secondary: Save · Share · Report]
]
[Safe Meet Spots map preview — collapsed by default]
[Similar listings strip]
```

**TrustPanel visual hierarchy:**
1. Tier badge (largest, brand-colored leaf icon)
2. Tier label + total points (med)
3. Progress bar to next tier (subtle, --text-soft)
4. KYC verified chip
5. Member-since · district (smallest, --text-muted)

**Mobile:** stacked; sticky bottom-action-bar with Save + Offer CTA.

**Components:** `PhotoCarousel`, `TrustPanel`, `PriceTag`, `OfferModal`, `SafeMeetSpotMap`, `SimilarListingsStrip`.

---

### 5.4 Create listing wizard (`/listings/new`)

4-step wizard:

| Step | Content |
|------|---------|
| 1 | Photos: drag-and-drop or "Add photo" tile. 1-8 photos. EXIF date check. Drag to reorder. |
| 2 | Details: title, description, category (with AI suggestion chip), condition, district. |
| 3 | Price: input + "Suggest fair price" button → shows AI range. |
| 4 | Review: read-only summary. Big "نشر الإعلان" / "Publish" CTA. |

Each step has a progress dots row and "Save draft" link.

---

### 5.5 Offer modal (overlay on listing detail)

**Purpose:** Make an offer in 2 taps.

**Content:**
- Asking price (read-only)
- Your offer input (EGP, default = asking)
- Note textarea (optional, 200 chars)
- Toggle: "Lock 5 tokens as commitment" (collapsible explanation: closed-loop, not money, 72h auto-release)
- Token hold amount slider (default 5, min 0, max 20)
- Buyer's wallet balance shown
- CTA "Send Offer" — primary coral

---

### 5.6 My Dashboard (`/my`)

Tab bar: **Listings · Offers · Handovers · Favorites · Wallet · TrustMeter**.

Each tab is a content area with cards filtered to the user.

**TrustMeter tab layout:**
```
[TrustMeterMeter — full progress visualization, large]
[Bonus grants strip — "Tokens earned from tier upgrades": list of TrustMeterBonusGrant rows]
[TrustMeterActivityFeed — last 30 events with pagination]
[How TrustMeter works — collapsible info section with link to ecosystem-wide explanation]
```

**Wallet tab:** existing balances + a sub-section "Trust-earned bonuses" listing all `TrustMeterBonusGrant` rows (read from `/api/v1/trust-meter/me/bonus-grants`).

---

### 5.7 Handover screen (post-offer-accepted)

**Layout:**
```
[Sticky header: "ميعاد التسليم"]
[Safe Meet Spot map — large]
[Spot details: name, district, lat/lng, "Open in Maps" deep link]
[Timeline:
  ☑ Offer accepted (2 hours ago)
  ⏳ Meet at Safe Spot
  ⬜ Both confirm handover
  ⬜ Rate each other
]
[Big tap target: "أكدت التسليم" / "I confirm handover"]
[Disabled until you're within 2 hours of the agreed time]
[Other party status: "Ahmed has not confirmed yet"]
[Token hold countdown badge]
```

---

### 5.8 Rating modal (post-both-confirmed)

5-star selector (large taps) + comment textarea (300 chars) + "Submit rating" CTA.

Stars use `--kanto-coral` filled; empty stars use border `--text-soft`.

---

## 6. Components Library (Souk ElKanto-specific)

| Component | Description |
|-----------|-------------|
| `KantoHero` | Stall-paper background, search bar, category chip scroll |
| `ListingCard` | Photo 4:3, price tag, title clamp-2, trust chip, district pill |
| `StallCard` | Avatar + name + trust + listing count, used in featured strip |
| `TrustPanel` | KYC chip + **TrustMeter Tier badge + total + progress bar to next tier** + member-since + district. ARIA-rich. |
| `TrustMeterBadge` | Inline pill: tier leaf icon + tier label + total number. Three sizes (xs / sm / md). Used on listing cards, offer modal, profile header. |
| `TrustMeterMeter` | Full progress visualization: large total + tier ribbon + bar to next tier + delta-to-go. Used on profile page only. |
| `TrustMeterActivityFeed` | Last 10 events: icon + service name + action + Δ pts + time-ago. RTL-aware. |
| `TierUpgradeToast` | Celebratory in-app notification: "🎉 وصلت Silver! +25 رمز أضيف لمحفظتك". Auto-dismiss after 8s. |
| `PriceTag` | Stylized price with `EGP` suffix, tabular numerals |
| `PhotoCarousel` | Swiper-like, supports lightbox, RTL-aware drag direction |
| `PhotoUploader` | Drag-and-drop + EXIF reader + duplicate-detection feedback |
| `CategoryChipScroll` | Horizontal scrolling category selector |
| `SafeMeetSpotMap` | Leaflet map with markers, "nearest 3" highlighted |
| `OfferModal` | Slide-up modal with token-hold toggle |
| `HandoverConfirm` | Two-tap convergence widget |
| `RatingStars` | Tap-large 5-star widget |
| `TokenHoldPill` | Live countdown + "Release" affordance for system |
| `WalletDrawer` | Slide-in sidebar showing token balances + recent txns |
| `ReportModal` | Severity 1-5 + reason + photo evidence |

---

## 7. Iconography

- Use **Lucide React** (matches Platform) for all icons.
- Souk-specific icons: `store` (NavBar logo lockup), `shield-check` (KYC badge), `handshake` (handover), `coins` (token hold), `map-pin` (Safe Meet Spot), `flag` (report).

---

## 8. Motion

| Element | Motion |
|---------|--------|
| Listing card hover | scale 1.02 + shadow lift, 200ms ease-out |
| TrustMeter badge mount | pulse-once ring (`--kanto-tier-*` per active tier), 600ms |
| TrustMeter tier-upgrade toast | slide-down + sparkle particles, 8s persistence |
| TrustMeter progress bar fill (after a positive event) | animated fill 800ms ease-out |
| Photo carousel transition | 320ms ease |
| Offer modal entrance | slide-up 320ms cubic-bezier(0.16, 1, 0.3, 1) |
| Handover both-confirmed | confetti burst + scale of success icon |
| Skeleton shimmer | 1.4s linear loop |

All motion respects `prefers-reduced-motion: reduce` — fallback to opacity-only.

---

## 9. Accessibility

- All text ≥ 4.5:1 contrast (light + dark).
- Focus rings visible on all interactive elements (use `--teal-bright` outline at 2px).
- Touch targets ≥ 44×44 (already in mobile rules).
- Carousel: keyboard arrows + announces "Image X of Y".
- Forms: every input has visible label; errors announced via `aria-live="polite"`.
- Map: text alternative listing the 3 nearest spots for screen readers.

---

## 10. Figma-Import Recipe

If a designer is rebuilding in Figma:

1. Set frame width to 1440 (desktop) and 390 (mobile-first iPhone 14).
2. Create local variables matching §2 color tokens (light + dark mode collections).
3. Create text styles per §3.
4. Build components in order: Atoms (PriceTag, TrustChip, KYCBadge, ListingCard) → Molecules (TrustPanel, PhotoCarousel, OfferModal) → Screens.
5. Use Auto Layout extensively. RTL handled by flipping direction of horizontal Auto Layouts.

If using an AI-to-Figma plugin:
- Feed sections of this spec one-by-one.
- Reference `Platform/src/app/globals.css` for exact CSS values.

---

## 11. Open Design Questions

- **Hero illustration:** custom artwork of a Madinaty stall (souk-arch silhouette + warm light) — needs commissioned art OR generated via image AI with brand-safe prompt.
- **Stall-paper texture:** subtle noise + warm gradient — try CSS-only first; fall back to PNG.
- **Trust badge animation:** confirm with brand team that the pulse-once is not too "gamified".
- **Empty illustrations:** style — line art? blob art? Sticking with line art for now.
