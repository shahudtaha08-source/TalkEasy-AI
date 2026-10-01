/// Health Device Service - Abstract interface for wearable device integration
/// 
/// This provides a clean abstraction layer for future wearable integration.
/// In v6.0, we use DemoHealthDeviceService with simulated data.
/// Future v6.5/v7.0 will implement BluetoothHealthDeviceService for real devices.

abstract class HealthDeviceService {
  /// Connection status
  bool get isConnected;
  
  /// Connect to the device
  Future<bool> connect();
  
  /// Disconnect from the device
  Future<void> disconnect();
  
  /// Get current heart rate (BPM)
  /// Returns null if not available or device not connected
  Future<int?> getHeartRate();
  
  /// Get current SpO2 percentage
  /// Returns null if not available or device not connected
  Future<int?> getSpO2();
  
  /// Get current blood pressure
  /// Returns null if not available or device not connected
  Future<Map<String, int>?> getBloodPressure();
  
  /// Get ECG status/reading
  /// Returns null if not available or device not connected
  Future<String?> getECG();
  
  /// Get sleep data
  /// Returns null if not available or device not connected
  Future<Map<String, dynamic>?> getSleep();
  
  /// Get step count
  /// Returns null if not available or device not connected
  Future<int?> getSteps();
  
  /// Get device battery status
  /// Returns null if not available or device not connected
  Future<int?> getBatteryStatus();
  
  /// Stream of real-time heart rate updates
  Stream<int?> getHeartRateStream();
  
  /// Stream of real-time SpO2 updates
  Stream<int?> getSpO2Stream();
  
  /// Stream of real-time step updates
  Stream<int?> getStepsStream();
}

/// Demo Health Device Service - Simulated data for v6.0
/// 
/// This service provides demo/simulated health data for UI demonstration.
/// All data is clearly labelled as demo in the UI.
class DemoHealthDeviceService implements HealthDeviceService {
  bool _isConnected = false;
  
  @override
  bool get isConnected => _isConnected;
  
  @override
  Future<bool> connect() async {
    // Simulate connection delay
    await Future.delayed(const Duration(seconds: 1));
    _isConnected = true;
    return true;
  }
  
  @override
  Future<void> disconnect() async {
    _isConnected = false;
  }
  
  @override
  Future<int?> getHeartRate() async {
    if (!_isConnected) return null;
    // Simulate heart rate between 60-100 BPM
    return 60 + (DateTime.now().millisecond % 41);
  }
  
  @override
  Future<int?> getSpO2() async {
    if (!_isConnected) return null;
    // Simulate SpO2 between 95-100%
    return 95 + (DateTime.now().millisecond % 6);
  }
  
  @override
  Future<Map<String, int>?> getBloodPressure() async {
    if (!_isConnected) return null;
    // Simulate BP: systolic 110-140, diastolic 70-90
    return {
      'systolic': 110 + (DateTime.now().millisecond % 31),
      'diastolic': 70 + (DateTime.now().millisecond % 21),
    };
  }
  
  @override
  Future<String?> getECG() async {
    if (!_isConnected) return null;
    // Simulate ECG status
    return 'Normal sinus rhythm (demo)';
  }
  
  @override
  Future<Map<String, dynamic>?> getSleep() async {
    if (!_isConnected) return null;
    // Simulate sleep data
    return {
      'nightSleep': 7 * 60, // 7 hours in minutes
      'nap': 30, // 30 minutes
      'totalSleep': 7.5 * 60, // 7.5 hours in minutes
      'deepSleep': 2 * 60, // 2 hours
      'remSleep': 1.5 * 60, // 1.5 hours
    };
  }
  
  @override
  Future<int?> getSteps() async {
    if (!_isConnected) return null;
    // Simulate steps between 5000-10000
    return 5000 + (DateTime.now().millisecond % 5001);
  }
  
  @override
  Future<int?> getBatteryStatus() async {
    if (!_isConnected) return null;
    // Simulate battery between 20-100%
    return 20 + (DateTime.now().millisecond % 81);
  }
  
  @override
  Stream<int?> getHeartRateStream() async* {
    while (_isConnected) {
      await Future.delayed(const Duration(seconds: 1));
      yield await getHeartRate();
    }
  }
  
  @override
  Stream<int?> getSpO2Stream() async* {
    while (_isConnected) {
      await Future.delayed(const Duration(seconds: 2));
      yield await getSpO2();
    }
  }
  
  @override
  Stream<int?> getStepsStream() async* {
    while (_isConnected) {
      await Future.delayed(const Duration(seconds: 5));
      yield await getSteps();
    }
  }
}

/// Bluetooth Health Device Service - Future implementation for v6.5/v7.0
/// 
/// This will implement real Bluetooth Low Energy (BLE) communication
/// with smartwatches and smart bands.
/// 
/// Planned features:
/// - BLE device scanning and pairing
/// - Real-time data streaming
/// - Battery level monitoring
/// - Connection state management
/// - Error handling and reconnection logic
/// 
/// Note: This is NOT implemented in v6.0.
class BluetoothHealthDeviceService implements HealthDeviceService {
  @override
  bool get isConnected => false;
  
  @override
  Future<bool> connect() async {
    throw UnimplementedError(
      'Bluetooth device integration is planned for v6.5/v7.0. '
      'Use DemoHealthDeviceService for v6.0.'
    );
  }
  
  @override
  Future<void> disconnect() async {
    throw UnimplementedError(
      'Bluetooth device integration is planned for v6.5/v7.0.'
    );
  }
  
  @override
  Future<int?> getHeartRate() async {
    throw UnimplementedError(
      'Bluetooth device integration is planned for v6.5/v7.0.'
    );
  }
  
  @override
  Future<int?> getSpO2() async {
    throw UnimplementedError(
      'Bluetooth device integration is planned for v6.5/v7.0.'
    );
  }
  
  @override
  Future<Map<String, int>?> getBloodPressure() async {
    throw UnimplementedError(
      'Bluetooth device integration is planned for v6.5/v7.0.'
    );
  }
  
  @override
  Future<String?> getECG() async {
    throw UnimplementedError(
      'Bluetooth device integration is planned for v6.5/v7.0.'
    );
  }
  
  @override
  Future<Map<String, dynamic>?> getSleep() async {
    throw UnimplementedError(
      'Bluetooth device integration is planned for v6.5/v7.0.'
    );
  }
  
  @override
  Future<int?> getSteps() async {
    throw UnimplementedError(
      'Bluetooth device integration is planned for v6.5/v7.0.'
    );
  }
  
  @override
  Future<int?> getBatteryStatus() async {
    throw UnimplementedError(
      'Bluetooth device integration is planned for v6.5/v7.0.'
    );
  }
  
  @override
  Stream<int?> getHeartRateStream() async* {
    throw UnimplementedError(
      'Bluetooth device integration is planned for v6.5/v7.0.'
    );
  }
  
  @override
  Stream<int?> getSpO2Stream() async* {
    throw UnimplementedError(
      'Bluetooth device integration is planned for v6.5/v7.0.'
    );
  }
  
  @override
  Stream<int?> getStepsStream() async* {
    throw UnimplementedError(
      'Bluetooth device integration is planned for v6.5/v7.0.'
    );
  }
}

/// Factory to create the appropriate health device service
class HealthDeviceServiceFactory {
  /// Create a health device service based on the type
  static HealthDeviceService createService({
    required bool useDemo,
  }) {
    if (useDemo) {
      return DemoHealthDeviceService();
    } else {
      // In v6.0, we always use demo
      // Future v6.5/v7.0 will return BluetoothHealthDeviceService
      return DemoHealthDeviceService();
    }
  }
}
