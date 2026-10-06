import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../data/app_state.dart';

/// Port of `getAgeGroupSettings()` in `Layout.tsx`.
///
/// The web app scales font size, vertical rhythm, card padding and button size from
/// `user.ageGroup`; this does the same so Settings → age group changes apply app-wide.
class TalkAgeStyle extends InheritedWidget {
  const TalkAgeStyle({
    super.key,
    required this.fontScale,
    required this.sectionGap,
    required this.cardPadding,
    required this.buttonHeight,
    required super.child,
  });

  final double fontScale;
  final double sectionGap;
  final double cardPadding;
  final double buttonHeight;

  static TalkAgeStyle of(BuildContext context) {
    final TalkAgeStyle? found =
        context.dependOnInheritedWidgetOfExactType<TalkAgeStyle>();
    assert(found != null, 'TalkAgeStyle is missing from the widget tree');
    return found!;
  }

  EdgeInsets get cardPaddingValue =>
      EdgeInsets.all(cardPadding);

  /// Rebuilds with the current user's age group whenever the profile changes.
  static TalkAgeStyle forContext(BuildContext context, Widget child) {
    final String ageGroup =
        context.watch<AppState>().ageGroup ?? '';
    return TalkAgeStyle.resolve(ageGroup, child);
  }

  static TalkAgeStyle resolve(String ageGroup, Widget child) {
    // `text-lg` vs `text-base` is 18 / 16 px.
    final bool senior = ageGroup.contains('Senior');
    return TalkAgeStyle(
      fontScale: senior ? 18 / 16 : 1.0,
      sectionGap: senior ? 32 : 24, // space-y-8 vs space-y-6
      cardPadding: senior ? 24 : 20, // p-6 vs p-5
      buttonHeight: senior ? 48 : 40, // px-6 py-3 vs px-4 py-2
      child: child,
    );
  }
}