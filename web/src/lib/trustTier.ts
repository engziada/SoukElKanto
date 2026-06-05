/**
 * TrustMeter tier mapping for FE display.
 *
 * NOTE: This is a deterministic stand-in until the listings API includes
 * `seller.trustMeter.tier` in the payload (Phase E). The hash gives every
 * card a stable, varied ribbon based on the sellerId — never random per
 * render, never network-dependent. Replace `deriveTierFromId` with a real
 * lookup against `/api/v1/trust-meter/users/:id` when wiring TrustMeter.
 */
export type TrustTier = 'NEW' | 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

const TIER_DISTRIBUTION: readonly TrustTier[] = [
  'NEW', 'NEW', 'NEW',          // 30% — most sellers are new
  'BRONZE', 'BRONZE',           // 20%
  'SILVER', 'SILVER',           // 20%
  'GOLD', 'GOLD',               // 20%
  'PLATINUM',                   // 10% — rare ribbon
] as const;

export function deriveTierFromId(sellerId: string): TrustTier {
  if (!sellerId) return 'NEW';
  let hash = 0;
  for (let i = 0; i < sellerId.length; i++) {
    hash = (hash * 31 + sellerId.charCodeAt(i)) >>> 0;
  }
  return TIER_DISTRIBUTION[hash % TIER_DISTRIBUTION.length];
}

export function tierLabelKey(tier: TrustTier): string {
  switch (tier) {
    case 'NEW':      return 'tierNew';
    case 'BRONZE':   return 'tierBronze';
    case 'SILVER':   return 'tierSilver';
    case 'GOLD':     return 'tierGold';
    case 'PLATINUM': return 'tierPlatinum';
  }
}

export const tierClassMap: Record<TrustTier, string> = {
  NEW:      'tierNew',
  BRONZE:   'tierBronze',
  SILVER:   'tierSilver',
  GOLD:     'tierGold',
  PLATINUM: 'tierPlatinum',
};
