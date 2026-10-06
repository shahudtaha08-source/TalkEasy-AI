import 'package:flutter/material.dart';

/// Mirrors the CSS custom properties in `client/src/index.css`.
class TalkColors {
  TalkColors._();

  // hsl(170 70% 40%)
  static const Color primary = Color(0xFF1DAF9C);
  static const Color onPrimary = Color(0xFFF0FCFA);
  static const Color primaryBorder = Color(0xFF178E80);

  /// The soft teal used behind primary icons (primary at 12% alpha).
  static const Color primarySoft = Color(0x1F1DAF9C);

  static const Color secondary = Color(0xFF94A3B8);
  static const Color onSecondary = Color(0xFFF8FAFC);

  static const Color background = Color(0xFFF4F8F7);
  static const Color card = Color(0xFFFFFFFF);
  static const Color cardBorder = Color(0xFFE2E8F0);
  static const Color cardForeground = Color(0xFF1A2C33);

  static const Color foreground = Color(0xFF1A2C33);
  static const Color muted = Color(0xFF5F7480);
  static const Color border = Color(0xFFE4EBEE);
  static const Color input = Color(0xFFE4EBEE);

  // hsl(210 60% 92%)
  static const Color softBlue = Color(0xFFDCEAF7);
  static const Color onSoftBlue = Color(0xFF1B3A5C);

  static const Color destructive = Color(0xFFDC2626);
  static const Color success = Color(0xFF16A34A);
  static const Color warning = Color(0xFFD97706);

  static const Color ring = Color(0x331DAF9C);

  // Dark theme
  static const Color darkBackground = Color(0xFF0B1418);
  static const Color darkCard = Color(0xFF111E23);
  static const Color darkCardBorder = Color(0xFF1E2F35);
  static const Color darkForeground = Color(0xFFE9F1F0);
  static const Color darkMuted = Color(0xFF93A7AE);
  static const Color darkBorder = Color(0xFF22363D);
}

/// Radii copied from the Tailwind scale used by the web app.
class TalkRadius {
  TalkRadius._();

  static const BorderRadius button = BorderRadius.all(Radius.circular(6));
  static const BorderRadius input = BorderRadius.all(Radius.circular(8));
  static const BorderRadius card = BorderRadius.all(Radius.circular(12));
  static const BorderRadius authCard = BorderRadius.all(Radius.circular(24));
  static const BorderRadius pill = BorderRadius.all(Radius.circular(999));
}

/// Spacing scale (Tailwind steps used across the web pages).
class TalkSpace {
  TalkSpace._();

  static const double xs = 4;
  static const double sm = 8;
  static const double md = 16;
  static const double lg = 24;
  static const double xl = 32;
}

/// Per-mood palette used by Mood Tracker, Statistics, Trends and History.
class TalkMoodPalette {
  TalkMoodPalette._();

  static const Map<String, Color> colors = {
    'Happy': Color(0xFFF59E0B),
    'Calm': Color(0xFF14B8A6),
    'Sad': Color(0xFF3B82F6),
    'Anxious': Color(0xFF8B5CF6),
    'Angry': Color(0xFFEF4444),
    'Tired': Color(0xFF64748B),
    'Overwhelmed': Color(0xFFEC4899),
    'Excited': Color(0xFFEAB308),
    'Neutral': Color(0xFF94A3B8),
    'Grateful': Color(0xFF10B981),
    'Lonely': Color(0xFF6366F1),
    'Other': Color(0xFF64748B),
  };

  static Color of(String mood) => colors[mood] ?? const Color(0xFF94A3B8);

  /// Moods offered by the web Mood Tracker, in the same order.
  static const List<String> options = [
    'Happy',
    'Calm',
    'Sad',
    'Anxious',
    'Angry',
    'Tired',
    'Overwhelmed',
    'Excited',
    'Neutral',
    'Grateful',
    'Lonely',
    'Other',
  ];

  static const Map<String, String> emoji = {
    'Happy': '😊',
    'Calm': '😌',
    'Sad': '😔',
    'Anxious': '😰',
    'Angry': '😠',
    'Tired': '😴',
    'Overwhelmed': '😫',
    'Excited': '🤩',
    'Neutral': '😐',
    'Grateful': '🙏',
    'Lonely': '🥺',
    'Other': '🤔',
  };
}

/// Stress level palette.
class TalkStressPalette {
  TalkStressPalette._();

  static const Map<String, Color> colors = {
    'Relaxed': Color(0xFF10B981),
    'Low': Color(0xFF14B8A6),
    'Moderate': Color(0xFFF59E0B),
    'High': Color(0xFFEF4444),
  };

  static Color of(String level) => colors[level] ?? const Color(0xFF94A3B8);

  static const List<String> levels = ['Relaxed', 'Low', 'Moderate', 'High'];
}