import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import { MapPin, Heart, Share2, Flag, ShieldCheck } from 'lucide-react';

interface ListingDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ListingDetailPage({ params }: ListingDetailPageProps) {
  const t = useTranslations();
  const { id } = await params;

  let listing: Awaited<ReturnType<typeof api.listings.get>> | null = null;
  try {
    listing = await api.listings.get(id);
  } catch {
    listing = null;
  }

  if (!listing) {
    return (
      <div className="py-12 text-center text-[var(--color-text-muted)]">
        {t('errors.notFound')}
      </div>
    );
  }

  const primaryPhoto = listing.photos?.find((p) => p.position === 0);

  return (
    <div className="grid gap-8 py-8 md:grid-cols-2">
      {/* Photos */}
      <div className="flex flex-col gap-4">
        <div className="aspect-[4/3] overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-surface)]">
          {primaryPhoto ? (
            <img
              src={primaryPhoto.url}
              alt={listing.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[var(--color-text-muted)]">
              <MapPin className="h-12 w-12" />
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-6">
        <div>
          <div className="mb-2 text-3xl font-bold text-[var(--color-kanto-coral)]">
            {listing.askingPrice.toLocaleString()} {t('listing.price')}
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">
            {listing.title}
          </h1>
        </div>

        {/* Trust panel */}
        <div className="flex items-center gap-3 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-teal-soft)]">
            <ShieldCheck className="h-5 w-5 text-[var(--color-teal)]" />
          </div>
          <div>
            <div className="text-sm font-semibold text-[var(--color-text)]">
              {t('listing.kycVerified')}
            </div>
            <div className="text-xs text-[var(--color-text-muted)]">
              {t('listing.memberSince')} — {listing.district}
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-[var(--color-kanto-coral-soft)] px-3 py-1 text-xs font-medium text-[var(--color-kanto-coral)]">
            {t(`categories.${listing.category}`)}
          </span>
          <span className="rounded-full bg-[var(--color-surface)] px-3 py-1 text-xs font-medium text-[var(--color-text-soft)]">
            {t(`conditions.${listing.condition}`)}
          </span>
          <span className="flex items-center gap-1 rounded-full bg-[var(--color-surface)] px-3 py-1 text-xs font-medium text-[var(--color-text-soft)]">
            <MapPin className="h-3 w-3" />
            {listing.district}
          </span>
        </div>

        <p className="text-[var(--color-text-soft)] leading-relaxed">
          {listing.description}
        </p>

        {/* Actions */}
        <div className="mt-auto flex flex-col gap-3">
          <button className="w-full rounded-[var(--radius-md)] bg-[var(--color-kanto-coral)] py-3 text-center font-semibold text-white shadow-[var(--shadow-card)] hover:opacity-90">
            {t('listing.makeOffer')}
          </button>
          <div className="flex gap-3">
            <button className="flex flex-1 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] py-2.5 text-sm font-medium text-[var(--color-text-soft)] hover:bg-[var(--color-surface)]">
              <Heart className="h-4 w-4" />
              {t('listing.save')}
            </button>
            <button className="flex flex-1 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] py-2.5 text-sm font-medium text-[var(--color-text-soft)] hover:bg-[var(--color-surface)]">
              <Share2 className="h-4 w-4" />
              {t('listing.share')}
            </button>
            <button className="flex flex-1 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] py-2.5 text-sm font-medium text-[var(--color-text-soft)] hover:bg-[var(--color-surface)]">
              <Flag className="h-4 w-4" />
              {t('listing.report')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
