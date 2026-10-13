import 'package:flutter/material.dart';

import '../widgets/app_shell.dart';
import '../widgets/talk_widgets.dart';

/// Placeholder for any destination not yet built in the mobile app. Keeps the
/// router from throwing a "no match" error when a nav item is tapped.
class ComingSoonScreen extends StatelessWidget {
  const ComingSoonScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const AppShell(
      child: TalkPageBody(
        scrollable: false,
        children: <Widget>[
          TalkEmptyState(
            icon: Icons.construction_rounded,
            title: 'Coming soon',
            message:
                'This section is not yet available in the mobile app. Use the '
                'TalkEasy web app for it in the meantime.',
          ),
        ],
      ),
    );
  }
}