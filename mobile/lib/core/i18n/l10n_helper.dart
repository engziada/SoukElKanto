import 'package:flutter/material.dart';

import 'generated/app_localizations.dart';

/// Convenience extension to access [AppLocalizations] from any [BuildContext].
extension L10nContext on BuildContext {
  /// Returns the [AppLocalizations] instance for the current locale.
  ///
  /// Throws if [AppLocalizations] is not available (e.g. during tests).
  AppLocalizations get l10n => AppLocalizations.of(this)!;
}
