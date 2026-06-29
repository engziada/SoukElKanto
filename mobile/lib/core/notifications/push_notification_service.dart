import 'dart:io';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../firebase_options.dart';
import '../auth/auth_provider.dart';

/// FCM push-notification provider for the Souk ElKanto mobile app.
///
/// Responsibilities:
///   1. Initialise Firebase (called once at app startup).
///   2. Request notification permission.
///   3. Fetch the FCM device token and register it with the backend.
///   4. Listen for token refreshes and re-register.
///   5. Listen for foreground messages (optional UI callback).
///
/// The backend stores tokens in `core.push_device_tokens` and uses
/// `firebase-admin` to dispatch push notifications via the `FcmChannel`.
class PushNotificationService {
  PushNotificationService(this._ref);

  final Ref _ref;

  bool _initialised = false;

  /// Initialise Firebase and register the FCM token.
  ///
  /// Call this after the user is authenticated. Safe to call multiple times —
  /// subsequent calls are no-ops after the first successful init.
  Future<void> init() async {
    if (_initialised) return;
    _initialised = true;

    try {
      await Firebase.initializeApp(
        options: DefaultFirebaseOptions.currentPlatform,
      );
      await _requestPermission();
      await _registerToken();
      _listenTokenRefresh();
      FirebaseMessaging.onMessage.listen(_handleForegroundMessage);
    } catch (e) {
      debugPrint('[PushNotificationService] init failed: $e');
    }
  }

  /// Request notification permission (no-op on desktop).
  Future<void> _requestPermission() async {
    if (Platform.isLinux || Platform.isWindows || Platform.isMacOS) return;

    final settings = await FirebaseMessaging.instance.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      debugPrint('[PushNotificationService] Permission granted');
    } else if (settings.authorizationStatus == AuthorizationStatus.provisional) {
      debugPrint('[PushNotificationService] Provisional permission granted');
    } else {
      debugPrint('[PushNotificationService] Permission denied');
    }
  }

  /// Fetch the current FCM token and register it with the backend.
  Future<void> _registerToken() async {
    final authState = _ref.read(authProvider);
    if (authState is! Authenticated) return;

    final token = await FirebaseMessaging.instance.getToken();
    if (token == null) {
      debugPrint('[PushNotificationService] No FCM token available');
      return;
    }

    final platform = _detectPlatform();
    const appSlug = 'kanto';

    try {
      final api = _ref.read(apiClientProvider);
      await api.registerDeviceToken(
        token: token,
        platform: platform,
        appSlug: appSlug,
      );
      debugPrint('[PushNotificationService] Token registered: ${token.substring(0, 12)}...');
    } catch (e) {
      debugPrint('[PushNotificationService] Token registration failed: $e');
    }
  }

  /// Listen for FCM token refreshes and re-register with the backend.
  void _listenTokenRefresh() {
    FirebaseMessaging.instance.onTokenRefresh.listen((newToken) async {
      debugPrint('[PushNotificationService] Token refreshed');
      try {
        final api = _ref.read(apiClientProvider);
        final platform = _detectPlatform();
        await api.registerDeviceToken(
          token: newToken,
          platform: platform,
          appSlug: 'kanto',
        );
      } catch (e) {
        debugPrint('[PushNotificationService] Token refresh registration failed: $e');
      }
    });
  }

  /// Handle a foreground push message.
  ///
  /// In v1 we just log it. The app can later show an in-app banner
  /// or route the user to the relevant screen.
  void _handleForegroundMessage(RemoteMessage message) {
    debugPrint(
      '[PushNotificationService] Foreground message: '
      '${message.notification?.title} — ${message.notification?.body}',
    );
  }

  /// Unregister the current device token (call on logout).
  Future<void> unregister() async {
    try {
      final token = await FirebaseMessaging.instance.getToken();
      if (token != null) {
        final api = _ref.read(apiClientProvider);
        await api.unregisterDeviceToken(token);
      }
    } catch (e) {
      debugPrint('[PushNotificationService] Unregister failed: $e');
    }
  }

  String _detectPlatform() {
    if (Platform.isAndroid) return 'android';
    if (Platform.isIOS) return 'ios';
    return 'web';
  }
}

/// Provider for the push notification service.
final pushNotificationProvider = Provider<PushNotificationService>((ref) {
  return PushNotificationService(ref);
});
