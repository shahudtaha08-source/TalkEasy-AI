import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../data/api_client.dart';
import '../data/app_state.dart';
import '../data/demo_store.dart';
import '../data/models.dart';
import '../theme/talk_colors.dart';
import '../widgets/app_shell.dart';
import '../widgets/talk_widgets.dart';

/// Water Intake. `GET/POST /api/water-entries` + `DELETE /api/water-entries/:id`,
/// the same endpoints the web `WaterIntake` page uses.
class WaterScreen extends StatefulWidget {
  const WaterScreen({super.key});

  @override
  State<WaterScreen> createState() => _WaterScreenState();
}

class _WaterScreenState extends State<WaterScreen> {
  static const List<int> _quickAdds = <int>[250, 500, 750];

  List<WaterEntry> _entries = <WaterEntry>[];
  bool _loading = true;
  bool _busy = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    final AppState state = context.read<AppState>();
    if (mounted) {
      setState(() {
        _loading = true;
        _error = null;
      });
    }
    try {
      final List<WaterEntry> entries;
      if (state.isDemo) {
        entries = state.demo.waterEntries(date: DemoStore.today());
      } else {
        final dynamic raw = await state.api.get(
          ApiPaths.waterEntries,
          query: <String, String>{'date': DemoStore.today()},
        );
        entries = raw is List
            ? raw
                .whereType<Map<String, dynamic>>()
                .map(WaterEntry.fromJson)
                .toList(growable: false)
            : <WaterEntry>[];
      }
      if (!mounted) return;
      setState(() {
        _entries = entries;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  Future<void> _add(int amountMl) async {
    final AppState state = context.read<AppState>();
    setState(() => _busy = true);
    try {
      if (state.isDemo) {
        state.demo.addWater(amountMl, date: DemoStore.today());
      } else {
        await state.api.post(ApiPaths.waterEntries, body: <String, dynamic>{
          'amountMl': amountMl,
          'date': DemoStore.today(),
        });
      }
      await _load();
    } catch (e) {
      if (!mounted) return;
      TalkToast.show(context, e.toString(), destructive: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _delete(WaterEntry entry) async {
    if (entry.id == null) return;
    final AppState state = context.read<AppState>();
    setState(() => _busy = true);
    try {
      if (state.isDemo) {
        state.demo.deleteWater(entry.id!);
      } else {
        await state.api.delete(ApiPaths.waterEntry(entry.id!));
      }
      await _load();
    } catch (e) {
      if (!mounted) return;
      TalkToast.show(context, e.toString(), destructive: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final ThemeData theme = Theme.of(context);
    final AppState state = context.watch<AppState>();
    final int goal = state.user?.waterTargetMl ?? 2500;
    final int total = _entries.fold<int>(
      0,
      (int sum, WaterEntry e) => sum + (e.amountMl ?? 0),
    );

    return AppShell(
      child: TalkPageBody(
        children: <Widget>[
          const TalkPageTitle(
            icon: Icons.water_drop_outlined,
            title: 'Water Intake',
            subtitle: 'Track your daily hydration',
            iconColor: TalkColors.softBlue,
          ),
          TalkCard(
            child: Column(
              children: <Widget>[
                TalkProgressRing(
                  value: goal == 0 ? 0 : total / goal,
                  label: '$total',
                  caption: 'of $goal ml',
                  color: const Color(0xFF0EA5E9),
                  size: 150,
                ),
                const SizedBox(height: TalkSpace.md),
                Wrap(
                  alignment: WrapAlignment.center,
                  spacing: TalkSpace.sm,
                  runSpacing: TalkSpace.sm,
                  children: <Widget>[
                    for (final int amount in _quickAdds)
                      FilledButton.tonal(
                        onPressed: _busy ? null : () => _add(amount),
                        child: Text('+$amount ml'),
                      ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: TalkSpace.lg),
          Text("Today's entries", style: theme.textTheme.titleMedium),
          const SizedBox(height: TalkSpace.sm),
          if (_loading)
            const Padding(
              padding: EdgeInsets.all(TalkSpace.lg),
              child: Center(child: CircularProgressIndicator()),
            )
          else if (_error != null)
            TalkEmptyState(
              icon: Icons.cloud_off_rounded,
              title: 'Could not load water entries',
              message: _error,
              action: TextButton(onPressed: _load, child: const Text('Retry')),
            )
          else if (_entries.isEmpty)
            const TalkEmptyState(
              icon: Icons.local_drink_outlined,
              title: 'No water logged today',
              message: 'Add a glass above to start tracking.',
            )
          else
            for (final WaterEntry entry in _entries) ...<Widget>[
              TalkCard(
                padding: const EdgeInsets.symmetric(
                    horizontal: TalkSpace.md, vertical: TalkSpace.sm),
                child: Row(
                  children: <Widget>[
                    const Icon(Icons.local_drink_outlined,
                        color: Color(0xFF0EA5E9)),
                    const SizedBox(width: TalkSpace.md),
                    Expanded(
                      child: Text('${entry.amountMl ?? 0} ml',
                          style: theme.textTheme.titleSmall),
                    ),
                    IconButton(
                      tooltip: 'Delete',
                      onPressed: _busy ? null : () => _delete(entry),
                      icon: const Icon(Icons.delete_outline_rounded,
                          color: TalkColors.destructive),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: TalkSpace.sm),
            ],
        ],
      ),
    );
  }
}
