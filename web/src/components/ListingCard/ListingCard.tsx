'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { MapPin, Heart, BadgeCheck } from 'lucide-react';
import type { Listing } from '@/lib/api';
import {
  deriveTierFromId,
  tierLabelKey,
  tierClassMap,
} from '@/lib/trustTier';
import { useFavoritesStore } from '@/lib/favorites/store';
import styles from './ListingCard.module.css';

interface ListingCardProps {
  listing: Listing;
}

/**
 * Build a stable Picsum URL from the listing id when no real photos exist yet.
 * Picsum returns 200 with a deterministic image per seed, so demo cards always
 * render rich content. Replace once R2 photo upload lands.
 */
function fallbackPhotoUrl(listingId: string, size = '640/480'): string {
  return `https://picsum.photos/seed/${encodeURIComponent(listingId)}/${size}`;
}

export function ListingCard({ listing }: ListingCardProps) {
  const locale = useLocale();
  const t = useTranslations();
  const { toggle: toggleFavorite, isSaved } = useFavoritesStore();
  const saved = isSaved(listing.id);
  const primaryPhoto = listing.photos?.find((p) => p.position === 0);
  const photoUrl = primaryPhoto?.url || fallbackPhotoUrl(listing.id);

  // Demo: mix listing id with seller id so we see tier variety on a 1-seller seed.
  // In production this becomes `seller.trustMeter.tier` from the listings payload.
  const tier = deriveTierFromId(`${listing.sellerId}::${listing.id}`);

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(listing.id);
  };

  return (
    <Link href={`/${locale}/listings/${listing.id}`} className={styles.card}>
      <div className={styles.photoWrap}>
        <Image
          src={photoUrl}
          alt={listing.title}
          className={styles.photo}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />

        <span
          className={`${styles.trustBadge} ${styles[tierClassMap[tier]]}`}
          aria-label={t(`listing.${tierLabelKey(tier)}`)}
        >
          <BadgeCheck size={10} aria-hidden="true" />
          {t(`listing.${tierLabelKey(tier)}`)}
        </span>

        <span className={styles.priceTag}>
          <span className={styles.priceAmount}>
            {listing.askingPrice.toLocaleString()}
          </span>
          <span className={styles.priceUnit}>{t('listing.price')}</span>
        </span>
      </div>

      <div className={styles.body}>
        <h3 className={styles.title}>{listing.title}</h3>

        <div className={styles.meta}>
          <span className={styles.district}>
            <MapPin size={12} aria-hidden="true" />
            {listing.district}
          </span>
          <button
            type="button"
            onClick={handleSave}
            className={`${styles.fav} ${saved ? styles.favActive : ''}`}
            aria-label={saved ? t('listing.unsave') : t('listing.save')}
            aria-pressed={saved}
          >
            <Heart size={14} fill={saved ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>
    </Link>
  );
}
