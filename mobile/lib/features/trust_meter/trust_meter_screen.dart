import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api/models.dart';
import '../../core/auth/auth_provider.dart';
import '../../core/i18n/l10n_helper.dart';
import '../../core/theme/app_colors.dart';
import '../../shared/widgets/error_view.dart';
import '../../shared/widgets/loading_indicator.dart';
import '../../shared/widgets/trust_badge.dart';

/// Trust meter provider.
final trustMeterProvider = FutureProvider((ref) async {
  final api = ref.read(apiClientProvider);
  return api.getTrustMeter();
});

/// Trust meter screen — shows trust score, tier, and progress.
class TrustMeterScreen extends ConsumerWidget {
  const TrustMeterScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tm = ref.watch(trustMeterProvider);
    final l = context.l10n;

    return Scaffold(
      appBar: AppBar(title: Text(l.myTrustMeterTitle)),
      body: tm.when(
        data: (snapshot) => ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Tier badge
            Center(
              child: TrustBadge(tier: snapshot.tier),
            ),
            const SizedBox(height: 24),
            // Score circle
            _ScoreCircle(
              total: snapshot.total,
              nextTier: snapshot.nextTier,
              pointsToNextTier: snapshot.pointsToNextTier,
            ),
            const SizedBox(height: 24),
            // Tier ladder
            Text(
              l.myTrustMeterLadderTitle,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
            ),
            const SizedBox(height: 12),
            for (final entry in TrustTiers.thresholds.entries)
              _TierRow(
                tier: entry.key,
                threshold: entry.value,
                current: snapshot.total,
                isCurrent: snapshot.tier == entry.key,
              ),
            const SizedBox(height: 24),
            // Info
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.awningShade,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                l.myTrustMeterSoon,
                style: const TextStyle(color: AppColors.slateSmoke),
              ),
            ),
          ],
        ),
        loading: () => const LoadingIndicator(),
        error: (e, _) => ErrorView(
          message: e.toString(),
          onRetry: () => ref.invalidate(trustMeterProvider),
        ),
      ),
    );
  }
}

class _ScoreCircle extends StatelessWidget {
  const _ScoreCircle({
    required this.total,
    this.nextTier,
    this.pointsToNextTier,
  });

  final int total;
  final String? nextTier;
  final int? pointsToNextTier;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 200,
      height: 200,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: const LinearGradient(
          colors: [AppColors.coral, AppColors.honey],
        ),
        boxShadow: AppColors.coralShadow,
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            '$total',
            style: const TextStyle(
              fontSize: 56,
              fontWeight: FontWeight.w800,
              color: AppColors.warmWhite,
            ),
          ),
          const Text(
            'Trust Points',
            style: TextStyle(
              color: AppColors.warmWhite,
              fontSize: 14,
            ),
          ),
          if (pointsToNextTier != null && nextTier != null) ...[
            const SizedBox(height: 4),
            Text(
              '$pointsToNextTier to $nextTier',
              style: const TextStyle(
                color: AppColors.warmWhite,
                fontSize: 12,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _TierRow extends StatelessWidget {
  const _TierRow({
    required this.tier,
    required this.threshold,
    required this.current,
    required this.isCurrent,
  });

  final String tier;
  final int threshold;
  final int current;
  final bool isCurrent;

  Color get _tierColor {
    return switch (tier) {
      'NEW' => AppColors.tierNew,
      'BRONZE' => AppColors.tierBronze,
      'SILVER' => AppColors.tierSilver,
      'GOLD' => AppColors.tierGold,
      'PLATINUM' => AppColors.tierPlatinum,
      _ => AppColors.slateSmoke,
    };
  }

  @override
  Widget build(BuildContext context) {
    final isUnlocked = current >= threshold;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Container(
            width: 12,
            height: 12,
            decoration: BoxDecoration(
              color: isUnlocked ? _tierColor : AppColors.border,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 12),
          Text(
            tier,
            style: TextStyle(
              fontWeight: isCurrent ? FontWeight.w700 : FontWeight.w500,
              color: isCurrent ? _tierColor : null,
            ),
          ),
          const Spacer(),
          Text(
            '$threshold+ pts',
            style: TextStyle(
              color: isUnlocked ? _tierColor : AppColors.dustyCloud,
              fontSize: 13,
            ),
          ),
          if (isCurrent) ...[
            const SizedBox(width: 8),
            Icon(Icons.check_circle, size: 16, color: _tierColor),
          ],
        ],
      ),
    );
  }
}
