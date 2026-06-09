'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeftRight, Clock, ArrowDownToLine, ArrowUpFromLine,
  Check, X, Repeat,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth/store';
import { useToast } from '@/components/Toast';
import { api } from '@/lib/api';
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
  const toast = useToast();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<Tab>('received');
  const [counterId, setCounterId] = useState<string | null>(null);
  const [counterAmount, setCounterAmount] = useState('');

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

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

  const invalidateOffers = () => {
    queryClient.invalidateQueries({ queryKey: qk.offersReceived() });
    queryClient.invalidateQueries({ queryKey: qk.offersSent() });
  };

  const confirmMut = useMutation({
    mutationFn: (id: string) => api.offers.confirmHandover(id),
    onSuccess: () => { toast.success(t('handoverConfirmed')); invalidateOffers(); },
    onError: () => toast.error(t('actionError')),
  });

  const acceptMut = useMutation({
    mutationFn: (id: string) => api.offers.accept(id),
    onSuccess: () => { toast.success(t('acceptedToast')); invalidateOffers(); },
    onError: () => toast.error(t('actionError')),
  });

  const declineMut = useMutation({
    mutationFn: (id: string) => api.offers.decline(id),
    onSuccess: () => { toast.info(t('declinedToast')); invalidateOffers(); },
    onError: () => toast.error(t('actionError')),
  });

  const counterMut = useMutation({
    mutationFn: (vars: { id: string; amount: number }) =>
      api.offers.counter(vars.id, vars.amount),
    onSuccess: () => {
      toast.success(t('counteredToast'));
      setCounterId(null);
      setCounterAmount('');
      invalidateOffers();
    },
    onError: () => toast.error(t('actionError')),
  });

  const withdrawMut = useMutation({
    mutationFn: (id: string) => api.offers.withdraw(id),
    onSuccess: () => { toast.info(t('withdrawnToast')); invalidateOffers(); },
    onError: () => toast.error(t('actionError')),
  });

  const busy =
    acceptMut.isPending || declineMut.isPending ||
    counterMut.isPending || withdrawMut.isPending ||
    confirmMut.isPending;

  const isLoading = !mounted || (tab === 'sent' ? loadingSent : loadingReceived);
  const rows: Offer[] | undefined = tab === 'sent' ? sent : received;

  const submitCounter = (id: string) => {
    const amount = Number(counterAmount);
    if (!amount || amount <= 0) return;
    counterMut.mutate({ id, amount });
  };

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
          {rows.map((offer) => {
            const canActReceived = tab === 'received' && offer.status === 'PENDING';
            const canWithdraw =
              tab === 'sent' &&
              (offer.status === 'PENDING' || offer.status === 'COUNTERED');
            return (
              <li key={offer.id} className={styles.row}>
                <div className={styles.rowMain}>
                  <div className={styles.amount}>
                    <span className={styles.amountValue}>
                      {offer.amount.toLocaleString()}
                    </span>
                    <span className={styles.amountUnit}>{tListing('price')}</span>
                  </div>
                  {offer.note && <p className={styles.note}>{offer.note}</p>}

                  {offer.listing && (
                    <div className={styles.listingInfo}>
                      <p className={styles.listingTitle}>{offer.listing.title}</p>
                      {offer.listing.photos?.[0]?.url && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={offer.listing.photos[0].url}
                          alt={offer.listing.title}
                          className={styles.listingThumb}
                        />
                      )}
                    </div>
                  )}

                  {/* Action row */}
                  {canActReceived && counterId !== offer.id && (
                    <div className={styles.actions}>
                      <button
                        type="button"
                        className={`${styles.actionBtn} ${styles.accept}`}
                        disabled={busy}
                        onClick={() => acceptMut.mutate(offer.id)}
                      >
                        <Check size={14} aria-hidden="true" />
                        {t('accept')}
                      </button>
                      <button
                        type="button"
                        className={`${styles.actionBtn} ${styles.counter}`}
                        disabled={busy}
                        onClick={() => {
                          setCounterId(offer.id);
                          setCounterAmount(String(offer.amount));
                        }}
                      >
                        <Repeat size={14} aria-hidden="true" />
                        {t('counter')}
                      </button>
                      <button
                        type="button"
                        className={`${styles.actionBtn} ${styles.decline}`}
                        disabled={busy}
                        onClick={() => declineMut.mutate(offer.id)}
                      >
                        <X size={14} aria-hidden="true" />
                        {t('decline')}
                      </button>
                    </div>
                  )}

                  {/* Counter input */}
                  {canActReceived && counterId === offer.id && (
                    <div className={styles.counterRow}>
                      <input
                        type="number"
                        min={1}
                        className={styles.counterInput}
                        placeholder={t('counterPlaceholder')}
                        value={counterAmount}
                        onChange={(e) => setCounterAmount(e.target.value)}
                        autoFocus
                      />
                      <button
                        type="button"
                        className={`${styles.actionBtn} ${styles.accept}`}
                        disabled={busy || !counterAmount}
                        onClick={() => submitCounter(offer.id)}
                      >
                        <Check size={14} aria-hidden="true" />
                        {t('confirm')}
                      </button>
                      <button
                        type="button"
                        className={`${styles.actionBtn} ${styles.ghost}`}
                        disabled={busy}
                        onClick={() => { setCounterId(null); setCounterAmount(''); }}
                      >
                        {t('cancel')}
                      </button>
                    </div>
                  )}

                  {canWithdraw && (
                    <div className={styles.actions}>
                      <button
                        type="button"
                        className={`${styles.actionBtn} ${styles.ghost}`}
                        disabled={busy}
                        onClick={() => withdrawMut.mutate(offer.id)}
                      >
                        <X size={14} aria-hidden="true" />
                        {t('withdraw')}
                      </button>
                    </div>
                  )}
                </div>

                <div className={styles.rowMeta}>
                  <span
                    className={`${styles.statusChip} ${
                      styles[`status_${offer.status}`] ?? styles.statusDefault
                    }`}
                  >
                    {tOfferStatus(offer.status as (typeof STATUS_KEYS)[number])}
                  </span>
                  <span className={styles.ts}>
                    <Clock size={12} aria-hidden="true" />
                    {new Date(offer.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
