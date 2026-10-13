/// TalkEasy v6.3.0 — scheduled local mood-reminder notifications (Android/iOS).
///
/// This turns the pure scheduling rules in `data/mood_reminder.dart` into an
/// actual OS-level notification that fires even when the app is closed. It is a
/// *local* reminder (no account or server required), so it works offline and
/// never leaks mood data off the device.
///
/// The reminder time is always derived from the last *saved* check-in — the
/// caller passes that timestamp in. With no saved check-in the interval starts
/// from now, and quiet hours are deferred to their end. Exactly one reminder is
/// scheduled at a time; scheduling again replaces the previous one, so a
/// reconnecting device never gets a burst.
library;

import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_timezone/flutter_timezone.dart';
import 'package:timezone/data/latest_all.dart' as tz_data;
import 'package:timezone/timezone.dart' as tz;

import '../data/mood_reminder.dart';

class NotificationService {
  NotificationService._();

  /// Shared instance used throughout the app.
  static final NotificationService instance = NotificationService._();

  static const int _moodReminderId = 1001;
  static const String _channelId = 'talkeasy_mood_reminders';
  static const String _channelName = 'Mood check-in reminders';
  static const String _channelDescription =
      'Nudges you to log your mood every few hours.';
  static const String moodDeepLink = '/mood-enhanced';

  /// SharedPreferences key holding the last saved check-in (ISO-8601 string),
  /// so a reminder can be re-scheduled on app launch before any network call.
  static const String lastCheckInPrefsKey = 'last_mood_check_in_at';

  final FlutterLocalNotificationsPlugin _plugin =
      FlutterLocalNotificationsPlugin();

  bool _initialized = false;
  String? _pendingDeepLink;
  void Function(String deepLink)? _onSelect;

  /// Deep-link payload captured from a notification tap (warm or cold start).
  String? consumePendingDeepLink() {
    final String? link = _pendingDeepLink;
    _pendingDeepLink = null;
    return link;
  }

  /// Initialises the plugin and resolves the device timezone. Safe to call more
  /// than once. [onSelect] is invoked when the user taps a notification while
  /// the app is running.
  Future<void> initialize({
    void Function(String deepLink)? onSelect,
  }) async {
    if (onSelect != null) _onSelect = onSelect;
    if (_initialized) return;

    tz_data.initializeTimeZones();
    try {
      final String name = await FlutterTimezone.getLocalTimezone();
      tz.setLocalLocation(tz.getLocation(name));
    } catch (_) {
      // Fall back to the default location when the platform timezone is
      // unavailable; scheduling still works, quiet hours just use it.
    }

    const AndroidInitializationSettings android =
        AndroidInitializationSettings('@mipmap/ic_launcher');
    const DarwinInitializationSettings ios = DarwinInitializationSettings(
      requestAlertPermission: false,
      requestBadgePermission: false,
      requestSoundPermission: false,
    );
    const InitializationSettings settings =
        InitializationSettings(android: android, iOS: ios);

    await _plugin.initialize(
      settings,
      onDidReceiveNotificationResponse: (NotificationResponse response) {
        final String? payload = response.payload;
        if (payload == null || payload.isEmpty) return;
        _pendingDeepLink = payload;
        _onSelect?.call(payload);
      },
    );

    final NotificationAppLaunchDetails? launch =
        await _plugin.getNotificationAppLaunchDetails();
    if (launch?.didNotificationLaunchApp ?? false) {
      _pendingDeepLink = launch?.notificationResponse?.payload;
    }
    _initialized = true;
  }

  /// Requests notification permission (Android 13+ and iOS). Returns whether
  /// notifications are permitted. On older Android versions this is a no-op.
  Future<bool> requestPermissions() async {
    await initialize();

    final AndroidFlutterLocalNotificationsPlugin? android = _plugin
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>();
    bool granted = true;
    if (android != null) {
      granted = await android.requestNotificationsPermission() ?? true;
    }

    final IOSFlutterLocalNotificationsPlugin? ios = _plugin
        .resolvePlatformSpecificImplementation<
            IOSFlutterLocalNotificationsPlugin>();
    if (ios != null) {
      final bool? iosGranted = await ios.requestPermissions(
        alert: true,
        badge: true,
        sound: true,
      );
      granted = granted && (iosGranted ?? true);
    }
    return granted;
  }

  /// Schedules (or replaces) the single mood-check-in reminder.
  ///
  /// [lastCheckInAt] is the last *saved* check-in, or null when the user has
  /// none yet. When [enabled] is false any pending reminder is cancelled.
  Future<void> scheduleMoodReminder({
    required DateTime? lastCheckInAt,
    bool enabled = true,
    int intervalHours = kMoodCheckInIntervalHours,
    String quietHoursStart = '22:00',
    String quietHoursEnd = '07:00',
  }) async {
    await initialize();

    if (!enabled) {
      await _plugin.cancel(_moodReminderId);
      return;
    }

    final DateTime now = DateTime.now();
    DateTime target = computeNextMoodReminder(
      lastCheckInAt: lastCheckInAt,
      now: now,
      intervalHours: intervalHours,
      quietHoursStart: quietHoursStart,
      quietHoursEnd: quietHoursEnd,
    );
    // zonedSchedule needs a future instant; guard against clock skew.
    if (!target.isAfter(now)) {
      target = now.add(const Duration(seconds: 10));
    }

    final tz.TZDateTime scheduled = tz.TZDateTime.from(target, tz.local);

    const AndroidNotificationDetails android = AndroidNotificationDetails(
      _channelId,
      _channelName,
      channelDescription: _channelDescription,
      importance: Importance.defaultImportance,
      priority: Priority.defaultPriority,
    );
    const DarwinNotificationDetails ios = DarwinNotificationDetails();
    const NotificationDetails details =
        NotificationDetails(android: android, iOS: ios);

    await _plugin.zonedSchedule(
      _moodReminderId,
      'TalkEasy',
      kMoodReminderMessage,
      scheduled,
      details,
      androidScheduleMode: AndroidScheduleMode.inexactAllowWhileIdle,
      uiLocalNotificationDateInterpretation:
          UILocalNotificationDateInterpretation.absoluteTime,
      payload: moodDeepLink,
    );
  }

  /// Cancels any pending mood reminder.
  Future<void> cancelMoodReminder() => _plugin.cancel(_moodReminderId);
}
