import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:souk_elkanto_mobile/core/i18n/app_locale.dart';

void main() {
  group('AppLocale', () {
    test('supported locales contains ar and en', () {
      expect(AppLocale.supported, contains(AppLocale.ar));
      expect(AppLocale.supported, contains(AppLocale.en));
      expect(AppLocale.supported.length, 2);
    });

    test('default locale is Arabic', () {
      expect(AppLocale.defaultLocale, AppLocale.ar);
    });

    test('isArabic returns true for ar locale', () {
      expect(AppLocale.isArabic(AppLocale.ar), true);
    });

    test('isArabic returns false for en locale', () {
      expect(AppLocale.isArabic(AppLocale.en), false);
    });

    test('direction returns RTL for Arabic', () {
      expect(AppLocale.direction(AppLocale.ar), TextDirection.rtl);
    });

    test('direction returns LTR for English', () {
      expect(AppLocale.direction(AppLocale.en), TextDirection.ltr);
    });
  });
}
