import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api/models.dart';
import '../../core/auth/auth_provider.dart';
import '../../core/i18n/l10n_helper.dart';
import '../../core/listings/listings_provider.dart';
import '../../core/theme/app_colors.dart';
import '../../shared/widgets/trust_badge.dart';

/// Profile screen — view and edit profile, KYC status, logout.
class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final user = authState is Authenticated ? authState.user : null;
    final l = context.l10n;

    return Scaffold(
      appBar: AppBar(
        title: Text(l.myProfileTitle),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await ref.read(authProvider.notifier).logout();
              if (context.mounted) context.go('/login');
            },
          ),
        ],
      ),
      body: user == null
          ? Center(child: Text(l.errorUnauthorized))
          : ListView(
              children: [
                // Header
                Container(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    children: [
                      CircleAvatar(
                        radius: 48,
                        backgroundColor: AppColors.coralAwning,
                        child: Text(
                          (user.fullName?.isNotEmpty == true
                                  ? user.fullName!
                                  : user.phoneNumber)
                              .substring(0, 1)
                              .toUpperCase(),
                          style: const TextStyle(
                            fontSize: 32,
                            fontWeight: FontWeight.w800,
                            color: AppColors.coral,
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        user.fullName ?? l.myProfileUnnamed,
                        style: Theme.of(context)
                            .textTheme
                            .titleLarge
                            ?.copyWith(fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        user.phoneNumber,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: AppColors.slateSmoke,
                            ),
                      ),
                      const SizedBox(height: 8),
                      TrustBadge(
                        tier: 'NEW',
                        showKycVerified: user.isKycVerified,
                      ),
                    ],
                  ),
                ),
                const Divider(),
                // KYC section
                _SectionTile(
                  icon: Icons.verified_user_outlined,
                  title: l.myProfileVerification,
                  subtitle: user.isKycVerified
                      ? l.myProfileKycVerified
                      : (user.kyc?.status ?? l.myProfileKycNotSubmitted),
                  onTap: () => context.push('/verify'),
                  trailing: user.isKycVerified
                      ? const Icon(Icons.check_circle, color: AppColors.mint)
                      : const Icon(Icons.chevron_right),
                ),
                // Edit profile
                _SectionTile(
                  icon: Icons.person_outline,
                  title: l.myProfileEdit,
                  subtitle: user.isProfileComplete ? l.myProfileProfileComplete : l.myProfileProfileIncomplete,
                  onTap: () => _showEditDialog(context, ref, user),
                  trailing: const Icon(Icons.chevron_right),
                ),
                // Wallet
                _SectionTile(
                  icon: Icons.account_balance_wallet_outlined,
                  title: l.myWalletTitle,
                  subtitle: l.myWalletBalance,
                  onTap: () => context.push('/wallet'),
                  trailing: const Icon(Icons.chevron_right),
                ),
                // Trust meter
                _SectionTile(
                  icon: Icons.shield_outlined,
                  title: l.myTrustMeterTitle,
                  subtitle: l.myTrustMeterSoon,
                  onTap: () => context.push('/trust-meter'),
                  trailing: const Icon(Icons.chevron_right),
                ),
                // My listings
                _SectionTile(
                  icon: Icons.sell_outlined,
                  title: l.myListingsTitle,
                  subtitle: ref.watch(myListingsProvider).when(
                        data: (listings) => listings.isEmpty
                            ? l.myListingsEmpty
                            : l.myOverviewActiveListings(listings.length),
                        loading: () => '…',
                        error: (_, __) => l.myListingsEmpty,
                      ),
                  onTap: () => context.push('/my'),
                  trailing: const Icon(Icons.chevron_right),
                ),
                // Offers
                _SectionTile(
                  icon: Icons.local_offer_outlined,
                  title: l.myOffersTitle,
                  subtitle: l.offersEmptyHint,
                  onTap: () => context.push('/offers'),
                  trailing: const Icon(Icons.chevron_right),
                ),
              ],
            ),
    );
  }

  void _showEditDialog(BuildContext context, WidgetRef ref, AuthUser user) {
    showDialog<void>(
      context: context,
      builder: (context) => _EditProfileDialog(user: user),
    );
  }
}

class _SectionTile extends StatelessWidget {
  const _SectionTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    this.onTap,
    this.trailing,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback? onTap;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: AppColors.coral),
      title: Text(title),
      subtitle: Text(subtitle),
      trailing: trailing,
      onTap: onTap,
    );
  }
}

class _EditProfileDialog extends ConsumerStatefulWidget {
  const _EditProfileDialog({required this.user});

  final AuthUser user;

  @override
  ConsumerState<_EditProfileDialog> createState() =>
      _EditProfileDialogState();
}

class _EditProfileDialogState extends ConsumerState<_EditProfileDialog> {
  late final _nameController =
      TextEditingController(text: widget.user.fullName ?? '');
  String? _gender;
  DateTime? _birthdate;
  late final _addressController =
      TextEditingController(text: widget.user.address ?? '');
  bool _saving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    // Normalize gender to uppercase MALE/FEMALE (matches web client + BE convention).
    final g = widget.user.gender?.toUpperCase().trim();
    _gender = (g == 'MALE' || g == 'FEMALE') ? g : null;
    // Parse existing birthdate string (ISO date or yyyy-MM-dd).
    final bd = widget.user.birthdate;
    if (bd != null && bd.isNotEmpty) {
      _birthdate = DateTime.tryParse(bd);
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  String _formatDate(DateTime d) =>
      '${d.year.toString().padLeft(4, '0')}-'
      '${d.month.toString().padLeft(2, '0')}-'
      '${d.day.toString().padLeft(2, '0')}';

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _birthdate ?? DateTime(now.year - 25),
      firstDate: DateTime(1950),
      lastDate: DateTime(now.year - 13),
    );
    if (picked != null) {
      setState(() => _birthdate = picked);
    }
  }

  Future<void> _save() async {
    final name = _nameController.text.trim();
    if (name.isEmpty) {
      setState(() => _error = context.l10n.myProfileFullName);
      return;
    }

    setState(() {
      _saving = true;
      _error = null;
    });

    try {
      final api = ref.read(apiClientProvider);
      final updated = await api.updateProfile(
        fullName: name,
        gender: _gender,
        birthdate: _birthdate != null ? _formatDate(_birthdate!) : null,
        address: _addressController.text.trim().isEmpty
            ? null
            : _addressController.text.trim(),
      );

      // Refresh auth state so the UI reflects the new profile.
      ref.read(authProvider.notifier).updateUser(updated);

      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(context.l10n.myProfileProfileSaved),
            backgroundColor: AppColors.mint,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _saving = false;
          _error = e.toString();
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = context.l10n;
    return AlertDialog(
      title: Text(l.myProfileEdit),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: _nameController,
              decoration: InputDecoration(
                labelText: l.myProfileFullName,
                border: const OutlineInputBorder(),
                prefixIcon: const Icon(Icons.person_outline),
              ),
              textCapitalization: TextCapitalization.words,
              textInputAction: TextInputAction.next,
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              value: _gender,
              decoration: InputDecoration(
                labelText: l.myProfileGender,
                border: const OutlineInputBorder(),
                prefixIcon: const Icon(Icons.wc_outlined),
              ),
              items: [
                DropdownMenuItem(value: 'MALE', child: Text(l.myProfileMale)),
                DropdownMenuItem(
                    value: 'FEMALE', child: Text(l.myProfileFemale)),
              ],
              onChanged: (v) => setState(() => _gender = v),
            ),
            const SizedBox(height: 16),
            InkWell(
              onTap: _pickDate,
              child: InputDecorator(
                decoration: InputDecoration(
                  labelText: l.myProfileBirthdate,
                  border: const OutlineInputBorder(),
                  prefixIcon: const Icon(Icons.calendar_today_outlined),
                ),
                child: Text(
                  _birthdate != null
                      ? _formatDate(_birthdate!)
                      : '—',
                  style: TextStyle(
                    color: _birthdate != null
                        ? null
                        : Theme.of(context).hintColor,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _addressController,
              decoration: InputDecoration(
                labelText: l.myProfileMadinatyAddress,
                border: const OutlineInputBorder(),
                prefixIcon: const Icon(Icons.location_on_outlined),
              ),
              textInputAction: TextInputAction.done,
            ),
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(
                _error!,
                style: TextStyle(
                  color: Theme.of(context).colorScheme.error,
                  fontSize: 13,
                ),
              ),
            ],
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: Text(l.myProfileCancel),
        ),
        FilledButton(
          onPressed: _saving ? null : _save,
          child: _saving
              ? const SizedBox(
                  height: 16, width: 16,
                  child: CircularProgressIndicator(strokeWidth: 2))
              : Text(l.myProfileSave),
        ),
      ],
    );
  }
}
