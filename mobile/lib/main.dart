import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/i18n/app_locale.dart';
import 'core/i18n/generated/app_localizations.dart';
import 'core/observability/crash_reporter.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';

/// Souk ElKanto mobile app entry point.
///
/// Initializes Sentry (if SENTRY_DSN is configured) then launches the app.
void main() {
  CrashReporter.init(
    const ProviderScope(
      child: SoukElKantoApp(),
    ),
  );
}

/// Root widget for the Souk ElKanto mobile app.
class SoukElKantoApp extends ConsumerWidget {
  const SoukElKantoApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final locale = ref.watch(localeProvider);
    final themeMode = ref.watch(themeModeProvider);
    final isArabic = AppLocale.isArabic(locale);
    final router = ref.watch(routerProvider);

    return MaterialApp.router(
      title: 'Souk ElKanto',
      debugShowCheckedModeBanner: false,

      // ── Theme ──
      theme: AppTheme.light(isArabic: isArabic),
      darkTheme: AppTheme.dark(isArabic: isArabic),
      themeMode: themeMode,

      // ── i18n ──
      locale: locale,
      supportedLocales: AppLocale.supported,
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],

      // ── Routing ──
      routerConfig: router,
    );
  }
}
