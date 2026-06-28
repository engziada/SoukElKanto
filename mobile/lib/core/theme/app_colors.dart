import 'package:flutter/material.dart';

/// Souk ElKanto color tokens — translated from DESIGN.md.
///
/// "The Covered Souk" palette: blue-tinted neutrals carry the calm,
/// coral and honey carry the warmth, teal anchors the brand link color.
/// No pure #000 or #fff anywhere — every neutral is tinted.
class AppColors {
  AppColors._();

  // ── Primary ──────────────────────────────────────────
  /// Stallkeeper Coral — the single signature accent (#ff8366).
  /// Used for primary CTA, Price Tag, active wizard step.
  static const Color coral = Color(0xFFFF8366);

  /// Coral Awning — soft tinted ground for coral chips (#fff0eb).
  static const Color coralAwning = Color(0xFFFFF0EB);

  // ── Secondary ────────────────────────────────────────
  /// Cairo Honey — paired with coral in CTA gradient (#ffc94a).
  static const Color honey = Color(0xFFFFC94A);

  /// Faience Teal — the trust color (#0bb8c7).
  static const Color teal = Color(0xFF0BB8C7);

  /// Teal dim — for KYC-verified badge background.
  static const Color tealDim = Color(0xFFE0F7FA);

  /// Resident Indigo — navigation chips, footer link hover (#2b6eff).
  static const Color indigo = Color(0xFF2B6EFF);

  // ── Tertiary ─────────────────────────────────────────
  /// Garden Mint — success states only (#22c993).
  static const Color mint = Color(0xFF22C993);

  /// Twilight Lilac — AI-suggestion chip (#9b7bff).
  static const Color lilac = Color(0xFF9B7BFF);

  // ── Neutrals (Light) ─────────────────────────────────
  /// Morning Haze — page background in light mode (#f6f9ff).
  static const Color morningHaze = Color(0xFFF6F9FF);

  /// Daylight Cream — footer background (#eef3ff).
  static const Color daylightCream = Color(0xFFEEF3FF);

  /// Stall Linen — card canvas (#fdfeff).
  static const Color stallLinen = Color(0xFFFDFEFF);

  /// Awning Shade — nav hover, chip bg, input rest (#f3f7ff).
  static const Color awningShade = Color(0xFFF3F7FF);

  /// Souk Mist — strongest cool background (#e6eeff).
  static const Color soukMist = Color(0xFFE6EEFF);

  /// Atlas Midnight — primary text (#0c1a33).
  static const Color atlasMidnight = Color(0xFF0C1A33);

  /// Slate Smoke — secondary text (#516787).
  static const Color slateSmoke = Color(0xFF516787);

  /// Dusty Cloud — tertiary text (#8094b0).
  static const Color dustyCloud = Color(0xFF8094B0);

  /// Warm White — on-coral text (#fffaf7).
  static const Color warmWhite = Color(0xFFFFFAF7);

  /// Cool White — on-teal text (#f9fdff).
  static const Color coolWhite = Color(0xFFF9FDFF);

  // ── Stall Warmth ─────────────────────────────────────
  /// Stall Paper — hero panel, empty-photo placeholder (#f5ecdc).
  static const Color stallPaper = Color(0xFFF5ECDC);

  /// Stall Paper Edge — 1px border around hero panel (#e8d9bd).
  static const Color stallPaperEdge = Color(0xFFE8D9BD);

  // ── Borders ──────────────────────────────────────────
  static const Color borderSoft = Color(0xFFE8EEF6);
  static const Color border = Color(0xFFD8E2F0);

  // ── TrustMeter Tier Ribbons ──────────────────────────
  /// Quiet Slate — NEW (0–200 pts) (#94a3b8).
  static const Color tierNew = Color(0xFF94A3B8);

  /// Worked Bronze — BRONZE (201–500) (#b45309).
  static const Color tierBronze = Color(0xFFB45309);

  /// Mantle Silver — SILVER (501–1000) (#64748b).
  static const Color tierSilver = Color(0xFF64748B);

  /// Aged Brass — GOLD (1001–2000) (#ca8a04).
  static const Color tierGold = Color(0xFFCA8A04);

  /// Verdigris — PLATINUM (2001–3000) (#0e7490).
  static const Color tierPlatinum = Color(0xFF0E7490);

  // ── Aurora Night (Dark) ──────────────────────────────
  static const Color darkBg = Color(0xFF0B1426);
  static const Color darkSurface = Color(0xFF13203A);
  static const Color darkSurfaceMid = Color(0xFF1A2A48);
  static const Color darkBorder = Color(0xFF2A3A5C);
  static const Color darkText = Color(0xFFF0F4FA);
  static const Color darkTextSecondary = Color(0xFFA0B4D0);
  static const Color darkTextTertiary = Color(0xFF6B82A0);

  // ── Shadows ──────────────────────────────────────────
  /// Card rest shadow — indigo-tinted.
  static List<BoxShadow> get cardShadow => [
        BoxShadow(
          color: const Color(0xFF143C8C).withValues(alpha: 0.10),
          blurRadius: 42,
          offset: const Offset(0, 14),
        ),
        BoxShadow(
          color: const Color(0xFF143C8C).withValues(alpha: 0.06),
          blurRadius: 6,
          offset: const Offset(0, 2),
        ),
      ];

  /// Card hover shadow — deeper indigo-tinted.
  static List<BoxShadow> get cardHoverShadow => [
        BoxShadow(
          color: const Color(0xFF143C8C).withValues(alpha: 0.16),
          blurRadius: 64,
          offset: const Offset(0, 24),
        ),
        BoxShadow(
          color: const Color(0xFF143C8C).withValues(alpha: 0.08),
          blurRadius: 10,
          offset: const Offset(0, 4),
        ),
      ];

  /// Coral shadow — warm shadow under primary CTAs and Price Tag.
  static List<BoxShadow> get coralShadow => [
        BoxShadow(
          color: coral.withValues(alpha: 0.30),
          blurRadius: 34,
          offset: const Offset(0, 12),
        ),
      ];

  /// Teal glow — TrustPanel KYC badge glow.
  static List<BoxShadow> get tealGlow => [
        BoxShadow(
          color: teal.withValues(alpha: 0.20),
          blurRadius: 50,
          offset: const Offset(0, 14),
        ),
      ];

  // ── Coral Gradient ───────────────────────────────────
  /// Primary CTA gradient: coral → honey.
  static const LinearGradient coralGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [coral, honey],
  );
}
