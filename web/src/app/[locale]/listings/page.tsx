import { getTranslations } from 'next-intl/server';
import { SlidersHorizontal } from 'lucide-react';
import { api } from '@/lib/api';
import { ListingCard } from '@/components/ListingCard';
import { EmptySearchState } from '@/components/EmptySearchState/EmptySearchState';
import styles from './listings.module.css';

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations();
  const params = await searchParams;

  const query: Record<string, string> = {};
  if (params.q) query.q = String(params.q);
  if (params.category) query.category = String(params.category);
  if (params.condition) query.condition = String(params.condition);
  if (params.district) query.district = String(params.district);
  if (params.sort) query.sort = String(params.sort);
  if (params.page) query.page = String(params.page);

  let listings: Awaited<ReturnType<typeof api.listings.list>> | null = null;
  let suggestions: Awaited<ReturnType<typeof api.listings.list>> | null = null;

  try {
    listings = await api.listings.list(query);
  } catch {
    listings = null;
  }

  const hasSearchQuery = Boolean(params.q);
  const isEmpty = !listings || listings.data.length === 0;

  if (isEmpty && hasSearchQuery) {
    try {
      suggestions = await api.listings.list({ limit: '4' });
    } catch {
      suggestions = null;
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t('nav.listings')}</h1>
        <button type="button" className={styles.filterBtn}>
          <SlidersHorizontal size={16} />
          {t('filters.clear')}
        </button>
      </div>

      {listings && listings.data.length > 0 ? (
        <>
          <div className={styles.grid}>
            {listings.data.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
          <div className={styles.bar}>
            <span>{listings.pagination.total_items} {t('nav.listings')}</span>
            <span>{t('filters.sort')}: {t('filters.sortNewest')}</span>
          </div>
        </>
      ) : isEmpty && hasSearchQuery ? (
        <EmptySearchState
          query={String(params.q)}
          suggestions={suggestions?.data ?? []}
        />
      ) : (
        <div className={styles.empty}>
          <p>{t('errors.notFound')}</p>
          <p style={{ fontSize: '0.85rem', marginTop: '0.5rem', opacity: 0.7 }}>
            {t('errors.beFirst')}
          </p>
        </div>
      )}
    </div>
  );
}
