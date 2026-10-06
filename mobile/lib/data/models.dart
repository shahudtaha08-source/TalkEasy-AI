/// Dart mirrors of the rows in `shared/schema.ts`. Field names match the JSON the
/// Express API returns so no translation layer is needed.
library;

import 'dart:convert';

class TalkUser {
  const TalkUser({
    this.id,
    this.email,
    this.username,
    this.firstName,
    this.lastName,
    this.profileImageUrl,
    this.ageGroup,
    this.preferredLanguage,
    this.emergencyContact,
    this.city,
    this.locality,
    this.budget,
    this.occupationType,
    this.waterTargetMl,
    this.sleepTargetHours,
    this.createdAt,
    this.updatedAt,
  });

  final String? id;
  final String? email;
  final String? username;
  final String? firstName;
  final String? lastName;
  final String? profileImageUrl;
  final String? ageGroup;
  final String? preferredLanguage;
  final String? emergencyContact;
  final String? city;
  final String? locality;
  final String? budget;
  final String? occupationType;
  final int? waterTargetMl;
  final double? sleepTargetHours;
  final String? createdAt;
  final String? updatedAt;

  static int? _int(dynamic v) => v == null ? null : (v as num).toInt();
  static double? _dbl(dynamic v) => v == null ? null : (v as num).toDouble();
  static String? _str(dynamic v) => v?.toString();

  factory TalkUser.fromJson(Map<String, dynamic> json) => TalkUser(
        id: _str(json['id']),
        email: _str(json['email']),
        username: _str(json['username']),
        firstName: _str(json['first_name'] ?? json['firstName']),
        lastName: _str(json['last_name'] ?? json['lastName']),
        profileImageUrl:
            _str(json['profile_image_url'] ?? json['profileImageUrl']),
        ageGroup: _str(json['age_group'] ?? json['ageGroup']),
        preferredLanguage: _str(
            json['preferred_language'] ?? json['preferredLanguage']),
        emergencyContact:
            _str(json['emergency_contact'] ?? json['emergencyContact']),
        city: _str(json['city']),
        locality: _str(json['locality']),
        budget: _str(json['budget']),
        occupationType: _str(json['occupation_type'] ?? json['occupationType']),
        waterTargetMl: _int(json['water_target_ml'] ?? json['waterTargetMl']),
        sleepTargetHours:
            _dbl(json['sleep_target_hours'] ?? json['sleepTargetHours']),
        createdAt: _str(json['created_at'] ?? json['createdAt']),
        updatedAt: _str(json['updated_at'] ?? json['updatedAt']),
      );

  String get displayName {
    final String first = firstName?.trim() ?? '';
    final String last = lastName?.trim() ?? '';
    final String joined = [first, last].where((s) => s.isNotEmpty).join(' ');
    return joined.isNotEmpty ? joined : (email ?? 'TalkEasy');
  }

  String get initials {
    final List<String> parts = [firstName, lastName]
        .where((s) => (s ?? '').trim().isNotEmpty)
        .map((s) => s!.trim())
        .toList();
    if (parts.isEmpty) return 'T';
    if (parts.length == 1) return parts.first.characters;
    return '${parts.first.characters}${parts.last.characters}';
  }
}

extension on String {
  String get characters => isEmpty ? '' : substring(0, 1).toUpperCase();
}

/// `moods` — simple mood log.
class Mood {
  const Mood({
    this.id,
    this.mood,
    this.notes,
    this.date,
    this.createdAt,
  });

  final int? id;
  final String? mood;
  final String? notes;
  final String? date;
  final String? createdAt;

  factory Mood.fromJson(Map<String, dynamic> json) => Mood(
        id: (json['id'] as num?)?.toInt(),
        mood: json['mood']?.toString(),
        notes: json['notes']?.toString(),
        date: json['date']?.toString(),
        createdAt: json['created_at']?.toString(),
      );
}

/// `mood_entries` — detailed log with intensity + factors.
class MoodEntry {
  const MoodEntry({
    this.id,
    this.mood,
    this.intensity,
    this.factors,
    this.contextNote,
    this.date,
    this.createdAt,
  });

  final int? id;
  final String? mood;
  final int? intensity;
  final List<String>? factors;
  final String? contextNote;
  final String? date;
  final String? createdAt;

  static List<String> _factors(dynamic raw) {
    if (raw == null) return const [];
    if (raw is List) return raw.map((e) => e.toString()).toList();
    // The column is text holding a JSON array.
    final String s = raw.toString().trim();
    if (s.isEmpty) return const [];
    final String inner = s.startsWith('[') && s.endsWith(']')
        ? s.substring(1, s.length - 1)
        : s;
    return inner
        .split(',')
        .map((e) => e.trim().replaceAll(RegExp(r'^"|"$'), ''))
        .where((e) => e.isNotEmpty)
        .toList();
  }

  factory MoodEntry.fromJson(Map<String, dynamic> json) => MoodEntry(
        id: (json['id'] as num?)?.toInt(),
        mood: json['mood']?.toString(),
        intensity: (json['intensity'] as num?)?.toInt(),
        factors: _factors(json['factors']),
        contextNote: json['context_note']?.toString(),
        date: json['date']?.toString(),
        createdAt: json['created_at']?.toString(),
      );
}

class Habit {
  const Habit({
    this.id,
    this.type,
    this.completed,
    this.completionPercentage,
    this.notes,
    this.date,
    this.createdAt,
  });

  final int? id;
  final String? type;
  final bool? completed;
  final int? completionPercentage;
  final String? notes;
  final String? date;
  final String? createdAt;

  factory Habit.fromJson(Map<String, dynamic> json) => Habit(
        id: (json['id'] as num?)?.toInt(),
        type: json['type']?.toString(),
        completed: json['completed'] as bool?,
        completionPercentage:
            (json['completion_percentage'] as num?)?.toInt(),
        notes: json['notes']?.toString(),
        date: json['date']?.toString(),
        createdAt: json['created_at']?.toString(),
      );

  Habit copyWith({bool? completed, int? completionPercentage}) => Habit(
        id: id,
        type: type,
        completed: completed ?? this.completed,
        completionPercentage:
            completionPercentage ?? this.completionPercentage,
        notes: notes,
        date: date,
        createdAt: createdAt,
      );
}

class Journal {
  const Journal({
    this.id,
    this.title,
    this.content,
    this.type,
    this.tags,
    this.date,
    this.createdAt,
  });

  final int? id;
  final String? title;
  final String? content;
  final String? type;
  final String? tags;
  final String? date;
  final String? createdAt;

  factory Journal.fromJson(Map<String, dynamic> json) => Journal(
        id: (json['id'] as num?)?.toInt(),
        title: json['title']?.toString(),
        content: json['content']?.toString(),
        type: json['type']?.toString(),
        tags: json['tags']?.toString(),
        date: json['date']?.toString(),
        createdAt: json['created_at']?.toString(),
      );
}

class SleepEntry {
  const SleepEntry({
    this.id,
    this.nightSleep,
    this.nap,
    this.totalSleep,
    this.date,
    this.createdAt,
  });

  final int? id;
  final int? nightSleep;
  final int? nap;
  final int? totalSleep;
  final String? date;
  final String? createdAt;

  factory SleepEntry.fromJson(Map<String, dynamic> json) => SleepEntry(
        id: (json['id'] as num?)?.toInt(),
        nightSleep: (json['night_sleep'] as num?)?.toInt(),
        nap: (json['nap'] as num?)?.toInt(),
        totalSleep: (json['total_sleep'] as num?)?.toInt(),
        date: json['date']?.toString(),
        createdAt: json['created_at']?.toString(),
      );
}

class WaterEntry {
  const WaterEntry({
    this.id,
    this.amountMl,
    this.date,
    this.loggedAt,
  });

  final int? id;
  final int? amountMl;
  final String? date;
  final String? loggedAt;

  factory WaterEntry.fromJson(Map<String, dynamic> json) => WaterEntry(
        id: (json['id'] as num?)?.toInt(),
        amountMl: (json['amount_ml'] as num?)?.toInt(),
        date: json['date']?.toString(),
        loggedAt: json['logged_at']?.toString(),
      );
}

class StressEntry {
  const StressEntry({
    this.id,
    this.level,
    this.score,
    this.note,
    this.interventionViewed,
    this.date,
    this.createdAt,
  });

  final int? id;
  final String? level;
  final int? score;
  final String? note;
  final bool? interventionViewed;
  final String? date;
  final String? createdAt;

  factory StressEntry.fromJson(Map<String, dynamic> json) => StressEntry(
        id: (json['id'] as num?)?.toInt(),
        level: json['level']?.toString(),
        score: (json['score'] as num?)?.toInt(),
        note: json['note']?.toString(),
        interventionViewed: json['intervention_viewed'] as bool?,
        date: json['date']?.toString(),
        createdAt: json['created_at']?.toString(),
      );
}

/// `health_daily_records`. Wearable metrics are always demo-flagged in v6.0.
class HealthDailyRecord {
  const HealthDailyRecord({
    this.id,
    this.date,
    this.heartRate,
    this.spo2,
    this.systolicBp,
    this.diastolicBp,
    this.ecgStatus,
    this.steps,
    this.isDemo,
    this.sleepHours,
    this.waterMl,
    this.stressLevel,
    this.mood,
    this.moodIntensity,
    this.createdAt,
    this.updatedAt,
  });

  final int? id;
  final String? date;
  final int? heartRate;
  final int? spo2;
  final int? systolicBp;
  final int? diastolicBp;
  final String? ecgStatus;
  final int? steps;
  final bool? isDemo;
  final double? sleepHours;
  final int? waterMl;
  final String? stressLevel;
  final String? mood;
  final int? moodIntensity;
  final String? createdAt;
  final String? updatedAt;

  factory HealthDailyRecord.fromJson(Map<String, dynamic> json) {
    if (json.isEmpty) return const HealthDailyRecord();
    return HealthDailyRecord(
      id: (json['id'] as num?)?.toInt(),
      date: json['date']?.toString(),
      heartRate: (json['heart_rate'] as num?)?.toInt(),
      spo2: (json['spo2'] as num?)?.toInt(),
      systolicBp: (json['systolic_bp'] as num?)?.toInt(),
      diastolicBp: (json['diastolic_bp'] as num?)?.toInt(),
      ecgStatus: json['ecg_status']?.toString(),
      steps: (json['steps'] as num?)?.toInt(),
      isDemo: json['is_demo'] as bool?,
      sleepHours: (json['sleep_hours'] as num?)?.toDouble(),
      waterMl: (json['water_ml'] as num?)?.toInt(),
      stressLevel: json['stress_level']?.toString(),
      mood: json['mood']?.toString(),
      moodIntensity: (json['mood_intensity'] as num?)?.toInt(),
      createdAt: json['created_at']?.toString(),
      updatedAt: json['updated_at']?.toString(),
    );
  }
}

class Report {
  const Report({
    this.id,
    this.type,
    this.title,
    this.periodStart,
    this.periodEnd,
    this.summaryJson,
    this.generatedAt,
  });

  final int? id;
  final String? type;
  final String? title;
  final String? periodStart;
  final String? periodEnd;
  final String? summaryJson;
  final String? generatedAt;

  factory Report.fromJson(Map<String, dynamic> json) => Report(
        id: (json['id'] as num?)?.toInt(),
        type: json['type']?.toString(),
        title: json['title']?.toString(),
        periodStart: json['period_start']?.toString(),
        periodEnd: json['period_end']?.toString(),
        summaryJson: json['summary_json']?.toString(),
        generatedAt: json['generated_at']?.toString(),
      );

  Map<String, dynamic> get summary {
    final String raw = summaryJson ?? '';
    if (raw.isEmpty) return const {};
    try {
      final dynamic decoded = jsonDecode(raw);
      return decoded is Map<String, dynamic> ? decoded : const {};
    } catch (_) {
      return const {};
    }
  }
}

class Conversation {
  const Conversation({
    this.id,
    this.title,
    this.createdAt,
  });

  final int? id;
  final String? title;
  final String? createdAt;

  factory Conversation.fromJson(Map<String, dynamic> json) => Conversation(
        id: (json['id'] as num?)?.toInt(),
        title: json['title']?.toString(),
        createdAt: json['created_at']?.toString(),
      );
}

class Message {
  const Message({
    this.id,
    this.conversationId,
    this.role,
    this.content,
    this.detectedEmotion,
    this.aiSuggestion,
    this.createdAt,
  });

  final int? id;
  final int? conversationId;
  final String? role;
  final String? content;
  final String? detectedEmotion;
  final String? aiSuggestion;
  final String? createdAt;

  bool get isUser => role == 'user';

  factory Message.fromJson(Map<String, dynamic> json) => Message(
        id: (json['id'] as num?)?.toInt(),
        conversationId: (json['conversation_id'] as num?)?.toInt(),
        role: json['role']?.toString(),
        content: json['content']?.toString(),
        detectedEmotion: json['detected_emotion']?.toString(),
        aiSuggestion: json['ai_suggestion']?.toString(),
        createdAt: json['created_at']?.toString(),
      );
}

/// One row of `GET /api/history/emotional`.
class EmotionalHistoryItem {
  const EmotionalHistoryItem({
    required this.id,
    required this.date,
    required this.type,
    required this.value,
    this.suggestion,
    this.notes,
    this.tags,
  });

  final int id;
  final String date;
  final String type;
  final String value;
  final String? suggestion;
  final String? notes;
  final String? tags;

  factory EmotionalHistoryItem.fromJson(Map<String, dynamic> json) =>
      EmotionalHistoryItem(
        id: (json['id'] as num?)?.toInt() ?? 0,
        date: json['date']?.toString() ?? '',
        type: json['type']?.toString() ?? 'mood',
        value: json['value']?.toString() ?? '',
        suggestion: json['suggestion']?.toString(),
        notes: json['notes']?.toString(),
        tags: json['tags']?.toString(),
      );
}