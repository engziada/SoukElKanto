# KYC External Integration Guide (Didit, Onfido, Jumio)

## Overview
The current KYC system uses manual document upload + admin review. External KYC providers automate identity verification via API.

## Recommended: Didit (formerly VU)
- **Why**: Best Middle East coverage, Arabic ID support, Egyptian national ID compatible
- **Pricing**: ~$0.50-1.50 per verification
- **API**: REST + Webhooks

## Implementation Plan

### Phase 1: Backend Integration

1. **Add Didit SDK/Client**
   ```bash
   npm install @didit/sdk
   ```

2. **Create Didit Service** (`CoreMesh/apps/core-hub/src/modules/kyc/didit.service.ts`)
   - Initialize with API key + secret
   - Methods:
     - `createSession(userId, redirectUrl)` → returns Didit session URL
     - `webhookHandler(payload)` → processes verification result
     - `getStatus(sessionId)` → polls status

3. **Update KYC Flow**
   - Replace manual upload with Didit redirect
   - Store `diditSessionId` in `KycRegistry.metadata`
   - Webhook updates `KycRegistry.status` to APPROVED/REJECTED

4. **Webhook Endpoint**
   ```
   POST /api/v1/kyc/webhooks/didit
   ```
   - Verify HMAC signature
   - Update user KYC status
   - Emit event for TrustMeter (+50 points on approval)

### Phase 2: Frontend Integration

1. **Update `/my/verify` page**
   - Instead of file upload form, show "Verify with Didit" button
   - Redirect to Didit session URL
   - Poll status or wait for webhook

2. **Update profile page**
   - Show "KYC Verified" badge (blue star)
   - Gate high-value deals (>5000 EGP) on KYC

### Phase 3: Admin Review (Optional)

Keep manual review as fallback for edge cases:
- Failed auto-verification → manual queue
- Admin override capability

## Alternative Providers

| Provider | Strength | Cost | Arabic IDs |
|----------|----------|------|------------|
| **Didit** | MENA focus, fast | $0.50-1.50 | Yes |
| Onfido | Global, mature | $1.50-3.00 | Limited |
| Jumio | Enterprise | $2.00-4.00 | Yes |
| Sumsub | Compliance-heavy | $1.00-2.00 | Yes |

## Security Considerations

- Store API keys in environment variables (never commit)
- Webhook endpoints must verify signatures
- PII should be encrypted at rest (already done with AES-256-GCM)
- Retention policy: auto-delete verification data after 90 days
- Audit trail: every KYC action logged via `@AuditAction()`

## Cost Estimate

Assuming 1,000 verifications/month:
- Didit: ~$1,000/month
- Onfido: ~$2,500/month
- Jumio: ~$3,000/month

## Implementation Order

1. Sign up for Didit sandbox
2. Implement backend service + webhook
3. Update `/my/verify` page
4. Test with Egyptian IDs
5. Go live with production keys
6. Monitor webhook delivery (add retry logic)
