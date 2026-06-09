'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { PlusCircle, Eye, Heart } from 'lucide-react';
import { useAuthStore } from '@/lib/auth/store';
import { qk, fetchMyListings } from '@/lib/queries';
import { ListingCard } from '@/components/ListingCard';
import { ListingCardSkeletonGrid } from '@/components/ListingCardSkeleton/ListingCardSkeletonGrid';
import tabStyles from '../my.module.css';
import styles from './my-listings.module.css';

export default function MyListingsPage() {
  const t = useTranslations('my.listings');
  const tStatus = useTranslations('my.listings.status');
  const locale = useLocale();
  const user = useAuthStore((s) => s.user);

  const { data: listings, isLoading } = useQuery({
    queryKey: qk.myListings(),
    queryFn: () => fetchMyListings(user!.id),
    enabled: Boolean(user),
    staleTime: 60_000, // 1 min — my own listings change infrequently
  });

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

      {isLoading ? (
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
          {listings.map((listing, idx) => (
            <li key={listing.id} className={styles.row}>
              <div className={styles.rowCard}>
                <ListingCard listing={listing} priority={idx < 6} />
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
