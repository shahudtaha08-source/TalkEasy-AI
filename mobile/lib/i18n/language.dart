import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../data/app_state.dart';
import 'translations.dart';

/// Thin wrapper over [AppState] + [tr] so widgets can call `context.t('dashboard')`.
extension TalkL10n on BuildContext {
  String t(String key, [Map<String, String>? params]) =>
      tr(read<AppState>().language, key, params);

  List<String> get languages => kTalkLanguages;
}

/// Applies the active language's locale and text direction app-wide, the way
/// `LanguageContext.tsx` flips `document.dir` for Urdu.
class TalkLocalization extends InheritedWidget {
  const TalkLocalization({
    super.key,
    required this.language,
    required this.isRtl,
    required super.child,
  });

  final String language;
  final bool isRtl;

  Locale get locale => localeForLanguage(language);

  static TalkLocalization of(BuildContext context) {
    final TalkLocalization? result =
        context.dependOnInheritedWidgetOfExactType<TalkLocalization>();
    assert(result != null, 'TalkLocalization is missing from the widget tree');
    return result!;
  }

  @override
  bool updateShouldNotify(TalkLocalization oldWidget) =>
      oldWidget.language != language || oldWidget.isRtl != isRtl;
}