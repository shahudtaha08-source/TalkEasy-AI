import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../data/api_client.dart';
import '../data/app_state.dart';
import '../data/contact.dart';
import '../data/demo_store.dart';
import '../data/models.dart';
import '../data/mood_reminder.dart';
import '../i18n/language.dart';
import '../services/notification_service.dart';
import '../theme/talk_colors.dart';
import '../widgets/app_shell.dart';
import '../widgets/talk_widgets.dart';

const List<String> _influences = <String>[
  'Work',
  'Study',
  'Family',
  'Friends',
  'Health',
  'Sleep',
  'Money',
  'Relationships',
  'Exercise',
  'Weather',
  'Alone',
  'Other',
];

/// Mood Tracker. Mirrors the web `MoodTrackerEnhanced` + `useCreateMood`:
/// saves through `POST /api/moods` (which also mirrors into `mood_entries`) and
/// reads recent entries from `GET /api/mood-entries`.
class MoodScreen extends StatefulWidget {
  const MoodScreen({super.key});

  @override
  State<MoodScreen> createState() => _MoodScreenState();
}

class _MoodScreenState extends State<MoodScreen> {
  final TextEditingController _noteController = TextEditingController();

  List<MoodEntry> _entries = <MoodEntry>[];
  bool _loading = true;
  bool _saving = false;
  String? _error;

  String _mood = TalkMoodPalette.options.first;
  double _intensity = 5;
  final Set<String> _selectedInfluences = <String>{};

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  @override
  void dispose() {
    _noteController.dispose();
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
      final List<MoodEntry> entries;
      if (state.isDemo) {
        entries = state.demo.moodEntries();
      } else {
        final dynamic raw = await state.api.get(
          ApiPaths.moodEntries,
          query: <String, String>{'limit': '30'},
        );
        entries = raw is List
            ? raw
                .whereType<Map<String, dynamic>>()
                .map(MoodEntry.fromJson)
                .toList(growable: false)
            : <MoodEntry>[];
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

  Future<void> _save() async {
    final AppState state = context.read<AppState>();
    final String note = _noteController.text.trim();
    final int intensity = _intensity.round();
    final List<String> factors = _selectedInfluences.toList();
    setState(() => _saving = true);
    try {
      if (state.isDemo) {
        state.demo.createMoodEntry(
          mood: _mood,
          intensity: intensity,
          factors: factors,
          contextNote: note.isEmpty ? null : note,
          date: DemoStore.today(),
        );
      } else {
        await state.api.post(ApiPaths.moods, body: <String, dynamic>{
          'mood': _mood,
          'intensity': intensity,
          'factors': factors,
          'contextNote': note.isEmpty ? null : note,
          'date': DemoStore.today(),
        });
      }
      _noteController.clear();
      setState(() => _selectedInfluences.clear());
      await _load();

      // A saved check-in resets the reminder anchor. Persist it (so the next
      // app launch can re-schedule before any network call) and replace the
      // pending OS notification — never nudge sooner than 3h after a check-in.
      final DateTime savedAt = DateTime.now();
      await state.persistLastMoodCheckIn(savedAt);
      try {
        await NotificationService.instance
            .scheduleMoodReminder(lastCheckInAt: savedAt);
      } catch (_) {
        // Reminder scheduling is best-effort and must not fail the save.
      }

      if (!mounted) return;
      TalkToast.show(context, context.t('entrySaved'));
    } catch (e) {
      if (!mounted) return;
      TalkToast.show(context, e.toString(), destructive: true);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  /// Most recent *saved* check-in, used to derive the next reminder.
  DateTime? get _lastCheckInAt {
    DateTime? latest;
    for (final MoodEntry entry in _entries) {
      final String? raw = entry.createdAt;
      if (raw == null) continue;
      final DateTime? parsed = DateTime.tryParse(raw);
      if (parsed == null) continue;
      if (latest == null || parsed.isAfter(latest)) latest = parsed;
    }
    return latest;
  }

  String _formatCheckInTime(MoodEntry entry) {
    final String? raw = entry.createdAt;
    if (raw != null) {
      final DateTime? parsed = DateTime.tryParse(raw);
      if (parsed != null) {
        return DateFormat('MMM d, HH:mm').format(parsed.toLocal());
      }
    }
    return entry.date ?? '';
  }

  Future<void> _contactSupport() async {
    final bool opened = await openSupportEmail(subject: 'TalkEasy Support');
    if (!mounted || opened) return;
    await Clipboard.setData(const ClipboardData(text: kSupportEmail));
    if (!mounted) return;
    TalkToast.show(context, 'Support email copied: $kSupportEmail');
  }

  @override
  Widget build(BuildContext context) {
    final ThemeData theme = Theme.of(context);
    final DateTime now = DateTime.now();
    final DateTime? lastCheckIn = _lastCheckInAt;
    final DateTime nextReminder = computeNextMoodReminder(
      lastCheckInAt: lastCheckIn,
      now: now,
      quietHoursStart: '22:00',
      quietHoursEnd: '07:00',
    );
    final DateFormat timeFmt = DateFormat('EEE HH:mm');
    return AppShell(
      child: TalkPageBody(
        children: <Widget>[
          TalkPageTitle(
            icon: Icons.sentiment_satisfied_alt_rounded,
            title: context.t('moodTracker'),
            subtitle: context.t('moodTrackerSubtitle'),
          ),
          TalkCard(
            child: Row(
              children: <Widget>[
                const Icon(Icons.alarm_rounded),
                const SizedBox(width: TalkSpace.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      Text('Mood check-in every 3 hours',
                          style: theme.textTheme.titleSmall),
                      const SizedBox(height: 2),
                      Text(
                        lastCheckIn == null
                            ? 'No check-ins saved yet — the first reminder starts now.'
                            : 'Last saved ${timeFmt.format(lastCheckIn.toLocal())}',
                        style: theme.textTheme.bodySmall,
                      ),
                      Text('Next reminder ~ ${timeFmt.format(nextReminder.toLocal())}',
                          style: theme.textTheme.bodySmall),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: TalkSpace.md),
          TalkCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(context.t('feelingText'),
                    style: theme.textTheme.titleMedium),
                const SizedBox(height: TalkSpace.sm),
                Wrap(
                  spacing: TalkSpace.sm,
                  runSpacing: TalkSpace.sm,
                  children: <Widget>[
                    for (final String mood in TalkMoodPalette.options)
                      TalkChoiceChip(
                        label: '${TalkMoodPalette.emoji[mood] ?? ''} $mood',
                        selected: _mood == mood,
                        selectedColor: TalkMoodPalette.of(mood),
                        selectedBorder: TalkMoodPalette.of(mood),
                        onTap: () => setState(() => _mood = mood),
                      ),
                  ],
                ),
                const SizedBox(height: TalkSpace.md),
                Row(
                  children: <Widget>[
                    Text('Intensity', style: theme.textTheme.titleSmall),
                    const Spacer(),
                    Text('${_intensity.round()}/10',
                        style: theme.textTheme.bodyMedium),
                  ],
                ),
                Slider(
                  value: _intensity,
                  min: 1,
                  max: 10,
                  divisions: 9,
                  label: '${_intensity.round()}',
                  onChanged: (double value) =>
                      setState(() => _intensity = value),
                ),
                const SizedBox(height: TalkSpace.sm),
                Text('What influenced this?',
                    style: theme.textTheme.titleSmall),
                const SizedBox(height: TalkSpace.sm),
                Wrap(
                  spacing: TalkSpace.sm,
                  runSpacing: TalkSpace.sm,
                  children: <Widget>[
                    for (final String influence in _influences)
                      TalkChoiceChip(
                        label: influence,
                        selected: _selectedInfluences.contains(influence),
                        onTap: () => setState(() {
                          if (!_selectedInfluences.remove(influence)) {
                            _selectedInfluences.add(influence);
                          }
                        }),
                      ),
                  ],
                ),
                const SizedBox(height: TalkSpace.md),
                TextField(
                  controller: _noteController,
                  maxLines: 3,
                  decoration: InputDecoration(
                    labelText: context.t('anyThoughtsLabel'),
                    hintText: context.t('thoughtsPlaceholder'),
                    border: const OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: TalkSpace.md),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton.icon(
                    onPressed: _saving ? null : _save,
                    icon: _saving
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.check_rounded),
                    label: Text(context.t('saveMood')),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: TalkSpace.lg),
          Text(context.t('recentMoods'), style: theme.textTheme.titleMedium),
          const SizedBox(height: TalkSpace.sm),
          if (_loading)
            const Padding(
              padding: EdgeInsets.all(TalkSpace.lg),
              child: Center(child: CircularProgressIndicator()),
            )
          else if (_error != null)
            TalkEmptyState(
              icon: Icons.cloud_off_rounded,
              title: 'Could not load moods',
              message: _error,
              action: TextButton(
                onPressed: _load,
                child: const Text('Retry'),
              ),
            )
          else if (_entries.isEmpty)
            const TalkEmptyState(
              icon: Icons.sentiment_neutral_rounded,
              title: 'No moods logged yet',
              message: 'Your saved moods will appear here.',
            )
          else
            for (final MoodEntry entry in _entries) ...<Widget>[
              TalkCard(
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Text(
                      TalkMoodPalette.emoji[entry.mood ?? ''] ?? '🙂',
                      style: const TextStyle(fontSize: 28),
                    ),
                    const SizedBox(width: TalkSpace.md),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: <Widget>[
                          Text(
                            '${entry.mood ?? 'Mood'}'
                            '${entry.intensity != null ? ' · ${entry.intensity}/10' : ''}',
                            style: theme.textTheme.titleSmall,
                          ),
                          if ((entry.factors ?? const <String>[]).isNotEmpty)
                            Text(entry.factors!.join(', '),
                                style: theme.textTheme.bodySmall),
                          if ((entry.contextNote ?? '').isNotEmpty)
                            Text(entry.contextNote!,
                                style: theme.textTheme.bodySmall),
                        ],
                      ),
                    ),
                    Text(_formatCheckInTime(entry), style: theme.textTheme.labelSmall),
                  ],
                ),
              ),
              const SizedBox(height: TalkSpace.sm),
            ],
          const SizedBox(height: TalkSpace.lg),
          TalkCard(
            child: Row(
              children: <Widget>[
                const Icon(Icons.support_agent_rounded),
                const SizedBox(width: TalkSpace.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      Text('Need help?', style: theme.textTheme.titleSmall),
                      const SizedBox(height: 2),
                      Text(kSupportEmail, style: theme.textTheme.bodySmall),
                    ],
                  ),
                ),
                TextButton(
                  onPressed: _contactSupport,
                  child: const Text('Email support'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
