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

/// Sleep Tracker. `GET/POST /api/sleep-entries` with the same
/// `{ nightSleep, nap, totalSleep, date }` payload as the web client.
class SleepScreen extends StatefulWidget {
  const SleepScreen({super.key});

  @override
  State<SleepScreen> createState() => _SleepScreenState();
}

class _SleepScreenState extends State<SleepScreen> {
  List<SleepEntry> _entries = <SleepEntry>[];
  bool _loading = true;
  bool _saving = false;
  String? _error;

  double _night = 7;
  double _nap = 0;

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
      final List<SleepEntry> entries;
      if (state.isDemo) {
        entries = state.demo.sleepEntries();
      } else {
        final dynamic raw = await state.api.get(ApiPaths.sleepEntries);
        entries = raw is List
            ? raw
                .whereType<Map<String, dynamic>>()
                .map(SleepEntry.fromJson)
                .toList(growable: false)
            : <SleepEntry>[];
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
    final int night = _night.round();
    final int nap = _nap.round();
    final int total = night + nap;
    setState(() => _saving = true);
    try {
      if (state.isDemo) {
        state.demo.saveSleep(
          nightSleep: night,
          nap: nap,
          totalSleep: total,
          date: DemoStore.today(),
        );
      } else {
        await state.api.post(ApiPaths.sleepEntries, body: <String, dynamic>{
          'nightSleep': night,
          'nap': nap,
          'totalSleep': total,
          'date': DemoStore.today(),
        });
      }
      await _load();
      if (!mounted) return;
      TalkToast.show(context, context.t('entrySaved'));
    } catch (e) {
      if (!mounted) return;
      TalkToast.show(context, e.toString(), destructive: true);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final ThemeData theme = Theme.of(context);
    final int total = _night.round() + _nap.round();

    return AppShell(
      child: TalkPageBody(
        children: <Widget>[
          const TalkPageTitle(
            icon: Icons.nightlight_round,
            title: 'Sleep Tracker',
            subtitle: 'Log your sleep and track your rest patterns',
          ),
          TalkCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text('Last night', style: theme.textTheme.titleMedium),
                const SizedBox(height: TalkSpace.sm),
                _SliderRow(
                  label: 'Night sleep',
                  value: _night,
                  max: 14,
                  suffix: '${_night.round()} h',
                  onChanged: (double v) => setState(() => _night = v),
                ),
                _SliderRow(
                  label: 'Nap',
                  value: _nap,
                  max: 6,
                  suffix: '${_nap.round()} h',
                  onChanged: (double v) => setState(() => _nap = v),
                ),
                const SizedBox(height: TalkSpace.sm),
                Row(
                  children: <Widget>[
                    const Icon(Icons.bedtime_rounded,
                        size: 18, color: TalkColors.softBlue),
                    const SizedBox(width: TalkSpace.sm),
                    Text('Total: $total h',
                        style: theme.textTheme.titleSmall),
                  ],
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
                    label: const Text('Save sleep'),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: TalkSpace.lg),
          Text('Recent nights', style: theme.textTheme.titleMedium),
          const SizedBox(height: TalkSpace.sm),
          if (_loading)
            const Padding(
              padding: EdgeInsets.all(TalkSpace.lg),
              child: Center(child: CircularProgressIndicator()),
            )
          else if (_error != null)
            TalkEmptyState(
              icon: Icons.cloud_off_rounded,
              title: 'Could not load sleep entries',
              message: _error,
              action: TextButton(onPressed: _load, child: const Text('Retry')),
            )
          else if (_entries.isEmpty)
            const TalkEmptyState(
              icon: Icons.bedtime_off_rounded,
              title: 'No sleep logged yet',
              message: 'Your saved nights will appear here.',
            )
          else
            for (final SleepEntry entry in _entries) ...<Widget>[
              TalkCard(
                child: Row(
                  children: <Widget>[
                    const Icon(Icons.nights_stay_rounded,
                        color: TalkColors.softBlue),
                    const SizedBox(width: TalkSpace.md),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: <Widget>[
                          Text('${entry.totalSleep ?? 0} h total',
                              style: theme.textTheme.titleSmall),
                          Text(
                            'Night ${entry.nightSleep ?? 0} h · Nap ${entry.nap ?? 0} h',
                            style: theme.textTheme.bodySmall,
                          ),
                        ],
                      ),
                    ),
                    Text(entry.date ?? '', style: theme.textTheme.labelSmall),
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

class _SliderRow extends StatelessWidget {
  const _SliderRow({
    required this.label,
    required this.value,
    required this.max,
    required this.suffix,
    required this.onChanged,
  });

  final String label;
  final double value;
  final double max;
  final String suffix;
  final ValueChanged<double> onChanged;

  @override
  Widget build(BuildContext context) {
    final ThemeData theme = Theme.of(context);
    return Row(
      children: <Widget>[
        SizedBox(
          width: 90,
          child: Text(label, style: theme.textTheme.bodyMedium),
        ),
        Expanded(
          child: Slider(
            value: value,
            min: 0,
            max: max,
            divisions: max.round(),
            label: suffix,
            onChanged: onChanged,
          ),
        ),
        SizedBox(
          width: 48,
          child: Text(suffix,
              textAlign: TextAlign.end, style: theme.textTheme.bodyMedium),
        ),
      ],
    );
  }
}
