import 'package:flutter_test/flutter_test.dart';
import 'package:talkeasy_mobile/data/mood_reminder.dart';

void main() {
  group('mood reminder rules', () {
    test('interval is three hours', () {
      expect(kMoodCheckInIntervalHours, 3);
    });

    test('next reminder is one interval after the last saved check-in', () {
      final DateTime last = DateTime.utc(2026, 1, 15, 9);
      final DateTime now = DateTime.utc(2026, 1, 15, 10);
      final DateTime next =
          computeNextMoodReminder(lastCheckInAt: last, now: now);
      expect(next.toUtc(), DateTime.utc(2026, 1, 15, 12));
    });

    test('without a saved check-in the interval starts from now', () {
      final DateTime now = DateTime.utc(2026, 1, 15, 10);
      final DateTime next = computeNextMoodReminder(now: now);
      expect(next.toUtc(), now.add(const Duration(hours: 3)));
    });

    test('a long offline gap yields a single future reminder, not a burst', () {
      final DateTime last = DateTime.utc(2026, 1, 15, 9);
      final DateTime now = DateTime.utc(2026, 1, 15, 19, 30);
      final DateTime next =
          computeNextMoodReminder(lastCheckInAt: last, now: now);
      expect(next.isAfter(now), true);
      expect(next.toUtc(), DateTime.utc(2026, 1, 15, 21));
    });

    test('hasCheckedInWithin only covers the current window', () {
      final DateTime now = DateTime.utc(2026, 1, 15, 12);
      expect(hasCheckedInWithin(DateTime.utc(2026, 1, 15, 10), now), true);
      expect(hasCheckedInWithin(DateTime.utc(2026, 1, 15, 8), now), false);
      expect(hasCheckedInWithin(null, now), false);
    });

    test('isInQuietHours handles the wrap-around window', () {
      final DateTime late = DateTime(2026, 1, 15, 23, 30);
      final DateTime early = DateTime(2026, 1, 15, 6);
      final DateTime noon = DateTime(2026, 1, 15, 12);
      expect(isInQuietHours(late, '22:00', '07:00'), true);
      expect(isInQuietHours(early, '22:00', '07:00'), true);
      expect(isInQuietHours(noon, '22:00', '07:00'), false);
    });
  });
}
