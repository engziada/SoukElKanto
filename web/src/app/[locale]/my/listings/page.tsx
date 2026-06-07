'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { PlusCircle, Eye, Heart } from 'lucide-react';
import { api, type Listing } from '@/lib/api';
import { useAuthStore } from '@/lib/auth/store';
import { ListingCard } from '@/components/ListingCard';
import { ListingCardSkeletonGrid } from '@/components/ListingCardSkeleton/ListingCardSkeletonGrid';
import tabStyles from '../my.module.css';
import styles from './my-listings.module.css';

export default function MyListingsPage() {
  const t = useTranslations('my.listings');
  const tStatus = useTranslations('my.listings.status');
  const locale = useLocale();
  const user = useAuthStore((s) => s.user);

  const [listings, setListings] = useState<Listing[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    // Fetch all listings then filter by sellerId.
    // TODO: replace with `GET /api/v1/listings?sellerId=me` once BE supports it.
    api.listings
      .list({ limit: '50' })
      .then((res) => {
        setListings(res.data.filter((l) => l.sellerId === user.id));
      })
      .catch(() => setListings([]))
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <section aria-labelledby="my-listings-title">
      <header className={styles.header}>
        <h2 id="my-listings-title" className={tabStyles.panelTitle}>
          {t('title')}
        </h2>
        <Link href={`/${locale}/listings/new`} className={styles.cta}>
          <PlusCircle size={16} aria-hidden="true" />
          {t('publishCta')}
        </Link>
      </header>

      {loading ? (
        <ListingCardSkeletonGrid count={4} />
      ) : !listings || listings.length === 0 ? (
        <div className={tabStyles.empty}>
          <p>{t('empty')}</p>
          <Link href={`/${locale}/listings/new`} className={styles.emptyCta}>
            <PlusCircle size={16} aria-hidden="true" />
            {t('publishCta')}
          </Link>
        </div>
      ) : (
        <ul className={styles.list}>
          {listings.map((listing) => (
            <li key={listing.id} className={styles.row}>
              <div className={styles.rowCard}>
                <ListingCard listing={listing} />
              </div>
              <aside className={styles.rowMeta}>
                <span
                  className={`${styles.statusChip} ${
                    styles[`status_${listing.status}`] ?? styles.statusDefault
                  }`}
                >
                  {tStatus(listing.status as Parameters<typeof tStatus>[0])}
                </span>
                <span className={styles.stat}>
                  <Eye size={12} aria-hidden="true" />
                  {listing.viewCount.toLocaleString()} {t('viewing')}
                </span>
                <span className={styles.stat}>
                  <Heart size={12} aria-hidden="true" />
                  {t('saves')}
                </span>
              </aside>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
