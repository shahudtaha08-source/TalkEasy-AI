import 'package:flutter/material.dart';

import 'talk_colors.dart';

/// Reproduces `client/src/index.css` (+ dark theme) and the shadcn component tokens
/// from `client/src/components/ui/*`.
class TalkTheme {
  TalkTheme._();

  static const String displayFont = 'Outfit';
  static const String bodyFont = 'DMSans';

  static ThemeData light() => _build(Brightness.light);

  static ThemeData dark() => _build(Brightness.dark);

  static ThemeData _build(Brightness brightness) {
    final bool isDark = brightness == Brightness.dark;

    final ColorScheme scheme = ColorScheme(
      brightness: brightness,
      primary: TalkColors.primary,
      onPrimary: TalkColors.onPrimary,
      primaryContainer: TalkColors.primarySoft,
      onPrimaryContainer: TalkColors.primaryBorder,
      secondary: TalkColors.secondary,
      onSecondary: TalkColors.onSecondary,
      error: TalkColors.destructive,
      onError: Colors.white,
      surface: isDark ? TalkColors.darkCard : TalkColors.background,
      onSurface: isDark ? TalkColors.darkForeground : TalkColors.foreground,
      surfaceContainerHighest:
          isDark ? TalkColors.darkBorder : TalkColors.background,
      onSurfaceVariant: isDark ? TalkColors.darkMuted : TalkColors.muted,
      outline: isDark ? TalkColors.darkBorder : TalkColors.border,
      outlineVariant: isDark ? TalkColors.darkBorder : TalkColors.border,
    );

    final TextTheme text = _textTheme(isDark);

    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      colorScheme: scheme,
      scaffoldBackgroundColor:
          isDark ? TalkColors.darkBackground : TalkColors.background,
      fontFamily: bodyFont,
      textTheme: text,
      splashFactory: InkSparkle.splashFactory,
      appBarTheme: AppBarTheme(
        backgroundColor:
            isDark ? TalkColors.darkBackground : TalkColors.background,
        foregroundColor:
            isDark ? TalkColors.darkForeground : TalkColors.foreground,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        titleTextStyle: text.titleLarge,
      ),
      cardTheme: CardTheme(
        color: isDark ? TalkColors.darkCard : TalkColors.card,
        surfaceTintColor: Colors.transparent,
        elevation: 1,
        shadowColor: isDark ? Colors.black54 : const Color(0x1A0F172A),
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: TalkRadius.card,
          side: BorderSide(
            color: isDark ? TalkColors.darkCardBorder : TalkColors.cardBorder,
          ),
        ),
      ),
      dividerTheme: DividerThemeData(
        color: isDark ? TalkColors.darkBorder : TalkColors.border,
        thickness: 1,
        space: 1,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: isDark ? const Color(0xFF16252B) : Colors.white,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        hintStyle: TextStyle(
          color: isDark ? TalkColors.darkMuted : TalkColors.muted,
          fontFamily: bodyFont,
        ),
        labelStyle: TextStyle(
          color: isDark ? TalkColors.darkMuted : TalkColors.muted,
          fontFamily: bodyFont,
        ),
        border: _inputBorder(
            isDark ? TalkColors.darkBorder : TalkColors.border),
        enabledBorder: _inputBorder(
            isDark ? TalkColors.darkBorder : TalkColors.border),
        focusedBorder: _inputBorder(TalkColors.primary, width: 1.6),
        errorBorder: _inputBorder(TalkColors.destructive),
        focusedErrorBorder: _inputBorder(TalkColors.destructive, width: 1.6),
        errorStyle: TextStyle(color: TalkColors.destructive, fontSize: 12),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: TalkColors.primary,
          foregroundColor: TalkColors.onPrimary,
          disabledBackgroundColor:
              isDark ? const Color(0xFF2A3B41) : const Color(0xFFCBD5D2),
          disabledForegroundColor:
              isDark ? TalkColors.darkMuted : const Color(0xFF8A9A9A),
          minimumSize: const Size(0, 44),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          shape: const RoundedRectangleBorder(borderRadius: TalkRadius.button),
          textStyle: TextStyle(
            fontFamily: bodyFont,
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor:
              isDark ? TalkColors.darkForeground : TalkColors.foreground,
          side: BorderSide(
            color: isDark ? TalkColors.darkBorder : TalkColors.cardBorder,
          ),
          minimumSize: const Size(0, 44),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          shape: const RoundedRectangleBorder(borderRadius: TalkRadius.button),
          textStyle: TextStyle(
            fontFamily: bodyFont,
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: TalkColors.primary,
          textStyle: TextStyle(
            fontFamily: bodyFont,
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),
      chipTheme: ChipThemeData(
        backgroundColor:
            isDark ? const Color(0xFF16252B) : TalkColors.softBlue,
        labelStyle: TextStyle(
          fontFamily: bodyFont,
          fontSize: 13,
          color: isDark ? TalkColors.darkForeground : TalkColors.onSoftBlue,
        ),
        side: BorderSide.none,
        shape: const RoundedRectangleBorder(borderRadius: TalkRadius.pill),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      ),
      progressIndicatorTheme: const ProgressIndicatorThemeData(
        color: TalkColors.primary,
        linearTrackColor: TalkColors.primarySoft,
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: isDark ? TalkColors.darkCard : Colors.white,
        indicatorColor: TalkColors.primarySoft,
        surfaceTintColor: Colors.transparent,
        elevation: 3,
        labelTextStyle: WidgetStatePropertyAll(
          TextStyle(fontFamily: bodyFont, fontSize: 11),
        ),
      ),
      drawerTheme: DrawerThemeData(
        backgroundColor: isDark ? TalkColors.darkCard : Colors.white,
        surfaceTintColor: Colors.transparent,
        width: 280,
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        backgroundColor: isDark ? const Color(0xFF22363D) : TalkColors.foreground,
        contentTextStyle: TextStyle(
          color: Colors.white,
          fontFamily: bodyFont,
          fontSize: 14,
        ),
        shape: const RoundedRectangleBorder(borderRadius: TalkRadius.button),
      ),
      tooltipTheme: TooltipThemeData(
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF22363D) : TalkColors.foreground,
          borderRadius: TalkRadius.button,
        ),
        textStyle: TextStyle(color: Colors.white, fontFamily: bodyFont),
      ),
    );
  }

  static OutlineInputBorder _inputBorder(Color color, {double width = 1}) {
    return OutlineInputBorder(
      borderRadius: TalkRadius.input,
      borderSide: BorderSide(color: color, width: width),
    );
  }

  /// `font-display` = Outfit, everything else = DM Sans.
  static TextTheme _textTheme(bool isDark) {
    final Color fg = isDark ? TalkColors.darkForeground : TalkColors.foreground;
    final Color muted = isDark ? TalkColors.darkMuted : TalkColors.muted;

    TextStyle display(double size, FontWeight weight, {double? height}) =>
        TextStyle(
          fontFamily: displayFont,
          fontSize: size,
          fontWeight: weight,
          color: fg,
          height: height,
        );

    TextStyle body(double size, FontWeight weight, Color color,
            {double? height}) =>
        TextStyle(
          fontFamily: bodyFont,
          fontSize: size,
          fontWeight: weight,
          color: color,
          height: height,
        );

    return TextTheme(
      displayLarge: display(44, FontWeight.w700, height: 1.1),
      displayMedium: display(38, FontWeight.w700, height: 1.1),
      displaySmall: display(32, FontWeight.w700, height: 1.15),
      headlineLarge: display(30, FontWeight.w700, height: 1.2),
      headlineMedium: display(26, FontWeight.w700, height: 1.2),
      headlineSmall: display(22, FontWeight.w700, height: 1.25),
      titleLarge: display(20, FontWeight.w600, height: 1.3),
      titleMedium: body(16, FontWeight.w600, fg),
      titleSmall: body(14, FontWeight.w600, fg),
      bodyLarge: body(16, FontWeight.w400, fg, height: 1.5),
      bodyMedium: body(14, FontWeight.w400, fg, height: 1.5),
      bodySmall: body(13, FontWeight.w400, muted, height: 1.45),
      labelLarge: body(14, FontWeight.w500, fg),
      labelMedium: body(13, FontWeight.w500, muted),
      labelSmall: body(11, FontWeight.w500, muted),
    );
  }
}