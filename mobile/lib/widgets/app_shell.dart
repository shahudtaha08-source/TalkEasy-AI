import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../data/app_state.dart';
import '../i18n/language.dart';
import '../theme/talk_colors.dart';
import 'talk_logo.dart';
import 'talk_widgets.dart';

/// One entry in [TalkNav.items].
class TalkNavItem {
  const TalkNavItem({
    required this.href,
    required this.labelKey,
    required this.icon,
    this.label,
  });

  final String href;

  /// Key into `translations.ts`. Null for labels the web app hard-codes in English.
  final String? labelKey;
  final String? label;
  final IconData icon;

  String labelFor(BuildContext context) =>
      labelKey != null ? context.t(labelKey!) : (label ?? href);
}

/// Navigation registry, in the exact order of `Sidebar.tsx`.
class TalkNav {
  TalkNav._();

  /// The single source of truth for the sidebar, drawer and bottom bar.
  static const List<TalkNavItem> items = <TalkNavItem>[
    TalkNavItem(href: '/dashboard', labelKey: 'dashboard', icon: Icons.home_rounded),
    TalkNavItem(href: '/chat', labelKey: 'supportChat', icon: Icons.chat_bubble_outline_rounded),
    TalkNavItem(href: '/mood-enhanced', label: 'Mood Tracker', icon: Icons.sentiment_satisfied_alt_rounded),
    TalkNavItem(href: '/habits', labelKey: 'habits', icon: Icons.check_circle_outline_rounded),
    TalkNavItem(href: '/sleep', label: 'Sleep Tracker', icon: Icons.nightlight_round),
    TalkNavItem(href: '/water', label: 'Water Intake', icon: Icons.water_drop_outlined),
    TalkNavItem(href: '/stress', label: 'Stress Tracker', icon: Icons.psychology_alt_outlined),
    TalkNavItem(href: '/health', label: 'Health Dashboard', icon: Icons.monitor_heart_outlined),
    TalkNavItem(href: '/trends-30', label: '30-Day Trends', icon: Icons.trending_up_rounded),
    TalkNavItem(href: '/trends-90', label: '90-Day Trends', icon: Icons.trending_up_rounded),
    TalkNavItem(href: '/reports', label: 'Reports', icon: Icons.description_outlined),
    TalkNavItem(href: '/journal', labelKey: 'journal', icon: Icons.menu_book_outlined),
    TalkNavItem(href: '/statistics', labelKey: 'statistics', icon: Icons.pie_chart_outline_rounded),
    TalkNavItem(href: '/history', labelKey: 'emotionalHistory', icon: Icons.history_rounded),
    TalkNavItem(href: '/resources', labelKey: 'resources', icon: Icons.auto_stories_outlined),
    TalkNavItem(href: '/help', labelKey: 'findHelp', icon: Icons.favorite_border_rounded),
    TalkNavItem(href: '/settings', labelKey: 'settings', icon: Icons.settings_outlined),
  ];

  /// Shown on the phone bottom bar. Same destinations, subset of the sidebar.
  static const List<String> bottomBarHrefs = <String>[
    '/dashboard',
    '/chat',
    '/mood-enhanced',
    '/habits',
    '/settings',
  ];

  static List<TalkNavItem> get bottomBarItems => items
      .where((TalkNavItem i) => bottomBarHrefs.contains(i.href))
      .toList(growable: false);

  /// `isActive` in `Sidebar.tsx`: exact match, or a prefix match except for /dashboard.
  static bool isActive(String location, String href) {
    if (location == href) return true;
    if (href == '/dashboard') return false;
    return location.startsWith(href);
  }
}

/// Protected shell mirroring `Layout.tsx`: brand header, language selector, nav list,
/// disclaimer, demo banner and the user footer with logout.
class AppShell extends StatelessWidget {
  const AppShell({super.key, required this.child});

  final Widget child;

  static const double breakpointWide = 900;
  static const double breakpointCompact = 600;

  @override
  Widget build(BuildContext context) {
    final double width = MediaQuery.sizeOf(context).width;
    final bool wide = width >= breakpointWide;
    final bool compact = width < breakpointCompact;

    final Widget content = _MainArea(child: child, compact: compact);

    return Scaffold(
      drawer: wide ? null : const _NavDrawer(),
      appBar: wide
          ? null
          : AppBar(
              leading: Builder(
                builder: (BuildContext ctx) => IconButton(
                  icon: const Icon(Icons.menu_rounded),
                  tooltip: 'Menu',
                  onPressed: Scaffold.of(ctx).openDrawer,
                ),
              ),
              titleSpacing: 0,
              title: const TalkEasyLogo(size: 30),
            ),
      body: wide
          ? Row(
              children: <Widget>[
                const _NavRail(),
                Expanded(child: content),
              ],
            )
          : content,
      bottomNavigationBar: compact ? const _BottomBar() : null,
    );
  }
}

class _MainArea extends StatelessWidget {
  const _MainArea({required this.child, required this.compact});

  final Widget child;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    return TalkAgeStyle.forContext(
      context,
      MediaQuery.withClampedTextScaling(
        minScaleFactor: 1.0,
        maxScaleFactor: 1.3,
        child: child,
      ),
    );
  }
}

/// Permanent sidebar for tablet/desktop widths.
class _NavRail extends StatelessWidget {
  const _NavRail();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 256,
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        border: Border(
          right: BorderSide(
            color: Theme.of(context).dividerColor.withValues(alpha: 0.6),
          ),
        ),
      ),
      child: const _SidebarContents(),
    );
  }
}

/// Drawer for phone and small-tablet widths.
class _NavDrawer extends StatelessWidget {
  const _NavDrawer();

  @override
  Widget build(BuildContext context) {
    return Drawer(
      child: TalkAgeStyle.forContext(
        context,
        const SafeArea(child: _SidebarContents()),
      ),
    );
  }
}

class _SidebarContents extends StatelessWidget {
  const _SidebarContents();

  @override
  Widget build(BuildContext context) {
    final AppState state = context.watch<AppState>();
    final String location = GoRouterState.of(context).uri.path;
    final ThemeData theme = Theme.of(context);

    return Column(
      children: <Widget>[
        Padding(
          padding: const EdgeInsets.fromLTRB(24, 24, 16, 16),
          child: Align(
            alignment: AlignmentDirectional.centerStart,
            child: InkWell(
              onTap: () {
                Navigator.of(context).pop();
                context.go('/dashboard');
              },
              borderRadius: TalkRadius.button,
              child: const TalkEasyLogo(size: 34),
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
          child: _LanguageSelector(language: state.language),
        ),
        Expanded(
          child: ListView(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            children: <Widget>[
              for (final TalkNavItem item in TalkNav.items)
                _NavLink(
                  item: item,
                  active: TalkNav.isActive(location, item.href),
                  onTap: () {
                    Navigator.of(context).maybePop();
                    if (location != item.href) context.go(item.href);
                  },
                ),
            ],
          ),
        ),
        Container(
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 10),
          decoration: BoxDecoration(
            border: Border(
              top: BorderSide(
                color: theme.dividerColor.withValues(alpha: 0.6),
              ),
            ),
          ),
          child: Text(
            context.t('disclaimerText'),
            style: theme.textTheme.labelSmall?.copyWith(fontSize: 10),
          ),
        ),
        if (state.isDemo)
          Container(
            margin: const EdgeInsets.fromLTRB(16, 0, 16, 8),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: const Color(0xFFFEF3C7).withValues(alpha: 0.7),
              borderRadius: TalkRadius.card,
              border: Border.all(color: const Color(0xFFFDE68A)),
            ),
            child: Row(
              children: <Widget>[
                const Icon(Icons.science_outlined,
                    size: 16, color: TalkColors.warning),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    context.t('demoMode'),
                    style: theme.textTheme.labelMedium
                        ?.copyWith(color: const Color(0xFFB45309)),
                  ),
                ),
                Text(
                  'ends ${_formatDate(state.demoExpiry)}',
                  style: theme.textTheme.labelSmall
                      ?.copyWith(fontSize: 9, color: const Color(0xFFB45309)),
                ),
              ],
            ),
          ),
        _UserFooter(inDemo: state.isDemo),
      ],
    );
  }

  static String _formatDate(DateTime date) =>
      '${date.day}/${date.month}/${date.year}';
}

class _NavLink extends StatelessWidget {
  const _NavLink({
    required this.item,
    required this.active,
    required this.onTap,
  });

  final TalkNavItem item;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final ThemeData theme = Theme.of(context);
    final bool isDark = theme.brightness == Brightness.dark;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: TalkRadius.card,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: active
                  ? (isDark
                      ? TalkColors.primary.withValues(alpha: 0.18)
                      : const Color(0xFFE6F7F4))
                  : Colors.transparent,
              borderRadius: TalkRadius.card,
            ),
            child: Row(
              children: <Widget>[
                Icon(
                  item.icon,
                  size: 20,
                  color: active
                      ? (isDark ? const Color(0xFF5EEAD4) : TalkColors.primary)
                      : theme.colorScheme.onSurfaceVariant,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    item.labelFor(context),
                    style: theme.textTheme.bodyMedium?.copyWith(
                      fontWeight: active ? FontWeight.w600 : FontWeight.w400,
                      color: active
                          ? (isDark ? const Color(0xFF5EEAD4) : TalkColors.primaryBorder)
                          : theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _LanguageSelector extends StatelessWidget {
  const _LanguageSelector({required this.language});

  final String language;

  @override
  Widget build(BuildContext context) {
    final ThemeData theme = Theme.of(context);
    final bool isDark = theme.brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF16252B) : const Color(0xFFF1F5F9),
        borderRadius: TalkRadius.card,
        border: Border.all(
          color: isDark ? TalkColors.darkBorder : const Color(0xFFE2E8F0),
        ),
      ),
      child: Row(
        children: <Widget>[
          const Icon(Icons.public, size: 16, color: TalkColors.primary),
          const SizedBox(width: 8),
          Expanded(
            child: DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                value: language,
                isExpanded: true,
                isDense: true,
                icon: const Icon(Icons.expand_more, size: 18),
                style: theme.textTheme.labelMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: isDark ? TalkColors.darkForeground : TalkColors.foreground,
                ),
                items: <DropdownMenuItem<String>>[
                  for (final String code in context.languages)
                    DropdownMenuItem<String>(value: code, child: Text(code)),
                ],
                onChanged: (String? value) {
                  if (value != null) context.read<AppState>().setLanguage(value);
                },
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _UserFooter extends StatelessWidget {
  const _UserFooter({required this.inDemo});

  final bool inDemo;

  @override
  Widget build(BuildContext context) {
    final AppState state = context.watch<AppState>();
    final ThemeData theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border(
          top: BorderSide(
            color: theme.dividerColor.withValues(alpha: 0.6),
          ),
        ),
      ),
      child: Column(
        children: <Widget>[
          Row(
            children: <Widget>[
              CircleAvatar(
                radius: 16,
                backgroundColor:
                    theme.brightness == Brightness.dark
                        ? const Color(0xFF123A36)
                        : const Color(0xFFCCFBF1),
                child: Text(
                  inDemo ? 'D' : (state.user?.initials ?? 'U'),
                  style: theme.textTheme.labelMedium?.copyWith(
                    color: theme.brightness == Brightness.dark
                        ? const Color(0xFF5EEAD4)
                        : TalkColors.primaryBorder,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  state.user?.firstName ??
                      (inDemo ? 'Demo User' : 'User'),
                  style: theme.textTheme.bodyMedium
                      ?.copyWith(fontWeight: FontWeight.w500),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          SizedBox(
            width: double.infinity,
            child: TextButton.icon(
              onPressed: () => _handleLeave(context, state, inDemo),
              style: TextButton.styleFrom(
                foregroundColor: inDemo ? TalkColors.warning : TalkColors.destructive,
                alignment: AlignmentDirectional.centerStart,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              ),
              icon: Icon(
                inDemo ? Icons.science_outlined : Icons.logout_rounded,
                size: 18,
              ),
              label: Text(context.t(inDemo ? 'exitDemo' : 'logout')),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _handleLeave(
    BuildContext context,
    AppState state,
    bool inDemo,
  ) async {
    if (inDemo) {
      state.setDemoMode(false);
    } else {
      await state.logout();
    }
    if (context.mounted) context.go('/');
  }
}

/// Phone bottom bar. Mirrors the sidebar's top destinations rather than inventing
/// a new information architecture.
class _BottomBar extends StatelessWidget {
  const _BottomBar();

  @override
  Widget build(BuildContext context) {
    final String location = GoRouterState.of(context).uri.path;

    return NavigationBar(
      selectedIndex: TalkNav.bottomBarHrefs.indexOf(location).clamp(0, 4),
      onDestinationSelected: (int index) =>
          context.go(TalkNav.bottomBarHrefs[index]),
      destinations: <Widget>[
        for (final TalkNavItem item in TalkNav.bottomBarItems)
          NavigationDestination(
            icon: Icon(item.icon),
            selectedIcon: Icon(item.icon, color: TalkColors.primary),
            label: item.labelFor(context),
          ),
      ],
    );
  }
}