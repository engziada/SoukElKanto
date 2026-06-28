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
          ],
        ),
      ),
    );
  }
}
