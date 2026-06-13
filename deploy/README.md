# Souk ElKanto — Deploy runbook (Session 5 / R-06)

> **Stack pick:** Fly.io (BE) + Supabase (Postgres+pgvector) + Upstash (Redis) + Vercel (FE) + Cloudflare (WAF/CDN).
> **Status:** Scaffolded — accounts exist, manual one-time setup steps below.

This document is the canonical "first deploy" checklist. It assumes the artifacts shipped in Session 5 already exist in the repo:

- `Codes/CoreMesh/Dockerfile`
- `Codes/CoreMesh/.dockerignore`
- `Codes/CoreMesh/fly.toml`
- `Codes/CoreMesh/docker-compose.prod.yml` (alt path — self-hosted)
- `Codes/CoreMesh/.github/workflows/ci.yml`
- `Codes/CoreMesh/.github/workflows/deploy-be.yml`
- `Codes/SoukElkanto/web/vercel.json`
- `Codes/SoukElkanto/.github/workflows/ci.yml`
- This file.

---

## 0 · Prerequisites

| Tool | Why | Install |
|---|---|---|
| `flyctl` | Deploy + secret management for Fly | `iwr https://fly.io/install.ps1 -useb \| iex` (Windows) |
| `vercel` CLI | Local Vercel build dry-runs | `npm i -g vercel` |
| `docker` | Local image build sanity | already required by dev stack |
| `gh` CLI | (optional) GitHub Actions secret management | `winget install --id GitHub.cli` |

Accounts you should have already created (per the Session 5 setup):
- Fly.io · Supabase · Upstash · Vercel · Cloudflare · GitHub (repo)

---

## 1 · Generate production secrets (once)

Use the helper:

```powershell
cd Codes\SoukElkanto\deploy
pwsh ./gen-prod-secrets.ps1
```

It prints `JWT_SECRET` (48 random bytes base64url) and `KYC_ENCRYPTION_KEY` (32 random bytes hex). Copy each into your secrets manager (Fly + Vercel as below). **Never paste these values into chat, commits, or shared docs.**

---

## 2 · Provision managed data layer

### 2.1 · Supabase Postgres

1. Supabase dashboard → New project → name `madinatyai-prod`, region `me-central-1` (Dubai).
2. Wait for provisioning (~2 min).
3. **Enable pgvector** — SQL editor → run:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
4. **Create the multi-schema layout** the Prisma schema expects:
   ```sql
   CREATE SCHEMA IF NOT EXISTS core;
   CREATE SCHEMA IF NOT EXISTS tenant_soukelkanto;
   CREATE SCHEMA IF NOT EXISTS tenant_souq;
   CREATE SCHEMA IF NOT EXISTS tenant_kitchen;
   CREATE SCHEMA IF NOT EXISTS tenant_tutor;
   CREATE SCHEMA IF NOT EXISTS tenant_timebank;
   ```
5. Copy the connection string from Settings → Database → Connection string → URI form.
   It looks like `postgresql://postgres.xxx:password@aws-x-x.pooler.supabase.com:6543/postgres`.
6. **Stash** in your password manager — you'll paste into `flyctl secrets set` below.

### 2.2 · Upstash Redis

1. Upstash console → Create Database.
2. Region: **`me-south-1` (Bahrain)** — closest to the BE in Frankfurt.
3. Eviction: enabled (default) — BullMQ + cache only, no critical state.
4. TLS: enabled.
5. From the dashboard, copy:
   - `UPSTASH_REDIS_HOST` → e.g. `apt-marmot-12345.upstash.io`
   - `UPSTASH_REDIS_PORT` → typically `6380` (TLS port)
   - `UPSTASH_REDIS_PASSWORD` → long random string
6. These will become `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` Fly secrets.

> ⚠️ Free-tier Upstash caps at 10k commands/day. R-13 load test must use a paid throughput tier before any public traffic.

---

## 3 · Deploy CoreMesh BE to Fly.io

### 3.1 · One-time app creation

```powershell
cd Codes\CoreMesh
flyctl auth login
flyctl apps create madinatyai-coremesh --org <your-org-slug>

# Create the KYC fallback volume (1 GB — small because R2 is the primary).
flyctl volumes create kyc_storage --size 1 --region fra --app madinatyai-coremesh
```

### 3.2 · Set production secrets

Replace each `…` with the real value. **Run these one at a time so they don't end up in shell history with values.**

```powershell
flyctl secrets set DATABASE_URL='postgresql://...supabase...' --app madinatyai-coremesh
flyctl secrets set REDIS_HOST='apt-marmot-12345.upstash.io' --app madinatyai-coremesh
flyctl secrets set REDIS_PORT='6380' --app madinatyai-coremesh
flyctl secrets set REDIS_PASSWORD='<upstash-password>' --app madinatyai-coremesh
flyctl secrets set REDIS_TLS='true' --app madinatyai-coremesh
flyctl secrets set JWT_SECRET='<48-byte-base64url-from-step-1>' --app madinatyai-coremesh
flyctl secrets set KYC_ENCRYPTION_KEY='<32-byte-hex-from-step-1>' --app madinatyai-coremesh
flyctl secrets set KANTO_R2_ENDPOINT='https://<account>.r2.cloudflarestorage.com' --app madinatyai-coremesh
flyctl secrets set KANTO_R2_ACCESS_KEY_ID='<r2-key>' --app madinatyai-coremesh
flyctl secrets set KANTO_R2_SECRET='<r2-secret>' --app madinatyai-coremesh
flyctl secrets set KANTO_R2_BUCKET='SoukElkanto-prod' --app madinatyai-coremesh
flyctl secrets set KANTO_R2_PUBLIC_BASE='https://<bucket>.r2.dev' --app madinatyai-coremesh
flyctl secrets set WAHA_BASE_URL='https://waha.xee.run.place' --app madinatyai-coremesh
flyctl secrets set WAHA_API_KEY='<new-rotated-from-dev>' --app madinatyai-coremesh
flyctl secrets set CORS_ORIGINS='https://kanto.madinatyai.com' --app madinatyai-coremesh

# Sanity check — list all secret keys (NOT values).
flyctl secrets list --app madinatyai-coremesh
```

### 3.3 · First deploy (manual)

```powershell
flyctl deploy --app madinatyai-coremesh
```

The Dockerfile's `release_command` runs `prisma migrate deploy` against the Supabase DB before the new machines accept traffic. First deploy: 3-6 min.

### 3.4 · Smoke test

```powershell
$be = 'https://madinatyai-coremesh.fly.dev'  # before custom domain
Invoke-RestMethod "$be/api/v1/health"
Invoke-RestMethod "$be/api/v1/version"
```

Expected: `{ status: 'ok', ... }` and `{ gitSha: '<sha>', buildTime: '...', ... }`.

### 3.5 · Subsequent deploys

After this, deploys are automated via [.github/workflows/deploy-be.yml](../../CoreMesh/.github/workflows/deploy-be.yml). Add a `FLY_API_TOKEN` secret in GitHub repo settings (Settings → Secrets and variables → Actions). Generate the token:

```powershell
flyctl auth token
```

Paste into `gh secret set FLY_API_TOKEN` (or via the web UI).

---

## 4 · Deploy Souk ElKanto FE to Vercel

### 4.1 · One-time project creation

1. Vercel dashboard → Add new → Project → import the SoukElkanto repo.
2. **Root directory:** `web` (critical — repo root contains docs + the Next app under `web/`).
3. **Framework preset:** Next.js (auto-detected via `vercel.json`).
4. Build command: `npm run build` (auto).
5. Install command: `npm ci --prefer-offline` (from `vercel.json`).

### 4.2 · Set production env vars (Vercel dashboard)

| Key | Value | Notes |
|---|---|---|
| `NEXT_PUBLIC_API_BASE` | *(blank)* | empty → calls hit `/api/v1/*` on the FE origin and Vercel rewrites to BE |
| `NEXT_PUBLIC_TENANT_ID` | `kanto` | |
| `NEXT_PUBLIC_ENV` | `production` | drives staging-banner visibility (R-16) |
| `CORE_MESH_URL` | `https://api.madinatyai.com` | absolute, used by Node SSR fetches |
| `NEXT_PUBLIC_AUTH_DEV_HINT` | *(blank)* | hides the dev-OTP hint in prod |

Add these to **all three** Vercel scopes: Production, Preview, Development.

### 4.3 · First deploy

Vercel auto-deploys on push to main. To force a fresh build:

```powershell
cd Codes\SoukElkanto\web
npx vercel --prod
```

---

## 5 · DNS + Cloudflare WAF

### 5.1 · DNS records (Cloudflare dashboard → DNS)

| Record | Type | Target | Proxy |
|---|---|---|---|
| `kanto.madinatyai.com` | CNAME | `cname.vercel-dns.com` | DNS only (Vercel manages SSL) |
| `api.madinatyai.com` | CNAME | `madinatyai-coremesh.fly.dev` | **Proxied** (orange cloud — WAF on) |

### 5.2 · Cloudflare TLS

1. SSL/TLS → Overview → mode: **Full (strict)**.
2. Edge Certificates → Always Use HTTPS: **On**.
3. Edge Certificates → Minimum TLS Version: **TLS 1.2**.

### 5.3 · Cloudflare WAF rules

Rules → Create rule:

- **Rate limit auth endpoints** — `(http.request.uri.path matches "^/api/v1/auth/")` → Action: rate limit 100 req/min per IP, mitigation: 1 min block.
- **Block known bots on writes** — `(cf.client.bot) and (http.request.method in {"POST" "PATCH" "DELETE"})` → Block.
- **Geo allowlist (optional, MENA-only beta)** — `not (ip.geoip.country in {"EG" "AE" "SA" "QA" "BH" "KW" "OM" "JO" "LB"})` → Block (override IP allowlist for team during dev).

### 5.4 · Tell Fly about the custom hostname

```powershell
flyctl certs add api.madinatyai.com --app madinatyai-coremesh
flyctl certs check api.madinatyai.com --app madinatyai-coremesh
```

Wait until Fly reports `Certificate Status: Issued`. Then traffic to `api.madinatyai.com` reaches the BE through the Cloudflare proxy.

### 5.5 · Tell Vercel about the custom hostname

Vercel dashboard → Project → Settings → Domains → Add `kanto.madinatyai.com`. Vercel verifies via the CNAME from step 5.1.

---

## 6 · Smoke test the live stack

```powershell
# BE
curl -fsS https://api.madinatyai.com/api/v1/health
curl -fsS https://api.madinatyai.com/api/v1/version

# FE
curl -fsS -I https://kanto.madinatyai.com/ar | Select-String "HTTP"
# Expected: HTTP/2 200

# Cross-origin sanity (browser dev console, on https://kanto.madinatyai.com):
#   fetch('/api/v1/health').then(r => r.json()).then(console.log)
```

If all three pass, the stack is live.

---

## 7 · Post-deploy checklist (first 24h)

- [ ] `flyctl status --app madinatyai-coremesh` shows ≥ 1 healthy machine
- [ ] `flyctl logs --app madinatyai-coremesh` has no repeating exceptions
- [ ] Vercel Deployments tab shows the latest commit as "Ready" on `kanto.madinatyai.com`
- [ ] Cloudflare Analytics shows traffic flowing
- [ ] Supabase Database → Reports → no slow queries > 1s in the last hour
- [ ] Upstash command rate < free-tier daily cap (or upgrade plan if approaching)
- [ ] Run one full e2e smoke from a real browser:
  - Register a new phone via WAHA (real OTP)
  - Create a listing
  - Make an offer
  - Accept + confirm handover
- [ ] Backup verification — Supabase auto-backup visible in the dashboard

---

## 8 · Rollback

Fly stores immutable images per release. To roll back:

```powershell
flyctl releases --app madinatyai-coremesh
flyctl deploy --image registry.fly.io/madinatyai-coremesh:<previous-tag> --app madinatyai-coremesh
```

For Vercel: dashboard → Deployments → click prior deploy → "Promote to production".

DB schema rollbacks: see Prisma migrations under `Codes/CoreMesh/prisma/migrations/`. Migrations are forward-only; emergency revert requires running `prisma migrate resolve --rolled-back <name>` and a hand-written rollback SQL — **don't do this without DBA on call**.

---

## 9 · Known gaps (tracked under separate R-#)

| Gap | R-# | Until then |
|---|---|---|
| Sentry + Better Stack not wired | R-12 ⏸️ | Logs are visible via `flyctl logs` + Vercel runtime logs |
| Twilio SMS fallback not wired | R-14 ⏸️ | OTP relies solely on WAHA — single point of failure |
| Automated KYC (Didit) not wired | R-10 ⏸️ | KYC stays manual upload + admin review |
| DR drill not executed | R-15 | Supabase auto-backups exist but untested |
| Staging environment not provisioned | R-16 | Promotions go straight to prod — change with care |
| Visual regression baselines absent | R-17 | CSS changes can silently break mobile/RTL |

---

## 10 · Quick reference

| Action | Command |
|---|---|
| BE logs | `flyctl logs --app madinatyai-coremesh` |
| BE status | `flyctl status --app madinatyai-coremesh` |
| BE shell into running machine | `flyctl ssh console --app madinatyai-coremesh` |
| BE secrets list | `flyctl secrets list --app madinatyai-coremesh` |
| FE logs | Vercel dashboard → Deployments → click deploy → Runtime Logs |
| DB shell | Supabase dashboard → SQL Editor |
| Redis shell | `redis-cli -h <upstash-host> -p 6380 -a <password> --tls` |
| Cloudflare cache purge | Dashboard → Caching → Configuration → Purge Everything |
