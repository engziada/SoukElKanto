/// API error types for the Souk ElKanto mobile app.
///
/// Mirrors the web app's `ApiError` class. Captures HTTP status, server
/// message, and error code for structured error handling.
library;

/// Base API error.
class ApiError implements Exception {
  const ApiError({
    required this.statusCode,
    required this.message,
    this.code,
    this.details,
  });

  final int statusCode;
  final String message;
  final String? code;
  final Map<String, dynamic>? details;

  bool get isNetwork => statusCode == 0;
  bool get isUnauthorized => statusCode == 401;
  bool get isForbidden => statusCode == 403;
  bool get isNotFound => statusCode == 404;
  bool get isValidation => statusCode == 400 || statusCode == 422;
  bool get isServer => statusCode >= 500;

  @override
  String toString() => 'ApiError($statusCode): $message';
}

/// Network connectivity error.
class NetworkError extends ApiError {
  const NetworkError({String? message})
      : super(
          statusCode: 0,
          message: message ?? 'Network error. Check your connection.',
        );
}

/// Authentication required (401).
class UnauthorizedError extends ApiError {
  const UnauthorizedError({String? message})
      : super(
          statusCode: 401,
          message: message ?? 'Authentication required.',
          code: 'UNAUTHORIZED',
        );
}

/// Resource not found (404).
class NotFoundError extends ApiError {
  const NotFoundError({String? message})
      : super(
          statusCode: 404,
          message: message ?? 'Resource not found.',
          code: 'NOT_FOUND',
        );
}

/// Validation error (400/422).
class ValidationError extends ApiError {
  const ValidationError({
    String? message,
    super.details,
  }) : super(
          statusCode: 400,
          message: message ?? 'Validation error.',
          code: 'VALIDATION',
        );
}
