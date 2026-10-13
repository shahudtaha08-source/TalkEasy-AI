import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../data/api_client.dart';
import '../data/app_state.dart';
import '../i18n/language.dart';
import '../theme/talk_colors.dart';
import '../widgets/talk_logo.dart';
import '../widgets/talk_widgets.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final TextEditingController _email = TextEditingController();
  final TextEditingController _password = TextEditingController();
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();

  bool _showPassword = false;
  bool _busy = false;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    setState(() => _busy = true);
    try {
      await context.read<AppState>().login(_email.text.trim(), _password.text);
      if (mounted) context.go('/dashboard');
    } on ApiException catch (e) {
      if (mounted) TalkToast.show(context, e.message, destructive: true);
    } catch (e) {
      if (mounted) TalkToast.show(context, e.toString(), destructive: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _continueDemo() {
    context.read<AppState>().setDemoMode(true);
    context.go('/dashboard');
  }

  Future<void> _forgotPassword() async {
    final TextEditingController email = TextEditingController(text: _email.text.trim());
    final bool? send = await showDialog<bool>(
      context: context,
      builder: (BuildContext ctx) => AlertDialog(
        title: const Text('Reset password'),
        content: TextField(
          controller: email,
          keyboardType: TextInputType.emailAddress,
          decoration: const InputDecoration(labelText: 'Account email'),
        ),
        actions: <Widget>[
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Send link')),
        ],
      ),
    );
    if (send != true || !mounted) return;
    try {
      await context.read<AppState>().requestPasswordReset(email.text.trim());
      if (mounted) {
        TalkToast.show(context, 'If that email exists, a reset link has been sent.');
      }
    } catch (_) {
      if (mounted) TalkToast.show(context, 'Could not request a reset link.', destructive: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final ThemeData theme = Theme.of(context);

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(TalkSpace.lg),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: TalkGlassCard(
                padding: const EdgeInsets.all(TalkSpace.lg),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: <Widget>[
                      const Center(child: TalkEasyLogo(size: 48)),
                      const SizedBox(height: TalkSpace.md),
                      Text(
                        context.t('appName'),
                        textAlign: TextAlign.center,
                        style: theme.textTheme.headlineSmall,
                      ),
                      const SizedBox(height: TalkSpace.lg),
                      TextFormField(
                        controller: _email,
                        keyboardType: TextInputType.emailAddress,
                        autofillHints: const <String>[AutofillHints.email],
                        decoration: const InputDecoration(labelText: 'Email'),
                        validator: (String? v) =>
                            (v == null || v.trim().isEmpty) ? 'Enter your email' : null,
                      ),
                      const SizedBox(height: TalkSpace.md),
                      TextFormField(
                        controller: _password,
                        obscureText: !_showPassword,
                        decoration: InputDecoration(
                          labelText: 'Password',
                          suffixIcon: IconButton(
                            tooltip: _showPassword ? 'Hide password' : 'Show password',
                            icon: Icon(_showPassword
                                ? Icons.visibility_off_outlined
                                : Icons.visibility_outlined),
                            onPressed: () => setState(() => _showPassword = !_showPassword),
                          ),
                        ),
                        validator: (String? v) =>
                            (v == null || v.isEmpty) ? 'Enter your password' : null,
                        onFieldSubmitted: (_) => _submit(),
                      ),
                      const SizedBox(height: TalkSpace.sm),
                      Align(
                        alignment: AlignmentDirectional.centerEnd,
                        child: TextButton(
                          onPressed: _busy ? null : _forgotPassword,
                          child: const Text('Forgot password?'),
                        ),
                      ),
                      const SizedBox(height: TalkSpace.sm),
                      FilledButton(
                        onPressed: _busy ? null : _submit,
                        style: FilledButton.styleFrom(
                          backgroundColor: TalkColors.primary,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                        ),
                        child: _busy
                            ? const SizedBox(
                                height: 18,
                                width: 18,
                                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                              )
                            : const Text('Log in'),
                      ),
                      const SizedBox(height: TalkSpace.md),
                      OutlinedButton.icon(
                        onPressed: _busy ? null : _continueDemo,
                        icon: const Icon(Icons.science_outlined, size: 18),
                        label: const Text('Continue in demo mode'),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
