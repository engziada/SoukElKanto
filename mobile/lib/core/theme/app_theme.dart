import 'package:flutter/material.dart';

import 'app_colors.dart';
import 'app_typography.dart';

/// Souk ElKanto theme — light and dark variants.
///
/// Light: "Sunny Horizon" — Morning Haze background, Stall Linen cards,
/// Atlas Midnight text, coral accents.
///
/// Dark: "Aurora Night" — deep navy ground, tinted lagoon surfaces,
/// warm-tinted near-white text.
class AppTheme {
  AppTheme._();

  // ── Radii ────────────────────────────────────────────
  static const double rSm = 8.0;
  static const double rMd = 14.0;
  static const double rLg = 20.0;
  static const double rXl = 28.0;
  static const double rPill = 999.0;

  // ── Spacing ──────────────────────────────────────────
  static const double s1 = 4.0;
  static const double s2 = 8.0;
  static const double s3 = 12.0;
  static const double s4 = 16.0;
  static const double s5 = 20.0;
  static const double s6 = 24.0;
  static const double s8 = 32.0;

  // ── Light Theme ──────────────────────────────────────
  static ThemeData light({required bool isArabic}) {
    final textTheme = AppTypography.lightTextTheme(isArabic: isArabic);

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: const ColorScheme.light(
        primary: AppColors.coral,
        onPrimary: AppColors.warmWhite,
        primaryContainer: AppColors.coralAwning,
        onPrimaryContainer: AppColors.coral,
        secondary: AppColors.teal,
        onSecondary: AppColors.coolWhite,
        secondaryContainer: AppColors.tealDim,
        onSecondaryContainer: AppColors.teal,
        tertiary: AppColors.indigo,
        onTertiary: AppColors.warmWhite,
        surface: AppColors.stallLinen,
        onSurface: AppColors.atlasMidnight,
        onSurfaceVariant: AppColors.slateSmoke,
        error: AppColors.coral,
        onError: AppColors.warmWhite,
        outline: AppColors.border,
        outlineVariant: AppColors.borderSoft,
        shadow: Color(0xFF143C8C),
        scrim: AppColors.atlasMidnight,
      ),
      scaffoldBackgroundColor: AppColors.morningHaze,
      canvasColor: AppColors.morningHaze,
      cardColor: AppColors.stallLinen,
      dividerColor: AppColors.borderSoft,
      textTheme: textTheme,
      primaryTextTheme: textTheme,
      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.morningHaze.withValues(alpha: 0.82),
        foregroundColor: AppColors.atlasMidnight,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        titleTextStyle: textTheme.titleLarge,
      ),
      cardTheme: CardThemeData(
        color: AppColors.stallLinen,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(rLg),
          side: const BorderSide(color: AppColors.borderSoft, width: 1),
        ),
        margin: EdgeInsets.zero,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.morningHaze,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 14,
          vertical: 12,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(rSm),
          borderSide: const BorderSide(color: AppColors.border, width: 1),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(rSm),
          borderSide: const BorderSide(color: AppColors.border, width: 1),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(rSm),
          borderSide: const BorderSide(color: AppColors.coral, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(rSm),
          borderSide: const BorderSide(color: AppColors.coral, width: 1),
        ),
        labelStyle: textTheme.bodyMedium,
        hintStyle: textTheme.bodySmall,
        prefixIconColor: AppColors.dustyCloud,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.coral,
          foregroundColor: AppColors.warmWhite,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(rPill),
          ),
          textStyle: textTheme.labelLarge?.copyWith(
            color: AppColors.warmWhite,
            fontSize: 15,
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: AppColors.slateSmoke,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(rPill),
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.slateSmoke,
          backgroundColor: AppColors.stallLinen,
          side: const BorderSide(color: AppColors.border, width: 1),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(rPill),
          ),
        ),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: AppColors.awningShade,
        labelStyle: textTheme.labelLarge,
        side: BorderSide.none,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(rPill),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      ),
      dividerTheme: const DividerThemeData(
        color: AppColors.borderSoft,
        thickness: 1,
        space: 1,
      ),
      iconTheme: const IconThemeData(
        color: AppColors.atlasMidnight,
        size: 24,
      ),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: AppColors.stallLinen,
        selectedItemColor: AppColors.coral,
        unselectedItemColor: AppColors.dustyCloud,
        type: BottomNavigationBarType.fixed,
        elevation: 0,
        selectedLabelStyle: textTheme.labelMedium,
        unselectedLabelStyle: textTheme.labelMedium,
      ),
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: AppColors.coral,
        foregroundColor: AppColors.warmWhite,
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(rPill),
        ),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: AppColors.atlasMidnight,
        contentTextStyle: textTheme.bodyMedium?.copyWith(
          color: AppColors.warmWhite,
        ),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(rSm),
        ),
      ),
    );
  }

  // ── Dark Theme ───────────────────────────────────────
  static ThemeData dark({required bool isArabic}) {
    final textTheme = AppTypography.darkTextTheme(isArabic: isArabic);

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: ColorScheme.dark(
        primary: AppColors.coral,
        onPrimary: AppColors.warmWhite,
        primaryContainer: AppColors.coralAwning.withValues(alpha: 0.15),
        onPrimaryContainer: AppColors.coral,
        secondary: AppColors.teal,
        onSecondary: AppColors.darkBg,
        secondaryContainer: AppColors.tealDim.withValues(alpha: 0.15),
        onSecondaryContainer: AppColors.teal,
        tertiary: AppColors.indigo,
        onTertiary: AppColors.warmWhite,
        surface: AppColors.darkSurface,
        onSurface: AppColors.darkText,
        onSurfaceVariant: AppColors.darkTextSecondary,
        error: AppColors.coral,
        onError: AppColors.warmWhite,
        outline: AppColors.darkBorder,
        outlineVariant: AppColors.darkBorder.withValues(alpha: 0.5),
        shadow: Colors.black,
        scrim: Colors.black,
      ),
      scaffoldBackgroundColor: AppColors.darkBg,
      canvasColor: AppColors.darkBg,
      cardColor: AppColors.darkSurface,
      dividerColor: AppColors.darkBorder.withValues(alpha: 0.5),
      textTheme: textTheme,
      primaryTextTheme: textTheme,
      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.darkBg.withValues(alpha: 0.82),
        foregroundColor: AppColors.darkText,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        titleTextStyle: textTheme.titleLarge,
      ),
      cardTheme: CardThemeData(
        color: AppColors.darkSurface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(rLg),
          side: BorderSide(
            color: AppColors.darkBorder.withValues(alpha: 0.5),
            width: 1,
          ),
        ),
        margin: EdgeInsets.zero,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.darkSurfaceMid,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 14,
          vertical: 12,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(rSm),
          borderSide: const BorderSide(
            color: AppColors.darkBorder,
            width: 1,
          ),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(rSm),
          borderSide: const BorderSide(
            color: AppColors.darkBorder,
            width: 1,
          ),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(rSm),
          borderSide: const BorderSide(color: AppColors.coral, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(rSm),
          borderSide: const BorderSide(color: AppColors.coral, width: 1),
        ),
        labelStyle: textTheme.bodyMedium,
        hintStyle: textTheme.bodySmall,
        prefixIconColor: AppColors.darkTextTertiary,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.coral,
          foregroundColor: AppColors.warmWhite,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(rPill),
          ),
          textStyle: textTheme.labelLarge?.copyWith(
            color: AppColors.warmWhite,
            fontSize: 15,
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: AppColors.darkTextSecondary,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(rPill),
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.darkTextSecondary,
          backgroundColor: AppColors.darkSurface,
          side: const BorderSide(
            color: AppColors.darkBorder,
            width: 1,
          ),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(rPill),
          ),
        ),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: AppColors.darkSurfaceMid,
        labelStyle: textTheme.labelLarge,
        side: BorderSide.none,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(rPill),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      ),
      dividerTheme: DividerThemeData(
        color: AppColors.darkBorder.withValues(alpha: 0.5),
        thickness: 1,
        space: 1,
      ),
      iconTheme: const IconThemeData(
        color: AppColors.darkText,
        size: 24,
      ),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: AppColors.darkSurface,
        selectedItemColor: AppColors.coral,
        unselectedItemColor: AppColors.darkTextTertiary,
        type: BottomNavigationBarType.fixed,
        elevation: 0,
        selectedLabelStyle: textTheme.labelMedium,
        unselectedLabelStyle: textTheme.labelMedium,
      ),
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: AppColors.coral,
        foregroundColor: AppColors.warmWhite,
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(rPill),
        ),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: AppColors.darkSurface,
        contentTextStyle: textTheme.bodyMedium?.copyWith(
          color: AppColors.darkText,
        ),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(rSm),
        ),
      ),
    );
  }
}
