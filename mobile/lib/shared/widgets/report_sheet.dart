import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api/models.dart';
import '../../core/auth/auth_provider.dart';
import '../../core/i18n/l10n_helper.dart';
import '../../core/theme/app_colors.dart';

/// Bottom sheet for reporting a listing.
class ReportSheet extends ConsumerStatefulWidget {
  const ReportSheet({super.key, required this.listing});

  final Listing listing;

  static Future<void> show(
    BuildContext context,
    WidgetRef ref,
    Listing listing,
  ) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
        ),
        child: ReportSheet(listing: listing),
      ),
    );
  }

  @override
  ConsumerState<ReportSheet> createState() => _ReportSheetState();
}

class _ReportSheetState extends ConsumerState<ReportSheet> {
  ReportIncidentType _selectedType = ReportIncidentType.scam;
  int _severity = 3;
  final _reasonController = TextEditingController();
  bool _submitting = false;
  String? _error;

  @override
  void dispose() {
    _reasonController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_reasonController.text.trim().isEmpty) {
      setState(() {
        _error = context.l10n.reportErrorReasonRequired;
      });
      return;
    }

    setState(() {
      _submitting = true;
      _error = null;
    });

    try {
      final api = ref.read(apiClientProvider);
      await api.reportListing(
        listingId: widget.listing.id,
        incidentType: _selectedType.apiValue,
        severity: _severity,
        reason: _reasonController.text.trim(),
      );
      if (mounted) {
        Navigator.of(context).pop();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(context.l10n.reportSuccessTitle),
            backgroundColor: AppColors.mint,
          ),
        );
      }
    } catch (e) {
      final api = ref.read(apiClientProvider);
      final err = api.extractError(e);
      if (mounted) {
        setState(() {
          _error = err.message;
          _submitting = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l = context.l10n;

    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.border,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 20),
          Text(
            l.reportTitle,
            style: theme.textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 16),
          // Incident type selector
          Text(l.reportIncidentLabel, style: theme.textTheme.labelLarge),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: ReportIncidentType.values.map((type) {
              final selected = type == _selectedType;
              return GestureDetector(
                onTap: () => setState(() => _selectedType = type),
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: selected
                        ? AppColors.coral
                        : AppColors.awningShade,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: selected ? AppColors.coral : AppColors.border,
                    ),
                  ),
                  child: Text(
                    type.name,
                    style: TextStyle(
                      color: selected
                          ? AppColors.warmWhite
                          : theme.textTheme.bodyMedium?.color,
                      fontSize: 13,
                      fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 16),
          // Severity slider
          Text('${l.reportSeverityLabel}: $_severity/5', style: theme.textTheme.labelLarge),
          Slider(
            value: _severity.toDouble(),
            min: 1,
            max: 5,
            divisions: 4,
            activeColor: AppColors.coral,
            onChanged: (v) => setState(() => _severity = v.round()),
          ),
          const SizedBox(height: 16),
          // Reason field
          TextField(
            controller: _reasonController,
            maxLines: 3,
            decoration: InputDecoration(
              labelText: l.reportReasonLabel,
              border: const OutlineInputBorder(),
              errorText: _error,
            ),
          ),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: _submitting ? null : _submit,
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.coral,
                foregroundColor: AppColors.warmWhite,
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              child: _submitting
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                        color: AppColors.warmWhite,
                        strokeWidth: 2,
                      ),
                    )
                  : Text(
                      l.reportSubmit,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
            ),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}
