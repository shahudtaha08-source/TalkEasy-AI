import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'data/app_state.dart';
import 'i18n/language.dart';
import 'services/health_device_service.dart';
import 'services/notification_service.dart';
import 'screens/splash_screen.dart';
import 'screens/login_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/chat_screen.dart';
import 'screens/mood_screen.dart';
import 'screens/habits_screen.dart';
import 'screens/sleep_screen.dart';
import 'screens/water_screen.dart';
import 'screens/exercise_screen.dart';
import 'screens/coming_soon_screen.dart';
import 'theme/talk_theme.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final SharedPreferences prefs = await SharedPreferences.getInstance();

  // Set up on-device mood reminders. This is best-effort: a failure here must
  // never block app startup. No data leaves the device.
  final NotificationService notifications = NotificationService.instance;
  await notifications.initialize();
  try {
    await notifications.requestPermissions();
    final String? stored =
        prefs.getString(NotificationService.lastCheckInPrefsKey);
    await notifications.scheduleMoodReminder(
      lastCheckInAt: stored == null ? null : DateTime.tryParse(stored),
    );
  } catch (_) {
    // Ignore — reminders are re-attempted after the next saved check-in.
  }

  runApp(TalkEasyApp(prefs: prefs));
}

class TalkEasyApp extends StatefulWidget {
  const TalkEasyApp({super.key, required this.prefs});

  final SharedPreferences prefs;

  @override
  State<TalkEasyApp> createState() => _TalkEasyAppState();
}

class _TalkEasyAppState extends State<TalkEasyApp> {
  late final AppState _state;
  late final GoRouter _router;
  final HealthDeviceService _healthDevice =
      HealthDeviceServiceFactory.createService(useDemo: false);

  @override
  void initState() {
    super.initState();
    _state = AppState(prefs: widget.prefs)..bootstrap();

    _router = GoRouter(
      initialLocation: '/splash',
      refreshListenable: _state,
      redirect: (BuildContext context, GoRouterState state) {
        final bool signedIn = _state.isAuthenticated || _state.isDemo;
        final String location = state.uri.path;
        final bool atAuth = location == '/splash' || location == '/login';

        if (_state.isLoading) return atAuth ? null : '/splash';
        if (!signedIn) return location == '/login' ? null : '/login';
        if (atAuth) return '/dashboard';
        return null;
      },
      routes: <RouteBase>[
        GoRoute(
          path: '/',
          builder: (BuildContext context, GoRouterState state) =>
              const SplashScreen(),
        ),
        GoRoute(
          path: '/splash',
          builder: (BuildContext context, GoRouterState state) =>
              const SplashScreen(),
        ),
        GoRoute(
          path: '/login',
          builder: (BuildContext context, GoRouterState state) =>
              const LoginScreen(),
        ),
        GoRoute(
          path: '/dashboard',
          builder: (BuildContext context, GoRouterState state) =>
              const DashboardScreen(),
        ),
        GoRoute(
          path: '/chat',
          builder: (BuildContext context, GoRouterState state) =>
              const ChatScreen(),
        ),
        GoRoute(
          path: '/mood',
          builder: (BuildContext context, GoRouterState state) =>
              const MoodScreen(),
        ),
        GoRoute(
          path: '/mood-enhanced',
          builder: (BuildContext context, GoRouterState state) =>
              const MoodScreen(),
        ),
        GoRoute(
          path: '/habits',
          builder: (BuildContext context, GoRouterState state) =>
              const HabitsScreen(),
        ),
        GoRoute(
          path: '/sleep',
          builder: (BuildContext context, GoRouterState state) =>
              const SleepScreen(),
        ),
        GoRoute(
          path: '/water',
          builder: (BuildContext context, GoRouterState state) =>
              const WaterScreen(),
        ),
        GoRoute(
          path: '/exercise',
          builder: (BuildContext context, GoRouterState state) =>
              const ExerciseScreen(),
        ),
        GoRoute(
          path: '/:page',
          builder: (BuildContext context, GoRouterState state) =>
              const ComingSoonScreen(),
        ),
      ],
    );

    // Route notification taps (warm) and a cold-start tap to the mood screen.
    NotificationService.instance.initialize(
      onSelect: (String deepLink) => _router.go(deepLink),
    );
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final String? pending =
          NotificationService.instance.consumePendingDeepLink();
      if (pending != null) _router.go(pending);
    });
  }

  @override
  void dispose() {
    _state.dispose();
    _router.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider<AppState>.value(
      value: _state,
      child: Provider<HealthDeviceService>.value(
        value: _healthDevice,
        child: AnimatedBuilder(
          animation: _state,
          builder: (BuildContext context, Widget? _) {
            return TalkLocalization(
              language: _state.language,
              isRtl: _state.isRtl,
              child: MaterialApp.router(
                title: 'TalkEasy',
                debugShowCheckedModeBanner: false,
                theme: TalkTheme.light(),
                darkTheme: TalkTheme.dark(),
                themeMode: _state.themeMode,
                routerConfig: _router,
              ),
            );
          },
        ),
      ),
    );
  }
}
