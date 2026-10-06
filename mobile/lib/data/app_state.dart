import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'api_client.dart';
import 'demo_store.dart';
import 'models.dart';

/// Session, profile, theme, language and demo-mode state.
///
/// Mirrors `useAuth` + `use-user.ts` + `LanguageContext.tsx` + the theme toggle in
/// `Settings.tsx`. Every data hook reads [isDemo] to decide between the API and [demo].
class AppState extends ChangeNotifier {
  AppState({required SharedPreferences prefs, ApiClient? api})
      : _prefs = prefs,
        api = api ?? ApiClient(),
        demo = DemoStore(prefs) {
    _language = _prefs.getString(languageKey) ?? 'English';
    _themeMode = ThemeMode.values.firstWhere(
      (ThemeMode m) => m.name == (_prefs.getString(themeKey) ?? 'system'),
      orElse: () => ThemeMode.system,
    );
  }

  final SharedPreferences _prefs;
  final ApiClient api;
  late final DemoStore demo;

  static const String languageKey = 'talkeasy_lang';
  static const String themeKey = 'talkeasy_theme';
  static const String ageStyleKey = 'talkeasy_age_group';

  TalkUser? _user;
  bool _loading = true;
  String? _error;

  String _language = 'English';
  ThemeMode _themeMode = ThemeMode.system;

  TalkUser? get user => _user;
  bool get isLoading => _loading;
  String? get error => _error;
  bool get isAuthenticated => _user != null;
  bool get isDemo => demo.isDemoMode;
  DateTime get demoExpiry => demo.expiryDate;

  String get language => _language;
  ThemeMode get themeMode => _themeMode;

  bool get isRtl => _language == 'Urdu';

  String? get ageGroup => _user?.ageGroup;

  // ─── Bootstrap ────────────────────────────────────────────────────────────

  /// `GET /api/auth/user`, with a `401` meaning "signed out" exactly like `use-user.ts`.
  Future<void> bootstrap() async {
    _loading = true;
    _error = null;
    notifyListeners();

    if (isDemo) {
      _user = demo.user();
      _syncLanguageFromUser();
      _loading = false;
      notifyListeners();
      return;
    }

    try {
      final dynamic json = await api.get(ApiPaths.authUser);
      if (json is Map<String, dynamic>) {
        _user = TalkUser.fromJson(json);
        _syncLanguageFromUser();
      } else {
        _user = null;
      }
      _error = null;
    } on ApiException catch (e) {
      _user = null;
      if (!e.isUnauthorized) _error = e.message;
    } catch (e) {
      _user = null;
      _error = e.toString();
    }

    _loading = false;
    notifyListeners();
  }

  void _syncLanguageFromUser() {
    final String? stored = _prefs.getString(languageKey);
    final String? profile = _user?.preferredLanguage;
    if (profile != null && profile.isNotEmpty && profile != stored) {
      _language = profile;
      _prefs.setString(languageKey, profile);
    }
  }

  // ─── Auth ─────────────────────────────────────────────────────────────────

  Future<bool> login(String email, String password) async {
    if (isDemo) {
      _user = demo.user();
      _loading = false;
      notifyListeners();
      return true;
    }
    try {
      final dynamic json = await api.post(
        ApiPaths.authLogin,
        body: <String, String>{'email': email, 'password': password},
      );
      _user = json is Map<String, dynamic> ? TalkUser.fromJson(json) : null;
      _loading = false;
      _error = null;
      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _user = null;
      notifyListeners();
      throw ApiException(e.message, statusCode: e.statusCode);
    }
  }

  Future<bool> register({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    String? ageGroup,
    String? preferredLanguage,
  }) async {
    if (isDemo) {
      _user = demo.user();
      _loading = false;
      notifyListeners();
      return true;
    }
    try {
      final dynamic json = await api.post(
        ApiPaths.authRegister,
        body: <String, String>{
          'email': email,
          'password': password,
          'firstName': firstName,
          'lastName': lastName,
          if (ageGroup != null) 'ageGroup': ageGroup,
          if (preferredLanguage != null)
            'preferredLanguage': preferredLanguage,
        },
      );
      _user = json is Map<String, dynamic> ? TalkUser.fromJson(json) : null;
      _loading = false;
      _error = null;
      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _user = null;
      notifyListeners();
      throw ApiException(e.message, statusCode: e.statusCode);
    }
  }

  Future<void> logout() async {
    if (isDemo) {
      demo.disable();
    } else {
      try {
        await api.post(ApiPaths.authLogout);
      } catch (_) {
        // Clearing the session locally is what matters.
      }
      api.clearCookies();
    }
    _user = null;
    notifyListeners();
  }

  Future<void> requestPasswordReset(String email) async {
    if (isDemo) return;
    await api.post(
      ApiPaths.authForgotPassword,
      body: <String, String>{'email': email},
    );
  }

  Future<bool> verifyResetToken(String token) async {
    if (isDemo) return false;
    final dynamic json = await api.post(
      ApiPaths.authVerifyResetToken,
      body: <String, String>{'token': token},
    );
    return json is Map && json['valid'] == true;
  }

  Future<void> resetPassword(String token, String newPassword) async {
    if (isDemo) return;
    await api.post(
      ApiPaths.authResetPassword,
      body: <String, String>{'token': token, 'newPassword': newPassword},
    );
  }

  // ─── Profile ──────────────────────────────────────────────────────────────

  /// `PATCH /api/user`, or `updateDemoUser` in demo mode.
  Future<void> updateProfile(Map<String, dynamic> updates) async {
    if (isDemo) {
      _user = demo.updateUser(updates);
      notifyListeners();
      return;
    }
    final dynamic json =
        await api.patch(ApiPaths.user, body: updates);
    if (json is Map<String, dynamic>) {
      _user = TalkUser.fromJson(json);
      notifyListeners();
    }
  }

  // ─── Preferences ──────────────────────────────────────────────────────────

  void setLanguage(String code) {
    _language = code;
    _prefs.setString(languageKey, code);
    notifyListeners();
    if (_user != null && _user!.preferredLanguage != code) {
      updateProfile(<String, dynamic>{'preferredLanguage': code});
    }
  }

  void setThemeMode(ThemeMode mode) {
    _themeMode = mode;
    _prefs.setString(themeKey, mode.name);
    notifyListeners();
  }

  void setDemoMode(bool enabled) {
    if (enabled) {
      demo.enable();
      _user = demo.user();
    } else {
      demo.disable();
      _user = null;
    }
    notifyListeners();
  }
}