import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Secure storage for the JWT auth token.
///
/// Uses platform-specific secure storage (Keychain on iOS, Keystore on Android).
class TokenStorage {
  TokenStorage._();

  static const _keyToken = 'kanto.jwt.token';
  static const _keyPhone = 'kanto.auth.phone';

  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
    iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
  );

  /// Save the JWT token.
  static Future<void> saveToken(String token) async {
    await _storage.write(key: _keyToken, value: token);
  }

  /// Read the JWT token (or null if not authenticated).
  static Future<String?> getToken() async {
    return _storage.read(key: _keyToken);
  }

  /// Delete the JWT token (logout).
  static Future<void> deleteToken() async {
    await _storage.delete(key: _keyToken);
  }

  /// Save the last-used phone number (for re-login UX).
  static Future<void> savePhone(String phone) async {
    await _storage.write(key: _keyPhone, value: phone);
  }

  /// Read the last-used phone number.
  static Future<String?> getPhone() async {
    return _storage.read(key: _keyPhone);
  }

  /// Delete the stored phone number.
  static Future<void> deletePhone() async {
    await _storage.delete(key: _keyPhone);
  }

  /// Delete all stored auth data.
  static Future<void> clearAll() async {
    await _storage.deleteAll();
  }
}
