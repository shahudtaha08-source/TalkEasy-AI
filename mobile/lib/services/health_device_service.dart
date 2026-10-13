/// Wearable/device abstraction for TalkEasy Mobile.
///
/// IMPORTANT: no real device integration ships yet. The default service is
/// [DisconnectedHealthDeviceService], which reports no device and returns no
/// readings. TalkEasy does not invent measurements. A real implementation
/// (Health Connect / HealthKit / vendor SDK) must implement [HealthDeviceService]
/// and return only measurements that were actually received from a device.
library;

/// A single device measurement, tagged with its true source.
class HealthMeasurement {
  const HealthMeasurement({
    required this.metric,
    required this.value,
    required this.recordedAt,
    this.valueSecondary,
    this.unit,
    required this.source,
    this.isDemo = false,
  });

  final String metric; // heart_rate | spo2 | steps | blood_pressure | ecg | sleep_duration
  final num? value;
  final num? valueSecondary;
  final String? unit;
  final DateTime recordedAt;
  final String source; // manual_import | health_connect | apple_health | demo
  final bool isDemo;
}

abstract class HealthDeviceService {
  /// Whether a device is currently connected/authorised.
  bool get isConnected;

  /// Human-readable device name, or null when not connected.
  String? get deviceName;

  /// Readings available since [since]. Never fabricates data.
  Future<List<HealthMeasurement>> fetchMeasurements({DateTime? since});
}

/// Default implementation: nothing connected, nothing returned.
class DisconnectedHealthDeviceService implements HealthDeviceService {
  const DisconnectedHealthDeviceService();

  @override
  bool get isConnected => false;

  @override
  String? get deviceName => null;

  @override
  Future<List<HealthMeasurement>> fetchMeasurements({DateTime? since}) async =>
      const <HealthMeasurement>[];
}

/// Clearly-labelled sample data for exploring the interface. Every returned row
/// carries `isDemo: true` and `source: 'demo'` so it can never be mistaken for a
/// real measurement.
class DemoHealthDeviceService implements HealthDeviceService {
  const DemoHealthDeviceService();

  @override
  bool get isConnected => true;

  @override
  String? get deviceName => 'Demo device (sample data)';

  @override
  Future<List<HealthMeasurement>> fetchMeasurements({DateTime? since}) async {
    final DateTime now = DateTime.now();
    return <HealthMeasurement>[
      HealthMeasurement(
        metric: 'heart_rate',
        value: 72,
        unit: 'bpm',
        recordedAt: now,
        source: 'demo',
        isDemo: true,
      ),
      HealthMeasurement(
        metric: 'steps',
        value: 6800,
        unit: 'steps',
        recordedAt: now,
        source: 'demo',
        isDemo: true,
      ),
    ];
  }
}

class HealthDeviceServiceFactory {
  HealthDeviceServiceFactory._();

  /// `useDemo` chooses sample data. Otherwise no device is assumed connected.
  static HealthDeviceService createService({required bool useDemo}) =>
      useDemo
          ? const DemoHealthDeviceService()
          : const DisconnectedHealthDeviceService();
}
