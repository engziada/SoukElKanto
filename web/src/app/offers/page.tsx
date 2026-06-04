import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import { Tag, Clock } from 'lucide-react';

export default async function OffersPage() {
  const t = useTranslations();

  let sent: Awaited<ReturnType<typeof api.offers.listSent>> | null = null;
  let received: Awaited<ReturnType<typeof api.offers.listReceived>> | null = null;

  try {
    sent = await api.offers.listSent();
    received = await api.offers.listReceived();
  } catch {
    sent = null;
    received = null;
  }

  const allOffers = [...(sent ?? []), ...(received ?? [])];

  return (
    <div className="flex flex-col gap-8 py-8">
      <h1 className="text-2xl font-bold text-[var(--color-text)]">
        {t('nav.offers')}
      </h1>

      {allOffers.length > 0 ? (
        <div className="grid gap-4">
          {allOffers.map((offer) => (
            <div
              key={offer.id}
              className="flex items-center justify-between rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4 shadow-[var(--shadow-card)]"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-kanto-coral-soft)]">
                  <Tag className="h-5 w-5 text-[var(--color-kanto-coral)]" />
                </div>
                <div>
                  <div className="font-semibold text-[var(--color-text)]">
                    {offer.amount.toLocaleString()} {t('listing.price')}
                  </div>
                  <div className="text-xs text-[var(--color-text-muted)]">
                    {offer.status}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                <Clock className="h-3 w-3" />
                {new Date(offer.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center text-[var(--color-text-muted)]">
          {t('errors.notFound')}
        </div>
      )}
    </div>
  );
}
