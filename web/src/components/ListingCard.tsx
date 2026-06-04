import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { MapPin, Heart } from 'lucide-react';
import type { Listing } from '@/lib/api';

interface ListingCardProps {
  listing: Listing;
}

export function ListingCard({ listing }: ListingCardProps) {
  const locale = useLocale();
  const t = useTranslations();
  const primaryPhoto = listing.photos?.find((p) => p.position === 0);

  return (
    <Link
      href={`/${locale}/listings/${listing.id}`}
      className="group flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] shadow-[var(--shadow-card)] transition-all duration-200 hover:scale-[1.02] hover:shadow-[var(--shadow-card-hover)]"
    >
      {/* Photo */}
      <div className="relative aspect-[4/3] overflow-hidden bg-[var(--color-surface)]">
        {primaryPhoto ? (
          <img
            src={primaryPhoto.url}
            alt={listing.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[var(--color-text-muted)]">
            <MapPin className="h-8 w-8" />
          </div>
        )}
        {/* Price tag */}
        <div className="absolute bottom-2 right-2 rounded-[var(--radius-sm)] bg-[var(--color-kanto-coral)] px-2.5 py-1 text-sm font-bold text-white">
          {listing.askingPrice.toLocaleString()} {t('listing.price')}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 text-sm font-semibold text-[var(--color-text)]">
          {listing.title}
        </h3>
        <div className="mt-auto flex items-center justify-between text-xs text-[var(--color-text-muted)]">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {listing.district}
          </span>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="rounded-full p-1 hover:bg-[var(--color-kanto-coral-soft)]"
            aria-label={t('listing.save')}
          >
            <Heart className="h-4 w-4 text-[var(--color-text-muted)]" />
          </button>
        </div>
      </div>
    </Link>
  );
}
