import 'package:flutter/material.dart';

import '../theme/talk_colors.dart';
import '../theme/talk_theme.dart';

/// `Card` from `client/src/components/ui/card.tsx`:
/// `rounded-xl border bg-card border-card-border shadow-sm`.
class TalkCard extends StatelessWidget {
  const TalkCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(TalkSpace.md),
    this.onTap,
    this.color,
    this.borderColor,
    this.margin,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final VoidCallback? onTap;
  final Color? color;
  final Color? borderColor;
  final EdgeInsetsGeometry? margin;

  @override
  Widget build(BuildContext context) {
    final bool isDark = Theme.of(context).brightness == Brightness.dark;
    final Widget content = Padding(padding: padding, child: child);

    return Container(
      margin: margin,
      decoration: BoxDecoration(
        color: color ?? (isDark ? TalkColors.darkCard : TalkColors.card),
        borderRadius: TalkRadius.card,
        border: Border.all(
          color: borderColor ??
              (isDark ? TalkColors.darkCardBorder : TalkColors.cardBorder),
        ),
        boxShadow: <BoxShadow>[
          BoxShadow(
            color: isDark
                ? Colors.black.withValues(alpha: 0.35)
                : const Color(0xFF0F172A).withValues(alpha: 0.06),
            blurRadius: 3,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: onTap == null
          ? content
          : Material(
              type: MaterialType.transparency,
              child: InkWell(
                onTap: onTap,
                borderRadius: TalkRadius.card,
                child: content,
              ),
            ),
    );
  }
}

/// `glass-card` from `Layout.tsx` — used by the chat transcript.
class TalkGlassCard extends StatelessWidget {
  const TalkGlassCard({super.key, required this.child, this.padding});

  final Widget child;
  final EdgeInsetsGeometry? padding;

  @override
  Widget build(BuildContext context) {
    final bool isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      padding: padding ?? const EdgeInsets.all(TalkSpace.md),
      decoration: BoxDecoration(
        borderRadius: TalkRadius.authCard,
        color: (isDark ? const Color(0xFF11212A) : Colors.white)
            .withValues(alpha: 0.82),
        border: Border.all(
          color: isDark ? TalkColors.darkCardBorder : const Color(0xFFE2E8F0),
        ),
      ),
      child: child,
    );
  }
}

/// Small labelled statistic used across Dashboard, Health, Trends and Statistics.
class TalkStatTile extends StatelessWidget {
  const TalkStatTile({
    super.key,
    required this.label,
    required this.value,
    this.icon,
    this.color,
    this.caption,
  });

  final String label;
  final String value;
  final IconData? icon;
  final Color? color;
  final String? caption;

  @override
  Widget build(BuildContext context) {
    final ThemeData theme = Theme.of(context);
    final Color accent = color ?? TalkColors.primary;

    return TalkCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          Row(
            children: <Widget>[
              if (icon != null) ...<Widget>[
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: accent.withValues(alpha: 0.12),
                    borderRadius: TalkRadius.button,
                  ),
                  child: Icon(icon, size: 18, color: accent),
                ),
                const SizedBox(width: TalkSpace.sm),
              ],
              Expanded(
                child: Text(
                  label,
                  style: theme.textTheme.bodySmall,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: TalkSpace.sm),
          Text(
            value,
            style: theme.textTheme.headlineSmall,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          if (caption != null) ...<Widget>[
            const SizedBox(height: 2),
            Text(caption!, style: theme.textTheme.labelSmall),
          ],
        ],
      ),
    );
  }
}

/// A labelled row of "Demo" / informational chips, matching the amber badges the web
/// Health page renders for simulated wearable values.
class TalkBadge extends StatelessWidget {
  const TalkBadge({
    super.key,
    required this.label,
    this.color = TalkColors.warning,
    this.icon,
  });

  final String label;
  final Color color;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.14),
        borderRadius: TalkRadius.pill,
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          if (icon != null) ...<Widget>[
            Icon(icon, size: 11, color: color),
            const SizedBox(width: 3),
          ],
          Text(
            label,
            style: TextStyle(
              color: color,
              fontSize: 10,
              fontWeight: FontWeight.w700,
              fontFamily: TalkTheme.bodyFont,
            ),
          ),
        ],
      ),
    );
  }
}

/// Section heading used on every page: `text-2xl font-display font-bold`.
class TalkPageTitle extends StatelessWidget {
  const TalkPageTitle({
    super.key,
    required this.title,
    this.subtitle,
    this.trailing,
    this.icon,
    this.iconColor,
  });

  final String title;
  final String? subtitle;
  final Widget? trailing;
  final IconData? icon;
  final Color? iconColor;

  @override
  Widget build(BuildContext context) {
    final ThemeData theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: TalkSpace.md),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          if (icon != null) ...<Widget>[
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: (iconColor ?? TalkColors.primary).withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(18),
              ),
              child: Icon(icon,
                  size: 28, color: iconColor ?? TalkColors.primary),
            ),
            const SizedBox(width: TalkSpace.md),
          ],
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(title, style: theme.textTheme.headlineMedium),
                if (subtitle != null) ...<Widget>[
                  const SizedBox(height: 4),
                  Text(subtitle!, style: theme.textTheme.bodySmall),
                ],
              ],
            ),
          ),
          if (trailing != null) ...<Widget>[
            const SizedBox(width: TalkSpace.sm),
            trailing!,
          ],
        ],
      ),
    );
  }
}

/// `use-toast` — destructive and default variants.
class TalkToast {
  TalkToast._();

  static void show(
    BuildContext context,
    String message, {
    bool destructive = false,
  }) {
    final ScaffoldMessengerState messenger = ScaffoldMessenger.of(context);
    messenger.hideCurrentSnackBar();
    messenger.showSnackBar(
      SnackBar(
        duration: const Duration(seconds: 4),
        content: Row(
          children: <Widget>[
            Icon(
              destructive ? Icons.error_outline : Icons.check_circle_outline,
              size: 18,
              color: destructive ? const Color(0xFFFF8080) : const Color(0xFF7BE0C4),
            ),
            const SizedBox(width: TalkSpace.sm),
            Expanded(child: Text(message)),
          ],
        ),
        backgroundColor: destructive
            ? const Color(0xFF7F1D1D)
            : const Color(0xFF12352E),
      ),
    );
  }
}

/// Full-screen empty / error state.
class TalkEmptyState extends StatelessWidget {
  const TalkEmptyState({
    super.key,
    required this.icon,
    required this.title,
    this.message,
    this.action,
  });

  final IconData icon;
  final String title;
  final String? message;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    final ThemeData theme = Theme.of(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(TalkSpace.lg),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            Icon(icon, size: 40, color: TalkColors.primary),
            const SizedBox(height: TalkSpace.md),
            Text(
              title,
              style: theme.textTheme.titleMedium,
              textAlign: TextAlign.center,
            ),
            if (message != null) ...<Widget>[
              const SizedBox(height: TalkSpace.sm),
              Text(
                message!,
                style: theme.textTheme.bodySmall,
                textAlign: TextAlign.center,
              ),
            ],
            if (action != null) ...<Widget>[
              const SizedBox(height: TalkSpace.md),
              action!,
            ],
          ],
        ),
      ),
    );
  }
}

/// A progress ring used for mood intensity, habit completion and water goals.
class TalkProgressRing extends StatelessWidget {
  const TalkProgressRing({
    super.key,
    required this.value,
    required this.label,
    this.color = TalkColors.primary,
    this.size = 120,
    this.caption,
  });

  /// 0.0 – 1.0
  final double value;
  final String label;
  final Color color;
  final double size;
  final String? caption;

  @override
  Widget build(BuildContext context) {
    final ThemeData theme = Theme.of(context);
    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        alignment: Alignment.center,
        children: <Widget>[
          SizedBox.expand(
            child: CircularProgressIndicator(
              value: value.clamp(0, 1),
              strokeWidth: size * 0.09,
              backgroundColor: color.withValues(alpha: 0.15),
              color: color,
              strokeCap: StrokeCap.round,
            ),
          ),
          Column(
            mainAxisSize: MainAxisSize.min,
            children: <Widget>[
              Text(
                label,
                style: theme.textTheme.headlineSmall?.copyWith(color: color),
              ),
              if (caption != null)
                Text(caption!, style: theme.textTheme.labelSmall),
            ],
          ),
        ],
      ),
    );
  }
}

/// Horizontal bar list used by Statistics and the trends pages.
class TalkBarRow extends StatelessWidget {
  const TalkBarRow({
    super.key,
    required this.label,
    required this.value,
    required this.displayValue,
    this.color = TalkColors.primary,
  });

  final String label;
  final double value;
  final String displayValue;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final ThemeData theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Row(
            children: <Widget>[
              Expanded(child: Text(label, style: theme.textTheme.bodyMedium)),
              Text(
                displayValue,
                style: theme.textTheme.titleSmall?.copyWith(color: color),
              ),
            ],
          ),
          const SizedBox(height: 6),
          ClipRRect(
            borderRadius: TalkRadius.pill,
            child: LinearProgressIndicator(
              value: value.clamp(0, 1),
              minHeight: 8,
              backgroundColor: color.withValues(alpha: 0.12),
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

/// Wraps page content in the same max-width + padding rhythm as
/// `max-w-4xl mx-auto p-4 md:p-8`.
class TalkPageBody extends StatelessWidget {
  const TalkPageBody({super.key, required this.children, this.scrollable = true});

  final List<Widget> children;
  final bool scrollable;

  @override
  Widget build(BuildContext context) {
    final Widget column = Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: children,
    );

    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 820),
        child: scrollable
            ? SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(
                    TalkSpace.md, TalkSpace.md, TalkSpace.md, 96),
                child: column,
              )
            : Padding(
                padding: const EdgeInsets.all(TalkSpace.md),
                child: column,
              ),
      ),
    );
  }
}

/// Selectable pill input used for mood, stress level, journal type and filters.
class TalkChoiceChip extends StatelessWidget {
  const TalkChoiceChip({
    super.key,
    required this.label,
    required this.selected,
    required this.onTap,
    this.icon,
    this.background,
    this.border,
    this.selectedBorder,
    this.selectedColor,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;
  final String? icon;
  final Color? background;
  final Color? border;
  final Color? selectedBorder;
  final Color? selectedColor;

  @override
  Widget build(BuildContext context) {
    final ThemeData theme = Theme.of(context);
    final Color borderColor = selected
        ? (selectedBorder ?? TalkColors.primary)
        : (border ?? TalkColors.cardBorder);

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: TalkRadius.button,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
          decoration: BoxDecoration(
            color: selected
                ? (selectedColor ?? TalkColors.primary)
                : (background ?? Colors.transparent),
            borderRadius: TalkRadius.button,
            border: Border.all(color: borderColor, width: selected ? 1.5 : 1),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: <Widget>[
              if (icon != null) ...<Widget>[
                Text(icon!, style: const TextStyle(fontSize: 16)),
                const SizedBox(width: 6),
              ],
              Text(
                label,
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: selected ? Colors.white : theme.colorScheme.onSurface,
                  fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}