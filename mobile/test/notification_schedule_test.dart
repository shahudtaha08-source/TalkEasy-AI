import 'package:flutter_test/flutter_test.dart';
import 'package:talkeasy_mobile/data/mood_reminder.dart';
import 'package:talkeasy_mobile/services/notification_service.dart';

void main() {
  group('notification service contract', () {
    test('the tap deep link points at the mood screen route', () {
      expect(NotificationService.moodDeepLink, '/mood-enhanced');
    });

    test('the reminder message is the neutral shared string', () {
      expect(kMoodReminderMessage, 'Time for your TalkEasy mood check-in.');
    });

    test('the persisted check-in key is stable', () {
      expect(NotificationService.lastCheckInPrefsKey, 'last_mood_check_in_at');
    });

    test('a fresh check-in schedules the next reminder three hours later', () {
      final DateTime now = DateTime(2026, 1, 15, 10);
      final DateTime next = computeNextMoodReminder(
        lastCheckInAt: now,
        now: now,
        quietHoursStart: '22:00',
        quietHoursEnd: '07:00',
      );
      expect(next.difference(now).inHours, 3);
    });

    test('a check-in just before quiet hours is deferred past quiet-hours end',
        () {
      final DateTime at = DateTime(2026, 1, 15, 21);
      final DateTime next = computeNextMoodReminder(
        lastCheckInAt: at,
        now: at,
        quietHoursStart: '22:00',
        quietHoursEnd: '07:00',
      );
      // Target would be 00:00, moved to 07:00 the next morning.
      expect(next.hour, 7);
      expect(next.day, 16);
    });
  });
}
