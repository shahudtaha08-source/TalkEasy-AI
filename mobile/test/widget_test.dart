// Basic smoke test for the TalkEasy mobile app.
//
// Verifies the app widget builds without throwing. Network calls made during
// bootstrap are expected to fail in the test environment and are handled by
// AppState, so the app still renders its MaterialApp shell.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:talkeasy_mobile/main.dart';

void main() {
  testWidgets('app boots and renders a MaterialApp', (WidgetTester tester) async {
    SharedPreferences.setMockInitialValues(<String, Object>{});
    final SharedPreferences prefs = await SharedPreferences.getInstance();

    await tester.pumpWidget(TalkEasyApp(prefs: prefs));
    await tester.pump();

    expect(find.byType(MaterialApp), findsOneWidget);
  });
}
