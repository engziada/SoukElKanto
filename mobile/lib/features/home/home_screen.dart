import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/i18n/l10n_helper.dart';
import '../../core/listings/listings_provider.dart';
import '../../core/theme/app_colors.dart';
import '../../shared/widgets/empty_state.dart';
import '../../shared/widgets/error_view.dart';
import '../../shared/widgets/listing_card.dart';
import '../../shared/widgets/loading_indicator.dart';

/// Home screen — hero banner + featured listings grid.
class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final l = context.l10n;
    final browseState = ref.watch(listingsBrowseProvider);

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          // App bar
          SliverAppBar(
            expandedHeight: 120,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              title: Text(
                l.metadataTitle,
                style: theme.textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.w800,
                ),
              ),
              background: Container(
                decoration: const BoxDecoration(
                  gradient: AppColors.coralGradient,
                ),
              ),
            ),
            actions: [
              IconButton(
                icon: const Icon(Icons.search),
                onPressed: () => context.push('/listings'),
              ),
              IconButton(
                icon: const Icon(Icons.favorite_outline),
                onPressed: () => context.push('/favorites'),
              ),
            ],
          ),
          // Hero banner
          SliverToBoxAdapter(
            child: _HeroBanner(),
          ),
          // Section header
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 24, 16, 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    l.homeNewListings,
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  TextButton(
                    onPressed: () => context.push('/listings'),
                    child: Text(l.homeViewAll),
                  ),
                ],
              ),
            ),
          ),
          // Listings grid
          browseState.listings.when(
            data: (listings) {
              if (listings.isEmpty) {
                return SliverFillRemaining(
                  hasScrollBody: false,
                  child: EmptyState(
                    icon: Icons.storefront_outlined,
                    title: l.errorBeFirst,
                    subtitle: l.errorEmptyResults,
                  ),
                );
              }
              return SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                sliver: SliverGrid(
                  gridDelegate:
                      const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    mainAxisSpacing: 12,
                    crossAxisSpacing: 12,
                    childAspectRatio: 0.72,
                  ),
                  delegate: SliverChildBuilderDelegate(
                    (context, index) => ListingCard(
                      listing: listings[index],
                    ),
                    childCount: listings.length > 6 ? 6 : listings.length,
                  ),
                ),
              );
            },
            loading: () => const SliverFillRemaining(
              child: LoadingIndicator(),
            ),
            error: (e, _) => SliverFillRemaining(
              child: ErrorView(
                message: e.toString(),
                onRetry: () => ref
                    .read(listingsBrowseProvider.notifier)
                    .refresh(),
              ),
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.push('/create'),
        backgroundColor: AppColors.coral,
        foregroundColor: AppColors.warmWhite,
        child: const Icon(Icons.add),
      ),
    );
  }
}

class _HeroBanner extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final l = context.l10n;
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: AppColors.stallPaper,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppColors.stallPaperEdge),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    l.heroTitle,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w700,
                          color: AppColors.atlasMidnight,
                        ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    l.heroSubtitle,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.slateSmoke,
                        ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Icon(
              Icons.storefront,
              size: 48,
              color: AppColors.coral.withValues(alpha: 0.8),
            ),
          ],
        ),
      ),
    );
  }
}
