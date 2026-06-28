import 'package:flutter_test/flutter_test.dart';
import 'package:souk_elkanto_mobile/core/api/models.dart';

/// Test fixtures for unit and widget tests.
///
/// Provides factory methods that create model instances with sensible defaults.
/// Each method accepts optional overrides so tests can customize specific fields.
class Fixtures {
  Fixtures._();

  /// A minimal AuthUser (no profile data, not verified).
  static AuthUser user({
    String id = 'user-1',
    String phoneNumber = '+201000000000',
    String role = 'USER',
    bool isVerified = false,
    int trustScore = 100,
    String? fullName,
    String? gender,
    String? birthdate,
    KycStatus? kyc,
  }) =>
      AuthUser(
        id: id,
        phoneNumber: phoneNumber,
        role: role,
        isVerified: isVerified,
        trustScore: trustScore,
        fullName: fullName,
        gender: gender,
        birthdate: birthdate,
        kyc: kyc,
      );

  /// A verified user with complete profile.
  static AuthUser verifiedUser({
    String id = 'user-verified',
    String fullName = 'Ahmed Test',
  }) =>
      user(
        id: id,
        fullName: fullName,
        gender: 'male',
        birthdate: '1990-01-01',
        isVerified: true,
        trustScore: 250,
        kyc: const KycStatus(status: 'APPROVED', reviewedAt: '2024-01-01'),
      );

  /// A ListingPhoto with default values.
  static ListingPhoto photo({
    String id = 'photo-1',
    String r2Key = 'listings/test/photo.jpg',
    String url = 'https://example.com/photo.jpg',
    int position = 0,
  }) =>
      ListingPhoto(
        id: id,
        r2Key: r2Key,
        url: url,
        position: position,
      );

  /// A minimal active listing.
  static Listing listing({
    String id = 'listing-1',
    String sellerId = 'user-1',
    String title = 'Test Item',
    int askingPrice = 500,
    String condition = 'GOOD',
    String category = 'electronics',
    String district = 'Madinaty',
    ListingStatus status = ListingStatus.active,
    String? description = 'A test listing',
    List<ListingPhoto> photos = const [],
    int offerCount = 0,
  }) =>
      Listing(
        id: id,
        sellerId: sellerId,
        title: title,
        askingPrice: askingPrice,
        condition: condition,
        category: category,
        district: district,
        status: status,
        description: description,
        photos: photos,
        offerCount: offerCount,
      );

  /// A listing with a photo.
  static Listing listingWithPhoto() => listing(photos: [photo()]);

  /// A Category with bilingual labels.
  static Category category({
    String value = 'electronics',
    String labelEn = 'Electronics',
    String labelAr = 'إلكترونيات',
  }) =>
      Category(
        value: value,
        labelEn: labelEn,
        labelAr: labelAr,
      );

  /// JSON map matching the backend response for a listing.
  static Map<String, dynamic> listingJson({
    String id = 'listing-1',
    String title = 'Test Item',
    int askingPrice = 500,
    String status = 'ACTIVE',
  }) =>
      {
        'id': id,
        'sellerId': 'user-1',
        'title': title,
        'askingPrice': askingPrice,
        'condition': 'GOOD',
        'category': 'electronics',
        'district': 'Madinaty',
        'status': status,
        'description': 'A test listing',
        'photos': [],
      };

  /// JSON map matching the backend response for a user.
  static Map<String, dynamic> userJson({
    String id = 'user-1',
    String phoneNumber = '+201000000000',
    String? fullName,
  }) =>
      {
        'id': id,
        'phoneNumber': phoneNumber,
        'role': 'USER',
        'isVerified': false,
        'trustScore': 100,
        if (fullName != null) 'fullName': fullName,
      };
}
