'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeftRight, Clock, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { useAuthStore } from '@/lib/auth/store';
import { qk, fetchOffersSent, fetchOffersReceived } from '@/lib/queries';
import type { Offer } from '@/lib/api';
import tabStyles from '../my.module.css';
import styles from './my-offers.module.css';

type Tab = 'sent' | 'received';

const STATUS_KEYS = ['PENDING', 'ACCEPTED', 'DECLINED', 'COUNTERED', 'WITHDRAWN', 'EXPIRED'] as const;

export default function MyOffersPage() {
  const t = useTranslations('my.offers');
  const tOfferStatus = useTranslations('offers.status');
  const tListing = useTranslations('listing');
  const user = useAuthStore((s) => s.user);

  const [tab, setTab] = useState<Tab>('received');

  const { data: sent, isLoading: loadingSent } = useQuery({
    queryKey: qk.offersSent(),
    queryFn: fetchOffersSent,
    enabled: Boolean(user),
  });

  const { data: received, isLoading: loadingReceived } = useQuery({
    queryKey: qk.offersReceived(),
    queryFn: fetchOffersReceived,
    enabled: Boolean(user),
  });

  const isLoading = tab === 'sent' ? loadingSent : loadingReceived;
  const rows: Offer[] | undefined = tab === 'sent' ? sent : received;

  return (
    <section aria-labelledby="my-offers-title">
      <header className={styles.header}>
        <h2 id="my-offers-title" className={tabStyles.panelTitle}>
          {t('title')}
        </h2>
        <div className={styles.tabs} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'received'}
            className={`${styles.tab} ${tab === 'received' ? styles.tabActive : ''}`}
            onClick={() => setTab('received')}
          >
            <ArrowDownToLine size={14} aria-hidden="true" />
            {t('tabReceived')}
            {received && <span className={styles.count}>{received.length}</span>}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'sent'}
            className={`${styles.tab} ${tab === 'sent' ? styles.tabActive : ''}`}
            onClick={() => setTab('sent')}
          >
            <ArrowUpFromLine size={14} aria-hidden="true" />
            {t('tabSent')}
            {sent && <span className={styles.count}>{sent.length}</span>}
          </button>
        </div>
      </header>

      {isLoading ? (
        <div className={tabStyles.empty} aria-busy="true">…</div>
      ) : !rows || rows.length === 0 ? (
        <div className={tabStyles.empty}>
          <ArrowLeftRight size={28} strokeWidth={1.2} aria-hidden="true" />
          <p>{t('empty')}</p>
        </div>
      ) : (
        <ul className={styles.list}>
          {rows.map((offer) => (
            <li key={offer.id} className={styles.row}>
              <div className={styles.rowMain}>
                <div className={styles.amount}>
                  <span className={styles.amountValue}>
                    {offer.amount.toLocaleString()}
                  </span>
                  <span className={styles.amountUnit}>{tListing('price')}</span>
                </div>
                {offer.note && (
                  <p className={styles.note}>{offer.note}</p>
                )}
              </div>
              <div className={styles.rowMeta}>
                <span
                  className={`${styles.statusChip} ${
                    styles[`status_${offer.status}`] ?? styles.statusDefault
                  }`}
                >
                  {tOfferStatus(
                    offer.status as (typeof STATUS_KEYS)[number],
                  )}
                </span>
                <span className={styles.ts}>
                  <Clock size={12} aria-hidden="true" />
                  {new Date(offer.createdAt).toLocaleDateString()}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
