import 'package:dio/dio.dart';

import 'api_error.dart';
import 'models.dart';

/// CoreMesh API client for the Souk ElKanto mobile app.
///
/// Uses Bearer token authentication (stored in secure storage).
/// Sends `x-tenant-id: kanto` header on every request.
/// API is versioned under `/api/v1/`.
///
/// All responses are wrapped by the backend's ResponseEnvelopeInterceptor
/// into `{ success: true, data: T, meta: {...} }`. This client unwraps
/// the `data` field automatically via a response interceptor.
class ApiClient {
  ApiClient({
    required String baseUrl,
    required String tenantId,
    required this.tokenProvider,
  }) : _dio = Dio(
          BaseOptions(
            baseUrl: '$baseUrl/api/v1',
            connectTimeout: const Duration(seconds: 15),
            receiveTimeout: const Duration(seconds: 30),
            sendTimeout: const Duration(seconds: 30),
            headers: {
              'x-tenant-id': tenantId,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
          ),
        ) {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await tokenProvider();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
        onResponse: (response, handler) {
          // Unwrap the response envelope: { success, data, meta }
          if (response.data is Map<String, dynamic>) {
            final envelope = response.data as Map<String, dynamic>;
            if (envelope.containsKey('success') && envelope.containsKey('data')) {
              response.data = envelope['data'];
            }
          }
          handler.next(response);
        },
        onError: (e, handler) {
          final apiError = _mapDioError(e);
          handler.reject(
            DioException(
              requestOptions: e.requestOptions,
              error: apiError,
              type: e.type,
              response: e.response,
            ),
          );
        },
      ),
    );
  }

  final Dio _dio;

  /// Returns the current JWT token (or null if not authenticated).
  final Future<String?> Function() tokenProvider;

  Dio get dio => _dio;

  // ── Error Mapping ────────────────────────────────────

  ApiError _mapDioError(DioException e) {
    if (e.type == DioExceptionType.connectionTimeout ||
        e.type == DioExceptionType.sendTimeout ||
        e.type == DioExceptionType.receiveTimeout ||
        e.type == DioExceptionType.connectionError) {
      return const NetworkError();
    }

    final statusCode = e.response?.statusCode ?? 0;
    final data = e.response?.data;
    String message = 'Something went wrong.';
    String? code;
    Map<String, dynamic>? details;

    // Error envelope: { success: false, error: { code, message, details? } }
    if (data is Map<String, dynamic>) {
      final errorObj = data['error'] as Map<String, dynamic>?;
      if (errorObj != null) {
        message = (errorObj['message'] as String?) ?? message;
        code = errorObj['code'] as String?;
        details = errorObj['details'] as Map<String, dynamic>?;
      } else {
        message = (data['message'] as String?) ?? message;
        code = data['code'] as String?;
      }
    }

    switch (statusCode) {
      case 401:
        return UnauthorizedError(message: message);
      case 403:
        return ApiError(
          statusCode: 403,
          message: message,
          code: code ?? 'FORBIDDEN',
        );
      case 404:
        return NotFoundError(message: message);
      case 410:
        return ApiError(
          statusCode: 410,
          message: message,
          code: code ?? 'GONE',
        );
      case 400:
      case 422:
        return ValidationError(message: message, details: details);
      case 429:
        return ApiError(
          statusCode: 429,
          message: message,
          code: code ?? 'RATE_LIMITED',
        );
      default:
        return ApiError(
          statusCode: statusCode,
          message: message,
          code: code,
        );
    }
  }

  /// Extracts the ApiError from a caught DioException.
  ApiError extractError(dynamic e) {
    if (e is DioException && e.error is ApiError) {
      return e.error as ApiError;
    }
    if (e is ApiError) return e;
    return ApiError(statusCode: 0, message: e.toString());
  }

  // ── Auth Endpoints ───────────────────────────────────

  /// Register a new phone number and send OTP.
  Future<void> register({required String phoneNumber}) async {
    await _dio.post<void>(
      '/auth/register',
      data: {'phoneNumber': phoneNumber},
    );
  }

  /// Resend OTP to an existing user (login).
  Future<void> resendOtp({required String phoneNumber}) async {
    await _dio.post<void>(
      '/auth/login',
      data: {'phoneNumber': phoneNumber},
    );
  }

  /// Verify OTP and get JWT + user.
  Future<({String token, AuthUser user})> verifyOtp({
    required String phoneNumber,
    required String code,
  }) async {
    final res = await _dio.post<Map<String, dynamic>>(
      '/auth/verify-otp',
      data: {'phoneNumber': phoneNumber, 'code': code},
    );
    final data = res.data as Map<String, dynamic>;
    final token = data['token'] as String;
    final user = AuthUser.fromJson(
      (data['user'] as Map<String, dynamic>).cast<String, dynamic>(),
    );
    return (token: token, user: user);
  }

  /// Get current user profile.
  Future<AuthUser> getMe() async {
    final res = await _dio.get<Map<String, dynamic>>('/auth/me');
    return AuthUser.fromJson(
      (res.data as Map<String, dynamic>).cast<String, dynamic>(),
    );
  }

  /// Logout (revoke token).
  Future<void> logout() async {
    await _dio.post<void>('/auth/logout');
  }

  /// Register an FCM push-notification device token.
  Future<void> registerDeviceToken({
    required String token,
    required String platform,
    String? appSlug,
  }) async {
    await _dio.post<void>(
      '/auth/device-token',
      data: {
        'token': token,
        'platform': platform,
        if (appSlug != null) 'appSlug': appSlug,
      },
    );
  }

  /// Unregister an FCM device token.
  Future<void> unregisterDeviceToken(String token) async {
    await _dio.delete<void>(
      '/auth/device-token',
      data: {'token': token},
    );
  }

  // ── User Endpoints ───────────────────────────────────

  /// Update user profile metadata.
  Future<AuthUser> updateProfile({
    String? fullName,
    String? gender,
    String? birthdate,
    String? address,
    String? madinatyGroup,
    String? buildingNo,
    String? aptNo,
  }) async {
    final body = <String, dynamic>{};
    if (fullName != null) body['fullName'] = fullName;
    if (gender != null) body['gender'] = gender;
    if (birthdate != null) body['birthdate'] = birthdate;
    if (address != null) body['address'] = address;
    if (madinatyGroup != null) body['madinatyGroup'] = madinatyGroup;
    if (buildingNo != null) body['buildingNo'] = buildingNo;
    if (aptNo != null) body['aptNo'] = aptNo;

    final res = await _dio.patch<Map<String, dynamic>>(
      '/users/me/profile',
      data: body,
    );
    return AuthUser.fromJson(
      (res.data as Map<String, dynamic>).cast<String, dynamic>(),
    );
  }

  /// Get KYC status for the current user.
  Future<KycStatus> getKycStatus() async {
    final res =
        await _dio.get<Map<String, dynamic>>('/users/me/kyc-status');
    return KycStatus.fromJson(
      (res.data as Map<String, dynamic>).cast<String, dynamic>(),
    );
  }

  /// Submit KYC document.
  Future<void> submitKyc({
    required String fullName,
    required String idNumber,
    required String documentBase64,
  }) async {
    await _dio.post<void>(
      '/users/me/kyc',
      data: {
        'fullName': fullName,
        'idNumber': idNumber,
        'documentBase64': documentBase64,
      },
    );
  }

  // ── Listing Endpoints ────────────────────────────────

  /// List listings with optional filters and pagination.
  Future<PaginatedResponse<Listing>> listListings({
    int page = 1,
    int limit = 20,
    String? category,
    String? condition,
    String? district,
    int? minPrice,
    int? maxPrice,
    String? sort,
    String? q,
  }) async {
    final params = <String, dynamic>{
      'page': page,
      'limit': limit,
    };
    if (category != null) params['category'] = category;
    if (condition != null) params['condition'] = condition;
    if (district != null) params['district'] = district;
    if (minPrice != null) params['minPrice'] = minPrice;
    if (maxPrice != null) params['maxPrice'] = maxPrice;
    if (sort != null) params['sort'] = sort;
    if (q != null) params['q'] = q;

    final res = await _dio.get<Map<String, dynamic>>(
      '/listings',
      queryParameters: params,
    );
    final data = res.data as Map<String, dynamic>;
    final items = (data['data'] as List<dynamic>)
        .map((e) =>
            Listing.fromJson((e as Map<String, dynamic>).cast<String, dynamic>()))
        .toList();
    final pagination =
        (data['pagination'] as Map<String, dynamic>).cast<String, dynamic>();

    return PaginatedResponse<Listing>(
      data: items,
      page: (pagination['page'] as num).toInt(),
      limit: (pagination['limit'] as num).toInt(),
      totalItems: (pagination['total_items'] as num).toInt(),
      totalPages: (pagination['total_pages'] as num).toInt(),
    );
  }

  /// Get a single listing by ID.
  Future<Listing> getListing(String id) async {
    final res = await _dio.get<Map<String, dynamic>>('/listings/$id');
    return Listing.fromJson(
      (res.data as Map<String, dynamic>).cast<String, dynamic>(),
    );
  }

  /// Create a new listing.
  Future<Listing> createListing({
    required String title,
    required String description,
    required String category,
    required String condition,
    required int askingPrice,
    required String district,
    List<({String r2Key, int position})> photos = const [],
  }) async {
    final res = await _dio.post<Map<String, dynamic>>(
      '/listings',
      data: {
        'title': title,
        'description': description,
        'category': category,
        'condition': condition,
        'askingPrice': askingPrice,
        'district': district,
        if (photos.isNotEmpty)
          'photos': photos
              .map((p) => {'r2Key': p.r2Key, 'position': p.position})
              .toList(),
      },
    );
    return Listing.fromJson(
      (res.data as Map<String, dynamic>).cast<String, dynamic>(),
    );
  }

  /// Update a listing.
  Future<Listing> updateListing({
    required String id,
    String? title,
    String? description,
    String? category,
    String? condition,
    int? askingPrice,
    String? district,
    List<({String r2Key, int position})>? photos,
  }) async {
    final body = <String, dynamic>{};
    if (title != null) body['title'] = title;
    if (description != null) body['description'] = description;
    if (category != null) body['category'] = category;
    if (condition != null) body['condition'] = condition;
    if (askingPrice != null) body['askingPrice'] = askingPrice;
    if (district != null) body['district'] = district;
    if (photos != null) {
      body['photos'] = photos
          .map((p) => {'r2Key': p.r2Key, 'position': p.position})
          .toList();
    }

    final res =
        await _dio.patch<Map<String, dynamic>>('/listings/$id', data: body);
    return Listing.fromJson(
      (res.data as Map<String, dynamic>).cast<String, dynamic>(),
    );
  }

  /// Delete a listing.
  Future<void> deleteListing(String id) async {
    await _dio.delete<void>('/listings/$id');
  }

  /// Get my listings (all statuses, array — not paginated).
  Future<List<Listing>> myListings() async {
    final res = await _dio.get<dynamic>('/listings/mine');
    final data = res.data;
    if (data is List) {
      return data
          .map((e) =>
              Listing.fromJson((e as Map<String, dynamic>).cast<String, dynamic>()))
          .toList();
    }
    return [];
  }

  /// Report a listing.
  Future<void> reportListing({
    required String listingId,
    required String incidentType,
    required int severity,
    required String reason,
    String? evidencePhotoR2Key,
  }) async {
    await _dio.post<void>(
      '/listings/$listingId/report',
      data: {
        'incidentType': incidentType,
        'severity': severity,
        'reason': reason,
        if (evidencePhotoR2Key != null)
          'evidencePhotoR2Key': evidencePhotoR2Key,
      },
    );
  }

  /// Get a presigned URL for photo upload to R2.
  Future<PhotoUploadUrlResponse> getPhotoUploadUrl({
    required String filename,
    required String contentType,
    required int bytes,
  }) async {
    final res = await _dio.post<Map<String, dynamic>>(
      '/listings/photo-upload-url',
      data: {
        'filename': filename,
        'contentType': contentType,
        'bytes': bytes,
      },
    );
    return PhotoUploadUrlResponse.fromJson(
      (res.data as Map<String, dynamic>).cast<String, dynamic>(),
    );
  }

  /// Upload raw bytes to R2 via presigned URL.
  Future<void> uploadToR2({
    required String presignedUrl,
    required List<int> bytes,
    required String contentType,
  }) async {
    final uploadDio = Dio();
    await uploadDio.put<void>(
      presignedUrl,
      data: Stream.fromIterable([bytes]),
      options: Options(
        headers: {
          'Content-Type': contentType,
          'Content-Length': bytes.length,
        },
        contentType: contentType,
      ),
    );
  }

  /// Full photo upload flow: get presigned URL → upload to R2 → return r2Key.
  Future<String> uploadPhoto({
    required String filename,
    required List<int> bytes,
    required String contentType,
  }) async {
    final response = await getPhotoUploadUrl(
      filename: filename,
      contentType: contentType,
      bytes: bytes.length,
    );
    await uploadToR2(
      presignedUrl: response.uploadUrl,
      bytes: bytes,
      contentType: contentType,
    );
    return response.r2Key;
  }

  // ── Offer Endpoints ──────────────────────────────────

  /// Create an offer on a listing.
  Future<Offer> createOffer({
    required String listingId,
    required int amount,
    String? note,
    int? tokenHoldAmount,
  }) async {
    final res = await _dio.post<Map<String, dynamic>>(
      '/offers',
      data: {
        'listingId': listingId,
        'amount': amount,
        if (note != null) 'note': note,
        if (tokenHoldAmount != null) 'tokenHoldAmount': tokenHoldAmount,
      },
    );
    return Offer.fromJson(
      (res.data as Map<String, dynamic>).cast<String, dynamic>(),
    );
  }

  /// Get sent offers (as buyer).
  Future<List<Offer>> sentOffers() async {
    final res = await _dio.get<dynamic>('/offers/sent');
    final data = res.data;
    if (data is List) {
      return data
          .map((e) =>
              Offer.fromJson((e as Map<String, dynamic>).cast<String, dynamic>()))
          .toList();
    }
    return [];
  }

  /// Get received offers (as seller).
  Future<List<Offer>> receivedOffers() async {
    final res = await _dio.get<dynamic>('/offers/received');
    final data = res.data;
    if (data is List) {
      return data
          .map((e) =>
              Offer.fromJson((e as Map<String, dynamic>).cast<String, dynamic>()))
          .toList();
    }
    return [];
  }

  /// Accept an offer (seller action).
  Future<Offer> acceptOffer(String offerId) async {
    final res =
        await _dio.patch<Map<String, dynamic>>('/offers/$offerId/accept');
    return Offer.fromJson(
      (res.data as Map<String, dynamic>).cast<String, dynamic>(),
    );
  }

  /// Decline an offer (seller action).
  Future<Offer> declineOffer(String offerId, {String? reason}) async {
    final res = await _dio.patch<Map<String, dynamic>>(
      '/offers/$offerId/decline',
      data: {if (reason != null) 'reason': reason},
    );
    return Offer.fromJson(
      (res.data as Map<String, dynamic>).cast<String, dynamic>(),
    );
  }

  /// Counter an offer (seller action — creates a new child offer).
  Future<Offer> counterOffer(String offerId, {required int amount}) async {
    final res = await _dio.patch<Map<String, dynamic>>(
      '/offers/$offerId/counter',
      data: {'amount': amount},
    );
    return Offer.fromJson(
      (res.data as Map<String, dynamic>).cast<String, dynamic>(),
    );
  }

  /// Withdraw an offer (buyer action).
  Future<Offer> withdrawOffer(String offerId) async {
    final res =
        await _dio.patch<Map<String, dynamic>>('/offers/$offerId/withdraw');
    return Offer.fromJson(
      (res.data as Map<String, dynamic>).cast<String, dynamic>(),
    );
  }

  /// Buyer accepts a counter offer.
  Future<Offer> buyerAcceptCounter(String offerId) async {
    final res = await _dio.patch<Map<String, dynamic>>(
      '/offers/$offerId/buyer-accept',
    );
    return Offer.fromJson(
      (res.data as Map<String, dynamic>).cast<String, dynamic>(),
    );
  }

  /// Buyer declines a counter offer.
  Future<Offer> buyerDeclineCounter(String offerId) async {
    final res = await _dio.patch<Map<String, dynamic>>(
      '/offers/$offerId/buyer-decline',
    );
    return Offer.fromJson(
      (res.data as Map<String, dynamic>).cast<String, dynamic>(),
    );
  }

  /// Buyer counters a counter offer.
  Future<Offer> buyerCounter(String offerId, {required int amount}) async {
    final res = await _dio.patch<Map<String, dynamic>>(
      '/offers/$offerId/buyer-counter',
      data: {'amount': amount},
    );
    return Offer.fromJson(
      (res.data as Map<String, dynamic>).cast<String, dynamic>(),
    );
  }

  // ── Handover Endpoints ───────────────────────────────

  /// Confirm handover (either party confirms; both must confirm to finalize).
  Future<Offer> confirmHandover(String offerId) async {
    final res = await _dio.post<Map<String, dynamic>>(
      '/handover/$offerId/confirm',
    );
    return Offer.fromJson(
      (res.data as Map<String, dynamic>).cast<String, dynamic>(),
    );
  }

  // ── Rating Endpoints ─────────────────────────────────

  /// Rate the counterpart after handover.
  Future<void> createRating({
    required String offerId,
    required int score,
    String? comment,
  }) async {
    await _dio.post<void>(
      '/ratings',
      data: {
        'offerId': offerId,
        'score': score,
        if (comment != null) 'comment': comment,
      },
    );
  }

  // ── Contact Reveal ───────────────────────────────────

  /// Reveal counterpart contact info (post-accept).
  Future<ContactReveal> revealContact(String offerId) async {
    final res = await _dio.get<Map<String, dynamic>>('/offers/$offerId/contact');
    return ContactReveal.fromJson(
      (res.data as Map<String, dynamic>).cast<String, dynamic>(),
    );
  }

  // ── Cancel Offer ─────────────────────────────────────

  /// Cancel an accepted offer (no-show, change of mind, etc.).
  Future<Offer> cancelOffer(String offerId, String reason) async {
    final res = await _dio.post<Map<String, dynamic>>(
      '/offers/$offerId/cancel',
      data: {'reason': reason},
    );
    return Offer.fromJson(
      (res.data as Map<String, dynamic>).cast<String, dynamic>(),
    );
  }

  // ── Disputes ─────────────────────────────────────────

  /// File a dispute on an offer.
  Future<Dispute> createDispute({
    required String offerId,
    required DisputeReason reason,
    String? description,
  }) async {
    final res = await _dio.post<Map<String, dynamic>>(
      '/disputes',
      data: {
        'offerId': offerId,
        'reason': reason.apiValue,
        if (description != null) 'description': description,
      },
    );
    return Dispute.fromJson(
      (res.data as Map<String, dynamic>).cast<String, dynamic>(),
    );
  }

  /// List disputes where the current user is filer or subject.
  Future<List<Dispute>> listMyDisputes() async {
    final res = await _dio.get<dynamic>('/disputes/mine');
    final data = res.data;
    if (data is List) {
      return data
          .map((e) => Dispute.fromJson(
              (e as Map<String, dynamic>).cast<String, dynamic>()))
          .toList();
    }
    return [];
  }

  // ── Favorites Endpoints ──────────────────────────────

  /// List user's favorites with listing data included.
  Future<List<Favorite>> listFavorites() async {
    final res = await _dio.get<dynamic>('/favorites');
    final data = res.data;
    if (data is List) {
      return data
          .map((e) => Favorite.fromJson(
              (e as Map<String, dynamic>).cast<String, dynamic>()))
          .toList();
    }
    return [];
  }

  /// Add a listing to favorites.
  Future<void> addFavorite(String listingId) async {
    await _dio.post<void>('/favorites/$listingId');
  }

  /// Remove a listing from favorites.
  Future<void> removeFavorite(String listingId) async {
    await _dio.delete<void>('/favorites/$listingId');
  }

  // ── Categories ───────────────────────────────────────

  /// List all listing categories with bilingual labels.
  Future<List<Category>> listCategories() async {
    final res = await _dio.get<dynamic>('/categories');
    final data = res.data;
    if (data is List) {
      return data
          .map((e) => Category.fromJson(
              (e as Map<String, dynamic>).cast<String, dynamic>()))
          .toList();
    }
    return [];
  }

  // ── Safe Meet Spots ──────────────────────────────────

  /// List safe meet spots, optionally filtered by district.
  Future<List<SafeSpot>> listSafeSpots({String? district}) async {
    final params = <String, dynamic>{};
    if (district != null) params['district'] = district;

    final res = await _dio.get<dynamic>(
      '/safe-meet-spots',
      queryParameters: params,
    );
    final data = res.data;
    if (data is List) {
      return data
          .map((e) => SafeSpot.fromJson(
              (e as Map<String, dynamic>).cast<String, dynamic>()))
          .toList();
    }
    return [];
  }

  // ── Token Wallet ─────────────────────────────────────

  /// Get the current user's token wallet.
  Future<TokenWallet> getWallet() async {
    final res =
        await _dio.get<Map<String, dynamic>>('/tokens/wallet/me');
    return TokenWallet.fromJson(
      (res.data as Map<String, dynamic>).cast<String, dynamic>(),
    );
  }

  // ── Trust Meter ──────────────────────────────────────

  /// Get trust meter snapshot for the current user.
  Future<TrustMeterSnapshot> getTrustMeter() async {
    final res =
        await _dio.get<Map<String, dynamic>>('/trust-meter/me');
    return TrustMeterSnapshot.fromJson(
      (res.data as Map<String, dynamic>).cast<String, dynamic>(),
    );
  }

  /// Get trust meter bonus grants for the current user.
  Future<List<Map<String, dynamic>>> getTrustMeterBonusGrants() async {
    final res =
        await _dio.get<dynamic>('/trust-meter/me/bonus-grants');
    final data = res.data;
    if (data is List) {
      return data
          .map((e) => (e as Map<String, dynamic>).cast<String, dynamic>())
          .toList();
    }
    return [];
  }

  /// Get trust meter snapshot for a specific user (public).
  Future<TrustMeterSnapshot> getTrustMeterForUser(String userId) async {
    final res = await _dio.get<Map<String, dynamic>>(
      '/trust-meter/users/$userId',
    );
    return TrustMeterSnapshot.fromJson(
      (res.data as Map<String, dynamic>).cast<String, dynamic>(),
    );
  }
}
