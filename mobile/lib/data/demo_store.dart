import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import 'models.dart';

/// Dart port of `client/src/lib/demo-data.ts`.
///
/// Demo mode is a private, 7-day, local-only session: every tap on "Try demo mode"
/// wipes and regenerates a fresh dataset, and nothing is sent to the server.
class DemoStore {
  DemoStore(this._prefs);

  final SharedPreferences _prefs;

  static const String modeKey = 'talkeasy_demo_mode';
  static const String userKey = 'talkeasy_demo_user';
  static const String moodsKey = 'talkeasy_demo_moods';
  static const String habitsKey = 'talkeasy_demo_habits';
  static const String journalsKey = 'talkeasy_demo_journals';
  static const String chatKey = 'talkeasy_demo_chat';
  static const String startedKey = 'talkeasy_demo_started_at';
  static const String sessionKey = 'talkeasy_demo_session_id';

  static const Duration duration = Duration(days: 7);

  static const List<String> _allKeys = [
    userKey,
    moodsKey,
    habitsKey,
    journalsKey,
    chatKey,
    startedKey,
    sessionKey,
  ];

  static String today() {
    final DateTime now = DateTime.now();
    return '${now.year.toString().padLeft(4, '0')}-'
        '${now.month.toString().padLeft(2, '0')}-'
        '${now.day.toString().padLeft(2, '0')}';
  }

  static String nowIso() => DateTime.now().toIso8601String();

  bool get isDemoMode {
    if (_prefs.getString(modeKey) != 'true') return false;
    final int startedAt =
        int.tryParse(_prefs.getString(startedKey) ?? '') ?? 0;
    if (startedAt == 0 ||
        DateTime.now()
                .difference(DateTime.fromMillisecondsSinceEpoch(startedAt)) >
            duration) {
      disable();
      return false;
    }
    return true;
  }

  DateTime get expiryDate {
    final int startedAt =
        int.tryParse(_prefs.getString(startedKey) ?? '') ??
            DateTime.now().millisecondsSinceEpoch;
    return DateTime.fromMillisecondsSinceEpoch(startedAt).add(duration);
  }

  void enable() {
    _clearData();
    _prefs.setString(modeKey, 'true');
    _prefs.setString(startedKey, DateTime.now().millisecondsSinceEpoch.toString());
    _prefs.setString(sessionKey, _newSessionId());
    _initEmpty();
  }

  void disable() {
    _prefs.remove(modeKey);
    _clearData();
  }

  void _clearData() {
    for (final String key in _allKeys) {
      _prefs.remove(key);
    }
  }

  void _initEmpty() {
    _prefs.setString(moodsKey, '[]');
    _prefs.setString(journalsKey, '[]');
    _prefs.setString(habitsKey, '[]');
    _prefs.setString(chatKey, '[]');
    // Touch the user so the session id is materialised.
    user();
  }

  static String _newSessionId() {
    final int stamp = DateTime.now().microsecondsSinceEpoch;
    return '${stamp.toRadixString(36)}'
        '${DateTime.now().millisecondsSinceEpoch.toRadixString(36)}';
  }

  // ─── User ──────────────────────────────────────────────────────────────────

  TalkUser user() {
    final String sessionId = _prefs.getString(sessionKey) ?? _newSessionId();
    final Map<String, dynamic> defaults = <String, dynamic>{
      'id': 'demo-$sessionId',
      'email': 'demo-${sessionId.substring(0, sessionId.length < 8 ? sessionId.length : 8)}@talkeasy.local',
      'firstName': 'Demo',
      'lastName': 'User',
      'profileImageUrl': null,
      'ageGroup': 'Young Adult (20-35)',
      'preferredLanguage': 'English',
      'emergencyContact': null,
      'city': null,
      'locality': null,
      'budget': null,
      'occupationType': null,
      'water_target_ml': 2500,
      'sleep_target_hours': 8.0,
    };

    final String? raw = _prefs.getString(userKey);
    if (raw == null) {
      _prefs.setString(sessionKey, sessionId);
      _prefs.setString(userKey, jsonEncode(defaults));
      return TalkUser.fromJson(defaults);
    }
    return TalkUser.fromJson(jsonDecode(raw) as Map<String, dynamic>);
  }

  TalkUser updateUser(Map<String, dynamic> updates) {
    final TalkUser current = user();
    final Map<String, dynamic> merged = <String, dynamic>{
      'id': current.id,
      'email': current.email,
      'username': current.username,
      'firstName': current.firstName,
      'lastName': current.lastName,
      'profileImageUrl': current.profileImageUrl,
      'ageGroup': current.ageGroup,
      'preferredLanguage': current.preferredLanguage,
      'emergencyContact': current.emergencyContact,
      'city': current.city,
      'locality': current.locality,
      'budget': current.budget,
      'occupationType': current.occupationType,
      'water_target_ml': current.waterTargetMl,
      'sleep_target_hours': current.sleepTargetHours,
      ...updates,
    };
    _prefs.setString(userKey, jsonEncode(merged));
    return TalkUser.fromJson(merged);
  }

  // ─── Generic list helpers ──────────────────────────────────────────────────

  List<Map<String, dynamic>> _read(String key) {
    final String? raw = _prefs.getString(key);
    if (raw == null || raw.isEmpty) return <Map<String, dynamic>>[];
    try {
      final dynamic decoded = jsonDecode(raw);
      if (decoded is! List) return <Map<String, dynamic>>[];
      return decoded
          .whereType<Map<String, dynamic>>()
          .toList(growable: true);
    } catch (_) {
      return <Map<String, dynamic>>[];
    }
  }

  void _write(String key, List<Map<String, dynamic>> value) {
    _prefs.setString(key, jsonEncode(value));
  }

  // ─── Moods ────────────────────────────────────────────────────────────────

  List<Mood> moods() =>
      _read(moodsKey).map(Mood.fromJson).toList(growable: false);

  Mood createMood(String mood, {String? notes, String? date}) {
    final List<Map<String, dynamic>> list = _read(moodsKey);
    final Map<String, dynamic> entry = <String, dynamic>{
      'id': DateTime.now().millisecondsSinceEpoch,
      'mood': mood,
      'notes': notes ?? '',
      'date': date ?? today(),
      'createdAt': nowIso(),
    };
    list.insert(0, entry);
    _write(moodsKey, list);
    return Mood.fromJson(entry);
  }

  // ─── Mood entries (detailed tracker) ──────────────────────────────────────

  List<MoodEntry> moodEntries() =>
      _read('talkeasy_demo_mood_entries').map(MoodEntry.fromJson).toList();

  MoodEntry createMoodEntry({
    required String mood,
    required int intensity,
    required List<String> factors,
    String? contextNote,
    String? date,
  }) {
    final List<Map<String, dynamic>> list =
        _read('talkeasy_demo_mood_entries');
    final Map<String, dynamic> entry = <String, dynamic>{
      'id': DateTime.now().millisecondsSinceEpoch,
      'mood': mood,
      'intensity': intensity,
      'factors': jsonEncode(factors),
      'context_note': contextNote ?? '',
      'date': date ?? today(),
      'createdAt': nowIso(),
    };
    list.insert(0, entry);
    _write('talkeasy_demo_mood_entries', list);
    return MoodEntry.fromJson(entry);
  }

  // ─── Habits ───────────────────────────────────────────────────────────────

  List<Habit> habits({String? date}) {
    final List<Habit> all =
        _read(habitsKey).map(Habit.fromJson).toList(growable: false);
    if (date == null) return all;
    return all.where((Habit h) => h.date == date).toList(growable: false);
  }

  Habit createHabit(String type, {String? notes, String? date}) {
    final List<Map<String, dynamic>> list = _read(habitsKey);
    final Map<String, dynamic> entry = <String, dynamic>{
      'id': DateTime.now().millisecondsSinceEpoch,
      'type': type,
      'completed': false,
      'completion_percentage': 0,
      'notes': notes ?? '',
      'date': date ?? today(),
      'createdAt': nowIso(),
    };
    list.add(entry);
    _write(habitsKey, list);
    return Habit.fromJson(entry);
  }

  Habit? updateHabit(int id, {bool? completed, int? completionPercentage, String? notes}) {
    final List<Map<String, dynamic>> list = _read(habitsKey);
    final int index = list.indexWhere((Map<String, dynamic> h) => h['id'] == id);
    if (index == -1) return null;
    list[index] = <String, dynamic>{
      ...list[index],
      if (completed != null) 'completed': completed,
      if (completionPercentage != null)
        'completion_percentage': completionPercentage,
      if (notes != null) 'notes': notes,
    };
    _write(habitsKey, list);
    return Habit.fromJson(list[index]);
  }

  // ─── Journals ─────────────────────────────────────────────────────────────

  List<Journal> journals() =>
      _read(journalsKey).map(Journal.fromJson).toList(growable: false);

  Journal createJournal({
    String? title,
    required String content,
    String? type,
    String? tags,
    String? date,
  }) {
    final List<Map<String, dynamic>> list = _read(journalsKey);
    final Map<String, dynamic> entry = <String, dynamic>{
      'id': DateTime.now().millisecondsSinceEpoch,
      'title': title ?? '',
      'content': content,
      'type': type ?? 'reflection',
      'tags': tags ?? '',
      'date': date ?? today(),
      'createdAt': nowIso(),
    };
    list.insert(0, entry);
    _write(journalsKey, list);
    return Journal.fromJson(entry);
  }

  Journal? updateJournal(int id, Map<String, dynamic> updates) {
    final List<Map<String, dynamic>> list = _read(journalsKey);
    final int index =
        list.indexWhere((Map<String, dynamic> j) => j['id'] == id);
    if (index == -1) return null;
    list[index] = <String, dynamic>{...list[index], ...updates};
    _write(journalsKey, list);
    return Journal.fromJson(list[index]);
  }

  void deleteJournal(int id) {
    _write(
      journalsKey,
      _read(journalsKey)
          .where((Map<String, dynamic> j) => j['id'] != id)
          .toList(growable: false),
    );
  }

  // ─── Sleep ────────────────────────────────────────────────────────────────

  List<SleepEntry> sleepEntries() => _read('talkeasy_demo_sleep_entries')
      .map(SleepEntry.fromJson)
      .toList(growable: false);

  SleepEntry saveSleep({
    required int nightSleep,
    required int nap,
    required int totalSleep,
    String? date,
  }) {
    final String day = date ?? today();
    final List<Map<String, dynamic>> list =
        _read('talkeasy_demo_sleep_entries');
    final int index =
        list.indexWhere((Map<String, dynamic> e) => e['date'] == day);
    final Map<String, dynamic> entry = <String, dynamic>{
      if (index == -1) 'id': DateTime.now().millisecondsSinceEpoch,
      'night_sleep': nightSleep,
      'nap': nap,
      'total_sleep': totalSleep,
      'date': day,
      'createdAt': nowIso(),
    };
    if (index == -1) {
      list.insert(0, entry);
    } else {
      entry['id'] = list[index]['id'];
      list[index] = entry;
    }
    _write('talkeasy_demo_sleep_entries', list);
    return SleepEntry.fromJson(entry);
  }

  // ─── Water ────────────────────────────────────────────────────────────────

  List<WaterEntry> waterEntries({String? date}) {
    final List<WaterEntry> all = _read('talkeasy_demo_water_entries')
        .map(WaterEntry.fromJson)
        .toList(growable: false);
    if (date == null) return all;
    return all.where((WaterEntry e) => e.date == date).toList(growable: false);
  }

  WaterEntry addWater(int amountMl, {String? date}) {
    final List<Map<String, dynamic>> list =
        _read('talkeasy_demo_water_entries');
    final Map<String, dynamic> entry = <String, dynamic>{
      'id': DateTime.now().millisecondsSinceEpoch,
      'amount_ml': amountMl,
      'date': date ?? today(),
      'logged_at': nowIso(),
    };
    list.insert(0, entry);
    _write('talkeasy_demo_water_entries', list);
    return WaterEntry.fromJson(entry);
  }

  void deleteWater(int id) {
    _write(
      'talkeasy_demo_water_entries',
      _read('talkeasy_demo_water_entries')
          .where((Map<String, dynamic> e) => e['id'] != id)
          .toList(growable: false),
    );
  }

  // ─── Stress ───────────────────────────────────────────────────────────────

  List<StressEntry> stressEntries() => _read('talkeasy_demo_stress_entries')
      .map(StressEntry.fromJson)
      .toList(growable: false);

  StressEntry addStress({
    required String level,
    int? score,
    String? note,
    String? date,
  }) {
    final List<Map<String, dynamic>> list =
        _read('talkeasy_demo_stress_entries');
    final Map<String, dynamic> entry = <String, dynamic>{
      'id': DateTime.now().millisecondsSinceEpoch,
      'level': level,
      'score': score,
      'note': note ?? '',
      'intervention_viewed': false,
      'date': date ?? today(),
      'createdAt': nowIso(),
    };
    list.insert(0, entry);
    _write('talkeasy_demo_stress_entries', list);
    return StressEntry.fromJson(entry);
  }

  StressEntry? markInterventionViewed(int id) {
    final List<Map<String, dynamic>> list =
        _read('talkeasy_demo_stress_entries');
    final int index =
        list.indexWhere((Map<String, dynamic> e) => e['id'] == id);
    if (index == -1) return null;
    list[index] = <String, dynamic>{
      ...list[index],
      'intervention_viewed': true,
    };
    _write('talkeasy_demo_stress_entries', list);
    return StressEntry.fromJson(list[index]);
  }

  // ─── Chat ─────────────────────────────────────────────────────────────────

  List<Conversation> conversations() {
    final List<Map<String, dynamic>> chats = _read(chatKey);
    final List<Map<String, dynamic>> sorted = chats.reversed
        .map((Map<String, dynamic> c) => <String, dynamic>{
              'id': c['id'],
              'title': c['title'],
              'createdAt': c['createdAt'],
            })
        .toList();
    return sorted.map(Conversation.fromJson).toList(growable: false);
  }

  List<Message> conversationHistory(int id) {
    final List<Map<String, dynamic>> chats = _read(chatKey);
    for (final Map<String, dynamic> c in chats) {
      if (c['id'] == id) {
        final List<dynamic> messages =
            (c['messages'] as List<dynamic>?) ?? const <dynamic>[];
        return messages
            .whereType<Map<String, dynamic>>()
            .map(Message.fromJson)
            .toList(growable: false);
      }
    }
    return const <Message>[];
  }

  Conversation createConversation(String title) {
    final List<Map<String, dynamic>> chats = _read(chatKey);
    final Map<String, dynamic> entry = <String, dynamic>{
      'id': DateTime.now().millisecondsSinceEpoch,
      'title': title,
      'createdAt': nowIso(),
      'messages': <dynamic>[],
    };
    chats.insert(0, entry);
    _write(chatKey, chats);
    return Conversation.fromJson(entry);
  }

  Message addMessage(
    int conversationId,
    String role,
    String content, {
    String? emotion,
    String? suggestion,
  }) {
    final List<Map<String, dynamic>> chats = _read(chatKey);
    final int index = chats.indexWhere(
        (Map<String, dynamic> c) => c['id'] == conversationId);
    if (index == -1) {
      throw StateError('Demo conversation $conversationId not found');
    }
    final List<dynamic> messages =
        (chats[index]['messages'] as List<dynamic>?) ?? <dynamic>[];
    final Map<String, dynamic> entry = <String, dynamic>{
      'id': DateTime.now().millisecondsSinceEpoch,
      'role': role,
      'content': content,
      'detected_emotion': emotion,
      'ai_suggestion': suggestion,
      'createdAt': nowIso(),
    };
    messages.add(entry);
    chats[index] = <String, dynamic>{...chats[index], 'messages': messages};
    _write(chatKey, chats);
    return Message.fromJson(entry);
  }

  // ─── Emotional history ────────────────────────────────────────────────────

  List<EmotionalHistoryItem> emotionalHistory() {
    final List<Map<String, dynamic>> history = <Map<String, dynamic>>[];

    for (final Mood m in moods()) {
      history.add(<String, dynamic>{
        'id': m.id,
        'date': m.createdAt,
        'type': 'mood',
        'value': m.mood,
        'notes': m.notes,
      });
    }
    for (final Journal j in journals()) {
      history.add(<String, dynamic>{
        'id': j.id,
        'date': j.createdAt,
        'type': 'journal',
        'value': (j.title ?? '').isEmpty ? 'Journal Entry' : j.title,
        'notes': j.content,
        'tags': j.tags,
      });
    }
    for (final Map<String, dynamic> c in _read(chatKey)) {
      final String title = c['title']?.toString() ?? '';
      final List<dynamic> messages =
          (c['messages'] as List<dynamic>?) ?? const <dynamic>[];
      for (final dynamic m in messages) {
        if (m is! Map<String, dynamic>) continue;
        if (m['role'] != 'assistant') continue;
        final String? emotion = m['detected_emotion']?.toString();
        if (emotion == null || emotion.isEmpty) continue;
        history.add(<String, dynamic>{
          'id': m['id'],
          'date': m['createdAt'],
          'type': 'emotion',
          'value': emotion,
          'suggestion': m['ai_suggestion'],
          'notes': 'Conversation topic: "$title"',
        });
      }
    }

    history.sort((Map<String, dynamic> a, Map<String, dynamic> b) =>
        (b['date']?.toString() ?? '')
            .compareTo(a['date']?.toString() ?? ''));

    return history
        .map(EmotionalHistoryItem.fromJson)
        .toList(growable: false);
  }
}