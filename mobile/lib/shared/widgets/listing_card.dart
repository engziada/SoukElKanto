import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/api/models.dart';
import '../../core/theme/app_colors.dart';
import 'price_tag.dart';
import 'trust_badge.dart';

/// A card displaying a listing summary — used in grids and lists.
class ListingCard extends StatelessWidget {
  const ListingCard({
    super.key,
    required this.listing,
    this.onTap,
    this.isFavorite = false,
    this.onFavoriteToggle,
    this.showFavoriteButton = true,
  });

  final Listing listing;
  final VoidCallback? onTap;
  final bool isFavorite;
  final VoidCallback? onFavoriteToggle;
  final bool showFavoriteButton;

  @override
  Widget build(BuildContext context) {
    final photo = listing.primaryPhoto;
    final theme = Theme.of(context);

    return GestureDetector(
      onTap: onTap ?? () => context.push('/listings/${listing.id}'),
      child: Container(
        decoration: BoxDecoration(
          color: theme.brightness == Brightness.dark
              ? AppColors.darkSurface
              : AppColors.stallLinen,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: theme.brightness == Brightness.dark
                ? AppColors.darkBorder
                : AppColors.borderSoft,
          ),
          boxShadow: AppColors.cardShadow,
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Photo
            Expanded(
              flex: 3,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  if (photo != null && photo.url.isNotEmpty)
                    CachedNetworkImage(
                      imageUrl: photo.url,
                      fit: BoxFit.cover,
                      placeholder: (context, url) => _PhotoPlaceholder(),
                      errorWidget: (context, url, error) =>
                          _PhotoPlaceholder(),
                    )
                  else
                    _PhotoPlaceholder(),
                  // Favorite button
                  if (showFavoriteButton)
                    Positioned(
                      top: 8,
                      right: 8,
                      child: GestureDetector(
                        onTap: onFavoriteToggle,
                        child: Container(
                          padding: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            color: Colors.black.withValues(alpha: 0.3),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            isFavorite
                                ? Icons.favorite
                                : Icons.favorite_border,
                            color: isFavorite
                                ? AppColors.coral
                                : Colors.white,
                            size: 18,
                          ),
                        ),
                      ),
                    ),
                  // Status badge if not active
                  if (listing.status != ListingStatus.active)
                    Positioned(
                      top: 8,
                      left: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: _statusColor(listing.status),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          listing.status.name,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
            // Info
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    listing.title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: theme.textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 4),
                  PriceTag(price: listing.askingPrice, compact: true),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const TrustBadge(tier: 'NEW', compact: true),
                      const SizedBox(width: 6),
                      if (listing.district.isNotEmpty)
                        Expanded(
                          child: Row(
                            children: [
                              Icon(
                                Icons.location_on_outlined,
                                size: 12,
                                color: theme.textTheme.bodySmall?.color,
                              ),
                              const SizedBox(width: 2),
                              Flexible(
                                child: Text(
                                  listing.district,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: theme.textTheme.bodySmall,
                                ),
                              ),
                            ],
                          ),
                        ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Color _statusColor(ListingStatus status) {
    return switch (status) {
      ListingStatus.reserved => AppColors.honey,
      ListingStatus.sold => AppColors.mint,
      ListingStatus.pendingReview => AppColors.lilac,
      ListingStatus.removed => Colors.grey,
      ListingStatus.expired => Colors.orange.shade700,
      ListingStatus.active => AppColors.coral,
    };
  }
}

class _PhotoPlaceholder extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.stallPaper,
      child: const Center(
        child: Icon(
          Icons.photo_camera_outlined,
          size: 32,
          color: AppColors.dustyCloud,
        ),
      ),
    );
  }
}
