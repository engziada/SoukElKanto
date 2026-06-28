import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../api/api_client.dart';
import '../api/models.dart';
import 'token_storage.dart';

/// Auth state.
sealed class AuthState {
  const AuthState();
}

class AuthInitial extends AuthState {
  const AuthInitial();
}

class AuthLoading extends AuthState {
  const AuthLoading();
}

class Authenticated extends AuthState {
  const Authenticated(this.user);
  final AuthUser user;
}

class Unauthenticated extends AuthState {
  const Unauthenticated();
}

class AuthError extends AuthState {
  const AuthError(this.message);
  final String message;
}

/// Auth notifier — manages login/OTP/logout flow.
class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier(this._api) : super(const AuthInitial()) {
    // ignore: discarded_futures
    _restoreSession();
  }

  final ApiClient _api;

  /// Restore session from secure storage on app start.
  Future<void> _restoreSession() async {
    final token = await TokenStorage.getToken();
    if (token == null || token.isEmpty) {
      state = const Unauthenticated();
      return;
    }
    try {
      final user = await _api.getMe();
      state = Authenticated(user);
    } catch (_) {
      await TokenStorage.deleteToken();
      state = const Unauthenticated();
    }
  }

  /// Request OTP for a phone number (register or login).
  Future<void> requestOtp(String phoneNumber) async {
    state = const AuthLoading();
    try {
      await _api.register(phoneNumber: phoneNumber);
      await TokenStorage.savePhone(phoneNumber);
      // Stay in a transitional state — the UI will navigate to OTP entry.
      state = const Unauthenticated();
    } catch (e) {
      final err = _api.extractError(e);
      state = AuthError(err.message);
    }
  }

  /// Resend OTP to an existing user.
  Future<void> resendOtp(String phoneNumber) async {
    state = const AuthLoading();
    try {
      await _api.resendOtp(phoneNumber: phoneNumber);
      await TokenStorage.savePhone(phoneNumber);
      state = const Unauthenticated();
    } catch (e) {
      final err = _api.extractError(e);
      state = AuthError(err.message);
    }
  }

  /// Verify OTP and complete login.
  Future<bool> verifyOtp(String phoneNumber, String code) async {
    state = const AuthLoading();
    try {
      final result =
          await _api.verifyOtp(phoneNumber: phoneNumber, code: code);
      await TokenStorage.saveToken(result.token);
      state = Authenticated(result.user);
      return true;
    } catch (e) {
      final err = _api.extractError(e);
      state = AuthError(err.message);
      return false;
    }
  }

  /// Logout — revoke token and clear storage.
  Future<void> logout() async {
    try {
      await _api.logout();
    } catch (_) {
      // Even if server logout fails, clear local state.
    }
    await TokenStorage.deleteToken();
    state = const Unauthenticated();
  }

  /// Update the cached user (after profile edits).
  void updateUser(AuthUser user) {
    if (state is Authenticated) {
      state = Authenticated(user);
    }
  }

  /// Reset to unauthenticated (used after error dismissal).
  void reset() {
    state = const Unauthenticated();
  }
}

/// API client provider.
///
/// Reads config from `--dart-define`. Defaults to the live production API.
/// Override in dev with: --dart-define=API_BASE_URL=http://10.0.2.2:3000
final apiClientProvider = Provider<ApiClient>((ref) {
  const baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://coremesh.madinatyai.com',
  );
  const tenantId = String.fromEnvironment(
    'TENANT_ID',
    defaultValue: 'kanto',
  );

  return ApiClient(
    baseUrl: baseUrl,
    tenantId: tenantId,
    tokenProvider: TokenStorage.getToken,
  );
});

/// Auth state provider.
final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final api = ref.watch(apiClientProvider);
  return AuthNotifier(api);
});

/// Convenience provider for the current user (or null).
final currentUserProvider = Provider<AuthUser?>((ref) {
  final state = ref.watch(authProvider);
  return state is Authenticated ? state.user : null;
});

/// Convenience provider for authentication status.
final isAuthenticatedProvider = Provider<bool>((ref) {
  return ref.watch(authProvider) is Authenticated;
});
