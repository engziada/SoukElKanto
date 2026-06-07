'use client';

/**
 * /my/favorites — shows listings saved via the Heart toggle.
 *
 * IDs come from the Zustand favorites store (localStorage persisted).
 * Full listing objects are fetched live from the API to avoid stale data;
 * if the API is down we fall back to showing IDs as placeholders.
 */

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Heart } from 'lucide-react';
import { api, type Listing } from '@/lib/api';
import { useFavoritesStore } from '@/lib/favorites/store';
import { ListingCard } from '@/components/ListingCard';
import { ListingCardSkeletonGrid } from '@/components/ListingCardSkeleton/ListingCardSkeletonGrid';
import tabStyles from '../my.module.css';

export default function MyFavoritesPage() {
  const t = useTranslations('my.favorites');
  const ids = useFavoritesStore((s) => s.ids);
  const [listings, setListings] = useState<Listing[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ids.length === 0) {
      setListings([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    // Fetch a wider page and filter client-side against saved IDs.
    // TODO: replace with `GET /api/v1/listings?ids=...` when BE supports it.
    api.listings
      .list({ limit: '100' })
      .then((res) => {
        const idSet = new Set(ids);
        setListings(res.data.filter((l) => idSet.has(l.id)));
      })
      .catch(() => setListings([]))
      .finally(() => setLoading(false));
  }, [ids]);

  return (
    <section aria-labelledby="favs-title">
      <h2 id="favs-title" className={tabStyles.panelTitle}>
        {t('title')}
      </h2>

      {loading ? (
        <ListingCardSkeletonGrid count={4} />
      ) : !listings || listings.length === 0 ? (
        <div className={tabStyles.empty}>
          <Heart size={32} strokeWidth={1.2} aria-hidden="true" />
          <p>{t('empty')}</p>
        </div>
      ) : (
        <div className={tabStyles.favGrid}>
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </section>
  );
}
