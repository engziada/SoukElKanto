import { useTranslations } from 'next-intl';
import { Search, ShieldCheck, MapPin, Coins } from 'lucide-react';
import { api } from '@/lib/api';
import { ListingCard } from '@/components/ListingCard';

export default async function HomePage() {
  const t = useTranslations();
  let listings: Awaited<ReturnType<typeof api.listings.list>> | null = null;

  try {
    listings = await api.listings.list({ limit: '12' });
  } catch {
    listings = null;
  }

  return (
    <div className="flex flex-col gap-12 py-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[var(--radius-xl)] bg-[var(--color-kanto-stall)] p-8 text-center md:p-12">
        <h1 className="mb-3 text-3xl font-bold text-[var(--color-text)] md:text-5xl">
          {t('hero.title')}
        </h1>
        <p className="mx-auto mb-6 max-w-xl text-[var(--color-text-soft)] md:text-lg">
          {t('hero.subtitle')}
        </p>
        <div className="mx-auto flex max-w-lg items-center gap-2 rounded-full bg-[var(--color-bg)] px-4 py-3 shadow-[var(--shadow-card)]">
          <Search className="h-5 w-5 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder={t('hero.searchPlaceholder')}
            className="flex-1 bg-transparent text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)]"
          />
        </div>
      </section>

      {/* New Listings */}
      <section>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[var(--color-text)]">
            {t('home.newListings')}
          </h2>
        </div>

        {listings && listings.data.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {listings.data.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center text-[var(--color-text-muted)]">
            {t('errors.notFound')}
          </div>
        )}
      </section>

      {/* Trust Banner */}
      <section className="flex flex-wrap items-center justify-center gap-6 rounded-[var(--radius-lg)] bg-[var(--color-teal-soft)] px-6 py-4 text-sm font-medium text-[var(--color-teal)]">
        <span className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" />
          {t('home.trustBanner').split('·')[0]?.trim()}
        </span>
        <span className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          {t('home.trustBanner').split('·')[1]?.trim()}
        </span>
        <span className="flex items-center gap-2">
          <Coins className="h-4 w-4" />
          {t('home.trustBanner').split('·')[2]?.trim()}
        </span>
      </section>
    </div>
  );
}
