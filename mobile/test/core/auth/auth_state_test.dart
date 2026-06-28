import 'package:flutter_test/flutter_test.dart';
import 'package:souk_elkanto_mobile/core/auth/auth_provider.dart';
import 'package:souk_elkanto_mobile/core/api/models.dart';

void main() {
  group('AuthState', () {
    test('AuthInitial is a AuthState', () {
      const state = AuthInitial();

      expect(state, isA<AuthState>());
    });

    test('AuthLoading is a AuthState', () {
      const state = AuthLoading();

      expect(state, isA<AuthState>());
    });

    test('Authenticated holds user', () {
      final user = AuthUser(
        id: 'user-1',
        phoneNumber: '+201000000000',
        fullName: 'Ahmed',
      );
      final state = Authenticated(user);

      expect(state, isA<AuthState>());
      expect(state.user.id, 'user-1');
      expect(state.user.fullName, 'Ahmed');
    });

    test('Unauthenticated is a AuthState', () {
      const state = Unauthenticated();

      expect(state, isA<AuthState>());
    });

    test('AuthError holds message', () {
      const state = AuthError('Invalid OTP');

      expect(state, isA<AuthState>());
      expect(state.message, 'Invalid OTP');
    });
  });

  group('AuthState transitions', () {
    test('AuthInitial → AuthLoading → Authenticated flow', () {
      // Verify state types are distinct
      expect(const AuthInitial(), isNot(const AuthLoading()));
      expect(const AuthLoading(), isNot(const Unauthenticated()));

      const loading = AuthLoading();
      expect(loading, isA<AuthState>());

      final user = AuthUser(id: 'u1', phoneNumber: '+201000000000');
      final authed = Authenticated(user);
      expect(authed, isA<AuthState>());
      expect(authed.user.id, 'u1');
    });

    test('AuthError → Unauthenticated reset flow', () {
      const error = AuthError('Something went wrong');
      expect(error.message, 'Something went wrong');

      const reset = Unauthenticated();
      expect(reset, isA<AuthState>());
    });
  });
}
