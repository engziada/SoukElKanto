import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../api/api_client.dart';
import '../api/models.dart';
import '../auth/auth_provider.dart';

/// State for listings browsing.
class ListingsBrowseState {
  const ListingsBrowseState({
    this.listings = const AsyncValue.loading(),
    this.page = 1,
    this.hasMore = true,
    this.category,
    this.condition,
    this.district,
    this.minPrice,
    this.maxPrice,
    this.sort,
    this.q,
  });

  final AsyncValue<List<Listing>> listings;
  final int page;
  final bool hasMore;
  final String? category;
  final String? condition;
  final String? district;
  final int? minPrice;
  final int? maxPrice;
  final String? sort;
  final String? q;

  ListingsBrowseState copyWith({
    AsyncValue<List<Listing>>? listings,
    int? page,
    bool? hasMore,
    String? category,
    String? condition,
    String? district,
    int? minPrice,
    int? maxPrice,
    String? sort,
    String? q,
    bool clearCategory = false,
    bool clearCondition = false,
    bool clearDistrict = false,
    bool clearSort = false,
    bool clearQ = false,
  }) =>
      ListingsBrowseState(
        listings: listings ?? this.listings,
        page: page ?? this.page,
        hasMore: hasMore ?? this.hasMore,
        category: clearCategory ? null : (category ?? this.category),
        condition: clearCondition ? null : (condition ?? this.condition),
        district: clearDistrict ? null : (district ?? this.district),
        minPrice: minPrice ?? this.minPrice,
        maxPrice: maxPrice ?? this.maxPrice,
        sort: clearSort ? null : (sort ?? this.sort),
        q: clearQ ? null : (q ?? this.q),
      );
}

/// Notifier for browsing listings with pagination and filters.
class ListingsBrowseNotifier
    extends StateNotifier<ListingsBrowseState> {
  ListingsBrowseNotifier(this._api) : super(const ListingsBrowseState()) {
    // ignore: discarded_futures
    _loadFirst();
  }

  final ApiClient _api;

  Future<void> _loadFirst() async {
    state = const ListingsBrowseState();
    try {
      final res = await _api.listListings(
        page: 1,
        limit: 20,
        category: state.category,
        condition: state.condition,
        district: state.district,
        minPrice: state.minPrice,
        maxPrice: state.maxPrice,
        sort: state.sort,
        q: state.q,
      );
      state = ListingsBrowseState(
        listings: AsyncValue.data(res.data),
        page: 1,
        hasMore: res.hasMore,
        category: state.category,
        condition: state.condition,
        district: state.district,
        minPrice: state.minPrice,
        maxPrice: state.maxPrice,
        sort: state.sort,
        q: state.q,
      );
    } catch (e, st) {
      state = state.copyWith(listings: AsyncValue.error(e, st));
    }
  }

  /// Load more listings (pagination).
  Future<void> loadMore() async {
    final current = state.listings.valueOrNull;
    if (current == null || !state.hasMore) return;

    try {
      final res = await _api.listListings(
        page: state.page + 1,
        limit: 20,
        category: state.category,
        condition: state.condition,
        district: state.district,
        minPrice: state.minPrice,
        maxPrice: state.maxPrice,
        sort: state.sort,
        q: state.q,
      );
      state = state.copyWith(
        listings: AsyncValue.data([...current, ...res.data]),
        page: state.page + 1,
        hasMore: res.hasMore,
      );
    } catch (_) {
      // Silent fail on pagination
    }
  }

  /// Refresh from first page.
  Future<void> refresh() => _loadFirst();

  /// Set category filter.
  void setCategory(String? category) {
    state = state.copyWith(category: category, clearCategory: category == null);
    // ignore: discarded_futures
    _loadFirst();
  }

  /// Set condition filter.
  void setCondition(String? condition) {
    state = state.copyWith(condition: condition, clearCondition: condition == null);
    // ignore: discarded_futures
    _loadFirst();
  }

  /// Set district filter.
  void setDistrict(String? district) {
    state = state.copyWith(district: district, clearDistrict: district == null);
    // ignore: discarded_futures
    _loadFirst();
  }

  /// Set price range filter.
  void setPriceRange(int? min, int? max) {
    state = state.copyWith(minPrice: min, maxPrice: max);
    // ignore: discarded_futures
    _loadFirst();
  }

  /// Set sort order.
  void setSort(String? sort) {
    state = state.copyWith(sort: sort, clearSort: sort == null);
    // ignore: discarded_futures
    _loadFirst();
  }

  /// Set search query.
  void setQuery(String? q) {
    state = state.copyWith(q: q, clearQ: q == null);
    // ignore: discarded_futures
    _loadFirst();
  }
}

/// Listings browse provider.
final listingsBrowseProvider =
    StateNotifierProvider<ListingsBrowseNotifier, ListingsBrowseState>((ref) {
  final api = ref.read(apiClientProvider);
  return ListingsBrowseNotifier(api);
});

/// Categories provider — cached.
final categoriesProvider = FutureProvider<List<Category>>((ref) async {
  final api = ref.read(apiClientProvider);
  return api.listCategories();
});

/// Single listing provider by ID.
final listingByIdProvider =
    FutureProvider.family<Listing, String>((ref, id) async {
  final api = ref.read(apiClientProvider);
  return api.getListing(id);
});

/// My listings provider.
final myListingsProvider = FutureProvider<List<Listing>>((ref) async {
  final api = ref.read(apiClientProvider);
  return api.myListings();
});

/// Sent offers provider.
final sentOffersProvider = FutureProvider<List<Offer>>((ref) async {
  final api = ref.read(apiClientProvider);
  return api.sentOffers();
});

/// Received offers provider.
final receivedOffersProvider = FutureProvider<List<Offer>>((ref) async {
  final api = ref.read(apiClientProvider);
  return api.receivedOffers();
});
