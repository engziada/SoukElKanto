import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { api } from '@/lib/api';
import { ListingCard } from '@/components/ListingCard';
import { EmptySearchState } from '@/components/EmptySearchState/EmptySearchState';
import { ListingCardSkeletonGrid } from '@/components/ListingCardSkeleton/ListingCardSkeletonGrid';
import { FilterButton } from './FilterButton';
import { SortSelect } from './SortSelect';
import { Pagination } from './Pagination';
import styles from './listings.module.css';

async function ListingsGrid({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const t = await getTranslations();

  const query: Record<string, string> = {};
  if (searchParams.q) query.q = String(searchParams.q);
  if (searchParams.category) query.category = String(searchParams.category);
  if (searchParams.condition) query.condition = String(searchParams.condition);
  if (searchParams.district) query.district = String(searchParams.district);
  if (searchParams.sort) query.sort = String(searchParams.sort);
  if (searchParams.page) query.page = String(searchParams.page);

  let listings: Awaited<ReturnType<typeof api.listings.list>> | null = null;
  let networkDown = false;

  try {
    listings = await api.listings.list(query);
  } catch {
    networkDown = true;
  }

  if (networkDown) {
    return (
      <div className={styles.empty}>
        <p>{t('errors.networkDown')}</p>
      </div>
    );
  }

  const hasSearchQuery = Boolean(searchParams.q);
  const hasFilters =
    Boolean(searchParams.category) ||
    Boolean(searchParams.condition) ||
    Boolean(searchParams.district);
  const isEmpty = !listings || listings.data.length === 0;

  if (isEmpty && hasSearchQuery) {
    let suggestions: Awaited<ReturnType<typeof api.listings.list>> | null = null;
    try {
      suggestions = await api.listings.list({ limit: '4' });
    } catch {
      suggestions = null;
    }
    return (
      <EmptySearchState
        query={String(searchParams.q)}
        suggestions={suggestions?.data ?? []}
      />
    );
  }

  if (isEmpty) {
    return (
      <div className={styles.empty}>
        <p>{t('errors.emptyResults')}</p>
        <p className={styles.emptyHint}>
          {hasFilters ? t('filters.clear') : t('errors.beFirst')}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className={styles.grid}>
        {listings!.data.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
      <Pagination
        page={listings!.pagination.page}
        totalPages={listings!.pagination.total_pages}
        totalItems={listings!.pagination.total_items}
      />
    </>
  );
}

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations();
  const params = await searchParams;

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t('nav.listings')}</h1>
        <div className={styles.headerActions}>
          <SortSelect />
          <FilterButton />
        </div>
      </div>

      <Suspense fallback={<ListingCardSkeletonGrid count={8} />}>
        <ListingsGrid searchParams={params} />
      </Suspense>
    </div>
  );
}
