import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

/// Trust tier badge — shows a colored ribbon with the tier name.
class TrustBadge extends StatelessWidget {
  const TrustBadge({
    super.key,
    required this.tier,
    this.compact = false,
    this.showKycVerified = false,
  });

  final String tier;
  final bool compact;
  final bool showKycVerified;

  static const Map<String, Color> _tierColors = {
    'NEW': AppColors.tierNew,
    'BRONZE': AppColors.tierBronze,
    'SILVER': AppColors.tierSilver,
    'GOLD': AppColors.tierGold,
    'PLATINUM': AppColors.tierPlatinum,
  };

  @override
  Widget build(BuildContext context) {
    final color = _tierColors[tier.toUpperCase()] ?? AppColors.tierNew;
    final label = tier.toUpperCase();

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          padding: EdgeInsets.symmetric(
            horizontal: compact ? 6 : 10,
            vertical: compact ? 2 : 4,
          ),
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(compact ? 4 : 8),
            border: Border.all(color: color.withValues(alpha: 0.3)),
          ),
          child: Text(
            label,
            style: TextStyle(
              color: color,
              fontSize: compact ? 9 : 11,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.5,
            ),
          ),
        ),
        if (showKycVerified) ...[
          const SizedBox(width: 4),
          Icon(
            Icons.verified_user,
            size: compact ? 12 : 16,
            color: AppColors.teal,
          ),
        ],
      ],
    );
  }
}
