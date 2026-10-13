import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../data/app_state.dart';
import '../theme/talk_colors.dart';
import '../widgets/talk_logo.dart';

/// Shown while [AppState.bootstrap] runs. Navigation is handled by the router's
/// redirect, so this screen only reflects loading / error state.
class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final AppState state = context.watch<AppState>();

    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.surface,
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            const TalkEasyLogo(size: 64),
            const SizedBox(height: 24),
            if (state.error != null)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 32),
                child: Text(
                  state.error!,
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: TalkColors.destructive),
                ),
              )
            else
              const CircularProgressIndicator(color: TalkColors.primary),
          ],
        ),
      ),
    );
  }
}
