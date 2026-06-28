import 'dart:ui';

/// TrustMeter tier mapping for display.
///
/// Ported from the web app's `src/lib/trustTier.ts`.
/// Deterministic stand-in until the listings API includes
/// `seller.trustMeter.tier` in the payload.
typedef TrustTier = String;

const List<TrustTier> _tierDistribution = [
  'NEW', 'NEW', 'NEW',
  'BRONZE', 'BRONZE',
  'SILVER', 'SILVER',
  'GOLD', 'GOLD',
  'PLATINUM',
];

/// Derives a stable tier from a seller ID using a hash.
/// Never random per render, never network-dependent.
TrustTier deriveTierFromId(String sellerId) {
  if (sellerId.isEmpty) return 'NEW';
  int hash = 0;
  for (int i = 0; i < sellerId.length; i++) {
    hash = (hash * 31 + sellerId.codeUnitAt(i)) & 0xFFFFFFFF;
  }
  return _tierDistribution[hash % _tierDistribution.length];
}

/// Returns the color for a trust tier.
int tierColor(TrustTier tier) {
  switch (tier) {
    case 'NEW':
      return 0xFF94A3B8;
    case 'BRONZE':
      return 0xFFB45309;
    case 'SILVER':
      return 0xFF64748B;
    case 'GOLD':
      return 0xFFCA8A04;
    case 'PLATINUM':
      return 0xFF0E7490;
    default:
      return 0xFF94A3B8;
  }
}

/// Returns the tier color as a Color object.
Color tierColorValue(TrustTier tier) => Color(tierColor(tier));

/// Returns the i18n key suffix for a tier.
String tierLabelKey(TrustTier tier) {
  switch (tier) {
    case 'NEW':
      return 'listingTierNew';
    case 'BRONZE':
      return 'listingTierBronze';
    case 'SILVER':
      return 'listingTierSilver';
    case 'GOLD':
      return 'listingTierGold';
    case 'PLATINUM':
      return 'listingTierPlatinum';
    default:
      return 'listingTierNew';
  }
}
