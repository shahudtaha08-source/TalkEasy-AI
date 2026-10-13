import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../data/api_client.dart';
import '../data/app_state.dart';
import '../data/models.dart';
import '../i18n/language.dart';
import '../theme/talk_colors.dart';
import '../widgets/app_shell.dart';
import '../widgets/talk_widgets.dart';

/// Phone-based exercise & activity tracking (v6.2.0).
///
/// This screen is honest about what it can and cannot do:
///   • It runs a timer and accepts manual input — no fabricated sensor values.
///   • Camera-based rep counting is *not* implemented and is stated as such.
///   • Calories are always labelled as a MET-based estimate, never a measurement.
///   • Sessions are saved through `POST /api/workouts`, which re-validates and
///     recomputes the canonical calorie estimate server-side.
class ExerciseScreen extends StatefulWidget {
  const ExerciseScreen({super.key});

  @override
  State<ExerciseScreen> createState() => _ExerciseScreenState();
}

class _ExerciseScreenState extends State<ExerciseScreen> {
  static const List<String> _categories = <String>[
    'strength',
    'cardio',
    'mobility',
    'sport',
    'mind_body',
  ];

  final TextEditingController _sets = TextEditingController();
  final TextEditingController _distance = TextEditingController();
  final TextEditingController _weight = TextEditingController();

  String _category = 'strength';
  late ExerciseActivity _activity = _activitiesFor(_category).first;

  Timer? _timer;
  bool _running = false;
  Duration _elapsed = Duration.zero;
  int _reps = 0;
  DateTime? _startedAt;

  List<WorkoutSession> _history = <WorkoutSession>[];
  bool _loadingHistory = true;
  bool _saving = false;

  static List<ExerciseActivity> _activitiesFor(String category) =>
      kExerciseCatalog.where((ExerciseActivity a) => a.category == category).toList(growable: false);

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadHistory());
  }

  @override
  void dispose() {
    _timer?.cancel();
    _sets.dispose();
    _distance.dispose();
    _weight.dispose();
    super.dispose();
  }

  Future<void> _loadHistory() async {
    final AppState state = context.read<AppState>();
    if (mounted) setState(() => _loadingHistory = true);
    try {
      final List<WorkoutSession> sessions;
      if (state.isDemo) {
        sessions = state.demo.workouts();
      } else {
        final dynamic raw = await state.api.get(ApiPaths.workouts,
            query: <String, String>{'limit': '30'});
        sessions = raw is List
            ? raw
                .whereType<Map<String, dynamic>>()
                .map(WorkoutSession.fromJson)
                .toList(growable: false)
            : <WorkoutSession>[];
      }
      if (!mounted) return;
      setState(() {
        _history = sessions;
        _loadingHistory = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _loadingHistory = false);
    }
  }

  void _selectCategory(String category) {
    if (category == _category) return;
    setState(() {
      _category = category;
      _activity = _activitiesFor(category).first;
      _resetSession();
    });
  }

  void _selectActivity(ExerciseActivity activity) {
    setState(() {
      _activity = activity;
      _resetSession();
    });
  }

  void _resetSession() {
    _timer?.cancel();
    _timer = null;
    _running = false;
    _elapsed = Duration.zero;
    _reps = 0;
    _startedAt = null;
    _sets.clear();
    _distance.clear();
  }

  void _startOrResume() {
    if (_running) return;
    _startedAt ??= DateTime.now();
    setState(() => _running = true);
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) return;
      setState(() => _elapsed += const Duration(seconds: 1));
    });
  }

  void _pause() {
    _timer?.cancel();
    _timer = null;
    setState(() => _running = false);
  }

  void _addRep() {
    if (!_activity.tracksReps) return;
    setState(() => _reps += 1);
  }

  double? _parseDouble(TextEditingController c) {
    final String t = c.text.trim();
    if (t.isEmpty) return null;
    return double.tryParse(t);
  }

  Future<void> _save() async {
    if (_elapsed.inSeconds <= 0) {
      TalkToast.show(context, 'Start the timer before saving.', destructive: true);
      return;
    }
    final AppState state = context.read<AppState>();
    final double? weightKg = _parseDouble(_weight);
    final CalorieEstimate? estimate = estimateWorkoutCalories(
      activity: _activity,
      durationSeconds: _elapsed.inSeconds,
      weightKg: weightKg,
    );
    final int? sets = _parseDouble(_sets)?.round();
    final double? distance = _activity.tracksDistance ? _parseDouble(_distance) : null;

    setState(() => _saving = true);
    try {
      if (state.isDemo) {
        state.demo.createWorkout(
          activityId: _activity.id,
          category: _activity.category,
          source: 'manual',
          startedAt: (_startedAt ?? DateTime.now()).toIso8601String(),
          durationSeconds: _elapsed.inSeconds,
          repetitions: _activity.tracksReps ? _reps : null,
          sets: sets,
          distanceMeters: distance,
          weightKg: weightKg,
          caloriesKcal: estimate?.kcal,
          weightAssumed: estimate?.weightAssumed ?? false,
          met: _activity.met,
        );
      } else {
        await state.api.post(ApiPaths.workouts, body: <String, dynamic>{
          'activityId': _activity.id,
          'category': _activity.category,
          'source': 'manual',
          'startedAt': (_startedAt ?? DateTime.now()).toIso8601String(),
          'durationSeconds': _elapsed.inSeconds,
          if (_activity.tracksReps) 'repetitions': _reps,
          if (sets != null) 'sets': sets,
          if (distance != null) 'distanceMeters': distance,
          if (weightKg != null) 'weightKg': weightKg,
        });
      }
      if (!mounted) return;
      TalkToast.show(context, context.t('exerciseSaved'));
      setState(_resetSession);
      await _loadHistory();
    } catch (e) {
      if (!mounted) return;
      TalkToast.show(context, '${context.t('exerciseSaveFailed')}: $e',
          destructive: true);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  String _formatDuration(Duration d) {
    final int h = d.inHours;
    final int m = d.inMinutes.remainder(60);
    final int s = d.inSeconds.remainder(60);
    String two(int v) => v.toString().padLeft(2, '0');
    return h > 0 ? '${two(h)}:${two(m)}:${two(s)}' : '${two(m)}:${two(s)}';
  }

  @override
  Widget build(BuildContext context) {
    final ThemeData theme = Theme.of(context);
    final double? weightKg = _parseDouble(_weight);
    final CalorieEstimate? estimate = estimateWorkoutCalories(
      activity: _activity,
      durationSeconds: _elapsed.inSeconds,
      weightKg: weightKg,
    );

    return AppShell(
      child: TalkPageBody(
        children: <Widget>[
          TalkPageTitle(
            icon: Icons.fitness_center_rounded,
            title: context.t('exerciseTitle'),
            subtitle: context.t('exerciseSubtitle'),
          ),
          _notice(
            theme,
            Icons.no_photography_outlined,
            context.t('exerciseCameraDeferred'),
          ),
          const SizedBox(height: TalkSpace.sm),
          _notice(
            theme,
            Icons.sensors_off_outlined,
            context.t('exerciseSensorNotice'),
          ),
          const SizedBox(height: TalkSpace.md),
          TalkCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(context.t('exerciseSelectActivity'),
                    style: theme.textTheme.titleMedium),
                const SizedBox(height: TalkSpace.sm),
                Wrap(
                  spacing: TalkSpace.sm,
                  runSpacing: TalkSpace.sm,
                  children: <Widget>[
                    for (final String c in _categories)
                      TalkChoiceChip(
                        label: context.t(exerciseCategoryLabelKey(c)),
                        selected: _category == c,
                        onTap: () => _selectCategory(c),
                      ),
                  ],
                ),
                const SizedBox(height: TalkSpace.md),
                Wrap(
                  spacing: TalkSpace.sm,
                  runSpacing: TalkSpace.sm,
                  children: <Widget>[
                    for (final ExerciseActivity a in _activitiesFor(_category))
                      TalkChoiceChip(
                        label: context.t(a.name),
                        selected: _activity.id == a.id,
                        onTap: () => _selectActivity(a),
                      ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: TalkSpace.md),
          TalkCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Row(
                  children: <Widget>[
                    Expanded(
                      child: TalkStatTile(
                        label: context.t('exerciseElapsed'),
                        value: _formatDuration(_elapsed),
                        icon: Icons.timer_outlined,
                      ),
                    ),
                    if (_activity.tracksReps) ...<Widget>[
                      const SizedBox(width: TalkSpace.sm),
                      Expanded(
                        child: TalkStatTile(
                          label: context.t('exerciseReps'),
                          value: '$_reps',
                          icon: Icons.repeat_rounded,
                          color: TalkColors.success,
                        ),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: TalkSpace.md),
                Row(
                  children: <Widget>[
                    Expanded(
                      child: FilledButton.icon(
                        onPressed: _saving ? null : (_running ? _pause : _startOrResume),
                        icon: Icon(_running
                            ? Icons.pause_rounded
                            : Icons.play_arrow_rounded),
                        label: Text(context.t(_running
                            ? 'exercisePause'
                            : (_elapsed > Duration.zero
                                ? 'exerciseResume'
                                : 'exerciseStart'))),
                      ),
                    ),
                    if (_activity.tracksReps) ...<Widget>[
                      const SizedBox(width: TalkSpace.sm),
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: _addRep,
                          icon: const Icon(Icons.add_rounded),
                          label: Text(context.t('exerciseAddRep')),
                        ),
                      ),
                    ],
                  ],
                ),
                if (_activity.tracksReps) ...<Widget>[
                  const SizedBox(height: TalkSpace.sm),
                  Text(context.t('exerciseManualNotice'),
                      style: theme.textTheme.labelSmall),
                ],
                const SizedBox(height: TalkSpace.md),
                Row(
                  children: <Widget>[
                    if (_activity.tracking.contains('sets')) ...<Widget>[
                      Expanded(
                        child: TextField(
                          controller: _sets,
                          keyboardType: TextInputType.number,
                          decoration: InputDecoration(
                            labelText: context.t('exerciseSets'),
                            border: const OutlineInputBorder(),
                          ),
                        ),
                      ),
                      const SizedBox(width: TalkSpace.sm),
                    ],
                    if (_activity.tracksDistance) ...<Widget>[
                      Expanded(
                        child: TextField(
                          controller: _distance,
                          keyboardType: const TextInputType.numberWithOptions(decimal: true),
                          decoration: InputDecoration(
                            labelText: context.t('exerciseDistance'),
                            border: const OutlineInputBorder(),
                          ),
                        ),
                      ),
                      const SizedBox(width: TalkSpace.sm),
                    ],
                    Expanded(
                      child: TextField(
                        controller: _weight,
                        keyboardType: const TextInputType.numberWithOptions(decimal: true),
                        onChanged: (_) => setState(() {}),
                        decoration: InputDecoration(
                          labelText: context.t('exerciseBodyWeight'),
                          border: const OutlineInputBorder(),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: TalkSpace.md),
          TalkCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(context.t('exerciseCalorieEstimate'),
                    style: theme.textTheme.titleMedium),
                const SizedBox(height: TalkSpace.sm),
                Text(
                  estimate == null ? '—' : '${estimate.kcal} kcal',
                  style: theme.textTheme.headlineSmall,
                ),
                const SizedBox(height: 2),
                Text(context.t('exerciseCalorieAssumption'),
                    style: theme.textTheme.labelSmall),
                if (estimate?.weightAssumed == true) ...<Widget>[
                  const SizedBox(height: 2),
                  Text(context.t('exerciseWeightAssumed'),
                      style: theme.textTheme.labelSmall),
                ],
                const SizedBox(height: TalkSpace.md),
                Row(
                  children: <Widget>[
                    Expanded(
                      child: FilledButton.icon(
                        onPressed: _saving ? null : _save,
                        icon: const Icon(Icons.save_outlined),
                        label: Text(context.t('exerciseFinish')),
                      ),
                    ),
                    const SizedBox(width: TalkSpace.sm),
                    OutlinedButton(
                      onPressed: _saving ? null : () => setState(_resetSession),
                      child: Text(context.t('exerciseDiscard')),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: TalkSpace.lg),
          Text(context.t('exerciseHistory'), style: theme.textTheme.titleMedium),
          const SizedBox(height: TalkSpace.sm),
          if (_loadingHistory)
            const Padding(
              padding: EdgeInsets.all(TalkSpace.lg),
              child: Center(child: CircularProgressIndicator()),
            )
          else if (_history.isEmpty)
            TalkEmptyState(
              icon: Icons.fitness_center_rounded,
              title: context.t('exerciseNoHistory'),
              message: context.t('exerciseSubtitle'),
            )
          else
            for (final WorkoutSession s in _history) ...<Widget>[
              TalkCard(
                child: Row(
                  children: <Widget>[
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: <Widget>[
                          Text(_activityName(s),
                              style: theme.textTheme.bodyLarge
                                  ?.copyWith(fontWeight: FontWeight.w600)),
                          const SizedBox(height: 2),
                          Text(
                            _sessionCaption(s),
                            style: theme.textTheme.labelSmall,
                          ),
                        ],
                      ),
                    ),
                    Text(_formatDuration(Duration(seconds: s.durationSeconds ?? 0)),
                        style: theme.textTheme.bodyMedium),
                  ],
                ),
              ),
              const SizedBox(height: TalkSpace.sm),
            ],
        ],
      ),
    );
  }

  Widget _notice(ThemeData theme, IconData icon, String text) {
    return Container(
      padding: const EdgeInsets.symmetric(
          horizontal: TalkSpace.md, vertical: TalkSpace.sm),
      decoration: BoxDecoration(
        color: TalkColors.warning.withValues(alpha: 0.10),
        borderRadius: TalkRadius.card,
        border: Border.all(color: TalkColors.warning.withValues(alpha: 0.35)),
      ),
      child: Row(
        children: <Widget>[
          Icon(icon, size: 16, color: TalkColors.warning),
          const SizedBox(width: TalkSpace.sm),
          Expanded(child: Text(text, style: theme.textTheme.labelSmall)),
        ],
      ),
    );
  }

  String _activityName(WorkoutSession s) {
    final ExerciseActivity? a = exerciseActivityById(s.activityId);
    return a != null ? context.t(a.name) : (s.activityId ?? 'Activity');
  }

  String _sessionCaption(WorkoutSession s) {
    final List<String> parts = <String>[];
    if ((s.repetitions ?? 0) > 0) parts.add('${s.repetitions} reps');
    if (s.caloriesKcal != null) parts.add('~${s.caloriesKcal} kcal (est.)');
    if (s.source != null) parts.add(s.source!);
    return parts.isEmpty ? (s.date ?? '') : parts.join(' · ');
  }
}
