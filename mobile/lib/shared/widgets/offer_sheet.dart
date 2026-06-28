import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api/models.dart';
import '../../core/auth/auth_provider.dart';
import '../../core/i18n/l10n_helper.dart';
import '../../core/theme/app_colors.dart';

/// Bottom sheet for making an offer on a listing.
class OfferSheet extends ConsumerStatefulWidget {
  const OfferSheet({
    super.key,
    required this.listing,
  });

  final Listing listing;

  /// Show the offer sheet as a modal bottom sheet.
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
        child: OfferSheet(listing: listing),
      ),
    );
  }

  @override
  ConsumerState<OfferSheet> createState() => _OfferSheetState();
}

class _OfferSheetState extends ConsumerState<OfferSheet> {
  final _amountController = TextEditingController();
  final _noteController = TextEditingController();
  bool _useTokenHold = false;
  bool _submitting = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    // Pre-fill with asking price as a starting point
    _amountController.text = widget.listing.askingPrice.toString();
  }

  @override
  void dispose() {
    _amountController.dispose();
    _noteController.dispose();
    super.dispose();
  }

  int? get _parsedAmount => int.tryParse(_amountController.text.trim());

  bool get _isValid {
    final amount = _parsedAmount;
    if (amount == null || amount < 0) return false;
    // Sanity check: 50%–150% of asking price
    final min = (widget.listing.askingPrice * 0.5).round();
    final max = (widget.listing.askingPrice * 1.5).round();
    return amount >= min && amount <= max;
  }

  Future<void> _submit() async {
    if (!_isValid) {
      setState(() {
        _error = context.l10n.offerErrorRange;
      });
      return;
    }

    setState(() {
      _submitting = true;
      _error = null;
    });

    try {
      final api = ref.read(apiClientProvider);
      await api.createOffer(
        listingId: widget.listing.id,
        amount: _parsedAmount!,
        note: _noteController.text.trim().isNotEmpty
            ? _noteController.text.trim()
            : null,
        tokenHoldAmount: _useTokenHold ? 1 : null,
      );
      if (mounted) {
        Navigator.of(context).pop();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(context.l10n.offerSentTitle),
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
    final askingPrice = widget.listing.askingPrice;
    final minOffer = (askingPrice * 0.5).round();
    final maxOffer = (askingPrice * 1.5).round();

    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Drag handle
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
            l.listingMakeOffer,
            style: theme.textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            widget.listing.title,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: AppColors.slateSmoke,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            l.offerRange(askingPrice, minOffer, maxOffer),
            style: theme.textTheme.bodySmall?.copyWith(
              color: AppColors.dustyCloud,
            ),
          ),
          const SizedBox(height: 20),
          // Amount field
          TextField(
            controller: _amountController,
            keyboardType: TextInputType.number,
            decoration: InputDecoration(
              labelText: l.offerYourOffer,
              border: const OutlineInputBorder(),
              prefixIcon: const Icon(Icons.payments_outlined),
              errorText: _error,
            ),
          ),
          const SizedBox(height: 12),
          // Note field
          TextField(
            controller: _noteController,
            maxLines: 2,
            decoration: InputDecoration(
              labelText: l.offerNote,
              border: const OutlineInputBorder(),
              prefixIcon: const Icon(Icons.note_outlined),
            ),
          ),
          const SizedBox(height: 12),
          // Token hold toggle
          SwitchListTile(
            title: Text(l.offerTokenHold),
            subtitle: Text(
              l.offerTokenHoldHint,
              style: const TextStyle(fontSize: 12),
            ),
            value: _useTokenHold,
            onChanged: (v) => setState(() => _useTokenHold = v),
            activeThumbColor: AppColors.coral,
          ),
          const SizedBox(height: 20),
          // Submit button
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
                      l.offerSendOffer,
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
