import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../data/app_state.dart';
import '../i18n/language.dart';
import '../theme/talk_colors.dart';
import '../widgets/app_shell.dart';
import '../widgets/talk_widgets.dart';

/// First authenticated screen. Wrapped in [AppShell] so navigation matches the web
/// sidebar. Data-heavy sections (mood, trends) are added as their own screens later.
class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final AppState state = context.watch<AppState>();
    final String name = state.user?.firstName?.trim().isNotEmpty == true
        ? state.user!.firstName!.trim()
        : (state.user?.displayName ?? 'there');

    return AppShell(
      child: TalkPageBody(
        children: <Widget>[
          TalkPageTitle(
            icon: Icons.home_rounded,
            title: 'Hello, $name',
            subtitle: 'Your TalkEasy wellness companion',
            trailing: state.isDemo
                ? const TalkBadge(label: 'DEMO', icon: Icons.science_outlined)
                : null,
          ),
          const SizedBox(height: TalkSpace.md),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: TalkSpace.md,
            crossAxisSpacing: TalkSpace.md,
            childAspectRatio: 1.5,
            children: <Widget>[
              _QuickTile(
                label: context.t('moodTracker'),
                icon: Icons.sentiment_satisfied_alt_rounded,
                color: TalkColors.primary,
                onTap: () => context.go('/mood-enhanced'),
              ),
              _QuickTile(
                label: context.t('habits'),
                icon: Icons.check_circle_outline_rounded,
                color: TalkColors.success,
                onTap: () => context.go('/habits'),
              ),
              _QuickTile(
                label: 'Sleep',
                icon: Icons.nightlight_round,
                color: TalkColors.softBlue,
                onTap: () => context.go('/sleep'),
              ),
              _QuickTile(
                label: 'Water',
                icon: Icons.water_drop_outlined,
                color: TalkColors.softBlue,
                onTap: () => context.go('/water'),
              ),
            ],
          ),
          const SizedBox(height: TalkSpace.lg),
          TalkCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text('Wellness Insights',

                    style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: TalkSpace.xs),
                Text(
                  'Daily, weekly, 30- and 90-day insights are available in the app.',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                const SizedBox(height: TalkSpace.sm),
                Text(
                  'Wearable device data is only shown when a device is actually connected or measurements are imported.',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _QuickTile extends StatelessWidget {
  const _QuickTile({
    required this.label,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return TalkCard(
      onTap: onTap,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Icon(icon, color: color, size: 24),
          const SizedBox(height: TalkSpace.sm),
          Text(label, style: Theme.of(context).textTheme.titleSmall),
        ],
      ),
    );
  }
}
