import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/i18n/l10n_helper.dart';
import '../../core/listings/listings_provider.dart';
import '../../shared/widgets/empty_state.dart';
import '../../shared/widgets/error_view.dart';
import '../../shared/widgets/listing_card.dart';
import '../../shared/widgets/loading_indicator.dart';

/// My listings screen — shows user's own listings.
class MyListingsScreen extends ConsumerWidget {
  const MyListingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final myListings = ref.watch(myListingsProvider);
    final l = context.l10n;

    return Scaffold(
      appBar: AppBar(
        title: Text(l.myListingsTitle),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => context.push('/create'),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(myListingsProvider),
        child: myListings.when(
          data: (listings) {
            if (listings.isEmpty) {
              return EmptyState(
                icon: Icons.sell_outlined,
                title: l.myListingsEmpty,
                subtitle: l.myListingsPublishCta,
                actionLabel: l.navCreate,
                onAction: null,
              );
            }
            return GridView.builder(
              padding: const EdgeInsets.all(16),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                childAspectRatio: 0.72,
              ),
              itemCount: listings.length,
              itemBuilder: (context, index) => ListingCard(
                listing: listings[index],
                showFavoriteButton: false,
              ),
            );
          },
          loading: () => const LoadingIndicator(),
          error: (e, _) => ErrorView(
            message: e.toString(),
            onRetry: () => ref.invalidate(myListingsProvider),
          ),
        ),
      ),
    );
  }
}
