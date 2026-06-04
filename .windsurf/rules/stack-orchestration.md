---
trigger: model_decision
description: Apply when running, starting, testing, or debugging Souk ElKanto — the frontend depends on the CoreMesh backend; never start the FE before the BE is healthy.
---

# Souk ElKanto — Stack Orchestration (read before running/testing)

Souk ElKanto's web app is a **frontend tenant** of CoreMesh. It is useless on
its own: every API call hits `http://localhost:3000/api/v1/*` with
`x-tenant-id: kanto`. Starting it before the backend is healthy causes a
retry/error loop — this is the failure to avoid.

## Strict dependency chain (upstream → downstream)

```text
Postgres + Redis (docker) → prisma migrate deploy → db:seed (tenant 'kanto')
  → CoreMesh core-hub :3000 (/api/v1/health = 200) → THIS app :3001
```

## Hard rules

1. **Do NOT start this frontend until** `GET http://localhost:3000/api/v1/health`
   returns **200**. The frontend cannot start the database — it is downstream.
2. **Bring the whole stack up from the parent folder, in order:**
   `pwsh ./stack-up.ps1` (in `Codes\`). Check first with
   `pwsh ./stack-status.ps1`.
3. **If the backend is down, fix the backend** (DB → migrate → seed → core-hub),
   do not loop on `npm run dev` here. `npm run check:be` verifies reachability.
4. This app runs on **:3001** (`npm run dev`), never :3000 (that's the backend).
5. **No retry loops.** If something fails ~3 times, STOP and report the first
   DOWN link. Don't keep restarting.

## Key facts

- API base: `NEXT_PUBLIC_API_BASE` (default `http://localhost:3000`). See
  `web/.env.example` → copy to `web/.env.local`.
- Tenant: `kanto` (`x-tenant-id` header, set in `web/src/lib/api.ts`).
- Orchestrator + full runbook: `f:\Web-Projects\MadinatyAI\Codes\` →
  `stack-up.ps1`, `stack-status.ps1`, `RUNBOOK.md`.
