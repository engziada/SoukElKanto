import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/auth/auth_provider.dart';
import '../../core/i18n/l10n_helper.dart';
import '../../core/theme/app_colors.dart';

/// Login screen — phone number entry with OTP send.
class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _phoneController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _submitting = false;

  @override
  void dispose() {
    _phoneController.dispose();
    super.dispose();
  }

  /// Normalize Egyptian phone number to +20XXXXXXXXX format.
  String? _normalizePhone(String input) {
    final trimmed = input.trim();
    if (trimmed.isEmpty) return null;

    // Remove spaces and dashes
    String phone = trimmed.replaceAll(RegExp(r'[\s-]'), '');

    // Handle Egyptian formats:
    // 01XXXXXXXXX -> +201XXXXXXXXX
    // +201XXXXXXXXX -> as-is
    // 201XXXXXXXXX -> +201XXXXXXXXX
    if (phone.startsWith('+20')) {
      // already normalized
    } else if (phone.startsWith('20') && phone.length == 12) {
      phone = '+$phone';
    } else if (phone.startsWith('0') && phone.length == 11) {
      phone = '+2${phone.substring(1)}';
    } else if (phone.startsWith('1') && phone.length == 10) {
      phone = '+20$phone';
    } else {
      return null;
    }

    // Validate: +20 followed by 10 digits
    if (!RegExp(r'^\+20\d{10}$').hasMatch(phone)) return null;
    return phone;
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    final normalized = _normalizePhone(_phoneController.text);
    if (normalized == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(context.l10n.authErrorInvalidPhone),
          backgroundColor: AppColors.coral,
        ),
      );
      return;
    }

    setState(() => _submitting = true);

    await ref.read(authProvider.notifier).requestOtp(normalized);

    if (mounted) {
      setState(() => _submitting = false);
      final authState = ref.read(authProvider);
      if (authState is! AuthError) {
        // ignore: unawaited_futures
        context.push('/otp');
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(authState.message),
            backgroundColor: AppColors.coral,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l = context.l10n;

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: ConstrainedBox(
            constraints: BoxConstraints(
              minHeight: MediaQuery.of(context).size.height -
                  MediaQuery.of(context).padding.top -
                  MediaQuery.of(context).padding.bottom,
            ),
            child: IntrinsicHeight(
              child: Form(
                key: _formKey,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Logo / Hero
                    const Icon(
                      Icons.storefront_outlined,
                      size: 72,
                      color: AppColors.coral,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      l.metadataTitle,
                      textAlign: TextAlign.center,
                      style: theme.textTheme.headlineMedium?.copyWith(
                        fontWeight: FontWeight.w800,
                        color: AppColors.atlasMidnight,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      l.authLoginSubtitle,
                      textAlign: TextAlign.center,
                      style: theme.textTheme.bodyLarge?.copyWith(
                        color: AppColors.slateSmoke,
                      ),
                    ),
                    const SizedBox(height: 40),
                    // Phone field
                    TextFormField(
                      controller: _phoneController,
                      keyboardType: TextInputType.phone,
                      decoration: InputDecoration(
                        labelText: l.authPhoneLabel,
                        hintText: l.authPhonePlaceholder,
                        border: const OutlineInputBorder(
                          borderRadius: BorderRadius.all(Radius.circular(12)),
                        ),
                        prefixIcon: const Icon(Icons.phone_outlined),
                        prefixText: '${l.authCountryCode} ',
                      ),
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return l.authErrorInvalidPhone;
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 24),
                    // Submit button
                    FilledButton(
                      onPressed: _submitting ? null : _submit,
                      style: FilledButton.styleFrom(
                        backgroundColor: AppColors.coral,
                        foregroundColor: AppColors.warmWhite,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: _submitting
                          ? const SizedBox(
                              height: 24,
                              width: 24,
                              child: CircularProgressIndicator(
                                color: AppColors.warmWhite,
                                strokeWidth: 2,
                              ),
                            )
                          : Text(
                              _submitting ? l.authSending : l.authSendOtp,
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                    ),
                    const SizedBox(height: 16),
                    // Terms
                    Text(
                      'By continuing, you agree to our Terms of Service and Privacy Policy.',
                      textAlign: TextAlign.center,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: AppColors.dustyCloud,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
