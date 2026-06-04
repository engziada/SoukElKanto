---
name: Souk ElKanto
description: The covered souk of Madinaty — warm, trust-first, Arabic-native.
colors:
  # Brand & accent
  stallkeeper-coral: "#ff8366"
  coral-awning: "#fff0eb"
  sun-baked-coral: "#ff6b5b"
  sun-baked-coral-soft: "#ffd7d1"
  cairo-honey: "#ffc94a"
  cairo-honey-soft: "#fff1c2"
  faience-teal: "#0bb8c7"
  lagoon-bright: "#14d4d4"
  faience-soft: "#ccfbf1"
  resident-indigo: "#2b6eff"
  resident-indigo-deep: "#1e4fd9"
  garden-mint: "#22c993"
  garden-mint-soft: "#cdf3e3"
  twilight-lilac: "#9b7bff"

  # Stall warmth
  stall-paper: "#f5ecdc"
  stall-paper-edge: "#e8d9bd"

  # Neutrals (light theme — "Sunny Horizon")
  morning-haze: "#f6f9ff"
  daylight-cream: "#eef3ff"
  stall-linen: "#fdfeff"
  awning-shade: "#f3f7ff"
  souk-mist: "#e6eeff"
  atlas-midnight: "#0c1a33"
  slate-smoke: "#516787"
  dusty-cloud: "#8094b0"
  warm-white: "#fffaf7"
  cool-white: "#f9fdff"

  # TrustMeter tier ribbons
  tier-quiet-slate: "#94a3b8"
  tier-worked-bronze: "#b45309"
  tier-mantle-silver: "#64748b"
  tier-aged-brass: "#ca8a04"
  tier-verdigris: "#0e7490"

  # Aurora Night (dark theme)
  night-bg: "#07101e"
  night-bg-alt: "#0d1a30"
  night-surface: "#0f1b30"
  night-surface-mid: "#142340"
  night-text: "#e8efff"
  night-coral: "#ff9a7a"
  night-stall: "#1f1a14"

typography:
  display:
    fontFamily: "Orbitron, Space Grotesk, system-ui, sans-serif"
    fontSize: "clamp(1.7rem, 4.5vw, 3rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Space Grotesk, Inter, system-ui, sans-serif"
    fontSize: "1.6rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Space Grotesk, Inter, system-ui, sans-serif"
    fontSize: "1.05rem"
    fontWeight: 600
    lineHeight: 1.35
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0.01em"
  body-ar:
    fontFamily: "Cairo, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.7
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.78rem"
    fontWeight: 600
    letterSpacing: "0.04em"
  price-tag:
    fontFamily: "Space Grotesk, Inter, system-ui, sans-serif"
    fontSize: "0.92rem"
    fontWeight: 700
    letterSpacing: "-0.01em"
    fontFeature: "'tnum' on"

rounded:
  sm: "0.5rem"
  md: "0.875rem"
  lg: "1.25rem"
  xl: "1.75rem"
  pill: "9999px"

spacing:
  "1": "0.25rem"
  "2": "0.5rem"
  "3": "0.75rem"
  "4": "1rem"
  "5": "1.5rem"
  "6": "2rem"
  "7": "3rem"
  "8": "4rem"
  "9": "6rem"

components:
  button-primary:
    backgroundColor: "{colors.stallkeeper-coral}"
    textColor: "{colors.warm-white}"
    rounded: "{rounded.pill}"
    padding: "0.55rem 1rem"
  button-primary-hover:
    backgroundColor: "{colors.sun-baked-coral}"
    textColor: "{colors.warm-white}"
    rounded: "{rounded.pill}"
  button-ghost:
    backgroundColor: "{colors.stall-linen}"
    textColor: "{colors.slate-smoke}"
    rounded: "{rounded.pill}"
    padding: "0.55rem 1rem"
  card-listing:
    backgroundColor: "{colors.stall-linen}"
    rounded: "{rounded.lg}"
  price-tag:
    backgroundColor: "{colors.stallkeeper-coral}"
    textColor: "{colors.warm-white}"
    rounded: "{rounded.sm}"
    padding: "0.3rem 0.7rem"
  chip:
    backgroundColor: "{colors.awning-shade}"
    textColor: "{colors.slate-smoke}"
    rounded: "{rounded.pill}"
    padding: "0.35rem 0.75rem"
  chip-accent:
    backgroundColor: "{colors.coral-awning}"
    textColor: "{colors.stallkeeper-coral}"
    rounded: "{rounded.pill}"
    padding: "0.35rem 0.75rem"
  input-text:
    backgroundColor: "{colors.morning-haze}"
    textColor: "{colors.atlas-midnight}"
    rounded: "{rounded.sm}"
    padding: "0.7rem 0.9rem"
  hero-stall-panel:
    backgroundColor: "{colors.stall-paper}"
    textColor: "{colors.atlas-midnight}"
    rounded: "{rounded.xl}"
    padding: "3rem 1.5rem"
---

# Design System: Souk ElKanto

## 1. Overview

**Creative North Star: "The Covered Souk"**

Souk ElKanto is the design language of a curated, indoor neighborhood market: stallkeepers you know by name, warm filtered light through fabric awnings, conversations over coffee. The system anchors on **Sunny Horizon** in light mode (daylight, sky, coral warmth) and **Aurora Night** in dark mode (deep navy, lagoon teal, warm-tinted near-white text). Both themes share the same souk metaphor: a covered space, never floodlit, never sterile.

This is a marketplace, but it explicitly **rejects** the classifieds vocabulary. Listings are stalls, not rows of ads. The signature coral (`#ff8366`) appears as a CTA accent and price tag — never as a sticker or a countdown. Trust signals (KYC verified, TrustMeter tier) precede the price visually on every listing. The grid breathes: two columns on mobile, never four. White-space is non-negotiable. Density is reserved for the seller dashboard, never the public browse surface.

The system descends from MadinatyAI's "Sunny Horizon" palette (deep navy text on cool-blue ground) and adds Souk ElKanto-specific tokens — `--kanto-coral`, `--kanto-stall`, `--kanto-stall-edge` — that carry the warm-craft character.

**Key Characteristics:**
- One signature accent (Stallkeeper Coral) used on ≤15% of any screen
- Ambient tinted glows, never hard black drop-shadows
- Tabular numerals on every price tag, currency suffix in user language
- RTL is a first-class layout direction, not a flip-translation
- The hero panel uses stall-paper cream + coral radial; no other surface does
- TrustMeter tier is a calm ribbon (Quiet Slate → Verdigris), never a leaderboard

## 2. Colors

A warm-on-cool palette: blue-tinted neutrals carry the calm, coral and honey carry the warmth, teal anchors the brand link color.

### Primary

- **Stallkeeper Coral** (`#ff8366`): the single signature accent. Used for the primary CTA (`Make Offer`, `Publish`), the floating Price Tag on every ListingCard, the active step in the create wizard, and the AR locale-toggle hover. Carried on ≤15% of any rendered surface.
- **Coral Awning** (`#fff0eb`): the soft tinted ground for coral chips and category badges. The only place coral surfaces appear without the gradient treatment.

### Secondary

- **Cairo Honey** (`#ffc94a`): paired with coral in the CTA gradient (`linear-gradient(135deg, var(--kanto-coral), var(--coral))`) and in the hero radial. Never used alone as a fill.
- **Faience Teal** (`#0bb8c7`): the trust color. Links, KYC-verified badge background (`--teal-dim`), the trust banner on the home page, the theme-toggle hover ring.
- **Resident Indigo** (`#2b6eff`): reserved for navigation chips and footer link hover. Never a CTA; that lane belongs to coral.

### Tertiary

- **Garden Mint** (`#22c993`): success states only (handover-confirmed checkmark, KYC-approved indicator).
- **Twilight Lilac** (`#9b7bff`): semantic-future. Reserved for the AI-suggestion chip when the suggest-category endpoint returns a result.

### Neutral

- **Morning Haze** (`#f6f9ff`): the page background in light mode. A blue-tinted near-white, never the body of a card.
- **Daylight Cream** (`#eef3ff`): the footer background and section gradient anchor.
- **Stall Linen** (`#fdfeff`): the canvas of every card, listing, modal. A hair of blue, never pure `#fff`. The most-used surface token in the system.
- **Awning Shade** (`#f3f7ff`): nav bar hover state, secondary chip backgrounds, input-field rest.
- **Souk Mist** (`#e6eeff`): the strongest cool background — used on hover for `surface-mid` rows, divider zones in the dashboard.
- **Atlas Midnight** (`#0c1a33`): primary text. Deep navy, never `#000`.
- **Slate Smoke** (`#516787`): secondary text — body copy, paragraph descriptions.
- **Dusty Cloud** (`#8094b0`): tertiary text — captions, timestamps, helper hints, district codes on cards.
- **Warm White** (`#fffaf7`): the `on-coral` text — what appears inside coral CTAs. Never pure `#fff`.
- **Cool White** (`#f9fdff`): the `on-teal` text — what appears on teal badges.

### Stall Warmth

- **Stall Paper** (`#f5ecdc`): the hero panel and the empty-photo placeholder. The only surface that breaks the cool-neutral family — by design, the warm anchor.
- **Stall Paper Edge** (`#e8d9bd`): the 1px border around the hero panel; the seam between awning fabric.

### TrustMeter Tier Ribbons

Calm tiers, deliberately desaturated. Worn metal, not arcade neon.

- **Quiet Slate** (`#94a3b8`) — NEW (0–200 pts)
- **Worked Bronze** (`#b45309`) — BRONZE (201–500)
- **Mantle Silver** (`#64748b`) — SILVER (501–1000)
- **Aged Brass** (`#ca8a04`) — GOLD (1001–2000)
- **Verdigris** (`#0e7490`) — PLATINUM (2001–3000)

### Named Rules

**The Coral Restraint Rule.** Stallkeeper Coral appears on ≤15% of any rendered surface. If a screen would push past 15%, the coral retreats to the Price Tag and CTA only. Decorative coral on background-coral is never used.

**The No-Pure-Neutrals Rule.** `#000` and `#fff` are forbidden in tokens, components, and ad-hoc styles. Every neutral is tinted toward blue (cool family) or warm (`stall-paper`, `warm-white`). Pure black/white kills the souk feel and produces SaaS-cream cliché.

**The Warmth-Anchor Rule.** Stall Paper (`#f5ecdc`) is the ONLY warm surface; everything else stays cool. Spreading the warm tone across multiple surfaces destroys the "covered, single light source" metaphor.

## 3. Typography

**Display Font:** Orbitron (Latin) — geometric, high-tech but quiet; only at hero scale and on the price tag.
**Headline Font:** Space Grotesk (Latin) / Cairo Bold (Arabic) — the section voice. Slightly wide, contemporary, neighborly.
**Body Font:** Inter (Latin) / Cairo (Arabic) — workhorse, optimized for screens.
**Micro Font:** Inter for Latin labels; **Changa** for Arabic chips and tier-tag micro-text.

**Character:** A subdued tech-display paired with humanist body. Display is bold-narrow; body is open and round. The pairing avoids editorial seriousness and avoids playful cartoon — both wrong for trust language. Arabic uses Cairo across the stack with Changa reserved for status pills.

### Hierarchy

- **Display** (700, `clamp(1.7rem, 4.5vw, 3rem)`, lh 1.1, ls −0.02em): hero title only. One per page maximum.
- **Headline** (700, `1.6rem`, lh 1.25, ls −0.015em): section titles (`Listings`, `My Offers`, `Create a Listing`).
- **Title** (600, `1.05rem`, lh 1.35): card headers, modal titles, dashboard tab names.
- **Body** (400, `1rem`, lh 1.6 Latin / 1.7 Arabic): paragraph copy, descriptions, hints. Capped at 65–75ch on any page.
- **Label** (600, `0.78rem`, ls 0.04em, lowercase or natural case): chip labels, tier ribbons, footer caption.
- **Price Tag** (700, `0.92rem`, tabular nums on): currency-suffixed amounts on listing cards. Always Space Grotesk for digit rhythm.

### Named Rules

**The Tabular-Nums-on-Prices Rule.** Every price renders with `font-variant-numeric: tabular-nums`. Misaligned 3-vs-4-digit prices in a grid look untrustworthy; tabular nums lock the column.

**The Arabic-First Rule.** The default `--font-body` becomes Cairo when `[lang="ar"]` or `[dir="rtl"]`. Arabic line-height is 1.7 (Latin is 1.6) — Arabic ascenders/descenders need the extra room to breathe.

**The Display-Rationing Rule.** Orbitron Display appears at most twice per route: the hero title, and the price on a focused ListingCard. Spreading Display further dilutes its impact.

## 4. Elevation

**Ambient lift, never hard shadows.** Cards rest with a soft tinted glow tinted toward `Resident Indigo` (in light mode) or pure rgba black at low opacity (in dark mode). On hover, the card lifts ~3px and the glow deepens. There are zero `#000` shadows in the system; every shadow is a tinted version of the dominant ground.

Coral CTAs carry a warm shadow (`--shadow-coral`) — coral-tinted, low opacity. This is the only shadow that ever uses a brand color; everything else uses indigo-tinted blacks.

### Shadow Vocabulary

- **`--shadow-card`** (`0 14px 42px rgba(20, 60, 140, 0.10), 0 2px 6px rgba(20, 60, 140, 0.06)`): the rest state of every ListingCard, OfferRow, Footer card, hero search bar.
- **`--shadow-card-hover`** (`0 24px 64px rgba(20, 60, 140, 0.16), 0 4px 10px rgba(20, 60, 140, 0.08)`): hover lift on cards. Pairs with a `transform: translateY(-3px)`.
- **`--shadow-coral`** (`0 12px 34px rgba(255, 131, 102, 0.30)`): the warm shadow under primary CTAs, the Price Tag, the locale-toggle hover. The only brand-colored shadow.
- **`--shadow-glow`** (`0 14px 50px rgba(11, 184, 199, 0.20)`): reserved for the TrustPanel KYC badge glow and theme-toggle interaction.

### Named Rules

**The Flat-Background-Rule.** The page background is flat. Depth is established by surface cards, not by gradient washes on the body. The radial-gradient in `.site-bg` is decorative atmosphere; it never carries hierarchy.

**The Tinted-Shadow Rule.** Every shadow uses `rgba(20, 60, 140, x)` (Resident Indigo low-opacity) or `rgba(255, 131, 102, x)` (Stallkeeper Coral). `rgba(0, 0, 0, x)` is forbidden in light mode.

## 5. Components

### Buttons

- **Shape:** Pill (`9999px`) for primary actions, medium-round (`0.875rem`) for navigation actions inside cards.
- **Primary CTA:** Coral gradient `linear-gradient(135deg, var(--kanto-coral), var(--coral))`, `--on-coral` text (Warm White `#fffaf7`), pill radius, `0.55rem 1rem` padding for nav-style, `0.85rem` for full-width hero CTAs. Carries `--shadow-coral`. On hover: `transform: translateY(-1px)`, shadow deepens.
- **Ghost:** Stall Linen background, Slate Smoke text, 1px border in `--border`. On hover: background shifts to Awning Shade, text to Atlas Midnight. Used for Save / Share / Report on the listing detail.
- **Locale toggle:** A 2.4rem pill in Awning Shade rest. On hover: full coral-honey gradient, `--shadow-coral`, Warm White text. The most playful interaction in the system.
- **Theme toggle (sun/moon):** Identical pill geometry to locale toggle. Sun icon in light mode, moon in dark, swapped via `[data-theme]`. Pure icon, no text.

### Chips

- **Filter / Category chip:** Awning Shade background, Slate Smoke text, pill radius, `0.35rem 0.75rem` padding. Label-class typography.
- **Accent chip (category match):** Coral Awning background, Stallkeeper Coral text, pill radius. Used on the listing detail to surface the category. ≤ 1 per chip cluster.
- **Tier chip (TrustMeter):** Background is the tier color at 12% opacity, text is the tier color at full. Pill radius. Compact (`0.25rem 0.6rem`). Label typography.

### Cards & Containers

- **Listing Card:** Corner radius `1.25rem` (`--r-lg`), Stall Linen background, soft `--border-soft` 1px border, `--shadow-card` rest. On hover: `translateY(-3px)`, `--shadow-card-hover`, photo scales 1.04× over 320ms. The photo wrap has aspect ratio `4 / 3`, overflow hidden, with a `stall-paper → surface-mid` gradient as the empty-photo placeholder.
- **Section card / Form panel:** Corner radius `1.25rem`, Stall Linen background, 1px `--border` border, `--shadow-card` rest. No hover state — these don't lift.
- **Hero stall panel:** Corner radius `1.75rem` (`--r-xl`), Stall Paper background with a 120% radial of Stallkeeper Coral at the top-right (15% opacity), 1px Stall Paper Edge border. Padding scales from `2rem 1rem` mobile to `4rem 3rem` desktop. The signature surface of the home page. Appears nowhere else.
- **No nested cards. Ever.** A card inside a card is always wrong; restructure with whitespace.

### Inputs / Fields

- **Style:** Morning Haze background, 1px `--border`, `--r-sm` radius (`0.5rem`), `0.7rem 0.9rem` padding, Atlas Midnight text.
- **Focus:** Border shifts to Stallkeeper Coral, plus a 3px outer glow `color-mix(in oklab, var(--kanto-coral) 20%, transparent)`. No box-shadow change beyond the glow.
- **Hero search bar:** A pill-shaped variant (`9999px`) of the input. Holds a Lucide search icon inside the bar (start position, RTL-aware). On focus the whole pill border shifts to coral, picks up `--shadow-coral`.

### Navigation

- **Header:** Sticky top, `color-mix(in oklab, var(--bg) 82%, transparent)` background, `backdrop-filter: blur(16px) saturate(140%)`, 1px `--border-soft` bottom border. Glassmorphism is rare in this system; this is one of the two acceptable uses.
- **Nav links:** Inter 500, `0.92rem`, Slate Smoke text. Hover: Atlas Midnight text, Awning Shade background, `--r-sm` padding pill. Active state inherited (no underline; no fill).
- **Brand mark:** Lucide `Store` icon inside a 2rem coral-gradient square, paired with "كانتو" (AR) or "Kanto" (EN) in Space Grotesk 700.
- **Mobile:** Nav links hide below `768px`. Header keeps brand, locale, theme toggle, login button. Hamburger / sheet menu deferred to Phase D.

### Signature: PriceTag

A pill-cornered (`--r-sm`) badge in coral gradient, Warm White text, `0.3rem 0.7rem` padding, Price-Tag typography (Space Grotesk 700, `0.92rem`, tabular nums). Positioned absolutely at `inset-block-end: var(--s-2); inset-inline-end: var(--s-2);` of every ListingCard photo wrap. Carries `--shadow-coral`. The single most-repeated visual element in the system; it is the "this is for sale" mark and the source of the souk's warmth.

### Signature: Dual-Logo Footer

A three-column grid (logo / divider / logo) collapsing to stacked rows below `768px`. Left: MadinatyAI logo + "MadinatyAI Ecosystem" + "This platform is part of…". Right: "Designed & built by" caption + ZSolutions wordmark. Both logos ship as light/dark SVG pairs in `/brand/`; the visible variant swaps via `[data-theme]` CSS rules — no JS. Bottom bar: copyright line, three footer links. The footer is the only place two brand marks coexist; it is also the only place attribution is shown.

## 6. Do's and Don'ts

### Do

- **Do** lead every listing with the KYC + TrustMeter tier ribbon, then the title, then the price. The trust signal precedes the offer.
- **Do** use Stallkeeper Coral on ≤15% of any screen. Reserve it for the Price Tag and the primary CTA. If you find yourself painting a third surface in coral, restructure.
- **Do** put Arabic line-height at 1.7 and Latin at 1.6. The mixed rendering needs the extra Arabic room.
- **Do** flow numbers through `font-variant-numeric: tabular-nums` whenever they sit in a column or grid.
- **Do** lift cards on hover by 3px with `transform`, not by deepening shadow alone. The micro-movement is what reads as warmth.
- **Do** mirror chevrons and arrows in RTL via `[dir="rtl"]` CSS rules. Symbolic icons (search, heart, store) stay un-mirrored.
- **Do** use logical properties (`margin-inline-start`, `inset-inline-end`, `padding-inline`) so every component flips correctly between LTR and EN.
- **Do** carry the dual-logo footer (MadinatyAI + ZSolutions) on every authenticated route. Attribution is not optional.

### Don't

- **Don't** use `#000` or `#fff` anywhere. Every neutral is tinted toward blue or warm.
- **Don't** apply `border-left` or `border-right` greater than 1px as a colored stripe on any card, alert, or list row. Side-stripe borders are banned.
- **Don't** use `background-clip: text` to make the brand text run a coral-to-honey gradient. Gradient text is decorative cliché; use a single solid color.
- **Don't** show a glassy `backdrop-filter` blur on hero panels, modals, or "premium" tiles. Glassmorphism is reserved for the sticky NavBar and the (later) WalletDrawer slide-in.
- **Don't** look like **OLX or Dubizzle.** No banner ads anywhere. No "Recommended Sponsored" rows. No price-strikethrough discounts.
- **Don't** look like **Facebook Marketplace.** No infinite-scroll without curation. No mixed-quality grid. No DM-the-seller shortcut bypassing the offer flow.
- **Don't** look like **crypto / web3 dashboards.** No neon-on-black, no monospace anywhere except in (future) developer/diagnostic surfaces. Aurora Night uses navy and tinted lagoon, not black.
- **Don't** look like **generic SaaS-cream.** No flat-white background + navy text + blue-gradient CTA. We have stall-paper warmth; use it.
- **Don't** use FLASH-SALE energy: no red countdown timers, no "ENDS IN" copy, no urgent oranges, no hero carousels of discount stickers.
- **Don't** make the TrustMeter tier a leaderboard. No top-100 boards, no public rankings, no big visible point counters. The tier badge is a calm ribbon.
- **Don't** nest cards. A card inside a card is always wrong. Use whitespace and tonal separation instead.
- **Don't** call coral "red" or "orange" anywhere in the UI copy. It is coral.
- **Don't** trigger celebratory animation (confetti, sparkle bursts, scale-up bounces) on routine actions — favorite, scroll, browse. Save delight for tier-up and confirmed-handover.
- **Don't** ever ship a string that exists in only one locale. AR and EN parity is enforced; the typed `messages/{ar,en}.json` shape catches missing keys.
