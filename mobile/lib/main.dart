import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'services/health_device_service.dart';
import 'screens/splash_screen.dart';
import 'screens/login_screen.dart';
import 'screens/dashboard_screen.dart';

void main() {
  runApp(const TalkEasyApp());
}

class TalkEasyApp extends StatelessWidget {
  const TalkEasyApp({super.key});

  @override
  Widget build(BuildContext context) {
    // Create health device service (demo mode for v6.0)
    final healthDeviceService = HealthDeviceServiceFactory.createService(
      useDemo: true,
    );

    return MultiProvider(
      providers: [
        Provider<HealthDeviceService>.value(value: healthDeviceService),
      ],
      child: MaterialApp.router(
        title: 'TalkEasy',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(
            seedColor: const Color(0xFF0D9488), // Teal-600
            brightness: Brightness.light,
          ),
          useMaterial3: true,
          fontFamily: 'Inter',
        ),
        darkTheme: ThemeData(
          colorScheme: ColorScheme.fromSeed(
            seedColor: const Color(0xFF0D9488),
            brightness: Brightness.dark,
          ),
          useMaterial3: true,
          fontFamily: 'Inter',
        ),
        themeMode: ThemeMode.system,
        routerConfig: _router,
      ),
    );
  }
}

/// GoRouter configuration for TalkEasy Mobile
final _router = GoRouter(
  initialLocation: '/splash',
  routes: [
    GoRoute(
      path: '/splash',
      builder: (context, state) => const SplashScreen(),
    ),
    GoRoute(
      path: '/login',
      builder: (context, state) => const LoginScreen(),
    ),
    GoRoute(
      path: '/dashboard',
      builder: (context, state) => const DashboardScreen(),
    ),
    // Future routes to be implemented:
    // - /register
    // - /forgot-password
    // - /mood
    // - /habits
    // - /sleep
    // - /journal
    // - /water
    // - /stress
    // - /health
    // - /trends-30
    // - /trends-90
    // - /reports
    // - /find-help
    // - /resources
    // - /settings
    // - /privacy-policy
    // - /terms
    // - /cookie-policy
  ],
);
