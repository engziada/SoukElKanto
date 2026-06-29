/// Data models for the Souk ElKanto mobile app.
///
/// Mirrors the CoreMesh API response shapes. All models are immutable
/// and use copyWith for updates. Field names match the backend exactly.
library;

// ─────────────────────────────────────────────────────────────────────────────
// Auth & User
// ─────────────────────────────────────────────────────────────────────────────

/// User authentication payload returned by /auth/verify-otp and /auth/me.
class AuthUser {
  const AuthUser({
    required this.id,
    required this.phoneNumber,
    this.role = 'USER',
    this.isVerified = false,
    this.trustScore = 0,
    this.fullName,
    this.gender,
    this.birthdate,
    this.address,
    this.madinatyGroup,
    this.buildingNo,
    this.aptNo,
    this.kyc,
    this.createdAt,
  });

  final String id;
  final String phoneNumber;
  final String role;
  final bool isVerified;
  final int trustScore;
  final String? fullName;
  final String? gender;
  final String? birthdate;
  final String? address;
  final String? madinatyGroup;
  final String? buildingNo;
  final String? aptNo;
  final KycStatus? kyc;
  final String? createdAt;

  bool get isKycVerified => kyc?.status == 'APPROVED';

  bool get isProfileComplete =>
      fullName != null &&
      fullName!.isNotEmpty &&
      gender != null &&
      birthdate != null;

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    final metadata = json['metadata'] as Map<String, dynamic>?;
    return AuthUser(
      id: json['id'] as String,
      phoneNumber: json['phoneNumber'] as String,
      role: (json['role'] as String?) ?? 'USER',
      isVerified: (json['isVerified'] as bool?) ?? false,
      trustScore: (json['trustScore'] as num?)?.toInt() ?? 0,
      fullName: (json['fullName'] as String?) ??
          (metadata?['fullName'] as String?),
      gender: (json['gender'] as String?) ??
          (metadata?['gender'] as String?),
      birthdate: (json['birthdate'] as String?) ??
          (metadata?['birthdate'] as String?),
      address: (json['address'] as String?) ??
          (metadata?['address'] as String?),
      madinatyGroup: (json['madinatyGroup'] as String?) ??
          (metadata?['madinatyGroup'] as String?),
      buildingNo: (json['buildingNo'] as String?) ??
          (metadata?['buildingNo'] as String?),
      aptNo: (json['aptNo'] as String?) ??
          (metadata?['aptNo'] as String?),
      kyc: json['kyc'] != null
          ? KycStatus.fromJson(
              (json['kyc'] as Map<String, dynamic>).cast<String, dynamic>())
          : null,
      createdAt: json['createdAt'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'phoneNumber': phoneNumber,
        'role': role,
        'isVerified': isVerified,
        'trustScore': trustScore,
        'fullName': fullName,
        'gender': gender,
        'birthdate': birthdate,
        'address': address,
        'madinatyGroup': madinatyGroup,
        'buildingNo': buildingNo,
        'aptNo': aptNo,
        'kyc': kyc?.toJson(),
        'createdAt': createdAt,
      };

  AuthUser copyWith({
    String? fullName,
    String? gender,
    String? birthdate,
    String? address,
    String? madinatyGroup,
    String? buildingNo,
    String? aptNo,
    KycStatus? kyc,
    int? trustScore,
    bool? isVerified,
  }) =>
      AuthUser(
        id: id,
        phoneNumber: phoneNumber,
        role: role,
        isVerified: isVerified ?? this.isVerified,
        trustScore: trustScore ?? this.trustScore,
        fullName: fullName ?? this.fullName,
        gender: gender ?? this.gender,
        birthdate: birthdate ?? this.birthdate,
        address: address ?? this.address,
        madinatyGroup: madinatyGroup ?? this.madinatyGroup,
        buildingNo: buildingNo ?? this.buildingNo,
        aptNo: aptNo ?? this.aptNo,
        kyc: kyc ?? this.kyc,
        createdAt: createdAt,
      );
}

/// KYC status embedded in the user object.
class KycStatus {
  const KycStatus({
    required this.status,
    this.reviewedAt,
  });

  final String status;
  final String? reviewedAt;

  factory KycStatus.fromJson(Map<String, dynamic> json) => KycStatus(
        status: json['status'] as String,
        reviewedAt: json['reviewedAt'] as String?,
      );

  Map<String, dynamic> toJson() => {
        'status': status,
        'reviewedAt': reviewedAt,
      };
}

// ─────────────────────────────────────────────────────────────────────────────
// Listings
// ─────────────────────────────────────────────────────────────────────────────

/// Listing status enum.
enum ListingStatus {
  active,
  reserved,
  sold,
  pendingReview,
  removed,
  expired;

  static ListingStatus fromString(String? value) {
    switch (value?.toUpperCase()) {
      case 'ACTIVE':
        return ListingStatus.active;
      case 'RESERVED':
        return ListingStatus.reserved;
      case 'SOLD':
        return ListingStatus.sold;
      case 'PENDING_REVIEW':
        return ListingStatus.pendingReview;
      case 'REMOVED':
        return ListingStatus.removed;
      case 'EXPIRED':
        return ListingStatus.expired;
      default:
        return ListingStatus.active;
    }
  }

  String get apiValue => switch (this) {
        ListingStatus.active => 'ACTIVE',
        ListingStatus.reserved => 'RESERVED',
        ListingStatus.sold => 'SOLD',
        ListingStatus.pendingReview => 'PENDING_REVIEW',
        ListingStatus.removed => 'REMOVED',
        ListingStatus.expired => 'EXPIRED',
      };
}

/// A photo attached to a listing.
class ListingPhoto {
  const ListingPhoto({
    required this.id,
    required this.r2Key,
    required this.url,
    required this.position,
    this.width = 0,
    this.height = 0,
    this.bytes = 0,
  });

  final String id;
  final String r2Key;
  final String url;
  final int position;
  final int width;
  final int height;
  final int bytes;

  factory ListingPhoto.fromJson(Map<String, dynamic> json) => ListingPhoto(
        id: json['id'] as String,
        r2Key: json['r2Key'] as String,
        url: (json['url'] as String?) ?? '',
        position: (json['position'] as num?)?.toInt() ?? 0,
        width: (json['width'] as num?)?.toInt() ?? 0,
        height: (json['height'] as num?)?.toInt() ?? 0,
        bytes: (json['bytes'] as num?)?.toInt() ?? 0,
      );
}

/// A marketplace listing.
class Listing {
  const Listing({
    required this.id,
    required this.sellerId,
    required this.title,
    required this.askingPrice,
    required this.condition,
    required this.category,
    required this.district,
    required this.status,
    this.description,
    this.photos = const [],
    this.viewCount = 0,
    this.offerCount = 0,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String sellerId;
  final String title;
  final int askingPrice;
  final String condition;
  final String category;
  final String district;
  final ListingStatus status;
  final String? description;
  final List<ListingPhoto> photos;
  final int viewCount;
  final int offerCount;
  final String? createdAt;
  final String? updatedAt;

  ListingPhoto? get primaryPhoto =>
      photos.isNotEmpty ? photos.first : null;

  factory Listing.fromJson(Map<String, dynamic> json) => Listing(
        id: json['id'] as String,
        sellerId: json['sellerId'] as String,
        title: json['title'] as String,
        askingPrice: (json['askingPrice'] as num).toInt(),
        condition: json['condition'] as String,
        category: json['category'] as String,
        district: json['district'] as String,
        status: ListingStatus.fromString(json['status'] as String?),
        description: json['description'] as String?,
        photos: (json['photos'] as List<dynamic>?)
                ?.map((e) =>
                    ListingPhoto.fromJson((e as Map<String, dynamic>).cast<String, dynamic>()))
                .toList() ??
            const [],
        viewCount: (json['viewCount'] as num?)?.toInt() ?? 0,
        offerCount: ((json['_count'] as Map<String, dynamic>?)?['offers']
                    as num?)
                ?.toInt() ??
            (json['offerCount'] as num?)?.toInt() ??
            0,
        createdAt: json['createdAt'] as String?,
        updatedAt: json['updatedAt'] as String?,
      );

  Listing copyWith({
    String? title,
    String? description,
    int? askingPrice,
    String? condition,
    String? category,
    String? district,
    ListingStatus? status,
    List<ListingPhoto>? photos,
  }) =>
      Listing(
        id: id,
        sellerId: sellerId,
        title: title ?? this.title,
        askingPrice: askingPrice ?? this.askingPrice,
        condition: condition ?? this.condition,
        category: category ?? this.category,
        district: district ?? this.district,
        status: status ?? this.status,
        description: description ?? this.description,
        photos: photos ?? this.photos,
        viewCount: viewCount,
        offerCount: offerCount,
        createdAt: createdAt,
        updatedAt: updatedAt,
      );
}

/// Paginated response wrapper for list endpoints.
class PaginatedResponse<T> {
  const PaginatedResponse({
    required this.data,
    required this.page,
    required this.limit,
    required this.totalItems,
    required this.totalPages,
  });

  final List<T> data;
  final int page;
  final int limit;
  final int totalItems;
  final int totalPages;

  bool get hasMore => page < totalPages;
}

// ─────────────────────────────────────────────────────────────────────────────
// Offers
// ─────────────────────────────────────────────────────────────────────────────

/// Offer status enum.
enum OfferStatus {
  pending,
  accepted,
  declined,
  countered,
  withdrawn,
  expired,
  handoverPending,
  confirmed,
  closed,
  cancelled;

  static OfferStatus fromString(String? value) {
    switch (value?.toUpperCase()) {
      case 'PENDING':
        return OfferStatus.pending;
      case 'ACCEPTED':
        return OfferStatus.accepted;
      case 'DECLINED':
        return OfferStatus.declined;
      case 'COUNTERED':
        return OfferStatus.countered;
      case 'WITHDRAWN':
        return OfferStatus.withdrawn;
      case 'EXPIRED':
        return OfferStatus.expired;
      case 'HANDOVER_PENDING':
        return OfferStatus.handoverPending;
      case 'CONFIRMED':
        return OfferStatus.confirmed;
      case 'CLOSED':
        return OfferStatus.closed;
      case 'CANCELLED':
        return OfferStatus.cancelled;
      default:
        return OfferStatus.pending;
    }
  }

  String get apiValue => switch (this) {
        OfferStatus.pending => 'PENDING',
        OfferStatus.accepted => 'ACCEPTED',
        OfferStatus.declined => 'DECLINED',
        OfferStatus.countered => 'COUNTERED',
        OfferStatus.withdrawn => 'WITHDRAWN',
        OfferStatus.expired => 'EXPIRED',
        OfferStatus.handoverPending => 'HANDOVER_PENDING',
        OfferStatus.confirmed => 'CONFIRMED',
        OfferStatus.closed => 'CLOSED',
        OfferStatus.cancelled => 'CANCELLED',
      };
}

/// Handover confirmation state for an offer.
class OfferHandover {
  const OfferHandover({
    required this.offerId,
    this.buyerConfirmedAt,
    this.sellerConfirmedAt,
    this.confirmedAt,
  });

  final String offerId;
  final String? buyerConfirmedAt;
  final String? sellerConfirmedAt;
  final String? confirmedAt;

  bool get isBuyerConfirmed => buyerConfirmedAt != null;
  bool get isSellerConfirmed => sellerConfirmedAt != null;
  bool get isFullyConfirmed => confirmedAt != null;

  factory OfferHandover.fromJson(Map<String, dynamic> json) => OfferHandover(
        offerId: json['offerId'] as String,
        buyerConfirmedAt: json['buyerConfirmedAt'] as String?,
        sellerConfirmedAt: json['sellerConfirmedAt'] as String?,
        confirmedAt: json['confirmedAt'] as String?,
      );
}

/// A rating on an offer.
class OfferRating {
  const OfferRating({
    required this.id,
    required this.raterId,
    required this.score,
    this.comment,
  });

  final String id;
  final String raterId;
  final int score;
  final String? comment;

  factory OfferRating.fromJson(Map<String, dynamic> json) => OfferRating(
        id: json['id'] as String,
        raterId: json['raterId'] as String,
        score: (json['score'] as num).toInt(),
        comment: json['comment'] as String?,
      );
}

/// An offer on a listing.
class Offer {
  const Offer({
    required this.id,
    required this.listingId,
    required this.buyerId,
    required this.sellerId,
    required this.amount,
    required this.status,
    this.note,
    this.tokenHoldAmount,
    this.tokenHoldExpiresAt,
    this.parentOfferId,
    this.declineReason,
    this.declinedAt,
    this.acceptedAt,
    this.createdAt,
    this.updatedAt,
    this.listing,
    this.handover,
    this.ratings = const [],
  });

  final String id;
  final String listingId;
  final String buyerId;
  final String sellerId;
  final int amount;
  final OfferStatus status;
  final String? note;
  final int? tokenHoldAmount;
  final String? tokenHoldExpiresAt;
  final String? parentOfferId;
  final String? declineReason;
  final String? declinedAt;
  final String? acceptedAt;
  final String? createdAt;
  final String? updatedAt;
  final Listing? listing;
  final OfferHandover? handover;
  final List<OfferRating> ratings;

  bool get isCountered => parentOfferId != null;

  factory Offer.fromJson(Map<String, dynamic> json) => Offer(
        id: json['id'] as String,
        listingId: json['listingId'] as String,
        buyerId: json['buyerId'] as String,
        sellerId: json['sellerId'] as String,
        amount: (json['amount'] as num).toInt(),
        status: OfferStatus.fromString(json['status'] as String?),
        note: json['note'] as String?,
        tokenHoldAmount: (json['tokenHoldAmount'] as num?)?.toInt(),
        tokenHoldExpiresAt: json['tokenHoldExpiresAt'] as String?,
        parentOfferId: json['parentOfferId'] as String?,
        declineReason: json['declineReason'] as String?,
        declinedAt: json['declinedAt'] as String?,
        acceptedAt: json['acceptedAt'] as String?,
        createdAt: json['createdAt'] as String?,
        updatedAt: json['updatedAt'] as String?,
        listing: json['listing'] != null
            ? Listing.fromJson(
                (json['listing'] as Map<String, dynamic>).cast<String, dynamic>())
            : null,
        handover: json['handover'] != null
            ? OfferHandover.fromJson(
                (json['handover'] as Map<String, dynamic>).cast<String, dynamic>())
            : null,
        ratings: (json['ratings'] as List<dynamic>?)
                ?.map((e) =>
                    OfferRating.fromJson((e as Map<String, dynamic>).cast<String, dynamic>()))
                .toList() ??
            const [],
      );
}

// ─────────────────────────────────────────────────────────────────────────────
// Favorites
// ─────────────────────────────────────────────────────────────────────────────

/// A favorite entry with the associated listing.
class Favorite {
  const Favorite({
    required this.listingId,
    required this.createdAt,
    this.listing,
  });

  final String listingId;
  final String? createdAt;
  final Listing? listing;

  factory Favorite.fromJson(Map<String, dynamic> json) => Favorite(
        listingId: json['listingId'] as String,
        createdAt: json['createdAt'] as String?,
        listing: json['listing'] != null
            ? Listing.fromJson(
                (json['listing'] as Map<String, dynamic>).cast<String, dynamic>())
            : null,
      );
}

// ─────────────────────────────────────────────────────────────────────────────
// Categories
// ─────────────────────────────────────────────────────────────────────────────

/// A listing category with bilingual labels.
class Category {
  const Category({
    required this.value,
    required this.labelEn,
    required this.labelAr,
  });

  final String value;
  final String labelEn;
  final String labelAr;

  String label(String locale) =>
      locale.startsWith('ar') ? labelAr : labelEn;

  factory Category.fromJson(Map<String, dynamic> json) => Category(
        value: json['value'] as String,
        labelEn: json['labelEn'] as String,
        labelAr: json['labelAr'] as String,
      );
}

// ─────────────────────────────────────────────────────────────────────────────
// Token Wallet
// ─────────────────────────────────────────────────────────────────────────────

/// Token wallet with balances, allocations, and recent transactions.
class TokenWallet {
  const TokenWallet({
    required this.userId,
    required this.businessTokens,
    required this.individualTokens,
    this.allocations = const [],
    this.recentTransactions = const [],
  });

  final String userId;
  final int businessTokens;
  final int individualTokens;
  final List<TokenAllocation> allocations;
  final List<TokenTransaction> recentTransactions;

  factory TokenWallet.fromJson(Map<String, dynamic> json) => TokenWallet(
        userId: json['userId'] as String,
        businessTokens: (json['businessTokens'] as num?)?.toInt() ?? 0,
        individualTokens: (json['individualTokens'] as num?)?.toInt() ?? 0,
        allocations: (json['allocations'] as List<dynamic>?)
                ?.map((e) => TokenAllocation.fromJson(
                    (e as Map<String, dynamic>).cast<String, dynamic>()))
                .toList() ??
            const [],
        recentTransactions: (json['recentTransactions'] as List<dynamic>?)
                ?.map((e) => TokenTransaction.fromJson(
                    (e as Map<String, dynamic>).cast<String, dynamic>()))
                .toList() ??
            const [],
      );
}

/// A token allocation (hold) for an active activity.
class TokenAllocation {
  const TokenAllocation({
    required this.activityType,
    required this.tokenType,
    required this.allocatedAmount,
  });

  final String activityType;
  final String tokenType;
  final int allocatedAmount;

  factory TokenAllocation.fromJson(Map<String, dynamic> json) =>
      TokenAllocation(
        activityType: json['activityType'] as String,
        tokenType: json['tokenType'] as String,
        allocatedAmount: (json['allocatedAmount'] as num).toInt(),
      );
}

/// A token transaction (credit/debit).
class TokenTransaction {
  const TokenTransaction({
    required this.activityType,
    required this.tokenType,
    required this.amount,
    required this.createdAt,
    this.description,
    this.referenceId,
  });

  final String activityType;
  final String tokenType;
  final int amount;
  final String? description;
  final String? referenceId;
  final String createdAt;

  factory TokenTransaction.fromJson(Map<String, dynamic> json) =>
      TokenTransaction(
        activityType: json['activityType'] as String,
        tokenType: json['tokenType'] as String,
        amount: (json['amount'] as num).toInt(),
        description: json['description'] as String?,
        referenceId: json['referenceId'] as String?,
        createdAt: json['createdAt'] as String,
      );
}

// ─────────────────────────────────────────────────────────────────────────────
// Trust Meter
// ─────────────────────────────────────────────────────────────────────────────

/// Trust meter snapshot for a user.
class TrustMeterSnapshot {
  const TrustMeterSnapshot({
    required this.userId,
    required this.total,
    required this.tier,
    required this.tierReachedAt,
    required this.highestTotal,
    this.nextTier,
    this.pointsToNextTier,
  });

  final String userId;
  final int total;
  final String tier;
  final String tierReachedAt;
  final int highestTotal;
  final String? nextTier;
  final int? pointsToNextTier;

  factory TrustMeterSnapshot.fromJson(Map<String, dynamic> json) =>
      TrustMeterSnapshot(
        userId: json['userId'] as String,
        total: (json['total'] as num).toInt(),
        tier: (json['tier'] as String?) ?? 'NEW',
        tierReachedAt: json['tierReachedAt'] as String,
        highestTotal: (json['highestTotal'] as num?)?.toInt() ?? 0,
        nextTier: json['nextTier'] as String?,
        pointsToNextTier: (json['pointsToNextTier'] as num?)?.toInt(),
      );
}

/// A bonus grant awarded on tier-up.
class TrustMeterBonusGrant {
  const TrustMeterBonusGrant({
    required this.tier,
    required this.amount,
    required this.tokenType,
    required this.grantedAt,
  });

  final String tier;
  final int amount;
  final String tokenType;
  final String grantedAt;

  factory TrustMeterBonusGrant.fromJson(Map<String, dynamic> json) =>
      TrustMeterBonusGrant(
        tier: json['tier'] as String,
        amount: (json['amount'] as num).toInt(),
        tokenType: json['tokenType'] as String,
        grantedAt: json['grantedAt'] as String,
      );
}

// ─────────────────────────────────────────────────────────────────────────────
// Safe Meet Spots
// ─────────────────────────────────────────────────────────────────────────────

/// A safe meet spot for in-person handovers.
class SafeSpot {
  const SafeSpot({
    required this.id,
    required this.name,
    required this.district,
    this.nameAr,
    this.latitude,
    this.longitude,
    this.description,
    this.isActive = true,
  });

  final String id;
  final String name;
  final String district;
  final String? nameAr;
  final double? latitude;
  final double? longitude;
  final String? description;
  final bool isActive;

  factory SafeSpot.fromJson(Map<String, dynamic> json) => SafeSpot(
        id: json['id'] as String,
        name: json['name'] as String,
        district: json['district'] as String,
        nameAr: json['nameAr'] as String?,
        latitude: (json['latitude'] as num?)?.toDouble(),
        longitude: (json['longitude'] as num?)?.toDouble(),
        description: json['description'] as String?,
        isActive: (json['isActive'] as bool?) ?? true,
      );
}

// ─────────────────────────────────────────────────────────────────────────────
// Photo Upload
// ─────────────────────────────────────────────────────────────────────────────

/// Response from POST /listings/photo-upload-url.
class PhotoUploadUrlResponse {
  const PhotoUploadUrlResponse({
    required this.uploadUrl,
    required this.r2Key,
    required this.publicUrl,
    required this.expiresInSeconds,
  });

  final String uploadUrl;
  final String r2Key;
  final String publicUrl;
  final int expiresInSeconds;

  factory PhotoUploadUrlResponse.fromJson(Map<String, dynamic> json) =>
      PhotoUploadUrlResponse(
        uploadUrl: json['uploadUrl'] as String,
        r2Key: json['r2Key'] as String,
        publicUrl: json['publicUrl'] as String,
        expiresInSeconds: (json['expiresInSeconds'] as num?)?.toInt() ?? 300,
      );
}

// ─────────────────────────────────────────────────────────────────────────────
// Reports
// ─────────────────────────────────────────────────────────────────────────────

/// Report incident types for reporting a listing.
enum ReportIncidentType {
  scam,
  spam,
  fraud,
  policyViolation,
  other;

  String get apiValue => switch (this) {
        ReportIncidentType.scam => 'SCAM',
        ReportIncidentType.spam => 'SPAM',
        ReportIncidentType.fraud => 'FRAUD',
        ReportIncidentType.policyViolation => 'POLICY_VIOLATION',
        ReportIncidentType.other => 'OTHER',
      };
}

// ─────────────────────────────────────────────────────────────────────────────
// Trust Tier Constants
// ─────────────────────────────────────────────────────────────────────────────

typedef TrustTier = String;

class TrustTiers {
  TrustTiers._();

  static const String new_ = 'NEW';
  static const String bronze = 'BRONZE';
  static const String silver = 'SILVER';
  static const String gold = 'GOLD';
  static const String platinum = 'PLATINUM';

  static const List<String> all = [new_, bronze, silver, gold, platinum];

  static const Map<String, int> thresholds = {
    new_: 0,
    bronze: 201,
    silver: 501,
    gold: 1001,
    platinum: 2001,
  };
}

// ── Contact Reveal ───────────────────────────────────────────────────────────

/// Contact info revealed after offer acceptance.
class ContactReveal {
  const ContactReveal({
    required this.fullName,
    required this.phoneNumber,
    required this.trustScore,
    required this.trustTier,
    required this.waMeLink,
  });

  final String fullName;
  final String phoneNumber;
  final int trustScore;
  final String trustTier;
  final String waMeLink;

  factory ContactReveal.fromJson(Map<String, dynamic> json) {
    return ContactReveal(
      fullName: json['fullName'] as String? ?? '',
      phoneNumber: json['phoneNumber'] as String? ?? '',
      trustScore: (json['trustScore'] as num?)?.toInt() ?? 0,
      trustTier: json['trustTier'] as String? ?? 'NEW',
      waMeLink: json['waMeLink'] as String? ?? '',
    );
  }
}

// ── Disputes ──────────────────────────────────────────────────────────────────

/// Dispute reason enum matching backend SoukDisputeReason.
enum DisputeReason {
  itemNotAsDescribed,
  itemDefective,
  noShow,
  paymentIssue,
  counterfeit,
  sellerBackedOut,
  buyerBackedOut,
  safetyConcern,
  other;

  static DisputeReason fromString(String? value) {
    switch (value?.toUpperCase()) {
      case 'ITEM_NOT_AS_DESCRIBED':
        return DisputeReason.itemNotAsDescribed;
      case 'ITEM_DEFECTIVE':
        return DisputeReason.itemDefective;
      case 'NO_SHOW':
        return DisputeReason.noShow;
      case 'PAYMENT_ISSUE':
        return DisputeReason.paymentIssue;
      case 'COUNTERFEIT':
        return DisputeReason.counterfeit;
      case 'SELLER_BACKED_OUT':
        return DisputeReason.sellerBackedOut;
      case 'BUYER_BACKED_OUT':
        return DisputeReason.buyerBackedOut;
      case 'SAFETY_CONCERN':
        return DisputeReason.safetyConcern;
      case 'OTHER':
        return DisputeReason.other;
      default:
        return DisputeReason.other;
    }
  }

  String get apiValue => switch (this) {
        DisputeReason.itemNotAsDescribed => 'ITEM_NOT_AS_DESCRIBED',
        DisputeReason.itemDefective => 'ITEM_DEFECTIVE',
        DisputeReason.noShow => 'NO_SHOW',
        DisputeReason.paymentIssue => 'PAYMENT_ISSUE',
        DisputeReason.counterfeit => 'COUNTERFEIT',
        DisputeReason.sellerBackedOut => 'SELLER_BACKED_OUT',
        DisputeReason.buyerBackedOut => 'BUYER_BACKED_OUT',
        DisputeReason.safetyConcern => 'SAFETY_CONCERN',
        DisputeReason.other => 'OTHER',
      };
}

/// Dispute status enum.
enum DisputeStatus {
  open,
  resolved,
  rejected;

  static DisputeStatus fromString(String? value) {
    switch (value?.toUpperCase()) {
      case 'RESOLVED':
        return DisputeStatus.resolved;
      case 'REJECTED':
        return DisputeStatus.rejected;
      default:
        return DisputeStatus.open;
    }
  }

  String get apiValue => switch (this) {
        DisputeStatus.open => 'OPEN',
        DisputeStatus.resolved => 'RESOLVED',
        DisputeStatus.rejected => 'REJECTED',
      };
}

/// Dispute model.
class Dispute {
  const Dispute({
    required this.id,
    required this.offerId,
    required this.filedById,
    required this.againstId,
    required this.reason,
    this.description,
    this.evidenceR2Key,
    required this.status,
    this.resolution,
    this.resolvedById,
    this.resolvedAt,
    required this.createdAt,
    required this.updatedAt,
  });

  final String id;
  final String offerId;
  final String filedById;
  final String againstId;
  final DisputeReason reason;
  final String? description;
  final String? evidenceR2Key;
  final DisputeStatus status;
  final String? resolution;
  final String? resolvedById;
  final String? resolvedAt;
  final String createdAt;
  final String updatedAt;

  factory Dispute.fromJson(Map<String, dynamic> json) {
    return Dispute(
      id: json['id'] as String? ?? '',
      offerId: json['offerId'] as String? ?? '',
      filedById: json['filedById'] as String? ?? '',
      againstId: json['againstId'] as String? ?? '',
      reason: DisputeReason.fromString(json['reason'] as String?),
      description: json['description'] as String?,
      evidenceR2Key: json['evidenceR2Key'] as String?,
      status: DisputeStatus.fromString(json['status'] as String?),
      resolution: json['resolution'] as String?,
      resolvedById: json['resolvedById'] as String?,
      resolvedAt: json['resolvedAt'] as String?,
      createdAt: json['createdAt'] as String? ?? '',
      updatedAt: json['updatedAt'] as String? ?? '',
    );
  }
}
