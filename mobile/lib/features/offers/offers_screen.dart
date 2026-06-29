import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api/models.dart';
import '../../core/auth/auth_provider.dart';
import '../../core/i18n/l10n_helper.dart';
import '../../core/listings/listings_provider.dart';
import '../../core/theme/app_colors.dart';
import '../../shared/widgets/empty_state.dart';
import '../../shared/widgets/error_view.dart';
import '../../shared/widgets/loading_indicator.dart';
import '../../shared/widgets/price_tag.dart';

/// Offers screen — sent and received offers in tabs.
class OffersScreen extends ConsumerWidget {
  const OffersScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l = context.l10n;
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: Text(l.myOffersTitle),
          bottom: TabBar(
            tabs: [
              Tab(text: l.myOffersTabSent),
              Tab(text: l.myOffersTabReceived),
            ],
          ),
        ),
        body: const TabBarView(
          children: [
            _SentOffersTab(),
            _ReceivedOffersTab(),
          ],
        ),
      ),
    );
  }
}

class _SentOffersTab extends ConsumerWidget {
  const _SentOffersTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final offers = ref.watch(sentOffersProvider);
    final l = context.l10n;

    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(sentOffersProvider),
      child: offers.when(
        data: (list) {
          if (list.isEmpty) {
            return EmptyState(
              icon: Icons.local_offer_outlined,
              title: l.errorEmptyOffers,
              subtitle: l.offersEmptyHint,
            );
          }
          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: list.length,
            itemBuilder: (context, index) =>
                _OfferCard(offer: list[index], isSent: true),
          );
        },
        loading: () => const LoadingIndicator(),
        error: (e, _) => ErrorView(
          message: e.toString(),
          onRetry: () => ref.invalidate(sentOffersProvider),
        ),
      ),
    );
  }
}

class _ReceivedOffersTab extends ConsumerWidget {
  const _ReceivedOffersTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final offers = ref.watch(receivedOffersProvider);
    final l = context.l10n;

    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(receivedOffersProvider),
      child: offers.when(
        data: (list) {
          if (list.isEmpty) {
            return EmptyState(
              icon: Icons.inbox_outlined,
              title: l.errorEmptyOffers,
              subtitle: l.offersEmptyHint,
            );
          }
          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: list.length,
            itemBuilder: (context, index) =>
                _OfferCard(offer: list[index], isSent: false),
          );
        },
        loading: () => const LoadingIndicator(),
        error: (e, _) => ErrorView(
          message: e.toString(),
          onRetry: () => ref.invalidate(receivedOffersProvider),
        ),
      ),
    );
  }
}

class _OfferCard extends ConsumerWidget {
  const _OfferCard({required this.offer, required this.isSent});

  final Offer offer;
  final bool isSent;

  Color get _statusColor {
    return switch (offer.status) {
      OfferStatus.pending => AppColors.honey,
      OfferStatus.accepted => AppColors.mint,
      OfferStatus.declined => AppColors.coral,
      OfferStatus.countered => AppColors.lilac,
      OfferStatus.withdrawn => AppColors.dustyCloud,
      OfferStatus.expired => AppColors.dustyCloud,
      OfferStatus.handoverPending => AppColors.teal,
      OfferStatus.confirmed => AppColors.mint,
      OfferStatus.closed => AppColors.slateSmoke,
      OfferStatus.cancelled => AppColors.coral,
    };
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l = context.l10n;
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Listing title
            if (offer.listing != null) ...[
              GestureDetector(
                onTap: () => context.push('/listings/${offer.listingId}'),
                child: Text(
                  offer.listing!.title,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                        color: AppColors.indigo,
                      ),
                ),
              ),
              const SizedBox(height: 8),
            ],
            // Offer amount
            Row(
              children: [
                PriceTag(price: offer.amount, compact: true),
                const SizedBox(width: 8),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: _statusColor.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    offer.status.name,
                    style: TextStyle(
                      color: _statusColor,
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
            if (offer.note != null && offer.note!.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(
                offer.note!,
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
            // Actions (for received offers that are pending)
            if (!isSent && offer.status == OfferStatus.pending) ...[
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: FilledButton(
                      onPressed: () async {
                        final api = ref.read(apiClientProvider);
                        await api.acceptOffer(offer.id);
                        ref.invalidate(receivedOffersProvider);
                      },
                      style: FilledButton.styleFrom(
                        backgroundColor: AppColors.mint,
                        foregroundColor: Colors.white,
                      ),
                      child: Text(l.myOffersAccept),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () async {
                        final api = ref.read(apiClientProvider);
                        await api.counterOffer(offer.id,
                            amount: offer.listing?.askingPrice ??
                                offer.amount);
                        ref.invalidate(receivedOffersProvider);
                      },
                      child: Text(l.myOffersCounter),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () async {
                        final api = ref.read(apiClientProvider);
                        await api.declineOffer(offer.id);
                        ref.invalidate(receivedOffersProvider);
                      },
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.coral,
                      ),
                      child: Text(l.myOffersDecline),
                    ),
                  ),
                ],
              ),
            ],
            // Actions for sent offers — withdraw when pending
            if (isSent && offer.status == OfferStatus.pending) ...[
              const SizedBox(height: 12),
              OutlinedButton.icon(
                onPressed: () async {
                  final api = ref.read(apiClientProvider);
                  await api.withdrawOffer(offer.id);
                  ref.invalidate(sentOffersProvider);
                },
                icon: const Icon(Icons.undo_outlined, size: 16),
                label: Text(l.myOffersWithdraw),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.coral,
                ),
              ),
            ],
            // Actions for sent offers — buyer responds to seller's counter
            if (isSent && offer.status == OfferStatus.countered) ...[
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: FilledButton(
                      onPressed: () async {
                        final api = ref.read(apiClientProvider);
                        await api.buyerAcceptCounter(offer.id);
                        ref.invalidate(sentOffersProvider);
                      },
                      style: FilledButton.styleFrom(
                        backgroundColor: AppColors.mint,
                        foregroundColor: Colors.white,
                      ),
                      child: Text(l.myOffersAcceptCounter),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () async {
                        final api = ref.read(apiClientProvider);
                        await api.buyerDeclineCounter(offer.id);
                        ref.invalidate(sentOffersProvider);
                      },
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.coral,
                      ),
                      child: Text(l.myOffersDeclineCounter),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              OutlinedButton.icon(
                onPressed: () => _showReCounterSheet(context, ref, offer),
                icon: const Icon(Icons.sync_alt, size: 16),
                label: Text(l.myOffersReCounter),
              ),
            ],
            // Handover confirm button
            if (offer.status == OfferStatus.accepted ||
                offer.status == OfferStatus.handoverPending) ...[
              const SizedBox(height: 12),
              FilledButton.icon(
                onPressed: () async {
                  final api = ref.read(apiClientProvider);
                  await api.confirmHandover(offer.id);
                  ref.invalidate(sentOffersProvider);
                  ref.invalidate(receivedOffersProvider);
                },
                icon: const Icon(Icons.handshake_outlined),
                label: Text(l.myOffersConfirmHandover),
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.teal,
                  foregroundColor: AppColors.coolWhite,
                ),
              ),
            ],
            // Post-accept actions: reveal contact, cancel deal, file dispute
            if (offer.status == OfferStatus.accepted ||
                offer.status == OfferStatus.handoverPending ||
                offer.status == OfferStatus.confirmed) ...[
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  OutlinedButton.icon(
                    onPressed: () =>
                        _showContactReveal(context, ref, offer.id),
                    icon: const Icon(Icons.phone_outlined, size: 16),
                    label: Text(l.myOffersRevealContact),
                  ),
                  if (offer.status != OfferStatus.confirmed)
                    OutlinedButton.icon(
                      onPressed: () =>
                          _showCancelSheet(context, ref, offer.id),
                      icon: const Icon(Icons.cancel_outlined, size: 16),
                      label: Text(l.myOffersCancelOffer),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.coral,
                      ),
                    ),
                  if (offer.status != OfferStatus.confirmed)
                    OutlinedButton.icon(
                      onPressed: () =>
                          _showDisputeSheet(context, ref, offer.id),
                      icon: const Icon(Icons.shield_outlined, size: 16),
                      label: Text(l.myOffersFileDispute),
                    ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}

// ── Contact Reveal Bottom Sheet ──────────────────────────────────────────────

Future<void> _showContactReveal(
  BuildContext context,
  WidgetRef ref,
  String offerId,
) async {
  final l = context.l10n;
  final api = ref.read(apiClientProvider);

  await showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    builder: (sheetContext) {
      return FutureBuilder<ContactReveal>(
        future: api.revealContact(offerId),
        builder: (innerContext, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Padding(
              padding: EdgeInsets.all(32),
              child: Center(child: CircularProgressIndicator()),
            );
          }
          if (snapshot.hasError) {
            return Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(l.myOffersActionError),
                  const SizedBox(height: 16),
                  TextButton(
                    onPressed: () => Navigator.of(innerContext).pop(),
                    child: Text(l.myOffersCancel),
                  ),
                ],
              ),
            );
          }
          final c = snapshot.data!;
          return Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  l.myOffersRevealContact,
                  style: Theme.of(innerContext).textTheme.titleLarge,
                ),
                const SizedBox(height: 16),
                Text(c.fullName,
                    style:
                        Theme.of(innerContext).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.w700,
                            )),
                const SizedBox(height: 8),
                Row(
                  children: [
                    const Icon(Icons.phone_outlined, size: 16),
                    const SizedBox(width: 8),
                    Text(c.phoneNumber),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    const Icon(Icons.shield_outlined, size: 16),
                    const SizedBox(width: 8),
                    Text('${c.trustTier} · ${c.trustScore}'),
                  ],
                ),
                const SizedBox(height: 16),
                if (c.waMeLink.isNotEmpty)
                  FilledButton.icon(
                    onPressed: () => _launchWa(innerContext, c.waMeLink),
                    icon: const Icon(Icons.open_in_new, size: 16),
                    label: const Text('WhatsApp'),
                  ),
                const SizedBox(height: 16),
                TextButton(
                  onPressed: () => Navigator.of(innerContext).pop(),
                  child: Text(l.myOffersCancel),
                ),
              ],
            ),
          );
        },
      );
    },
  );
}

// ── Cancel Offer Bottom Sheet ────────────────────────────────────────────────

Future<void> _showCancelSheet(
  BuildContext context,
  WidgetRef ref,
  String offerId,
) async {
  final l = context.l10n;
  final api = ref.read(apiClientProvider);
  final reasonController = TextEditingController();

  await showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    builder: (sheetContext) {
      return StatefulBuilder(
        builder: (setCtx, setSt) {
          return Padding(
            padding: EdgeInsets.only(
              left: 24,
              right: 24,
              top: 24,
              bottom: MediaQuery.of(setCtx).viewInsets.bottom + 24,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  l.myOffersCancelOffer,
                  style: Theme.of(setCtx).textTheme.titleLarge,
                ),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.honey.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.warning_amber_rounded, size: 16),
                      const SizedBox(width: 8),
                      Expanded(child: Text(l.myOffersCancelWarning)),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                Text(l.myOffersCancelReasonLabel,
                    style: Theme.of(setCtx).textTheme.labelMedium),
                const SizedBox(height: 6),
                TextField(
                  controller: reasonController,
                  maxLines: 3,
                  maxLength: 500,
                  decoration: InputDecoration(
                    hintText: l.myOffersCancelReasonPlaceholder,
                    border: const OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    TextButton(
                      onPressed: () => Navigator.of(setCtx).pop(),
                      child: Text(l.myOffersCancel),
                    ),
                    const SizedBox(width: 8),
                    FilledButton(
                      onPressed: reasonController.text.trim().isEmpty
                          ? null
                          : () async {
                              setSt(() {});
                              try {
                                await api.cancelOffer(
                                    offerId, reasonController.text.trim());
                                if (setCtx.mounted) {
                                  Navigator.of(setCtx).pop();
                                  ref.invalidate(sentOffersProvider);
                                  ref.invalidate(receivedOffersProvider);
                                }
                              } catch (_) {
                                if (setCtx.mounted) {
                                  ScaffoldMessenger.of(setCtx).showSnackBar(
                                    SnackBar(
                                        content: Text(l.myOffersActionError)),
                                  );
                                }
                              }
                            },
                      style: FilledButton.styleFrom(
                        backgroundColor: AppColors.coral,
                      ),
                      child: Text(l.myOffersCancelConfirm),
                    ),
                  ],
                ),
              ],
            ),
          );
        },
      );
    },
  );
}

// ── Dispute Bottom Sheet ─────────────────────────────────────────────────────

Future<void> _showDisputeSheet(
  BuildContext context,
  WidgetRef ref,
  String offerId,
) async {
  final l = context.l10n;
  final api = ref.read(apiClientProvider);
  final descController = TextEditingController();
  DisputeReason selectedReason = DisputeReason.itemNotAsDescribed;

  final reasonOptions = <DisputeReason>[
    DisputeReason.itemNotAsDescribed,
    DisputeReason.itemDefective,
    DisputeReason.noShow,
    DisputeReason.paymentIssue,
    DisputeReason.counterfeit,
    DisputeReason.sellerBackedOut,
    DisputeReason.buyerBackedOut,
    DisputeReason.safetyConcern,
    DisputeReason.other,
  ];

  String reasonLabel(DisputeReason r) {
    return switch (r) {
      DisputeReason.itemNotAsDescribed => l.myDisputesReasonItemNotAsDescribed,
      DisputeReason.itemDefective => l.myDisputesReasonItemDefective,
      DisputeReason.noShow => l.myDisputesReasonNoShow,
      DisputeReason.paymentIssue => l.myDisputesReasonPaymentIssue,
      DisputeReason.counterfeit => l.myDisputesReasonCounterfeit,
      DisputeReason.sellerBackedOut => l.myDisputesReasonSellerBackedOut,
      DisputeReason.buyerBackedOut => l.myDisputesReasonBuyerBackedOut,
      DisputeReason.safetyConcern => l.myDisputesReasonSafetyConcern,
      DisputeReason.other => l.myDisputesReasonOther,
    };
  }

  await showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    builder: (sheetContext) {
      return StatefulBuilder(
        builder: (setCtx, setSt) {
          return Padding(
            padding: EdgeInsets.only(
              left: 24,
              right: 24,
              top: 24,
              bottom: MediaQuery.of(setCtx).viewInsets.bottom + 24,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  l.myDisputesTitle,
                  style: Theme.of(setCtx).textTheme.titleLarge,
                ),
                const SizedBox(height: 16),
                Text(l.myDisputesReasonLabel,
                    style: Theme.of(setCtx).textTheme.labelMedium),
                const SizedBox(height: 6),
                DropdownButtonFormField<DisputeReason>(
                  initialValue: selectedReason,
                  decoration: const InputDecoration(
                    border: OutlineInputBorder(),
                  ),
                  items: reasonOptions
                      .map((r) => DropdownMenuItem(
                            value: r,
                            child: Text(reasonLabel(r)),
                          ))
                      .toList(),
                  onChanged: (v) {
                    if (v != null) {
                      setSt(() => selectedReason = v);
                    }
                  },
                ),
                const SizedBox(height: 16),
                Text(l.myDisputesDescriptionLabel,
                    style: Theme.of(setCtx).textTheme.labelMedium),
                const SizedBox(height: 6),
                TextField(
                  controller: descController,
                  maxLines: 4,
                  maxLength: 1000,
                  decoration: InputDecoration(
                    hintText: l.myDisputesDescriptionPlaceholder,
                    border: const OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    TextButton(
                      onPressed: () => Navigator.of(setCtx).pop(),
                      child: Text(l.myOffersCancel),
                    ),
                    const SizedBox(width: 8),
                    FilledButton(
                      onPressed: () async {
                        setSt(() {});
                        try {
                          await api.createDispute(
                            offerId: offerId,
                            reason: selectedReason,
                            description: descController.text.trim().isEmpty
                                ? null
                                : descController.text.trim(),
                          );
                          if (setCtx.mounted) {
                            Navigator.of(setCtx).pop();
                            ScaffoldMessenger.of(setCtx).showSnackBar(
                              SnackBar(content: Text(l.myDisputesFiledToast)),
                            );
                          }
                        } catch (_) {
                          if (setCtx.mounted) {
                            ScaffoldMessenger.of(setCtx).showSnackBar(
                              SnackBar(
                                  content: Text(l.myDisputesActionError)),
                            );
                          }
                        }
                      },
                      style: FilledButton.styleFrom(
                        backgroundColor: AppColors.coral,
                      ),
                      child: Text(l.myDisputesSubmit),
                    ),
                  ],
                ),
              ],
            ),
          );
        },
      );
    },
  );
}

// ── Re-Counter Bottom Sheet ─────────────────────────────────────────────────

Future<void> _showReCounterSheet(
  BuildContext context,
  WidgetRef ref,
  Offer offer,
) async {
  final l = context.l10n;
  final api = ref.read(apiClientProvider);
  final amountController = TextEditingController();

  await showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    builder: (sheetContext) {
      return StatefulBuilder(
        builder: (setCtx, setSt) {
          return Padding(
            padding: EdgeInsets.only(
              left: 24,
              right: 24,
              top: 24,
              bottom: MediaQuery.of(setCtx).viewInsets.bottom + 24,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  l.myOffersReCounter,
                  style: Theme.of(setCtx).textTheme.titleLarge,
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: amountController,
                  keyboardType: TextInputType.number,
                  decoration: InputDecoration(
                    labelText: l.myOffersCounterPlaceholder,
                    border: const OutlineInputBorder(),
                    prefixIcon: const Icon(Icons.payments_outlined),
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    TextButton(
                      onPressed: () => Navigator.of(setCtx).pop(),
                      child: Text(l.myOffersCancel),
                    ),
                    const SizedBox(width: 8),
                    FilledButton(
                      onPressed: () async {
                        final amount = int.tryParse(amountController.text.trim());
                        if (amount == null || amount <= 0) return;
                        try {
                          await api.buyerCounter(offer.id, amount: amount);
                          if (setCtx.mounted) {
                            Navigator.of(setCtx).pop();
                            ref.invalidate(sentOffersProvider);
                          }
                        } catch (_) {
                          if (setCtx.mounted) {
                            ScaffoldMessenger.of(setCtx).showSnackBar(
                              SnackBar(
                                  content: Text(l.myOffersActionError)),
                            );
                          }
                        }
                      },
                      style: FilledButton.styleFrom(
                        backgroundColor: AppColors.coral,
                      ),
                      child: Text(l.myOffersReCounter),
                    ),
                  ],
                ),
              ],
            ),
          );
        },
      );
    },
  );
}

/// Launch WhatsApp link — placeholder until url_launcher is wired.
void _launchWa(BuildContext context, String url) {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(content: Text(url)),
  );
}
