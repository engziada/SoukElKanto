import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/auth/auth_provider.dart';
import '../../core/auth/token_storage.dart';
import '../../core/i18n/l10n_helper.dart';
import '../../core/theme/app_colors.dart';
import '../../shared/widgets/loading_indicator.dart';

/// OTP verification screen — enter the 6-digit code sent via SMS.
class OtpScreen extends ConsumerStatefulWidget {
  const OtpScreen({super.key});

  @override
  ConsumerState<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends ConsumerState<OtpScreen> {
  final _codeController = TextEditingController();
  bool _submitting = false;
  int _resendCountdown = 0;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _startResendCountdown();
  }

  @override
  void dispose() {
    _codeController.dispose();
    _timer?.cancel();
    super.dispose();
  }

  void _startResendCountdown() {
    setState(() => _resendCountdown = 30);
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      setState(() {
        _resendCountdown--;
        if (_resendCountdown <= 0) {
          timer.cancel();
        }
      });
    });
  }

  Future<void> _verify() async {
    final code = _codeController.text.trim();
    if (code.length != 6) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(context.l10n.authErrorInvalidCode),
          backgroundColor: AppColors.coral,
        ),
      );
      return;
    }

    setState(() => _submitting = true);

    final phone = await TokenStorage.getPhone();
    if (phone == null) {
      if (mounted) context.go('/login');
      return;
    }

    final success =
        await ref.read(authProvider.notifier).verifyOtp(phone, code);

    if (mounted) {
      setState(() => _submitting = false);
      if (success) {
        context.go('/');
      } else {
        final authState = ref.read(authProvider);
        if (authState is AuthError) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(authState.message),
              backgroundColor: AppColors.coral,
            ),
          );
        }
      }
    }
  }

  Future<void> _resend() async {
    final phone = await TokenStorage.getPhone();
    if (phone == null) {
      if (mounted) context.go('/login');
      return;
    }

    await ref.read(authProvider.notifier).resendOtp(phone);
    if (mounted) {
      _startResendCountdown();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(context.l10n.authResentSuccess),
          backgroundColor: AppColors.mint,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l = context.l10n;

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/login'),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: ConstrainedBox(
            constraints: BoxConstraints(
              minHeight: MediaQuery.of(context).size.height -
                  MediaQuery.of(context).padding.top -
                  MediaQuery.of(context).padding.bottom -
                  kToolbarHeight,
            ),
            child: IntrinsicHeight(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Icon
                  const Icon(
                    Icons.lock_outline,
                    size: 64,
                    color: AppColors.coral,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    l.authVerifyTitle,
                    textAlign: TextAlign.center,
                    style: theme.textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    l.authVerifySubtitle(''),
                    textAlign: TextAlign.center,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: AppColors.slateSmoke,
                    ),
                  ),
                  const SizedBox(height: 32),
                  // OTP input
                  TextFormField(
                    controller: _codeController,
                    keyboardType: TextInputType.number,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 24,
                      letterSpacing: 8,
                      fontWeight: FontWeight.w700,
                    ),
                    maxLength: 6,
                    decoration: InputDecoration(
                      hintText: '------',
                      counterText: '',
                      border: const OutlineInputBorder(
                        borderRadius: BorderRadius.all(Radius.circular(12)),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(
                          color: AppColors.coral,
                          width: 2,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  // Verify button
                  FilledButton(
                    onPressed: _submitting ? null : _verify,
                    style: FilledButton.styleFrom(
                      backgroundColor: AppColors.coral,
                      foregroundColor: AppColors.warmWhite,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: _submitting
                        ? const LoadingIndicator()
                        : Text(
                            l.authVerify,
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                  ),
                  const SizedBox(height: 16),
                  // Resend button
                  TextButton(
                    onPressed: _resendCountdown > 0 ? null : _resend,
                    child: Text(
                      _resendCountdown > 0
                          ? '${l.authResend} (${_resendCountdown}s)'
                          : l.authResend,
                      style: TextStyle(
                        color: _resendCountdown > 0
                            ? AppColors.dustyCloud
                            : AppColors.coral,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
