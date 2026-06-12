'use client';

/**
 * /my/handovers — R-03a
 *
 * Sections (top-to-bottom):
 *   1. "Awaiting your confirmation" — the offer is ACCEPTED but the current
 *      user hasn't tapped Confirm yet.
 *   2. "Awaiting counterpart" — current user already confirmed; the other
 *      party hasn't.
 *   3. "Completed" — both parties confirmed (bothConfirmedAt set). Offers
 *      here show a "Rate counterpart" CTA when the current user hasn't yet
 *      submitted a rating.
 *
 * Data is pulled from listSent + listReceived. Each offer carries the inline
 * handover + ratings summary (see BE update to listSent/listReceivedOffers).
 */

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Handshake, Check, Clock, Star } from 'lucide-react';
import { useAuthStore } from '@/lib/auth/store';
import { useToast } from '@/components/Toast';
import { api } from '@/lib/api';
import { qk, fetchOffersSent, fetchOffersReceived } from '@/lib/queries';
import type { Offer } from '@/lib/api';
import { RatingModal } from '@/components/RatingModal';
import tabStyles from '../my.module.css';
import styles from './handovers.module.css';

type Section = 'pendingMine' | 'awaitingOther' | 'completed';

function ListingThumb({ offer }: { offer: Offer }) {
  const photoUrl = offer.listing?.photos?.[0]?.url;
  if (photoUrl) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={photoUrl}
        alt={offer.listing?.title ?? ''}
        className={styles.thumb}
      />
    );
  }
  return <div className={styles.thumbFallback} aria-hidden="true">{(offer.listing?.title ?? '?').charAt(0)}</div>;
}

export default function MyHandoversPage() {
  const t = useTranslations('my.handovers');
  const tListing = useTranslations('listing');
  const locale = useLocale();
  const user = useAuthStore((s) => s.user);
  const toast = useToast();
  const queryClient = useQueryClient();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [ratingFor, setRatingFor] = useState<Offer | null>(null);

  const { data: sent } = useQuery({
    queryKey: qk.offersSent(),
    queryFn: fetchOffersSent,
    enabled: Boolean(user),
  });
  const { data: received } = useQuery({
    queryKey: qk.offersReceived(),
    queryFn: fetchOffersReceived,
    enabled: Boolean(user),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: qk.offersSent() });
    queryClient.invalidateQueries({ queryKey: qk.offersReceived() });
  };

  const confirmMut = useMutation({
    mutationFn: (id: string) => api.offers.confirmHandover(id),
    onSuccess: () => { toast.success(t('confirmedToast')); invalidate(); },
    onError: () => toast.error(t('actionError')),
  });

  if (!mounted || !user) {
    return <div className={tabStyles.empty} aria-busy="true">…</div>;
  }

  // Merge sent + received without duplicates (an offer appears in only one
  // list for any given user, but defensive de-dupe by id keeps us safe).
  const allMap = new Map<string, Offer>();
  for (const o of sent ?? []) allMap.set(o.id, o);
  for (const o of received ?? []) allMap.set(o.id, o);
  const accepted = Array.from(allMap.values()).filter(
    (o) => o.status === 'ACCEPTED' || o.status === 'HANDOVER_PENDING' || o.status === 'CONFIRMED',
  );

  /** Derive which section a given offer belongs to, from the current user POV. */
  function sectionOf(offer: Offer): Section {
    const isBuyer = offer.buyerId === user!.id;
    const h = offer.handover ?? {};
    const myConfirmed = isBuyer ? !!h.buyerConfirmedAt : !!h.sellerConfirmedAt;
    const otherConfirmed = isBuyer ? !!h.sellerConfirmedAt : !!h.buyerConfirmedAt;
    if (myConfirmed && otherConfirmed) return 'completed';
    if (myConfirmed && !otherConfirmed) return 'awaitingOther';
    return 'pendingMine';
  }

  const grouped: Record<Section, Offer[]> = {
    pendingMine: [],
    awaitingOther: [],
    completed: [],
  };
  for (const o of accepted) grouped[sectionOf(o)].push(o);

  function hasRated(offer: Offer): boolean {
    return (offer.ratings ?? []).some((r) => r.raterId === user!.id);
  }

  function counterpartLabel(offer: Offer): string {
    return offer.buyerId === user!.id ? t('counterpartSeller') : t('counterpartBuyer');
  }

  function renderRow(offer: Offer, section: Section) {
    return (
      <li key={offer.id} className={styles.row}>
        <div className={styles.rowMain}>
          <ListingThumb offer={offer} />
          <div className={styles.rowText}>
            <p className={styles.listingTitle}>{offer.listing?.title ?? '—'}</p>
            <p className={styles.amount}>
              {offer.amount.toLocaleString()} {tListing('price')}
            </p>
            <p className={styles.counterpart}>{counterpartLabel(offer)}</p>
          </div>
        </div>

        <div className={styles.rowActions}>
          {section === 'pendingMine' && (
            <button
              type="button"
              className={`${styles.actionBtn} ${styles.confirm}`}
              disabled={confirmMut.isPending}
              onClick={() => confirmMut.mutate(offer.id)}
            >
              <Check size={14} aria-hidden="true" />
              {t('confirm')}
            </button>
          )}
          {section === 'awaitingOther' && (
            <span className={`${styles.statusChip} ${styles.statusAwaiting}`}>
              <Clock size={12} aria-hidden="true" />
              {t('awaitingOther')}
            </span>
          )}
          {section === 'completed' && hasRated(offer) && (
            <span className={`${styles.statusChip} ${styles.statusDone}`}>
              <Star size={12} aria-hidden="true" />
              {t('rated')}
            </span>
          )}
          {section === 'completed' && !hasRated(offer) && (
            <button
              type="button"
              className={`${styles.actionBtn} ${styles.rate}`}
              onClick={() => setRatingFor(offer)}
            >
              <Star size={14} aria-hidden="true" />
              {t('rateCounterpart')}
            </button>
          )}
        </div>

        <div className={styles.rowMeta}>
          <span className={styles.ts}>
            {new Date(offer.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US')}
          </span>
        </div>
      </li>
    );
  }

  function renderSection(section: Section, title: string) {
    const rows = grouped[section];
    if (rows.length === 0) return null;
    return (
      <section className={styles.section} aria-labelledby={`handover-${section}-title`}>
        <h3 id={`handover-${section}-title`} className={styles.sectionTitle}>
          {title}
          <span className={styles.sectionCount}>{rows.length}</span>
        </h3>
        <ul className={styles.list}>{rows.map((o) => renderRow(o, section))}</ul>
      </section>
    );
  }

  const hasAny = accepted.length > 0;

  return (
    <section aria-labelledby="handovers-title">
      <header className={styles.header}>
        <h2 id="handovers-title" className={tabStyles.panelTitle}>
          {t('title')}
        </h2>
      </header>

      {!hasAny ? (
        <div className={tabStyles.empty}>
          <Handshake size={32} strokeWidth={1.2} aria-hidden="true" />
          <p>{t('empty')}</p>
        </div>
      ) : (
        <div className={styles.sections}>
          {renderSection('pendingMine', t('pendingMine'))}
          {renderSection('awaitingOther', t('awaitingOther'))}
          {renderSection('completed', t('completed'))}
        </div>
      )}

      {ratingFor && (
        <RatingModal
          offer={ratingFor}
          onClose={() => setRatingFor(null)}
          onRated={() => {
            setRatingFor(null);
            invalidate();
            toast.success(t('rated'));
          }}
        />
      )}
    </section>
  );
}
