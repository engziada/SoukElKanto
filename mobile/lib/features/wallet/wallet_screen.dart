import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/auth/auth_provider.dart';
import '../../core/i18n/l10n_helper.dart';
import '../../core/theme/app_colors.dart';
import '../../shared/widgets/error_view.dart';
import '../../shared/widgets/loading_indicator.dart';

/// Wallet provider — fetches token wallet data.
final walletProvider = FutureProvider((ref) async {
  final api = ref.read(apiClientProvider);
  return api.getWallet();
});

/// Wallet screen — shows token balances, allocations, and transactions.
class WalletScreen extends ConsumerWidget {
  const WalletScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final wallet = ref.watch(walletProvider);
    final l = context.l10n;

    return Scaffold(
      appBar: AppBar(title: Text(l.myWalletTitle)),
      body: wallet.when(
        data: (w) => ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Balance card
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppColors.teal, AppColors.indigo],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Column(
                children: [
                  Text(
                    l.myWalletBalance,
                    style: const TextStyle(
                      color: AppColors.coolWhite,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '${w.businessTokens + w.individualTokens}',
                    style: const TextStyle(
                      color: AppColors.coolWhite,
                      fontSize: 48,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      _BalanceChip(
                        label: l.myWalletBusinessTokens,
                        amount: w.businessTokens,
                      ),
                      _BalanceChip(
                        label: l.myWalletIndividualTokens,
                        amount: w.individualTokens,
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            // Allocations
            if (w.allocations.isNotEmpty) ...[
              Text(
                l.myWalletAllocationsTitle,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
              ),
              const SizedBox(height: 8),
              for (final a in w.allocations)
                ListTile(
                  leading: const Icon(Icons.lock_outline, color: AppColors.coral),
                  title: Text(a.activityType),
                  subtitle: Text('${a.tokenType} · ${a.allocatedAmount}'),
                ),
              const SizedBox(height: 16),
            ],
            // Recent transactions
            if (w.recentTransactions.isNotEmpty) ...[
              Text(
                l.myWalletRecentTitle,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
              ),
              const SizedBox(height: 8),
              for (final t in w.recentTransactions)
                ListTile(
                  leading: Icon(
                    t.amount >= 0
                        ? Icons.arrow_downward
                        : Icons.arrow_upward,
                    color: t.amount >= 0 ? AppColors.mint : AppColors.coral,
                  ),
                  title: Text(t.description ?? t.activityType),
                  subtitle: Text(t.createdAt),
                  trailing: Text(
                    '${t.amount >= 0 ? '+' : ''}${t.amount}',
                    style: TextStyle(
                      fontWeight: FontWeight.w700,
                      color: t.amount >= 0 ? AppColors.mint : AppColors.coral,
                    ),
                  ),
                ),
            ],
          ],
        ),
        loading: () => const LoadingIndicator(),
        error: (e, _) => ErrorView(
          message: e.toString(),
          onRetry: () => ref.invalidate(walletProvider),
        ),
      ),
    );
  }
}

class _BalanceChip extends StatelessWidget {
  const _BalanceChip({required this.label, required this.amount});

  final String label;
  final int amount;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          '$amount',
          style: const TextStyle(
            color: AppColors.coolWhite,
            fontSize: 24,
            fontWeight: FontWeight.w700,
          ),
        ),
        Text(
          label,
          style: const TextStyle(
            color: AppColors.coolWhite,
            fontSize: 12,
          ),
        ),
      ],
    );
  }
}
