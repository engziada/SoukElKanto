import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/favorites/favorites_provider.dart';
import '../../core/i18n/l10n_helper.dart';
import '../../core/listings/listings_provider.dart';
import '../../shared/widgets/empty_state.dart';
import '../../shared/widgets/error_view.dart';
import '../../shared/widgets/listing_card.dart';
import '../../shared/widgets/loading_indicator.dart';

/// Favorites screen — shows user's saved listings.
class FavoritesScreen extends ConsumerWidget {
  const FavoritesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final favorites = ref.watch(favoritesProvider);
    final l = context.l10n;

    return Scaffold(
      appBar: AppBar(title: Text(l.myFavoritesTitle)),
      body: RefreshIndicator(
        onRefresh: () =>
            ref.read(favoritesProvider.notifier).refresh(),
        child: favorites.when(
          data: (favIds) {
            if (favIds.isEmpty) {
              return EmptyState(
                icon: Icons.favorite_border,
                title: l.myFavoritesEmpty,
                subtitle: l.myFavoritesEmpty,
              );
            }
            // Fetch each favorited listing
            return ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: favIds.length,
              itemBuilder: (context, index) {
                final listingAsync =
                    ref.watch(listingByIdProvider(favIds[index]));
                return listingAsync.when(
                  data: (listing) => Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: SizedBox(
                      height: 280,
                      child: ListingCard(
                        listing: listing,
                        isFavorite: true,
                        onFavoriteToggle: () => ref
                            .read(favoritesProvider.notifier)
                            .toggle(listing.id),
                      ),
                    ),
                  ),
                  loading: () => const SizedBox(
                    height: 280,
                    child: LoadingIndicator(),
                  ),
                  error: (_, _) => const SizedBox.shrink(),
                );
              },
            );
          },
          loading: () => const LoadingIndicator(),
          error: (e, _) => ErrorView(
            message: e.toString(),
            onRetry: () => ref.read(favoritesProvider.notifier).refresh(),
          ),
        ),
      ),
    );
  }
}
