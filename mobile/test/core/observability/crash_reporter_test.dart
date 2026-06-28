import 'package:flutter_test/flutter_test.dart';
import 'package:souk_elkanto_mobile/core/observability/crash_reporter.dart';

void main() {
  setUp(() {
    CrashReporter.clear();
  });

  group('CrashReporter', () {
    test('isEnabled is always true for built-in handler', () {
      expect(CrashReporter.isEnabled, true);
    });

    test('captureException records an entry', () async {
      await CrashReporter.captureException(
        Exception('test error'),
        stackTrace: StackTrace.current,
      );

      expect(CrashReporter.entries.length, 1);
      expect(CrashReporter.entries.first.type, CrashType.manual);
      expect(CrashReporter.entries.first.message, contains('test error'));
    });

    test('captureMessage records an entry', () async {
      await CrashReporter.captureMessage('test message');

      expect(CrashReporter.entries.length, 1);
      expect(CrashReporter.entries.first.type, CrashType.message);
      expect(CrashReporter.entries.first.message, 'test message');
    });

    test('clear removes all entries', () async {
      await CrashReporter.captureMessage('msg1');
      await CrashReporter.captureMessage('msg2');
      expect(CrashReporter.entries.length, 2);

      CrashReporter.clear();
      expect(CrashReporter.entries, isEmpty);
    });

    test('entries list is unmodifiable', () {
      expect(() => CrashReporter.entries.add(CrashEntry(
        type: CrashType.manual,
        message: 'x',
        timestamp: DateTime.now(),
      )), throwsUnsupportedError);
    });
  });

  group('CrashEntry', () {
    test('toLogLine includes timestamp, type, and message', () {
      final entry = CrashEntry(
        type: CrashType.framework,
        message: 'Something broke',
        timestamp: DateTime.parse('2024-06-01T12:00:00'),
      );

      final line = entry.toLogLine();
      expect(line, contains('2024-06-01T12:00:00'));
      expect(line, contains('framework'));
      expect(line, contains('Something broke'));
    });

    test('toLogLine includes stack trace when present', () {
      final entry = CrashEntry(
        type: CrashType.manual,
        message: 'error',
        timestamp: DateTime.now(),
        stackTrace: '#0 main (file.dart:1)',
      );

      expect(entry.toLogLine(), contains('stack=#0 main'));
    });

    test('toLogLine includes context when present', () {
      final entry = CrashEntry(
        type: CrashType.framework,
        message: 'error',
        timestamp: DateTime.now(),
        context: 'while building widget',
      );

      expect(entry.toLogLine(), contains('context=while building widget'));
    });

    test('toString returns toLogLine', () {
      final entry = CrashEntry(
        type: CrashType.message,
        message: 'hello',
        timestamp: DateTime.parse('2024-01-01T00:00:00'),
      );

      expect(entry.toString(), entry.toLogLine());
    });
  });
}
