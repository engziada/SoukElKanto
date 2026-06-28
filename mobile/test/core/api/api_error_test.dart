import 'package:flutter_test/flutter_test.dart';
import 'package:souk_elkanto_mobile/core/api/api_error.dart';

void main() {
  group('ApiError hierarchy', () {
    test('NetworkError defaults to correct message', () {
      const err = NetworkError();

      expect(err.statusCode, 0);
      expect(err.isNetwork, true);
      expect(err.message, 'Network error. Check your connection.');
    });

    test('NetworkError accepts custom message', () {
      const err = NetworkError(message: 'Custom network error');

      expect(err.message, 'Custom network error');
    });

    test('UnauthorizedError defaults to correct message and code', () {
      const err = UnauthorizedError();

      expect(err.statusCode, 401);
      expect(err.isUnauthorized, true);
      expect(err.code, 'UNAUTHORIZED');
      expect(err.message, 'Authentication required.');
    });

    test('NotFoundError defaults to correct message and code', () {
      const err = NotFoundError();

      expect(err.statusCode, 404);
      expect(err.isNotFound, true);
      expect(err.code, 'NOT_FOUND');
    });

    test('ValidationError defaults to correct message and code', () {
      const err = ValidationError(message: 'Bad input');

      expect(err.statusCode, 400);
      expect(err.isValidation, true);
      expect(err.code, 'VALIDATION');
      expect(err.message, 'Bad input');
    });

    test('ValidationError carries details map', () {
      const err = ValidationError(
        message: 'Validation failed',
        details: {'field': 'price', 'reason': 'must be positive'},
      );

      expect(err.details, isNotNull);
      expect(err.details!['field'], 'price');
    });

    test('isForbidden is true for 403', () {
      const err = ApiError(statusCode: 403, message: 'Forbidden');

      expect(err.isForbidden, true);
    });

    test('isServer is true for 500 and 502', () {
      const err1 = ApiError(statusCode: 500, message: 'Internal');
      const err2 = ApiError(statusCode: 502, message: 'Bad gateway');

      expect(err1.isServer, true);
      expect(err2.isServer, true);
    });

    test('isServer is false for 4xx', () {
      const err = ApiError(statusCode: 404, message: 'Not found');

      expect(err.isServer, false);
    });

    test('toString formats correctly', () {
      const err = ApiError(statusCode: 429, message: 'Rate limited', code: 'RATE_LIMITED');

      expect(err.toString(), 'ApiError(429): Rate limited');
    });
  });
}
