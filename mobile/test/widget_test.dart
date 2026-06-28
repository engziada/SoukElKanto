import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:souk_elkanto_mobile/core/i18n/app_locale.dart';
import 'package:souk_elkanto_mobile/core/i18n/generated/app_localizations.dart';
import 'package:souk_elkanto_mobile/core/theme/app_theme.dart';

/// Minimal app shell for widget tests — avoids network calls from providers.
Widget _testApp({Widget? child, Locale locale = const Locale('en')}) {
  return ProviderScope(
    child: MaterialApp(
      locale: locale,
      supportedLocales: AppLocale.supported,
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      theme: AppTheme.light(isArabic: false),
      home: child ?? const Scaffold(body: Text('Test')),
    ),
  );
}

void main() {
  group('App smoke tests', () {
    testWidgets('MaterialApp renders without crashing', (tester) async {
      await tester.pumpWidget(_testApp());
      await tester.pump();

      expect(find.byType(MaterialApp), findsOneWidget);
      expect(find.byType(Scaffold), findsOneWidget);
    });

    testWidgets('App renders with Arabic locale (RTL)', (tester) async {
      await tester.pumpWidget(_testApp(locale: const Locale('ar')));
      await tester.pumpAndSettle();

      expect(find.byType(MaterialApp), findsOneWidget);
      final direction = tester.widget<Directionality>(
        find.byType(Directionality).first,
      );
      expect(direction.textDirection, TextDirection.rtl);
    });

    testWidgets('App renders with English locale (LTR)', (tester) async {
      await tester.pumpWidget(_testApp(locale: const Locale('en')));
      await tester.pumpAndSettle();

      final direction = tester.widget<Directionality>(
        find.byType(Directionality).first,
      );
      expect(direction.textDirection, TextDirection.ltr);
    });
  });

  group('Theme tests', () {
    testWidgets('Light theme applies correctly', (tester) async {
      await tester.pumpWidget(_testApp());
      await tester.pump();

      final material = tester.widget<MaterialApp>(find.byType(MaterialApp));
      expect(material.theme, isNotNull);
    });
  });

  group('Router smoke test', () {
    testWidgets('GoRouter can be created with routes', (tester) async {
      final router = GoRouter(
        routes: [
          GoRoute(
            path: '/',
            builder: (context, state) => const Scaffold(
              body: Text('Home'),
            ),
          ),
        ],
      );

      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp.router(
            routerConfig: router,
            theme: AppTheme.light(isArabic: false),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Home'), findsOneWidget);
    });
  });
}
