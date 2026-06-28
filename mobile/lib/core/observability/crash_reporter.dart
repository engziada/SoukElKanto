import 'dart:async';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';

/// Crash reporter module — captures Flutter framework and Dart errors.
///
/// Uses Flutter's built-in error handling (no external dependency).
/// Errors are logged to an in-memory ring buffer and optionally persisted
/// to a crash log file in the app's documents directory.
///
/// For production Sentry integration, set `SENTRY_DSN` via `--dart-define`
/// and replace this with `sentry_flutter` once Kotlin version conflicts
/// are resolved.
class CrashReporter {
  CrashReporter._();

  /// Maximum number of crash entries kept in memory.
  static const int _maxBuffer = 50;

  /// In-memory ring buffer of recent crash entries.
  static final List<CrashEntry> _entries = [];

  /// Whether crash reporting is enabled (always true for built-in handler).
  static bool get isEnabled => true;

  /// All captured crash entries (oldest first).
  static List<CrashEntry> get entries => List.unmodifiable(_entries);

  /// Initialize crash reporting before runApp.
  static Future<void> init(Widget app) async {
    // Capture Dart-level errors outside Flutter zones.
    FlutterError.onError = _onFlutterError;

    // Capture errors from async zones that Flutter doesn't catch.
    PlatformDispatcher.instance.onError = _onPlatformError;

    runApp(app);
  }

  /// Flutter framework error handler.
  static void _onFlutterError(FlutterErrorDetails details) {
    _record(
      CrashEntry(
        type: CrashType.framework,
        message: details.exceptionAsString(),
        stackTrace: details.stack?.toString(),
        timestamp: DateTime.now(),
        context: details.context?.toString(),
      ),
    );
    // Still print to console for debugging.
    FlutterError.presentError(details);
  }

  /// Platform-level error handler (async zone errors).
  static bool _onPlatformError(Object error, StackTrace stackTrace) {
    _record(
      CrashEntry(
        type: CrashType.uncaught,
        message: error.toString(),
        stackTrace: stackTrace.toString(),
        timestamp: DateTime.now(),
      ),
    );
    return true; // Suppress default handler.
  }

  /// Capture an exception manually.
  static Future<void> captureException(
    dynamic exception, {
    dynamic stackTrace,
    Map<String, dynamic>? hints,
  }) async {
    _record(
      CrashEntry(
        type: CrashType.manual,
        message: exception.toString(),
        stackTrace: stackTrace?.toString(),
        timestamp: DateTime.now(),
        hints: hints,
      ),
    );
  }

  /// Capture a message (info-level event).
  static Future<void> captureMessage(
    String message, {
    Map<String, dynamic>? hints,
  }) async {
    _record(
      CrashEntry(
        type: CrashType.message,
        message: message,
        timestamp: DateTime.now(),
        hints: hints,
      ),
    );
  }

  /// Record a crash entry into the ring buffer and persist to file.
  static void _record(CrashEntry entry) {
    _entries.add(entry);
    if (_entries.length > _maxBuffer) {
      _entries.removeAt(0);
    }
    // ignore: discarded_futures
    _persist(entry);
  }

  /// Append a crash entry to the crash log file.
  static Future<void> _persist(CrashEntry entry) async {
    try {
      final dir = await getApplicationDocumentsDirectory();
      final file = File('${dir.path}/crash_log.txt');
      await file.writeAsString(
        '${entry.toLogLine()}\n',
        mode: FileMode.append,
      );
    } catch (_) {
      // Best-effort persistence — don't crash the crash reporter.
    }
  }

  /// Clear all stored crash entries (in-memory only).
  static void clear() {
    _entries.clear();
  }
}

/// Type of crash entry.
enum CrashType {
  framework,
  uncaught,
  manual,
  message,
}

/// A single crash or error entry.
class CrashEntry {
  const CrashEntry({
    required this.type,
    required this.message,
    required this.timestamp,
    this.stackTrace,
    this.context,
    this.hints,
  });

  final CrashType type;
  final String message;
  final DateTime timestamp;
  final String? stackTrace;
  final String? context;
  final Map<String, dynamic>? hints;

  /// Format as a single log line for file persistence.
  String toLogLine() {
    final parts = <String>[
      '[${timestamp.toIso8601String()}]',
      '[${type.name}]',
      message,
    ];
    if (context != null) parts.add('context=$context');
    if (stackTrace != null) parts.add('stack=$stackTrace');
    return parts.join(' | ');
  }

  @override
  String toString() => toLogLine();
}
