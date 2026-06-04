# Product

## Register

product

## Users

**Madinaty residents.** 700K+ people inside Egypt's largest integrated city (TMG/AMI, New Cairo, 8,000 acres, 23 districts). Five active personas, all phone-first, all mid-flow when they open Kanto:

- **The Mover** — family relocating between districts or leaving the city. Needs to clear a household quickly. High-volume, time-sensitive seller. Opens Kanto on the couch the night before move day.
- **The Outgrowing Parent** — kids 0–12 cycling through clothes, toys, gear every season. Cycles continuously in both directions. Opens Kanto from the playground or during nap-time.
- **The Upgrader** — replacing furniture or appliances, wants to sell mid-value items without strangers walking through the apartment.
- **The Bargain Hunter** — students, cost-conscious families, new arrivals. Bought their last item on Facebook and got burned.
- **The Sustainable Buyer** — eco-conscious resident who buys used by principle. Wants to actually feel good about the trade, not lectured at.

Shared context: Arabic-first speakers, smartphone-dominant, WhatsApp is the default communication app, suspicious of strangers but trust their neighbors. They've already tried the existing alternatives (40+ Facebook groups, dozens of WhatsApp chats) and bear the scars: stolen photos, no-show buyers, scam DMs, hours wasted on tire-kickers.

## Product Purpose

A peer-to-peer, second-hand marketplace **scoped to one city**, built as a tenant of the MadinatyAI ecosystem. Replaces fragmented Facebook/WhatsApp groups with a single curated space backed by four trust pillars: KYC-verified neighbors, portable TrustMeter reputation, designated Safe Meet Spots inside Madinaty, and an optional 72h closed-loop token hold as commitment.

The platform is a **transparent broker**. It facilitates discovery, communication, and trust signals; settlements happen off-platform between residents. No money moves through Kanto. No card processing, no escrow, no banking license. Tokens are closed-loop credits, never currency.

Success at v1 = 2,000 listings, 800 active sellers, 1,200 confirmed handovers, and <2% reported-listing rate within 90 days of launch.

## Brand Personality

**Three words:** trusted neighbor, warm, uncluttered.

**Tone of voice (AR):** كأنك بتكلم جارك على القهوة. Conversational Egyptian, not classical/formal Arabic. Never salesy. Never urgent.

**Tone of voice (EN):** "Found by neighbors, for neighbors." Friendly, low-key, never pushy. Slightly Egyptian-craft in feel — the visual metaphor is a covered souk's curated stalls, not a wholesale warehouse.

**Emotional goals:** confidence (these are my neighbors, not strangers), calm (no FOMO, no countdown timers), pride (I cleaned the apartment AND helped someone else's kid get a crib).

## Anti-references

Confirmed: do **not** look or feel like any of these:

- **OLX / Dubizzle** — banner-ad clutter, dense rows of low-trust listings, cold corporate aesthetic. The pattern Kanto exists to replace.
- **Facebook Marketplace** — chaotic infinite scroll, no curation, no reputation, mixed quality, scam DMs in the inbox.
- **Crypto / web3** — neon-on-black, monospace everything, holographic gradients, terminal vibes, futurism cosplay. Wrong audience and wrong values.
- **Generic SaaS-cream** — Stripe-Linear-Vercel-Notion sameness: white background, navy text, soft-shadow rounded card, tasteful blue gradient. Souk ElKanto is a residential community marketplace, not a B2B tool. Cleanliness without warmth is not the brief.
- **FLASH-SALE energy** — red-orange "ENDS IN 02:14:33" urgency, large discount stickers, jumpy hero carousels.
- **Reputation as scoreboard** — leaderboards, public point counters with prominent numbers, gamified streaks. TrustMeter is shown as a calm tier badge, not a score-chase.

## Design Principles

1. **Trust before price, in Arabic by default.** Every listing surfaces KYC verification + TrustMeter tier before the asking price reaches the reader's eye. Arabic is the canonical voice; English is the secondary translation. RTL is engineered, not retro-fitted. Trust language is localized to Egyptian conversational tone, not translated from a global template.

2. **Broker, never bank.** No checkout button. No card iconography. No "Pay" or "Buy now" verb anywhere in the UI. Tokens are visualized as commitment chips with a countdown — never as a balance the user spends. The visual vocabulary must read as "community signal", not "fintech".

3. **Souk warmth, not market chaos.** Stall-paper background tones, a single warm coral accent (`--kanto-coral`), generous whitespace, low-density listing grid (2 columns mobile, 4 desktop). The opposite of a classifieds wall. Curated, not crammed. Density is reserved for the seller dashboard, never the public browse surface.

4. **Mobile-first, WhatsApp-shaped, earned delight.** Every flow ships fully usable at 375px wide. Share-to-WhatsApp is a first-class action on every listing. Phone-OTP, not email. Celebratory micro-interactions (tier-up ribbon, handover-confirmed flourish) appear rarely so they actually land — never on routine actions like favoriting or scrolling.

## Accessibility & Inclusion

Target: **WCAG 2.1 AA strict, with full RTL parity and prefers-reduced-motion compliance.**

Concrete commitments:

- Every interactive element has ≥4.5:1 contrast against its background in both Sunny Horizon (light) and Aurora Night (dark) themes. Decorative `--kanto-coral` text on `--kanto-coral-soft` background is rejected if it falls below — coral always renders on white or `--kanto-stall` instead.
- A visible focus ring (`2px solid var(--teal-bright)`, 2px offset) appears on every focusable element. Never `outline: none` without an explicit replacement.
- All RTL handling uses logical properties (`margin-inline`, `padding-inline`, `inset-inline`) so direction flips without pixel-mirroring. Carousels and chip scrollers reverse drag direction in RTL. Icons that imply direction (arrows, chevrons) mirror; symbolic icons (search, heart) do not.
- `@media (prefers-reduced-motion: reduce)` collapses all transitions to instant or opacity-only fades. The duration tokens `--dur-fast/med/slow` are zeroed out at this media query.
- Touch targets are ≥44×44 px on mobile.
- All form inputs have visible labels (placeholders are not labels). Errors announce via `aria-live="polite"`.
- Photo carousels announce "Image X of Y" to screen readers. Safe Meet Spot maps include a text alternative listing the three nearest spots for users who can't see the map.
- All copy localized AR + EN with parity (no English-only string slipping through).
