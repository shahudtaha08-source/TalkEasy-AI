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
        createdAt: (json['created_at'] ?? json['createdAt'])?.toString(),
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
        contextNote: (json['context_note'] ?? json['contextNote'])?.toString(),
        date: json['date']?.toString(),
        createdAt: (json['created_at'] ?? json['createdAt'])?.toString(),
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
            ((json['completion_percentage'] ?? json['completionPercentage'])
                    as num?)
                ?.toInt(),
        notes: json['notes']?.toString(),
        date: json['date']?.toString(),
        createdAt: (json['created_at'] ?? json['createdAt'])?.toString(),
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
        createdAt: (json['created_at'] ?? json['createdAt'])?.toString(),
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
        nightSleep:
            ((json['night_sleep'] ?? json['nightSleep']) as num?)?.toInt(),
        nap: (json['nap'] as num?)?.toInt(),
        totalSleep:
            ((json['total_sleep'] ?? json['totalSleep']) as num?)?.toInt(),
        date: json['date']?.toString(),
        createdAt: (json['created_at'] ?? json['createdAt'])?.toString(),
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
        amountMl: ((json['amount_ml'] ?? json['amountMl']) as num?)?.toInt(),
        date: json['date']?.toString(),
        loggedAt: (json['logged_at'] ?? json['loggedAt'])?.toString(),
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
        interventionViewed:
            (json['intervention_viewed'] ?? json['interventionViewed']) as bool?,
        date: json['date']?.toString(),
        createdAt: (json['created_at'] ?? json['createdAt'])?.toString(),
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
        periodStart: (json['period_start'] ?? json['periodStart'])?.toString(),
        periodEnd: (json['period_end'] ?? json['periodEnd'])?.toString(),
        summaryJson: (json['summary_json'] ?? json['summaryJson'])?.toString(),
        generatedAt: (json['generated_at'] ?? json['generatedAt'])?.toString(),
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
        createdAt: (json['created_at'] ?? json['createdAt'])?.toString(),
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
        conversationId:
            ((json['conversation_id'] ?? json['conversationId']) as num?)
                ?.toInt(),
        role: json['role']?.toString(),
        content: json['content']?.toString(),
        detectedEmotion:
            (json['detected_emotion'] ?? json['detectedEmotion'])?.toString(),
        aiSuggestion:
            (json['ai_suggestion'] ?? json['aiSuggestion'])?.toString(),
        createdAt: (json['created_at'] ?? json['createdAt'])?.toString(),
      );
}

/// One activity in the exercise catalogue. Mirrors `shared/exercise.ts`.
class ExerciseActivity {
  const ExerciseActivity({
    required this.id,
    required this.category,
    required this.name,
    required this.tracking,
    required this.met,
    this.supportsGps = false,
    this.supportsSteps = false,
  });

  final String id;
  final String category;
  final String name;
  final List<String> tracking;
  final double met;
  final bool supportsGps;
  final bool supportsSteps;

  bool get tracksReps => tracking.contains('reps');
  bool get tracksDistance => tracking.contains('distance');
}

/// Static mirror of the server catalogue so the screen works offline. The
/// server remains authoritative when a session is saved (it recomputes the
/// calorie estimate and re-validates everything).
const List<ExerciseActivity> kExerciseCatalog = <ExerciseActivity>[
  ExerciseActivity(id: 'pushups', category: 'strength', name: 'exercisePushups', tracking: <String>['reps', 'sets'], met: 7.5),
  ExerciseActivity(id: 'squats', category: 'strength', name: 'exerciseSquats', tracking: <String>['reps', 'sets'], met: 5.0),
  ExerciseActivity(id: 'situps', category: 'strength', name: 'exerciseSitups', tracking: <String>['reps', 'sets'], met: 8.0),
  ExerciseActivity(id: 'pullups', category: 'strength', name: 'exercisePullups', tracking: <String>['reps', 'sets'], met: 8.0),
  ExerciseActivity(id: 'lunges', category: 'strength', name: 'exerciseLunges', tracking: <String>['reps', 'sets'], met: 6.0),
  ExerciseActivity(id: 'kettlebell_swing', category: 'strength', name: 'exerciseKettlebellSwing', tracking: <String>['reps', 'sets'], met: 9.8),
  ExerciseActivity(id: 'walking', category: 'cardio', name: 'exerciseWalking', tracking: <String>['duration', 'distance'], met: 3.5, supportsGps: true, supportsSteps: true),
  ExerciseActivity(id: 'running', category: 'cardio', name: 'exerciseRunning', tracking: <String>['duration', 'distance'], met: 9.8, supportsGps: true, supportsSteps: true),
  ExerciseActivity(id: 'cycling', category: 'cardio', name: 'exerciseCycling', tracking: <String>['duration', 'distance'], met: 7.5, supportsGps: true),
  ExerciseActivity(id: 'jump_rope', category: 'cardio', name: 'exerciseJumpRope', tracking: <String>['duration'], met: 12.3, supportsSteps: true),
  ExerciseActivity(id: 'rowing', category: 'cardio', name: 'exerciseRowing', tracking: <String>['duration', 'distance'], met: 7.0),
  ExerciseActivity(id: 'elliptical', category: 'cardio', name: 'exerciseElliptical', tracking: <String>['duration'], met: 5.0),
  ExerciseActivity(id: 'stretching', category: 'mobility', name: 'exerciseStretching', tracking: <String>['duration'], met: 2.3),
  ExerciseActivity(id: 'pilates', category: 'mobility', name: 'exercisePilates', tracking: <String>['duration'], met: 3.0),
  ExerciseActivity(id: 'basketball', category: 'sport', name: 'exerciseBasketball', tracking: <String>['duration'], met: 6.5),
  ExerciseActivity(id: 'football', category: 'sport', name: 'exerciseFootball', tracking: <String>['duration'], met: 7.0),
  ExerciseActivity(id: 'badminton', category: 'sport', name: 'exerciseBadminton', tracking: <String>['duration'], met: 5.5),
  ExerciseActivity(id: 'swimming', category: 'sport', name: 'exerciseSwimming', tracking: <String>['duration'], met: 8.0),
  ExerciseActivity(id: 'yoga', category: 'mind_body', name: 'exerciseYoga', tracking: <String>['duration'], met: 2.5),
  ExerciseActivity(id: 'tai_chi', category: 'mind_body', name: 'exerciseTaiChi', tracking: <String>['duration'], met: 3.0),
];

const double kDefaultWeightKg = 70;

ExerciseActivity? exerciseActivityById(String? id) {
  if (id == null) return null;
  for (final ExerciseActivity a in kExerciseCatalog) {
    if (a.id == id) return a;
  }
  return null;
}

/// i18n key for a category, used to label the category chips.
String exerciseCategoryLabelKey(String category) {
  switch (category) {
    case 'strength':
      return 'exerciseCategoryStrength';
    case 'cardio':
      return 'exerciseCategoryCardio';
    case 'mobility':
      return 'exerciseCategoryMobility';
    case 'sport':
      return 'exerciseCategorySport';
    case 'mind_body':
      return 'exerciseCategoryMindBody';
    default:
      return 'exerciseTitle';
  }
}

class CalorieEstimate {
  const CalorieEstimate({
    required this.kcal,
    required this.weightKg,
    required this.weightAssumed,
  });

  final int kcal;
  final double weightKg;
  final bool weightAssumed;
}

/// Deterministic MET-based estimate, mirroring `estimateCalories` on the server.
/// Returns null when the activity is unknown or the duration is not positive.
CalorieEstimate? estimateWorkoutCalories({
  required ExerciseActivity activity,
  required int durationSeconds,
  double? weightKg,
}) {
  if (durationSeconds <= 0) return null;
  final bool hasWeight = weightKg != null && weightKg >= 20 && weightKg <= 400;
  final double weight = hasWeight ? weightKg : kDefaultWeightKg;
  final double minutes = durationSeconds / 60;
  final double kcal = (activity.met * 3.5 * weight) / 200 * minutes;
  return CalorieEstimate(
    kcal: kcal.round(),
    weightKg: weight,
    weightAssumed: !hasWeight,
  );
}

/// `workout_sessions` row from `GET /api/workouts`.
class WorkoutSession {
  const WorkoutSession({
    this.id,
    this.activityId,
    this.category,
    this.source,
    this.startedAt,
    this.durationSeconds,
    this.repetitions,
    this.sets,
    this.distanceMeters,
    this.caloriesKcal,
    this.weightAssumed,
    this.met,
    this.notes,
    this.date,
    this.createdAt,
  });

  final int? id;
  final String? activityId;
  final String? category;
  final String? source;
  final String? startedAt;
  final int? durationSeconds;
  final int? repetitions;
  final int? sets;
  final double? distanceMeters;
  final int? caloriesKcal;
  final bool? weightAssumed;
  final double? met;
  final String? notes;
  final String? date;
  final String? createdAt;

  factory WorkoutSession.fromJson(Map<String, dynamic> json) => WorkoutSession(
        id: (json['id'] as num?)?.toInt(),
        activityId: (json['activity_id'] ?? json['activityId'])?.toString(),
        category: json['category']?.toString(),
        source: json['source']?.toString(),
        startedAt: (json['started_at'] ?? json['startedAt'])?.toString(),
        durationSeconds:
            ((json['duration_seconds'] ?? json['durationSeconds']) as num?)
                ?.toInt(),
        repetitions: (json['repetitions'] as num?)?.toInt(),
        sets: (json['sets'] as num?)?.toInt(),
        distanceMeters:
            ((json['distance_meters'] ?? json['distanceMeters']) as num?)
                ?.toDouble(),
        caloriesKcal:
            ((json['calories_kcal'] ?? json['caloriesKcal']) as num?)?.toInt(),
        weightAssumed:
            (json['weight_assumed'] ?? json['weightAssumed']) as bool?,
        met: (json['met'] as num?)?.toDouble(),
        notes: json['notes']?.toString(),
        date: json['date']?.toString(),
        createdAt: (json['created_at'] ?? json['createdAt'])?.toString(),
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