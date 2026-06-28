import 'package:flutter/material.dart';

/// Souk ElKanto typography tokens — translated from DESIGN.md.
///
/// Display: Orbitron (Latin) — hero title + price tag only.
/// Headline: Space Grotesk (Latin) / Cairo Bold (Arabic).
/// Body: Inter (Latin) / Cairo (Arabic).
/// Arabic line-height: 1.7 (Latin: 1.6).
class AppTypography {
  AppTypography._();

  // ── Font Families ────────────────────────────────────
  static const String cairo = 'Cairo';
  static const String spaceGrotesk = 'Space Grotesk';
  static const String inter = 'Inter';

  /// Returns the appropriate font family based on locale.
  /// Arabic uses Cairo; English uses Inter for body, Space Grotesk for headlines.
  static String bodyFamily({required bool isArabic}) =>
      isArabic ? cairo : inter;

  static String headlineFamily({required bool isArabic}) =>
      isArabic ? cairo : spaceGrotesk;

  // ── Light Theme Text Themes ──────────────────────────

  static TextTheme lightTextTheme({required bool isArabic}) {
    final bodyFam = bodyFamily(isArabic: isArabic);
    final headlineFam = headlineFamily(isArabic: isArabic);
    final bodyHeight = isArabic ? 1.7 : 1.6;

    return TextTheme(
      // Display — hero title only (1 per page max).
      displayLarge: TextStyle(
        fontFamily: headlineFam,
        fontSize: 32,
        fontWeight: FontWeight.w700,
        height: 1.1,
        letterSpacing: -0.5,
        color: const Color(0xFF0C1A33),
      ),
      // Headline — section titles.
      headlineLarge: TextStyle(
        fontFamily: headlineFam,
        fontSize: 26,
        fontWeight: FontWeight.w700,
        height: 1.25,
        letterSpacing: -0.3,
        color: const Color(0xFF0C1A33),
      ),
      headlineMedium: TextStyle(
        fontFamily: headlineFam,
        fontSize: 22,
        fontWeight: FontWeight.w700,
        height: 1.25,
        color: const Color(0xFF0C1A33),
      ),
      // Title — card headers, modal titles.
      titleLarge: TextStyle(
        fontFamily: bodyFam,
        fontSize: 17,
        fontWeight: FontWeight.w600,
        height: 1.35,
        color: const Color(0xFF0C1A33),
      ),
      titleMedium: TextStyle(
        fontFamily: bodyFam,
        fontSize: 15,
        fontWeight: FontWeight.w600,
        height: 1.35,
        color: const Color(0xFF0C1A33),
      ),
      // Body — paragraph copy.
      bodyLarge: TextStyle(
        fontFamily: bodyFam,
        fontSize: 16,
        fontWeight: FontWeight.w400,
        height: bodyHeight,
        color: const Color(0xFF0C1A33),
      ),
      bodyMedium: TextStyle(
        fontFamily: bodyFam,
        fontSize: 14,
        fontWeight: FontWeight.w400,
        height: bodyHeight,
        color: const Color(0xFF516787),
      ),
      bodySmall: TextStyle(
        fontFamily: bodyFam,
        fontSize: 12,
        fontWeight: FontWeight.w400,
        height: bodyHeight,
        color: const Color(0xFF8094B0),
      ),
      // Label — chip labels, tier ribbons.
      labelLarge: TextStyle(
        fontFamily: bodyFam,
        fontSize: 13,
        fontWeight: FontWeight.w600,
        letterSpacing: 0.4,
        color: const Color(0xFF516787),
      ),
      labelMedium: TextStyle(
        fontFamily: bodyFam,
        fontSize: 11,
        fontWeight: FontWeight.w600,
        letterSpacing: 0.4,
        color: const Color(0xFF516787),
      ),
      // Price Tag — tabular nums, Space Grotesk.
      labelSmall: const TextStyle(
        fontFamily: spaceGrotesk,
        fontSize: 15,
        fontWeight: FontWeight.w700,
        fontFeatures: [FontFeature.tabularFigures()],
        color: Color(0xFFFFFAF7),
      ),
    );
  }

  // ── Dark Theme Text Themes ───────────────────────────

  static TextTheme darkTextTheme({required bool isArabic}) {
    final bodyFam = bodyFamily(isArabic: isArabic);
    final headlineFam = headlineFamily(isArabic: isArabic);
    final bodyHeight = isArabic ? 1.7 : 1.6;

    return TextTheme(
      displayLarge: TextStyle(
        fontFamily: headlineFam,
        fontSize: 32,
        fontWeight: FontWeight.w700,
        height: 1.1,
        letterSpacing: -0.5,
        color: const Color(0xFFF0F4FA),
      ),
      headlineLarge: TextStyle(
        fontFamily: headlineFam,
        fontSize: 26,
        fontWeight: FontWeight.w700,
        height: 1.25,
        letterSpacing: -0.3,
        color: const Color(0xFFF0F4FA),
      ),
      headlineMedium: TextStyle(
        fontFamily: headlineFam,
        fontSize: 22,
        fontWeight: FontWeight.w700,
        height: 1.25,
        color: const Color(0xFFF0F4FA),
      ),
      titleLarge: TextStyle(
        fontFamily: bodyFam,
        fontSize: 17,
        fontWeight: FontWeight.w600,
        height: 1.35,
        color: const Color(0xFFF0F4FA),
      ),
      titleMedium: TextStyle(
        fontFamily: bodyFam,
        fontSize: 15,
        fontWeight: FontWeight.w600,
        height: 1.35,
        color: const Color(0xFFF0F4FA),
      ),
      bodyLarge: TextStyle(
        fontFamily: bodyFam,
        fontSize: 16,
        fontWeight: FontWeight.w400,
        height: bodyHeight,
        color: const Color(0xFFF0F4FA),
      ),
      bodyMedium: TextStyle(
        fontFamily: bodyFam,
        fontSize: 14,
        fontWeight: FontWeight.w400,
        height: bodyHeight,
        color: const Color(0xFFA0B4D0),
      ),
      bodySmall: TextStyle(
        fontFamily: bodyFam,
        fontSize: 12,
        fontWeight: FontWeight.w400,
        height: bodyHeight,
        color: const Color(0xFF6B82A0),
      ),
      labelLarge: TextStyle(
        fontFamily: bodyFam,
        fontSize: 13,
        fontWeight: FontWeight.w600,
        letterSpacing: 0.4,
        color: const Color(0xFFA0B4D0),
      ),
      labelMedium: TextStyle(
        fontFamily: bodyFam,
        fontSize: 11,
        fontWeight: FontWeight.w600,
        letterSpacing: 0.4,
        color: const Color(0xFFA0B4D0),
      ),
      labelSmall: const TextStyle(
        fontFamily: spaceGrotesk,
        fontSize: 15,
        fontWeight: FontWeight.w700,
        fontFeatures: [FontFeature.tabularFigures()],
        color: Color(0xFFFFFAF7),
      ),
    );
  }

  // ── Google Fonts Registration ────────────────────────

  /// Registers Google Fonts for the app.
  /// Called once at startup to ensure fonts are available.
  static void registerFonts() {
    // Google Fonts are loaded on-demand via google_fonts package.
    // This is a no-op placeholder for explicit registration if needed.
  }
}
