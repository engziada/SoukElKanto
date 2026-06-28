import 'package:flutter_test/flutter_test.dart';
import 'package:souk_elkanto_mobile/core/api/models.dart';
import 'package:souk_elkanto_mobile/core/api/api_error.dart';

void main() {
  group('AuthUser', () {
    test('fromJson parses all fields correctly', () {
      final json = {
        'id': 'user-1',
        'phoneNumber': '+201000000000',
        'role': 'USER',
        'isVerified': true,
        'trustScore': 250,
        'fullName': 'Ahmed',
        'gender': 'male',
        'birthdate': '1990-01-01',
        'kyc': {'status': 'APPROVED', 'reviewedAt': '2024-01-01'},
      };

      final user = AuthUser.fromJson(json);

      expect(user.id, 'user-1');
      expect(user.phoneNumber, '+201000000000');
      expect(user.role, 'USER');
      expect(user.isVerified, true);
      expect(user.trustScore, 250);
      expect(user.fullName, 'Ahmed');
      expect(user.isKycVerified, true);
    });

    test('fromJson handles missing optional fields with defaults', () {
      final json = {
        'id': 'user-2',
        'phoneNumber': '+201000000001',
      };

      final user = AuthUser.fromJson(json);

      expect(user.role, 'USER');
      expect(user.isVerified, false);
      expect(user.trustScore, 0);
      expect(user.fullName, isNull);
      expect(user.isKycVerified, false);
      expect(user.isProfileComplete, false);
    });

    test('isProfileComplete is true when fullName, gender, and birthdate are set', () {
      final user = AuthUser(
        id: 'user-1',
        phoneNumber: '+201000000000',
        fullName: 'Ahmed',
        gender: 'male',
        birthdate: '1990-01-01',
      );

      expect(user.isProfileComplete, true);
    });

    test('isProfileComplete is false when any field is missing', () {
      final user = AuthUser(
        id: 'user-1',
        phoneNumber: '+201000000000',
        fullName: 'Ahmed',
        gender: 'male',
      );

      expect(user.isProfileComplete, false);
    });

    test('copyWith updates only specified fields', () {
      final user = AuthUser(
        id: 'user-1',
        phoneNumber: '+201000000000',
        fullName: 'Old Name',
      );
      final updated = user.copyWith(fullName: 'New Name');

      expect(updated.fullName, 'New Name');
      expect(updated.id, 'user-1');
      expect(updated.phoneNumber, '+201000000000');
    });

    test('toJson round-trips correctly', () {
      final user = AuthUser(
        id: 'user-1',
        phoneNumber: '+201000000000',
        fullName: 'Ahmed',
        trustScore: 200,
      );
      final json = user.toJson();
      final restored = AuthUser.fromJson(json);

      expect(restored.id, user.id);
      expect(restored.phoneNumber, user.phoneNumber);
      expect(restored.fullName, user.fullName);
      expect(restored.trustScore, user.trustScore);
    });
  });

  group('KycStatus', () {
    test('fromJson parses status and reviewedAt', () {
      final kyc = KycStatus.fromJson({
        'status': 'APPROVED',
        'reviewedAt': '2024-06-01',
      });

      expect(kyc.status, 'APPROVED');
      expect(kyc.reviewedAt, '2024-06-01');
    });

    test('toJson round-trips correctly', () {
      const kyc = KycStatus(status: 'PENDING', reviewedAt: null);
      final json = kyc.toJson();

      expect(json['status'], 'PENDING');
      expect(json['reviewedAt'], isNull);
    });
  });

  group('ListingStatus', () {
    test('fromString parses all valid values', () {
      expect(ListingStatus.fromString('ACTIVE'), ListingStatus.active);
      expect(ListingStatus.fromString('RESERVED'), ListingStatus.reserved);
      expect(ListingStatus.fromString('SOLD'), ListingStatus.sold);
      expect(ListingStatus.fromString('PENDING_REVIEW'),
          ListingStatus.pendingReview);
      expect(ListingStatus.fromString('REMOVED'), ListingStatus.removed);
      expect(ListingStatus.fromString('EXPIRED'), ListingStatus.expired);
    });

    test('fromString defaults to active for unknown values', () {
      expect(ListingStatus.fromString('UNKNOWN'), ListingStatus.active);
      expect(ListingStatus.fromString(null), ListingStatus.active);
    });

    test('apiValue round-trips correctly', () {
      for (final status in ListingStatus.values) {
        expect(ListingStatus.fromString(status.apiValue), status);
      }
    });
  });

  group('OfferStatus', () {
    test('fromString parses all valid values', () {
      expect(OfferStatus.fromString('PENDING'), OfferStatus.pending);
      expect(OfferStatus.fromString('ACCEPTED'), OfferStatus.accepted);
      expect(OfferStatus.fromString('DECLINED'), OfferStatus.declined);
      expect(OfferStatus.fromString('COUNTERED'), OfferStatus.countered);
      expect(OfferStatus.fromString('WITHDRAWN'), OfferStatus.withdrawn);
      expect(OfferStatus.fromString('HANDOVER_PENDING'),
          OfferStatus.handoverPending);
      expect(OfferStatus.fromString('CONFIRMED'), OfferStatus.confirmed);
      expect(OfferStatus.fromString('CLOSED'), OfferStatus.closed);
    });

    test('fromString defaults to pending for unknown values', () {
      expect(OfferStatus.fromString('UNKNOWN'), OfferStatus.pending);
      expect(OfferStatus.fromString(null), OfferStatus.pending);
    });

    test('apiValue round-trips correctly', () {
      for (final status in OfferStatus.values) {
        expect(OfferStatus.fromString(status.apiValue), status);
      }
    });
  });

  group('Listing', () {
    test('fromJson parses all fields correctly', () {
      final json = {
        'id': 'listing-1',
        'sellerId': 'user-1',
        'title': 'iPhone 13',
        'askingPrice': 15000,
        'condition': 'GOOD',
        'category': 'electronics',
        'district': 'Madinaty',
        'status': 'ACTIVE',
        'description': 'Great condition',
        'photos': [
          {
            'id': 'photo-1',
            'r2Key': 'listings/test/photo.jpg',
            'url': 'https://example.com/photo.jpg',
            'position': 0,
          }
        ],
        'viewCount': 42,
        '_count': {'offers': 3},
      };

      final listing = Listing.fromJson(json);

      expect(listing.id, 'listing-1');
      expect(listing.title, 'iPhone 13');
      expect(listing.askingPrice, 15000);
      expect(listing.condition, 'GOOD');
      expect(listing.status, ListingStatus.active);
      expect(listing.photos.length, 1);
      expect(listing.photos.first.url, 'https://example.com/photo.jpg');
      expect(listing.viewCount, 42);
      expect(listing.offerCount, 3);
    });

    test('fromJson handles missing optional fields', () {
      final json = {
        'id': 'listing-2',
        'sellerId': 'user-1',
        'title': 'No photos',
        'askingPrice': 100,
        'condition': 'NEW',
        'category': 'other',
        'district': 'Madinaty',
      };

      final listing = Listing.fromJson(json);

      expect(listing.photos, isEmpty);
      expect(listing.description, isNull);
      expect(listing.viewCount, 0);
      expect(listing.offerCount, 0);
      expect(listing.primaryPhoto, isNull);
    });

    test('primaryPhoto returns first photo when photos exist', () {
      final listing = Listing(
        id: 'l1',
        sellerId: 'u1',
        title: 'Test',
        askingPrice: 100,
        condition: 'NEW',
        category: 'other',
        district: 'Madinaty',
        status: ListingStatus.active,
        photos: [
          ListingPhoto(id: 'p1', r2Key: 'k', url: 'url1', position: 0),
          ListingPhoto(id: 'p2', r2Key: 'k2', url: 'url2', position: 1),
        ],
      );

      expect(listing.primaryPhoto?.url, 'url1');
    });

    test('primaryPhoto returns null when photos empty', () {
      final listing = Listing(
        id: 'l1',
        sellerId: 'u1',
        title: 'Test',
        askingPrice: 100,
        condition: 'NEW',
        category: 'other',
        district: 'Madinaty',
        status: ListingStatus.active,
      );

      expect(listing.primaryPhoto, isNull);
    });

    test('copyWith updates only specified fields', () {
      final listing = Listing(
        id: 'l1',
        sellerId: 'u1',
        title: 'Old Title',
        askingPrice: 100,
        condition: 'NEW',
        category: 'other',
        district: 'Madinaty',
        status: ListingStatus.active,
      );
      final updated = listing.copyWith(title: 'New Title', askingPrice: 200);

      expect(updated.title, 'New Title');
      expect(updated.askingPrice, 200);
      expect(updated.id, 'l1');
      expect(updated.condition, 'NEW');
    });
  });

  group('PaginatedResponse', () {
    test('hasMore is true when page < totalPages', () {
      const res = PaginatedResponse<Listing>(
        data: [],
        page: 1,
        limit: 20,
        totalItems: 50,
        totalPages: 3,
      );

      expect(res.hasMore, true);
    });

    test('hasMore is false when page >= totalPages', () {
      const res = PaginatedResponse<Listing>(
        data: [],
        page: 3,
        limit: 20,
        totalItems: 50,
        totalPages: 3,
      );

      expect(res.hasMore, false);
    });
  });

  group('ApiError', () {
    test('NetworkError has statusCode 0 and isNetwork is true', () {
      const err = NetworkError();

      expect(err.statusCode, 0);
      expect(err.isNetwork, true);
      expect(err.isUnauthorized, false);
    });

    test('UnauthorizedError has statusCode 401', () {
      const err = UnauthorizedError();

      expect(err.statusCode, 401);
      expect(err.isUnauthorized, true);
    });

    test('NotFoundError has statusCode 404', () {
      const err = NotFoundError();

      expect(err.statusCode, 404);
      expect(err.isNotFound, true);
    });

    test('ValidationError has statusCode 400', () {
      const err = ValidationError(message: 'Invalid field');

      expect(err.statusCode, 400);
      expect(err.isValidation, true);
    });

    test('isServer is true for 5xx errors', () {
      const err = ApiError(statusCode: 500, message: 'Server error');

      expect(err.isServer, true);
    });

    test('toString includes statusCode and message', () {
      const err = ApiError(statusCode: 404, message: 'Not found');

      expect(err.toString(), 'ApiError(404): Not found');
    });
  });
}
