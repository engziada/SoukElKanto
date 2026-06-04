# Souk ElKanto — Documentation Index

> **Souk ElKanto** (سوق الكنتو) — Pre-loved goods marketplace for Madinaty residents.
> A community-tenant under the **MadinatyAI Ecosystem Hub** (CoreMesh).
>
> **Status:** Planning · v0 · 2026-06-01
> **Tenant subdomain:** `kanto`
> **Tenant schema:** `tenant_soukelkanto`

---

## Quick Facts

- **What:** P2P (resident-to-resident) marketplace for second-hand, vintage, kids-outgrown, moving-sale goods.
- **Why:** Madinaty's 700K residents constantly cycle goods (kids grow, families move, upgrades) — currently flowing through fragmented WhatsApp/Facebook groups with zero trust layer.
- **Differentiator:** Powered by CoreMesh — verified KYC, portable TrustScore, closed-loop token-hold commitment, Safe Meet Spots inside Madinaty.
- **Broker stance:** Listings + offer/counter-offer only. Settlement off-platform. No funds held. Token holds are commitment signals, never cash.

---

## Documents

| # | File | Purpose |
|---|------|---------|
| 1 | [`feasibility_swot.md`](./feasibility_swot.md) | Feasibility + ROI + Risk matrix + SWOT (EN + AR) |
| 2 | [`prd_business.md`](./prd_business.md) | Product Requirements Doc + Business plan (EN + AR) |
| 3 | [`architecture.md`](./architecture.md) | Business + Technical architecture (with Mermaid diagrams) |
| 4 | [`tech_plan.md`](./tech_plan.md) | Implementation steps (sequential + parallel), stack rationale |
| 5 | [`data_model.md`](./data_model.md) | Prisma schema for `tenant_soukelkanto` |
| 6 | [`api_contract.md`](./api_contract.md) | REST endpoint contract (versioned `/api/v1/...`) |
| 7 | [`design_spec.md`](./design_spec.md) | Figma-ready design spec (tokens, screens, components) |
| 8 | [`ai_prompt.md`](./ai_prompt.md) | Comprehensive prompt to feed Claude Code for implementation |

---

## Locked Decisions (from intake)

| Decision | Value |
|----------|-------|
| Name | Souk ElKanto (literal Arabic framing kept) |
| Sellers | P2P only — Madinaty residents only |
| Transaction model | Listings + offer/counter-offer + trust layer + category focus + lightweight protection |
| Frontend v1 | Next.js 15 web (matches `Platform/` stack) |
| Frontend v2 | Flutter mobile (shared API contract from day one) |
| Backend | New tenant module on existing CoreMesh — no new gateway |
| Tenant strategy | New PostgreSQL schema `tenant_soukelkanto` |
| Auth | Reuses CoreMesh GlobalUser + JWT |
| KYC | Reuses CoreMesh KycEngine |
| Trust | Reuses CoreMesh TrustScore (portable across all tenants) |
| Wallet | Reuses CoreMesh Shared Token Wallet (closed-loop) |
| Multi-tenancy | Reuses CoreMesh TenantMiddleware + TenantContext (AsyncLocalStorage) |
| Events | Reuses CoreMesh BullMQ + EcosystemCrossMatches |

---

## Lightweight Protection Layer (v1)

Eight mechanisms — all building on CoreMesh primitives — to keep buyers and sellers safe without making Souk ElKanto a financial party:

1. **KYC-verified badge** — listings from KYC-approved sellers show a "Verified Resident" chip.
2. **TrustScore display** — every listing surfaces seller's portable TrustScore (0-100) from CoreMesh.
3. **Photo timestamp** — uploaded photos are timestamped server-side; old / re-used photos are flagged.
4. **Safe Meet Spots** — predefined coordinates near Madinaty security gates / club / community center; recommended automatically on every offer accepted.
5. **Report flow** — one-click report on listing or user → `EcosystemSharedReport` (severity 1-5, feeds TrustScore).
6. **Token hold (commitment, not escrow)** — buyer optionally locks N individual tokens for 72h after offer-accepted; tokens auto-release back to wallet on handover-confirmed or auto-expiry. Forfeit-on-no-show is configurable per category but defaults OFF in v1. **No cash, no escrow, no financial party.**
7. **Two-tap handover confirmation** — both buyer and seller tap "Handover complete" in-app to close the deal; closes the token hold.
8. **Rating after handover** — both parties rate each other (1-5); ratings feed back into TrustScore via `EcosystemSharedReport` weights.

---

## Non-Goals (v1)

- Merchant accounts / pro stalls (P2P only).
- Auctions / timed bidding (deferred to v2).
- In-app payment processing or escrow (broker policy).
- Delivery integration (residents meet at Safe Meet Spots).
- International shipping (Madinaty residents only).
- Native mobile app (web mobile-responsive first; Flutter in phase 2).

---

## Contact

Same as umbrella project — see root `CLAUDE.md`.
