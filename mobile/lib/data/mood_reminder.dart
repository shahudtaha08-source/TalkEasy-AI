/// TalkEasy — mood check-in reminder rules (Dart mirror of shared/mood-reminder).
///
/// The next reminder is always derived from the last *saved* check-in, never
/// from opening the screen; missed reminders collapse to a single future slot
/// (no burst after being offline); quiet hours are skipped in local time.
///
/// Note: this file computes *when* to remind. Background delivery (a scheduled
/// local notification while the app is closed) is not enabled — the app shows
/// the reminder while it is open. See the project notes for that limitation.
library;

const int kMoodCheckInIntervalHours = 3;

const String kMoodReminderMessage = 'Time for your TalkEasy mood check-in.';

int? _parseHHmm(String? value) {
  if (value == null) return null;
  final RegExpMatch? m = RegExp(r'^([01]\d|2[0-3]):([0-5]\d)$').firstMatch(value.trim());
  if (m == null) return null;
  return int.parse(m.group(1)!) * 60 + int.parse(m.group(2)!);
}

int _localMinutesOfDay(DateTime instant) {
  final DateTime local = instant.toLocal();
  return local.hour * 60 + local.minute;
}

/// True when [instant] falls inside quiet hours (handles the wrap-around window,
/// e.g. 22:00 -> 07:00). Equal/missing bounds mean "no quiet hours".
bool isInQuietHours(DateTime instant, String? start, String? end) {
  final int? s = _parseHHmm(start);
  final int? e = _parseHHmm(end);
  if (s == null || e == null || s == e) return false;
  final int minutes = _localMinutesOfDay(instant);
  if (s < e) return minutes >= s && minutes < e;
  return minutes >= s || minutes < e;
}

DateTime _movePastQuietHours(DateTime instant, String quietHoursEnd) {
  final int? end = _parseHHmm(quietHoursEnd);
  if (end == null) return instant;
  final int minutes = _localMinutesOfDay(instant);
  final int delta = (end - minutes + 1440) % 1440;
  return instant.add(Duration(minutes: delta == 0 ? 1440 : delta));
}

/// Next reminder instant. See the file docs for the exact rules.
DateTime computeNextMoodReminder({
  DateTime? lastCheckInAt,
  required DateTime now,
  int intervalHours = kMoodCheckInIntervalHours,
  String? quietHoursStart,
  String? quietHoursEnd,
}) {
  final int hours = intervalHours > 0 ? intervalHours : kMoodCheckInIntervalHours;
  final Duration step = Duration(hours: hours);

  // Anchor on the last saved check-in; with none, start the interval from now.
  DateTime base = lastCheckInAt ?? now;
  if (base.isAfter(now)) base = now;

  DateTime next = base.add(step);
  if (!next.isAfter(now)) {
    final int steps = now.difference(base).inMilliseconds ~/ step.inMilliseconds + 1;
    next = base.add(step * steps);
  }
  while (!next.isAfter(now)) {
    next = next.add(step);
  }
  if (quietHoursEnd != null && isInQuietHours(next, quietHoursStart, quietHoursEnd)) {
    next = _movePastQuietHours(next, quietHoursEnd);
  }
  return next;
}

/// True while a check-in has already been saved inside the current window.
bool hasCheckedInWithin(DateTime? lastCheckInAt, DateTime now,
    {int intervalHours = kMoodCheckInIntervalHours}) {
  if (lastCheckInAt == null) return false;
  return now.difference(lastCheckInAt).inMilliseconds <
      Duration(hours: intervalHours).inMilliseconds;
}
