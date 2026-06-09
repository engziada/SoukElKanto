> This is a strategic technical assessment. Do NOT migrate until the Foundation phase is stable.

# Convex DB Migration Assessment

## What is Convex?
Convex is a serverless realtime database with:
- **Live queries** (subscriptions push updates to clients)
- **Serverless functions** (TypeScript, no ops)
- **Automatic scaling** (no connection pooling issues)
- **Real-time sync** (WebSocket subscriptions)

## Current Architecture
```
SoukElkanto Web (Next.js) → HTTP REST → CoreMesh (NestJS) → Prisma → PostgreSQL
```

## Proposed Convex Architecture
```
SoukElkanto Web (Next.js) → Convex Client (WebSocket) → Convex Functions → Convex DB
```

## What Would Change

| Feature | Current (CoreMesh) | Convex |
|---------|-------------------|--------|
| Real-time offers | Poll / re-fetch | Live subscription |
| Chat/messaging | Not built yet | Native real-time |
| Offline support | None | Automatic optimistic updates |
| Scaling | Manual (Redis + Postgres) | Automatic |
| Auth | JWT + custom | Convex Auth (built-in) |
| Multi-tenancy | Schema-per-tenant | Would need redesign |

## Pros of Migration

1. **Real-time offers**: When buyer sends offer, seller sees it instantly without refresh
2. **Real-time chat**: Built-in messaging between buyer/seller
3. **Simplified backend**: No NestJS server needed for reads (writes still need business logic)
4. **Offline-first**: Convex handles optimistic updates and sync
5. **No connection pooling**: Postgres connection limits are a non-issue

## Cons of Migration

1. **Vendor lock-in**: Convex is proprietary. Migration OUT is hard.
2. **Multi-tenancy redesign**: Current schema-per-tenant model doesn't map cleanly to Convex
3. **Complex backend logic**: KYC, payments, TrustScore, AI routing stays in CoreMesh
4. **Hybrid complexity**: Running BOTH Convex + CoreMesh is more complex than one system
5. **Cost at scale**: Convex charges per function call + storage. At 10k MAU, could exceed self-hosted Postgres costs.
6. **Team expertise**: Team knows NestJS/Prisma. Convex is a new paradigm.

## Recommended Approach: NO Full Migration

Instead of replacing CoreMesh with Convex, use Convex for **real-time features only**:

### Hybrid Architecture (Recommended)
```
┌─────────────────────────────────────┐
│  SoukElkanto Web (Next.js)         │
│  - Reads: Convex live queries        │
│  - Writes: CoreMesh REST API         │
└─────────────────────────────────────┘
         │                      │
         ▼                      ▼
   ┌──────────┐         ┌──────────────┐
   │  Convex  │         │  CoreMesh    │
   │  (real-  │◄──────►│  (business   │
   │  time)   │ sync    │  logic)      │
   └──────────┘         └──────────────┘
        │                     │
        ▼                     ▼
   Convex DB            PostgreSQL
```

### What Goes to Convex
- Live offer status updates
- Chat messages between buyer/seller
- Notification feed
- Presence (user online/offline)

### What Stays in CoreMesh
- User auth + KYC
- Business logic (create listing, make offer, accept)
- Payment orchestration
- AI routing
- TrustScore calculation
- Admin operations

### Sync Strategy
Use Convex as a **read replica**:
1. CoreMesh writes to PostgreSQL
2. CoreMesh also pushes to Convex via webhook
3. Frontend subscribes to Convex for real-time updates
4. Frontend sends mutations to CoreMesh

## Implementation Order (If Approved)

1. **Pilot**: Chat feature only (new feature, no migration risk)
2. **Evaluate**: Measure latency, cost, dev velocity after 1 month
3. **Expand**: Add live offer updates
4. **Decision**: Full migration or stay hybrid

## Cost Comparison (Projected)

| Users | CoreMesh (self-hosted) | Convex Hybrid | Convex Full |
|-------|----------------------|---------------|-------------|
| 1K MAU | $50/mo (Render) | $100/mo | $200/mo |
| 10K MAU | $200/mo | $400/mo | $800/mo |
| 100K MAU | $800/mo | $2,000/mo | $5,000/mo |

## Verdict

**Defer Convex migration until after Foundation phase (Q4 2025)**. The current HTTP REST architecture is sufficient for the marketplace MVP. Consider Convex for:
- **Q1 2026**: Add real-time chat (new feature, low risk)
- **Q2 2026**: Evaluate hybrid model for live offers
- **Q3 2026**: Decision point — expand or abandon

The priority now is: **stability > real-time polish**.
