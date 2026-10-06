import 'package:flutter/material.dart';

/// Mood options and their contributing-factor lists, copied verbatim from
/// `client/src/pages/MoodTrackerEnhanced.tsx` (`MOODS` / `FACTORS` / `DEFAULT_FACTORS`).
class TalkMoods {
  TalkMoods._();

  static const List<String> options = [
    'Happy',
    'Calm',
    'Excited',
    'Neutral',
    'Sad',
    'Anxious',
    'Angry',
    'Tired',
    'Overwhelmed',
    'Other',
  ];

  static const Map<String, String> emoji = {
    'Happy': '\u{1F60A}',
    'Calm': '\u{1F60C}',
    'Excited': '\u{1F929}',
    'Neutral': '\u{1F610}',
    'Sad': '\u{1F614}',
    'Anxious': '\u{1F630}',
    'Angry': '\u{1F620}',
    'Tired': '\u{1F634}',
    'Overwhelmed': '\u{1F62B}',
    'Other': '\u{1F914}',
  };

  /// Background / border pair per mood, matching the Tailwind classes in the web page.
  static const Map<String, List<Color>> swatch = {
    'Happy': [Color(0xFFFEF3C7), Color(0xFFFDE68A)],
    'Calm': [Color(0xFFCCFBF1), Color(0xFF99F6E4)],
    'Excited': [Color(0xFFFFEDD5), Color(0xFFFED7AA)],
    'Neutral': [Color(0xFFF1F5F9), Color(0xFFE2E8F0)],
    'Sad': [Color(0xFFDBEAFE), Color(0xFFBFDBFE)],
    'Anxious': [Color(0xFFFEF3C7), Color(0xFFFDE68A)],
    'Angry': [Color(0xFFFEE2E2), Color(0xFFFECACA)],
    'Tired': [Color(0xFFEDE9FE), Color(0xFFDDD6FE)],
    'Overwhelmed': [Color(0xFFFFE4E6), Color(0xFFFECDD3)],
    'Other': [Color(0xFFF3F4F6), Color(0xFFE5E7EB)],
  };

  static const Map<String, List<String>> factors = {
    'Happy': [
      'Good news',
      'Friends',
      'Family',
      'College / Work',
      'Achievement',
      'Relationship',
      'Rest',
      'Personal time',
      'Other',
    ],
    'Calm': [
      'Rest',
      'Meditation',
      'Nature',
      'Personal time',
      'Family',
      'Music',
      'Other',
    ],
    'Excited': [
      'Achievement',
      'Friends',
      'Good news',
      'New opportunity',
      'Relationship',
      'Other',
    ],
    'Sad': [
      'College / Work',
      'Family',
      'Friends',
      'Relationship',
      'Loneliness',
      'Stress',
      'Health',
      'Other',
    ],
    'Anxious': [
      'Exams / Deadlines',
      'Health concerns',
      'Uncertainty',
      'Relationships',
      'Finances',
      'Family',
      'Other',
    ],
    'Angry': [
      'Conflict',
      'College / Work',
      'Family',
      'Injustice',
      'Frustration',
      'Other',
    ],
    'Tired': [
      'Poor sleep',
      'Overwork',
      'Stress',
      'Illness',
      'No breaks',
      'Other',
    ],
    'Overwhelmed': [
      'Too many tasks',
      'Deadlines',
      'Relationships',
      'Family',
      'College / Work',
      'Other',
    ],
    'Neutral': ['Routine day', 'Just okay', 'Other'],
    'Other': ['Other'],
  };

  /// Shown before a mood is picked.
  static const List<String> defaultFactors = [
    'College / Work',
    'Family',
    'Friends',
    'Relationship',
    'Health',
    'Other',
  ];

  static List<String> factorsFor(String mood) =>
      factors[mood] ?? defaultFactors;
}

/// `COMMON_HABITS` from `client/src/pages/HabitTracker.tsx`.
class TalkHabits {
  TalkHabits._();

  static const List<String> common = [
    'Meditation',
    'Exercise',
    'Hydration',
    'Journaling',
    'Reading',
  ];
}