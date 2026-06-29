import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:share_plus/share_plus.dart';

import '../../core/auth/auth_provider.dart';
import '../../core/favorites/favorites_provider.dart';
import '../../core/i18n/l10n_helper.dart';
import '../../core/listings/listings_provider.dart';
import '../../core/theme/app_colors.dart';
import '../../shared/widgets/condition_chip.dart';
import '../../shared/widgets/error_view.dart';
import '../../shared/widgets/loading_indicator.dart';
import '../../shared/widgets/offer_sheet.dart';
import '../../shared/widgets/price_tag.dart';
import '../../shared/widgets/report_sheet.dart';
import '../../shared/widgets/trust_badge.dart';

/// Listing detail screen — photos, description, seller info, actions.
class ListingDetailScreen extends ConsumerWidget {
  const ListingDetailScreen({super.key, required this.id});

  final String id;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final listingAsync = ref.watch(listingByIdProvider(id));
    final favorites = ref.watch(favoritesProvider);
    final currentUser = ref.watch(currentUserProvider);
    final l = context.l10n;

    return listingAsync.when(
      data: (listing) {
        final isFav = favorites.valueOrNull?.contains(listing.id) ?? false;
        final isOwner = currentUser?.id == listing.sellerId;
        return Scaffold(
          body: CustomScrollView(
            slivers: [
              // Photo gallery
              SliverAppBar(
                expandedHeight: 300,
                pinned: true,
                leading: IconButton(
                  icon: Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.3),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.arrow_back, color: Colors.white),
                  ),
                  onPressed: () => context.pop(),
                ),
                actions: [
                  if (isOwner)
                    IconButton(
                      icon: Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.3),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.edit_outlined,
                            color: Colors.white),
                      ),
                      onPressed: () =>
                          context.push('/listings/${listing.id}/edit'),
                    ),
                  IconButton(
                    icon: Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.3),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        isFav ? Icons.favorite : Icons.favorite_border,
                        color: isFav ? AppColors.coral : Colors.white,
                      ),
                    ),
                    onPressed: () =>
                        ref.read(favoritesProvider.notifier).toggle(listing.id),
                  ),
                  IconButton(
                    icon: Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.3),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.share, color: Colors.white),
                    ),
                    onPressed: () {
                      final price = listing.askingPrice;
                      final url =
                          'https://elkanto.madinatyai.com/listings/${listing.id}';
                      Share.share(
                        '${listing.title} — $price EGP\n$url',
                        subject: listing.title,
                      );
                    },
                  ),
                ],
                flexibleSpace: FlexibleSpaceBar(
                  background: listing.photos.isNotEmpty
                      ? CachedNetworkImage(
                          imageUrl: listing.photos.first.url,
                          fit: BoxFit.cover,
                          placeholder: (context, url) => Container(
                            color: AppColors.stallPaper,
                          ),
                          errorWidget: (context, url, error) => Container(
                            color: AppColors.stallPaper,
                            child: const Icon(Icons.broken_image, size: 48),
                          ),
                        )
                      : Container(
                          color: AppColors.stallPaper,
                          child: const Icon(Icons.photo_camera_outlined,
                              size: 48, color: AppColors.dustyCloud),
                        ),
                ),
              ),
              // Content
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Price
                      PriceTag(price: listing.askingPrice),
                      const SizedBox(height: 16),
                      // Title
                      Text(
                        listing.title,
                        style: Theme.of(context)
                            .textTheme
                            .headlineSmall
                            ?.copyWith(fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 12),
                      // Meta row
                      Row(
                        children: [
                          ConditionChip(condition: listing.condition),
                          const SizedBox(width: 8),
                          if (listing.district.isNotEmpty) ...[
                            const Icon(Icons.location_on_outlined, size: 16),
                            const SizedBox(width: 4),
                            Text(listing.district),
                          ],
                        ],
                      ),
                      const SizedBox(height: 20),
                      // Description
                      if (listing.description != null &&
                          listing.description!.isNotEmpty) ...[
                        Text(
                          l.createLabelDescription,
                          style: Theme.of(context)
                              .textTheme
                              .titleMedium
                              ?.copyWith(fontWeight: FontWeight.w600),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          listing.description!,
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                        const SizedBox(height: 20),
                      ],
                      // Seller info
                      const Divider(),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          const CircleAvatar(
                            backgroundColor: AppColors.awningShade,
                            child: Icon(Icons.person, color: AppColors.slateSmoke),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  l.listingSeller,
                                  style: Theme.of(context).textTheme.bodySmall,
                                ),
                                const TrustBadge(tier: 'NEW'),
                              ],
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.flag_outlined),
                            onPressed: () =>
                                ReportSheet.show(context, ref, listing),
                          ),
                        ],
                      ),
                      const SizedBox(height: 80),
                    ],
                  ),
                ),
              ),
            ],
          ),
          // Bottom action bar
          bottomNavigationBar: SafeArea(
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Theme.of(context).scaffoldBackgroundColor,
                border: const Border(
                    top: BorderSide(color: AppColors.borderSoft)),
              ),
              child: isOwner
                  ? Row(
                      children: [
                        Expanded(
                          child: FilledButton.icon(
                            onPressed: () =>
                                context.push('/listings/${listing.id}/edit'),
                            icon: const Icon(Icons.edit_outlined),
                            label: Text(l.createEditTitle),
                            style: FilledButton.styleFrom(
                              backgroundColor: AppColors.indigo,
                              foregroundColor: Colors.white,
                              minimumSize: const Size(double.infinity, 52),
                            ),
                          ),
                        ),
                      ],
                    )
                  : FilledButton.icon(
                      onPressed: () =>
                          OfferSheet.show(context, ref, listing),
                      icon: const Icon(Icons.local_offer_outlined),
                      label: Text(
                        l.listingMakeOffer,
                        style: const TextStyle(
                            fontSize: 16, fontWeight: FontWeight.w700),
                      ),
                      style: FilledButton.styleFrom(
                        backgroundColor: AppColors.coral,
                        foregroundColor: AppColors.warmWhite,
                        minimumSize: const Size(double.infinity, 52),
                      ),
                    ),
            ),
          ),
        );
      },
      loading: () => const Scaffold(
        body: LoadingIndicator(),
      ),
      error: (e, _) => Scaffold(
        body: ErrorView(
          message: e.toString(),
          onRetry: () => ref.invalidate(listingByIdProvider(id)),
        ),
      ),
    );
  }
}
