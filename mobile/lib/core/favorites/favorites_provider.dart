import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../api/api_client.dart';
import '../auth/auth_provider.dart';

/// Favorites state — a list of listing IDs the user has saved.
class FavoritesNotifier extends StateNotifier<AsyncValue<List<String>>> {
  FavoritesNotifier(this._api)
      : super(const AsyncValue<List<String>>.loading()) {
    // ignore: discarded_futures
    _load();
  }

  final ApiClient _api;

  /// Load favorites from the backend.
  Future<void> _load() async {
    state = const AsyncValue.loading();
    try {
      final favorites = await _api.listFavorites();
      state = AsyncValue.data(favorites.map((f) => f.listingId).toList());
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  /// Refresh favorites from the backend.
  Future<void> refresh() async {
    try {
      final favorites = await _api.listFavorites();
      state = AsyncValue.data(favorites.map((f) => f.listingId).toList());
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  /// Toggle a listing's favorite status.
  Future<void> toggle(String listingId) async {
    final current = state.valueOrNull ?? [];
    final isFav = current.contains(listingId);

    // Optimistic update
    state = AsyncValue.data(
      isFav
          ? current.where((id) => id != listingId).toList()
          : [...current, listingId],
    );

    try {
      if (isFav) {
        await _api.removeFavorite(listingId);
      } else {
        await _api.addFavorite(listingId);
      }
    } catch (e) {
      // Revert on error
      state = AsyncValue.data(current);
    }
  }

  /// Check if a listing is favorited.
  bool isFavorite(String listingId) {
    return state.valueOrNull?.contains(listingId) ?? false;
  }
}

/// Favorites provider — synced with BE /favorites endpoints.
final favoritesProvider =
    StateNotifierProvider<FavoritesNotifier, AsyncValue<List<String>>>((ref) {
  final api = ref.read(apiClientProvider);
  return FavoritesNotifier(api);
});
