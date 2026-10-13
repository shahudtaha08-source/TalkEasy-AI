import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../data/api_client.dart';
import '../data/app_state.dart';
import '../data/demo_store.dart';
import '../data/models.dart';
import '../i18n/language.dart';
import '../theme/talk_colors.dart';
import '../widgets/app_shell.dart';
import '../widgets/talk_widgets.dart';

/// Habit Builder. Writes through the same endpoints as `use-habits.ts`:
/// `GET/POST /api/habits` and `PATCH /api/habits/:id`.
class HabitsScreen extends StatefulWidget {
  const HabitsScreen({super.key});

  @override
  State<HabitsScreen> createState() => _HabitsScreenState();
}

class _HabitsScreenState extends State<HabitsScreen> {
  final TextEditingController _controller = TextEditingController();

  List<Habit> _habits = <Habit>[];
  bool _loading = true;
  bool _busy = false;
  String? _error;

  static const List<String> _suggestionKeys = <String>[
    'sleepHabit',
    'waterHabit',
    'exerciseHabit',
    'meditationHabit',
    'journalHabit',
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
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
      final List<Habit> habits;
      if (state.isDemo) {
        habits = state.demo.habits(date: DemoStore.today());
      } else {
        final dynamic raw = await state.api.get(
          ApiPaths.habits,
          query: <String, String>{'date': DemoStore.today()},
        );
        habits = raw is List
            ? raw
                .whereType<Map<String, dynamic>>()
                .map(Habit.fromJson)
                .toList(growable: false)
            : <Habit>[];
      }
      if (!mounted) return;
      setState(() {
        _habits = habits;
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

  Future<void> _addHabit(String type) async {
    final String value = type.trim();
    if (value.isEmpty) return;
    final AppState state = context.read<AppState>();
    setState(() => _busy = true);
    try {
      if (state.isDemo) {
        state.demo.createHabit(value, date: DemoStore.today());
      } else {
        await state.api.post(ApiPaths.habits, body: <String, dynamic>{
          'type': value,
          'completed': false,
          'completionPercentage': 0,
          'date': DemoStore.today(),
        });
      }
      _controller.clear();
      await _load();
    } catch (e) {
      if (!mounted) return;
      TalkToast.show(context, e.toString(), destructive: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _toggle(Habit habit) async {
    if (habit.id == null) return;
    final AppState state = context.read<AppState>();
    final bool completed = !(habit.completed ?? false);
    final int percentage = completed ? 100 : 0;
    setState(() {
      _habits = _habits
          .map((Habit h) => h.id == habit.id
              ? h.copyWith(
                  completed: completed, completionPercentage: percentage)
              : h)
          .toList(growable: false);
    });
    try {
      if (state.isDemo) {
        state.demo.updateHabit(
          habit.id!,
          completed: completed,
          completionPercentage: percentage,
        );
      } else {
        await state.api.patch(
          ApiPaths.habit(habit.id!),
          body: <String, dynamic>{
            'completed': completed,
            'completionPercentage': percentage,
          },
        );
      }
    } catch (e) {
      if (!mounted) return;
      TalkToast.show(context, e.toString(), destructive: true);
      await _load();
    }
  }

  @override
  Widget build(BuildContext context) {
    final ThemeData theme = Theme.of(context);
    final int total = _habits.length;
    final int done = _habits.where((Habit h) => h.completed == true).length;

    return AppShell(
      child: TalkPageBody(
        children: <Widget>[
          TalkPageTitle(
            icon: Icons.check_circle_outline_rounded,
            title: context.t('habitTrackerTitle'),
            subtitle: context.t('habitTrackerSubtitle'),
          ),
          TalkCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  total == 0
                      ? context.t('noHabitsToday')
                      : '${context.t('progress')}: $done/$total',
                  style: theme.textTheme.titleMedium,
                ),
                const SizedBox(height: TalkSpace.sm),
                TalkBarRow(
                  label: context.t('completionRate'),
                  value: total == 0 ? 0 : done / total,
                  displayValue: total == 0
                      ? '0%'
                      : '${((done / total) * 100).round()}%',
                ),
                const SizedBox(height: TalkSpace.md),
                Row(
                  children: <Widget>[
                    Expanded(
                      child: TextField(
                        controller: _controller,
                        textInputAction: TextInputAction.done,
                        onSubmitted: (String value) => _addHabit(value),
                        decoration: InputDecoration(
                          hintText: context.t('customHabitPlaceholder'),
                          border: const OutlineInputBorder(),
                        ),
                      ),
                    ),
                    const SizedBox(width: TalkSpace.sm),
                    FilledButton(
                      onPressed: _busy
                          ? null
                          : () => _addHabit(_controller.text),
                      child: Text(context.t('addHabit')),
                    ),
                  ],
                ),
                const SizedBox(height: TalkSpace.sm),
                Wrap(
                  spacing: TalkSpace.sm,
                  runSpacing: TalkSpace.sm,
                  children: <Widget>[
                    for (final String key in _suggestionKeys)
                      ActionChip(
                        label: Text(context.t(key)),
                        onPressed:
                            _busy ? null : () => _addHabit(context.t(key)),
                      ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: TalkSpace.lg),
          if (_loading)
            const Padding(
              padding: EdgeInsets.all(TalkSpace.lg),
              child: Center(child: CircularProgressIndicator()),
            )
          else if (_error != null)
            TalkEmptyState(
              icon: Icons.cloud_off_rounded,
              title: 'Could not load habits',
              message: _error,
              action: TextButton(onPressed: _load, child: const Text('Retry')),
            )
          else if (_habits.isEmpty)
            const TalkEmptyState(
              icon: Icons.playlist_add_check_rounded,
              title: 'No habits tracked today',
              message: 'Add a habit above to start building your routine.',
            )
          else
            for (final Habit habit in _habits) ...<Widget>[
              TalkCard(
                padding: const EdgeInsets.symmetric(
                    horizontal: TalkSpace.sm, vertical: 4),
                child: CheckboxListTile(
                  value: habit.completed ?? false,
                  onChanged: (_) => _toggle(habit),
                  title: Text(habit.type ?? 'Habit'),
                  subtitle: habit.notes?.isNotEmpty == true
                      ? Text(habit.notes!)
                      : null,
                  controlAffinity: ListTileControlAffinity.leading,
                  contentPadding: EdgeInsets.zero,
                  activeColor: TalkColors.success,
                ),
              ),
              const SizedBox(height: TalkSpace.sm),
            ],
        ],
      ),
    );
  }
}
