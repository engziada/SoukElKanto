import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:souk_elkanto_mobile/core/listings/listings_provider.dart';

void main() {
  group('ListingsBrowseState', () {
    test('default state has loading listings, page 1, hasMore true', () {
      const state = ListingsBrowseState();

      expect(state.listings.isLoading, true);
      expect(state.page, 1);
      expect(state.hasMore, true);
      expect(state.category, isNull);
      expect(state.condition, isNull);
      expect(state.district, isNull);
      expect(state.sort, isNull);
      expect(state.q, isNull);
    });

    test('copyWith updates only specified fields', () {
      const state = ListingsBrowseState();
      final updated = state.copyWith(
        page: 2,
        category: 'electronics',
      );

      expect(updated.page, 2);
      expect(updated.category, 'electronics');
      expect(updated.condition, isNull);
      expect(updated.hasMore, true);
    });

    test('copyWith clearCategory sets category to null', () {
      const state = ListingsBrowseState(category: 'electronics');
      final updated = state.copyWith(clearCategory: true);

      expect(updated.category, isNull);
    });

    test('copyWith clearSort sets sort to null', () {
      const state = ListingsBrowseState(sort: 'price_asc');
      final updated = state.copyWith(clearSort: true);

      expect(updated.sort, isNull);
    });

    test('copyWith clearQ sets q to null', () {
      const state = ListingsBrowseState(q: 'iphone');
      final updated = state.copyWith(clearQ: true);

      expect(updated.q, isNull);
    });

    test('copyWith preserves existing fields when not specified', () {
      const state = ListingsBrowseState(
        page: 3,
        category: 'electronics',
        sort: 'price_asc',
      );
      final updated = state.copyWith(page: 4);

      expect(updated.page, 4);
      expect(updated.category, 'electronics');
      expect(updated.sort, 'price_asc');
    });
  });
}
