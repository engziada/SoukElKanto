import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import { ListingCard } from '@/components/ListingCard';
import { SlidersHorizontal } from 'lucide-react';

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = useTranslations();
  const params = await searchParams;

  const query: Record<string, string> = {};
  if (params.q) query.q = String(params.q);
  if (params.category) query.category = String(params.category);
  if (params.condition) query.condition = String(params.condition);
  if (params.district) query.district = String(params.district);
  if (params.sort) query.sort = String(params.sort);
  if (params.page) query.page = String(params.page);

  let listings: Awaited<ReturnType<typeof api.listings.list>> | null = null;
  try {
    listings = await api.listings.list(query);
  } catch {
    listings = null;
  }

  return (
    <div className="flex flex-col gap-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--color-text)]">
          {t('nav.listings')}
        </h1>
        <button className="flex items-center gap-2 rounded-full border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text-soft)] hover:bg-[var(--color-surface)]">
          <SlidersHorizontal className="h-4 w-4" />
          {t('filters.clear')}
        </button>
      </div>

      {listings && listings.data.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {listings.data.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
          <div className="flex items-center justify-between text-sm text-[var(--color-text-muted)]">
            <span>
              {listings.pagination.total_items} {t('nav.listings')}
            </span>
            <span>
              {t('filters.sort')}: {t('filters.sortNewest')}
            </span>
          </div>
        </>
      ) : (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center text-[var(--color-text-muted)]">
          {t('errors.notFound')}
        </div>
      )}
    </div>
  );
}
