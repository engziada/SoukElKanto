import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Supported locales.
class AppLocale {
  AppLocale._();

  static const Locale ar = Locale('ar');
  static const Locale en = Locale('en');

  static const List<Locale> supported = [ar, en];

  static const String _keyLocale = 'kanto.locale';

  /// Default locale is Arabic (RTL).
  static const Locale defaultLocale = ar;

  static bool isArabic(Locale locale) => locale.languageCode == 'ar';

  /// Text direction for the locale.
  static TextDirection direction(Locale locale) =>
      isArabic(locale) ? TextDirection.rtl : TextDirection.ltr;
}

/// Locale notifier — persists user's language choice.
class LocaleNotifier extends StateNotifier<Locale> {
  LocaleNotifier() : super(AppLocale.defaultLocale) {
    // ignore: discarded_futures
    _restore();
  }

  Future<void> _restore() async {
    final prefs = await SharedPreferences.getInstance();
    final code = prefs.getString(AppLocale._keyLocale);
    if (code != null) {
      state = Locale(code);
    }
  }

  Future<void> setLocale(Locale locale) async {
    state = locale;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(AppLocale._keyLocale, locale.languageCode);
  }

  Future<void> toggleLocale() async {
    final newLocale =
        AppLocale.isArabic(state) ? AppLocale.en : AppLocale.ar;
    await setLocale(newLocale);
  }
}

/// Locale state provider.
final localeProvider =
    StateNotifierProvider<LocaleNotifier, Locale>((ref) => LocaleNotifier());

/// Theme mode notifier — persists dark/light choice.
class ThemeModeNotifier extends StateNotifier<ThemeMode> {
  ThemeModeNotifier() : super(ThemeMode.system) {
    // ignore: discarded_futures
    _restore();
  }

  static const String _keyTheme = 'kanto.theme';

  Future<void> _restore() async {
    final prefs = await SharedPreferences.getInstance();
    final mode = prefs.getString(_keyTheme);
    if (mode != null) {
      state = ThemeMode.values.firstWhere(
        (e) => e.name == mode,
        orElse: () => ThemeMode.system,
      );
    }
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    state = mode;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyTheme, mode.name);
  }

  Future<void> toggle() async {
    await setThemeMode(
      state == ThemeMode.dark ? ThemeMode.light : ThemeMode.dark,
    );
  }
}

/// Theme mode provider.
final themeModeProvider =
    StateNotifierProvider<ThemeModeNotifier, ThemeMode>((ref) => ThemeModeNotifier());
