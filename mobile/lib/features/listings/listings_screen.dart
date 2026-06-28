import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/i18n/app_locale.dart';
import '../../core/i18n/generated/app_localizations.dart';
import '../../core/i18n/l10n_helper.dart';
import '../../core/listings/listings_provider.dart';
import '../../core/theme/app_colors.dart';
import '../../shared/widgets/empty_state.dart';
import '../../shared/widgets/error_view.dart';
import '../../shared/widgets/listing_card.dart';
import '../../shared/widgets/loading_indicator.dart';

/// Listings browse screen — search, filter, and paginated grid.
class ListingsScreen extends ConsumerStatefulWidget {
  const ListingsScreen({super.key});

  @override
  ConsumerState<ListingsScreen> createState() => _ListingsScreenState();
}

class _ListingsScreenState extends ConsumerState<ListingsScreen> {
  final _scrollController = ScrollController();
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      // ignore: discarded_futures
      ref.read(listingsBrowseProvider.notifier).loadMore();
    }
  }

  @override
  Widget build(BuildContext context) {
    final browseState = ref.watch(listingsBrowseProvider);
    final l = context.l10n;

    return Scaffold(
      appBar: AppBar(
        title: Text(l.navListings),
        actions: [
          IconButton(
            icon: const Icon(Icons.tune),
            onPressed: () => _showFilterSheet(context),
          ),
        ],
      ),
      body: Column(
        children: [
          // Search bar
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: l.heroSearchPlaceholder,
                prefixIcon: const Icon(Icons.search),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppColors.coral),
                ),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _searchController.clear();
                          ref
                              .read(listingsBrowseProvider.notifier)
                              .setQuery(null);
                        },
                      )
                    : null,
              ),
              onSubmitted: (value) {
                ref
                    .read(listingsBrowseProvider.notifier)
                    .setQuery(value.isEmpty ? null : value);
              },
            ),
          ),
          // Active filter chips
          if (browseState.category != null ||
              browseState.condition != null ||
              browseState.sort != null)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: SizedBox(
                height: 36,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  children: [
                    if (browseState.category != null)
                      _FilterChip(
                        label: browseState.category!,
                        onRemove: () => ref
                            .read(listingsBrowseProvider.notifier)
                            .setCategory(null),
                      ),
                    if (browseState.condition != null)
                      _FilterChip(
                        label: browseState.condition!,
                        onRemove: () => ref
                            .read(listingsBrowseProvider.notifier)
                            .setCondition(null),
                      ),
                    if (browseState.sort != null)
                      _FilterChip(
                        label: browseState.sort!,
                        onRemove: () => ref
                            .read(listingsBrowseProvider.notifier)
                            .setSort(null),
                      ),
                  ],
                ),
              ),
            ),
          // Listings grid
          Expanded(
            child: RefreshIndicator(
              color: AppColors.coral,
              onRefresh: () =>
                  ref.read(listingsBrowseProvider.notifier).refresh(),
              child: browseState.listings.when(
                data: (listings) {
                  if (listings.isEmpty) {
                    return EmptyState(
                      icon: Icons.search_off,
                      title: l.searchNoResultsTitle,
                      subtitle: l.errorEmptyResults,
                    );
                  }
                  return GridView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.all(16),
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      mainAxisSpacing: 12,
                      crossAxisSpacing: 12,
                      childAspectRatio: 0.72,
                    ),
                    itemCount: listings.length,
                    itemBuilder: (context, index) => ListingCard(
                      listing: listings[index],
                    ),
                  );
                },
                loading: () => const LoadingIndicator(),
                error: (e, _) => ErrorView(
                  message: e.toString(),
                  onRetry: () => ref
                      .read(listingsBrowseProvider.notifier)
                      .refresh(),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showFilterSheet(BuildContext context) {
    // ignore: discarded_futures
    showModalBottomSheet<void>(
      context: context,
      builder: (context) => _FilterSheet(ref: ref),
    );
  }
}

class _FilterChip extends StatelessWidget {
  const _FilterChip({required this.label, required this.onRemove});

  final String label;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: Chip(
        label: Text(label),
        onDeleted: onRemove,
        deleteIconColor: AppColors.coral,
        backgroundColor: AppColors.coralAwning,
        side: BorderSide.none,
      ),
    );
  }
}

class _FilterSheet extends StatelessWidget {
  const _FilterSheet({required this.ref});

  final WidgetRef ref;

  @override
  Widget build(BuildContext context) {
    final categoriesAsync = ref.watch(categoriesProvider);
    final browseState = ref.watch(listingsBrowseProvider);
    final l = context.l10n;

    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            l.filterTitle,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
          ),
          const SizedBox(height: 16),
          // Sort options
          Text(l.filterSort, style: Theme.of(context).textTheme.labelLarge),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            children: [
              for (final sort in ['newest', 'price_asc', 'price_desc', 'popular'])
                ChoiceChip(
                  label: Text(_sortLabel(context.l10n, sort)),
                  selected: browseState.sort == sort,
                  selectedColor: AppColors.coral,
                  labelStyle: TextStyle(
                    color: browseState.sort == sort
                        ? AppColors.warmWhite
                        : null,
                  ),
                  onSelected: (_) {
                    ref.read(listingsBrowseProvider.notifier).setSort(sort);
                    Navigator.pop(context);
                  },
                ),
            ],
          ),
          const SizedBox(height: 16),
          // Categories
          Text(l.filterCategory, style: Theme.of(context).textTheme.labelLarge),
          const SizedBox(height: 8),
          categoriesAsync.when(
            data: (categories) => Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final cat in categories)
                  ChoiceChip(
                    label: Text(AppLocale.isArabic(Localizations.localeOf(context)) ? cat.labelAr : cat.labelEn),
                    selected: browseState.category == cat.value,
                    selectedColor: AppColors.coral,
                    labelStyle: TextStyle(
                      color: browseState.category == cat.value
                          ? AppColors.warmWhite
                          : null,
                    ),
                    onSelected: (_) {
                      ref
                          .read(listingsBrowseProvider.notifier)
                          .setCategory(cat.value);
                      Navigator.pop(context);
                    },
                  ),
              ],
            ),
            loading: () => const SizedBox(
              height: 24,
              width: 24,
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
            error: (_, _) => Text(l.errorGeneric),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  String _sortLabel(AppLocalizations l, String sort) {
    switch (sort) {
      case 'newest':
        return l.filterSortNewest;
      case 'price_asc':
        return l.filterSortPriceAsc;
      case 'price_desc':
        return l.filterSortPriceDesc;
      case 'popular':
        return l.filterSortPopular;
      default:
        return sort;
    }
  }
}
