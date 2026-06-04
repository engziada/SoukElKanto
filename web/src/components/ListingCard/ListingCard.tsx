'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { MapPin, Heart, ImageOff, BadgeCheck } from 'lucide-react';
import type { Listing } from '@/lib/api';
import styles from './ListingCard.module.css';

interface ListingCardProps {
  listing: Listing;
}

export function ListingCard({ listing }: ListingCardProps) {
  const locale = useLocale();
  const t = useTranslations();
  const [saved, setSaved] = useState(false);
  const primaryPhoto = listing.photos?.find((p) => p.position === 0);

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSaved((s) => !s);
  };

  return (
    <Link href={`/${locale}/listings/${listing.id}`} className={styles.card}>
      <div className={styles.photoWrap}>
        {primaryPhoto?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={primaryPhoto.url}
            alt={listing.title}
            className={styles.photo}
            loading="lazy"
          />
        ) : (
          <div className={styles.photoPlaceholder} aria-hidden="true">
            <ImageOff size={28} />
          </div>
        )}

        {/* Trust tier badge — placeholder NEW until backend wires real tier data */}
        <span className={styles.trustBadge}>
          <BadgeCheck size={10} />
          {t('listing.tierNew')}
        </span>

        <span className={styles.priceTag}>
          {listing.askingPrice.toLocaleString()} {t('listing.price')}
        </span>
      </div>

      <div className={styles.body}>
        <h3 className={styles.title}>{listing.title}</h3>

        <div className={styles.meta}>
          <span className={styles.district}>
            <MapPin size={12} />
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
