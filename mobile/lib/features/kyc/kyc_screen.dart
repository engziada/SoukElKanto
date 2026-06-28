import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import '../../core/auth/auth_provider.dart';
import '../../core/i18n/l10n_helper.dart';
import '../../core/theme/app_colors.dart';
import 'dart:convert';

/// KYC verification screen — submit national ID photo.
class KycScreen extends ConsumerStatefulWidget {
  const KycScreen({super.key});

  @override
  ConsumerState<KycScreen> createState() => _KycScreenState();
}

class _KycScreenState extends ConsumerState<KycScreen> {
  final _nameController = TextEditingController();
  final _idController = TextEditingController();
  XFile? _idPhoto;
  bool _submitting = false;

  @override
  void dispose() {
    _nameController.dispose();
    _idController.dispose();
    super.dispose();
  }

  Future<void> _pickIdPhoto() async {
    final picker = ImagePicker();
    final photo = await picker.pickImage(
      source: ImageSource.camera,
      imageQuality: 80,
      maxWidth: 1080,
    );
    if (photo != null) {
      setState(() => _idPhoto = photo);
    }
  }

  Future<void> _submit() async {
    if (_nameController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(context.l10n.myVerifyErrorName),
          backgroundColor: AppColors.coral,
        ),
      );
      return;
    }
    if (_idController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(context.l10n.myVerifyErrorId),
          backgroundColor: AppColors.coral,
        ),
      );
      return;
    }
    if (_idPhoto == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(context.l10n.myVerifyErrorDocument),
          backgroundColor: AppColors.coral,
        ),
      );
      return;
    }

    setState(() => _submitting = true);

    try {
      final api = ref.read(apiClientProvider);
      final bytes = await _idPhoto!.readAsBytes();
      final base64Photo = base64Encode(bytes);

      await api.submitKyc(
        fullName: _nameController.text.trim(),
        idNumber: _idController.text.trim(),
        documentBase64: base64Photo,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(context.l10n.myVerifySuccessBody),
            backgroundColor: AppColors.mint,
          ),
        );
        context.go('/profile');
      }
    } catch (e) {
      final api = ref.read(apiClientProvider);
      final err = api.extractError(e);
      if (mounted) {
        setState(() => _submitting = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(err.message),
            backgroundColor: AppColors.coral,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l10n;
    return Scaffold(
      appBar: AppBar(title: Text(l.myVerifyTitle)),
      body: _submitting
          ? const Center(child: CircularProgressIndicator(color: AppColors.coral))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Info banner
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.tealDim,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.info_outline, color: AppColors.teal),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            l.myVerifySubtitle,
                            style: const TextStyle(color: AppColors.teal),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                  // Full name
                  TextField(
                    controller: _nameController,
                    decoration: InputDecoration(
                      labelText: l.myVerifyFullName,
                      border: const OutlineInputBorder(),
                      prefixIcon: const Icon(Icons.person_outline),
                    ),
                  ),
                  const SizedBox(height: 16),
                  // ID number
                  TextField(
                    controller: _idController,
                    decoration: InputDecoration(
                      labelText: l.myVerifyIdNumber,
                      border: const OutlineInputBorder(),
                      prefixIcon: const Icon(Icons.badge_outlined),
                    ),
                  ),
                  const SizedBox(height: 16),
                  // ID photo
                  GestureDetector(
                    onTap: _pickIdPhoto,
                    child: Container(
                      height: 200,
                      decoration: BoxDecoration(
                        border: Border.all(color: AppColors.border),
                        borderRadius: BorderRadius.circular(12),
                        color: AppColors.awningShade,
                      ),
                      child: _idPhoto == null
                          ? Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.camera_alt_outlined,
                                    size: 48, color: AppColors.dustyCloud),
                                const SizedBox(height: 8),
                                Text(l.myVerifyDropHint),
                              ],
                            )
                          : ClipRRect(
                              borderRadius: BorderRadius.circular(12),
                              child: Image.file(
                                File(_idPhoto!.path),
                                fit: BoxFit.cover,
                              ),
                            ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  // Submit
                  FilledButton(
                    onPressed: _submit,
                    style: FilledButton.styleFrom(
                      backgroundColor: AppColors.coral,
                      foregroundColor: AppColors.warmWhite,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                    child: Text(
                      l.myVerifySubmit,
                      style: const TextStyle(
                          fontSize: 16, fontWeight: FontWeight.w700),
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}
