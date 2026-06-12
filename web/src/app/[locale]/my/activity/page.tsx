'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import {
  History, Tag, ArrowDownToLine, ArrowUpFromLine, Handshake, Award,
  XCircle, Clock,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth/store';
import { api, type Listing, type Offer } from '@/lib/api';
import tabStyles from '../my.module.css';
import styles from './activity.module.css';

/**
 * Activity event — one row in the unified history feed.
 *
 * Activity aggregates four sources into a single timeline:
 *  - Listings I created (any status — ACTIVE / RESERVED / REMOVED / EXPIRED)
 *  - Offers I sent (any status, plus their handover + ratings)
 *  - Offers I received (any status, plus their handover + ratings)
 *  - Ratings I gave + received (derived from offers.ratings)
 *
 * Each source maps onto an EventKind below. The whole feed is sorted by `at`
 * (newest first), then filtered client-side by the role/status/date pills.
 */
type EventKind =
  | 'listing'
  | 'offer_sent'
  | 'offer_received'
  | 'handover'
  | 'rating_given'
  | 'rating_received';

type Role = 'all' | 'buyer' | 'seller';
type StatusBucket = 'all' | 'pending' | 'completed' | 'cancelled';
type DateBucket = 'all' | '7d' | '30d' | '90d';

interface ActivityEvent {
  id: string;
  kind: EventKind;
  at: string; // ISO date
  role: 'buyer' | 'seller';
  status: StatusBucket;
  title: string;
  amount?: number;
  listingId?: string;
  offerId?: string;
}

// Buckets:
//  - pending    = offer/handover still open and waiting on someone
//  - completed  = offer CONFIRMED/CLOSED (deal done) or rating given
//  - cancelled  = DECLINED / WITHDRAWN / EXPIRED / REMOVED listings
function offerStatusToBucket(offerStatus: string): StatusBucket {
  switch (offerStatus) {
    case 'PENDING':
    case 'ACCEPTED':
    case 'COUNTERED':
    case 'HANDOVER_PENDING':
      return 'pending';
    case 'CONFIRMED':
    case 'CLOSED':
      return 'completed';
    case 'DECLINED':
    case 'WITHDRAWN':
    case 'EXPIRED':
      return 'cancelled';
    default:
      return 'pending';
  }
}

function listingStatusToBucket(listingStatus: string): StatusBucket {
  switch (listingStatus) {
    case 'ACTIVE':
    case 'RESERVED':
    case 'PENDING_REVIEW':
      return 'pending';
    case 'REMOVED':
    case 'EXPIRED':
      return 'cancelled';
    default:
      return 'pending';
  }
}

function eventIcon(kind: EventKind) {
  switch (kind) {
    case 'listing':         return Tag;
    case 'offer_sent':      return ArrowUpFromLine;
    case 'offer_received':  return ArrowDownToLine;
    case 'handover':        return Handshake;
    case 'rating_given':
    case 'rating_received': return Award;
  }
}

function dateBucketCutoff(bucket: DateBucket): Date | null {
  if (bucket === 'all') return null;
  const days = bucket === '7d' ? 7 : bucket === '30d' ? 30 : 90;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

export default function MyActivityPage() {
  const t = useTranslations('my.activity');
  const tListing = useTranslations('listing');
  const locale = useLocale();
  const user = useAuthStore((s) => s.user);

  const [role, setRole] = useState<Role>('all');
  const [statusBucket, setStatusBucket] = useState<StatusBucket>('all');
  const [dateBucket, setDateBucket] = useState<DateBucket>('all');

  const { data: listings = [], isLoading: loadingListings } = useQuery({
    queryKey: ['activity', 'listings'],
    queryFn: () => api.listings.listMine(),
    enabled: Boolean(user),
  });
  const { data: sent = [], isLoading: loadingSent } = useQuery({
    queryKey: ['activity', 'offersSent'],
    queryFn: () => api.offers.listSent(),
    enabled: Boolean(user),
  });
  const { data: received = [], isLoading: loadingReceived } = useQuery({
    queryKey: ['activity', 'offersReceived'],
    queryFn: () => api.offers.listReceived(),
    enabled: Boolean(user),
  });

  const isLoading = loadingListings || loadingSent || loadingReceived;

  // ── Aggregate into a single timeline ─────────────────────────────────────
  const events = useMemo<ActivityEvent[]>(() => {
    const out: ActivityEvent[] = [];

    for (const l of listings as Listing[]) {
      out.push({
        id: `l:${l.id}`,
        kind: 'listing',
        at: l.createdAt,
        role: 'seller',
        status: listingStatusToBucket(l.status),
        title: l.title,
        amount: l.askingPrice,
        listingId: l.id,
      });
    }

    for (const o of sent as Offer[]) {
      out.push({
        id: `os:${o.id}`,
        kind: 'offer_sent',
        at: o.createdAt,
        role: 'buyer',
        status: offerStatusToBucket(o.status),
        title: o.listing?.title ?? '—',
        amount: o.amount,
        listingId: o.listingId,
        offerId: o.id,
      });
      if (o.handover?.bothConfirmedAt) {
        out.push({
          id: `h:${o.id}`,
          kind: 'handover',
          at: o.handover.bothConfirmedAt,
          role: 'buyer',
          status: 'completed',
          title: o.listing?.title ?? '—',
          amount: o.amount,
          listingId: o.listingId,
          offerId: o.id,
        });
      }
      for (const r of o.ratings ?? []) {
        const isMine = r.raterId === user?.id;
        out.push({
          id: `${isMine ? 'rg' : 'rr'}:${r.id}`,
          kind: isMine ? 'rating_given' : 'rating_received',
          at: o.handover?.bothConfirmedAt ?? o.createdAt,
          role: 'buyer',
          status: 'completed',
          title: o.listing?.title ?? '—',
          amount: r.score,
          listingId: o.listingId,
          offerId: o.id,
        });
      }
    }

    for (const o of received as Offer[]) {
      out.push({
        id: `or:${o.id}`,
        kind: 'offer_received',
        at: o.createdAt,
        role: 'seller',
        status: offerStatusToBucket(o.status),
        title: o.listing?.title ?? '—',
        amount: o.amount,
        listingId: o.listingId,
        offerId: o.id,
      });
      // handover + ratings on received offers can already appear via sent if
      // both parties are the same user — avoid double-emit by checking id.
      const seen = new Set(out.map((e) => e.id));
      if (o.handover?.bothConfirmedAt && !seen.has(`h:${o.id}`)) {
        out.push({
          id: `h:${o.id}`,
          kind: 'handover',
          at: o.handover.bothConfirmedAt,
          role: 'seller',
          status: 'completed',
          title: o.listing?.title ?? '—',
          amount: o.amount,
          listingId: o.listingId,
          offerId: o.id,
        });
      }
      for (const r of o.ratings ?? []) {
        const isMine = r.raterId === user?.id;
        const eventId = `${isMine ? 'rg' : 'rr'}:${r.id}`;
        if (seen.has(eventId)) continue;
        out.push({
          id: eventId,
          kind: isMine ? 'rating_given' : 'rating_received',
          at: o.handover?.bothConfirmedAt ?? o.createdAt,
          role: 'seller',
          status: 'completed',
          title: o.listing?.title ?? '—',
          amount: r.score,
          listingId: o.listingId,
          offerId: o.id,
        });
      }
    }

    return out.sort((a, b) => +new Date(b.at) - +new Date(a.at));
  }, [listings, sent, received, user]);

  // ── Apply filters ────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const cutoff = dateBucketCutoff(dateBucket);
    return events.filter((e) => {
      if (role !== 'all' && e.role !== role) return false;
      if (statusBucket !== 'all' && e.status !== statusBucket) return false;
      if (cutoff && new Date(e.at) < cutoff) return false;
      return true;
    });
  }, [events, role, statusBucket, dateBucket]);

  const labelForEvent = (e: ActivityEvent): string => {
    switch (e.kind) {
      case 'listing':         return t('events.listingCreated');
      case 'offer_sent':      return t('events.offerSent');
      case 'offer_received':  return t('events.offerReceived');
      case 'handover':        return t('events.handoverDone');
      case 'rating_given':    return t('events.ratingGiven');
      case 'rating_received': return t('events.ratingReceived');
    }
  };

  return (
    <section aria-labelledby="activity-title">
      <header className={styles.header}>
        <h2 id="activity-title" className={tabStyles.panelTitle}>
          <History size={18} aria-hidden="true" /> {t('title')}
        </h2>
      </header>

      <div className={styles.filters} role="group" aria-label={t('filtersLabel')}>
        <FilterPill
          label={t('filterRole')}
          value={role}
          options={[
            { v: 'all',    label: t('roleAll') },
            { v: 'buyer',  label: t('roleBuyer') },
            { v: 'seller', label: t('roleSeller') },
          ]}
          onChange={(v) => setRole(v as Role)}
        />
        <FilterPill
          label={t('filterStatus')}
          value={statusBucket}
          options={[
            { v: 'all',       label: t('statusAll') },
            { v: 'pending',   label: t('statusPending') },
            { v: 'completed', label: t('statusCompleted') },
            { v: 'cancelled', label: t('statusCancelled') },
          ]}
          onChange={(v) => setStatusBucket(v as StatusBucket)}
        />
        <FilterPill
          label={t('filterDate')}
          value={dateBucket}
          options={[
            { v: 'all', label: t('dateAll') },
            { v: '7d',  label: t('date7d') },
            { v: '30d', label: t('date30d') },
            { v: '90d', label: t('date90d') },
          ]}
          onChange={(v) => setDateBucket(v as DateBucket)}
        />
      </div>

      {isLoading ? (
        <div className={tabStyles.empty} aria-busy="true">…</div>
      ) : filtered.length === 0 ? (
        <div className={tabStyles.empty}>
          <XCircle size={28} strokeWidth={1.2} aria-hidden="true" />
          <p>{t('empty')}</p>
        </div>
      ) : (
        <ul className={styles.feed}>
          {filtered.map((e) => {
            const Icon = eventIcon(e.kind);
            return (
              <li key={e.id} className={styles.event}>
                <div className={`${styles.iconBubble} ${styles[`kind_${e.kind}`]}`}>
                  <Icon size={16} aria-hidden="true" />
                </div>
                <div className={styles.eventBody}>
                  <div className={styles.eventTop}>
                    <span className={styles.eventLabel}>{labelForEvent(e)}</span>
                    <span className={`${styles.statusChip} ${styles[`bucket_${e.status}`]}`}>
                      {t(`statusBucket.${e.status}`)}
                    </span>
                  </div>
                  <div className={styles.eventTitle}>
                    {e.listingId ? (
                      <Link href={`/${locale}/listings/${e.listingId}`} className={styles.titleLink}>
                        {e.title}
                      </Link>
                    ) : (
                      e.title
                    )}
                    {e.amount !== undefined && (
                      <span className={styles.eventAmount}>
                        {e.kind === 'rating_given' || e.kind === 'rating_received'
                          ? `${e.amount}/5`
                          : `${e.amount.toLocaleString()} ${tListing('price')}`}
                      </span>
                    )}
                  </div>
                  <div className={styles.eventMeta}>
                    <Clock size={12} aria-hidden="true" />
                    {new Date(e.at).toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-US')}
                    {' · '}
                    {t(e.role === 'buyer' ? 'roleBuyer' : 'roleSeller')}
                    {e.offerId && (
                      <>
                        {' · '}
                        <Link href={`/${locale}/my/offers?highlight=${e.offerId}`} className={styles.linkSecondary}>
                          {t('viewOffer')}
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

interface FilterPillProps<T extends string> {
  label: string;
  value: T;
  options: Array<{ v: T; label: string }>;
  onChange: (v: T) => void;
}

function FilterPill<T extends string>({ label, value, options, onChange }: FilterPillProps<T>) {
  return (
    <div className={styles.pillGroup}>
      <span className={styles.pillGroupLabel}>{label}</span>
      <div className={styles.pillRow}>
        {options.map((o) => (
          <button
            key={o.v}
            type="button"
            className={`${styles.pill} ${value === o.v ? styles.pillActive : ''}`}
            onClick={() => onChange(o.v)}
            aria-pressed={value === o.v}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
