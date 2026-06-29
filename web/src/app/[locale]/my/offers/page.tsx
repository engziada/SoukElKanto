'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeftRight, Clock, ArrowDownToLine, ArrowUpFromLine,
  Check, X, Repeat, Handshake, Phone, Ban, ShieldAlert,
} from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/auth/store';
import { useToast } from '@/components/Toast';
import { api } from '@/lib/api';
import { qk, fetchOffersSent, fetchOffersReceived } from '@/lib/queries';
import type { Offer } from '@/lib/api';
import { ContactRevealModal } from '@/components/ContactRevealModal';
import { CancelOfferModal } from '@/components/CancelOfferModal';
import { DisputeModal } from '@/components/DisputeModal';
import tabStyles from '../my.module.css';
import styles from './my-offers.module.css';

type Tab = 'sent' | 'received';

const STATUS_KEYS = [
  'PENDING',
  'ACCEPTED',
  'DECLINED',
  'COUNTERED',
  'WITHDRAWN',
  'EXPIRED',
  'HANDOVER_PENDING',
  'CONFIRMED',
  'CLOSED',
  'CANCELLED',
] as const;

export default function MyOffersPage() {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations('my.offers');
  const tOfferStatus = useTranslations('offers.status');
  const tListing = useTranslations('listing');
  const user = useAuthStore((s) => s.user);
  const toast = useToast();
  const queryClient = useQueryClient();
  // Loose gate (#1): if the BE replies with PROFILE_INCOMPLETE / AGE_RESTRICTED,
  // bounce the user to /my/profile with a hint. Falls back to the generic
  // action-error toast for everything else.
  const handleMutError = (err: unknown) => {
    const e = err as { status?: number; message?: string };
    if (e?.status === 403 && typeof e.message === 'string' && e.message.startsWith('PROFILE_')) {
      router.push(`/${locale}/my/profile?reason=profile-incomplete&next=/${locale}/my/offers`);
      return;
    }
    toast.error(t('actionError'));
  };

  const [tab, setTab] = useState<Tab>('received');
  const [counterId, setCounterId] = useState<string | null>(null);
  const [counterAmount, setCounterAmount] = useState('');
  const [revealFor, setRevealFor] = useState<string | null>(null);
  const [cancelFor, setCancelFor] = useState<string | null>(null);
  const [disputeFor, setDisputeFor] = useState<string | null>(null);

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
    onError: handleMutError,
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

  // ── R-02: buyer-side actions on seller-initiated counters ─────────
  const buyerAcceptMut = useMutation({
    mutationFn: (id: string) => api.offers.buyerAccept(id),
    onSuccess: () => { toast.success(t('acceptedToast')); invalidateOffers(); },
    onError: handleMutError,
  });
  const buyerDeclineMut = useMutation({
    mutationFn: (id: string) => api.offers.buyerDecline(id),
    onSuccess: () => { toast.info(t('declinedToast')); invalidateOffers(); },
    onError: () => toast.error(t('actionError')),
  });
  const buyerCounterMut = useMutation({
    mutationFn: (vars: { id: string; amount: number }) =>
      api.offers.buyerCounter(vars.id, vars.amount),
    onSuccess: () => {
      toast.success(t('counteredToast'));
      setCounterId(null);
      setCounterAmount('');
      invalidateOffers();
    },
    onError: () => toast.error(t('actionError')),
  });

  const cancelMut = useMutation({
    mutationFn: (vars: { id: string; reason: string }) =>
      api.offers.cancel(vars.id, vars.reason),
    onSuccess: () => { toast.info(t('cancelledToast')); invalidateOffers(); },
    onError: () => toast.error(t('actionError')),
  });

  const busy =
    acceptMut.isPending || declineMut.isPending ||
    counterMut.isPending || withdrawMut.isPending ||
    confirmMut.isPending ||
    buyerAcceptMut.isPending || buyerDeclineMut.isPending ||
    buyerCounterMut.isPending || cancelMut.isPending;

  const isLoading = !mounted || (tab === 'sent' ? loadingSent : loadingReceived);
  const rows: Offer[] | undefined = tab === 'sent' ? sent : received;

  const submitCounter = (id: string) => {
    const amount = Number(counterAmount);
    if (!amount || amount <= 0) return;
    counterMut.mutate({ id, amount });
  };

  // R-02: when the buyer re-counters a seller's counter, call the buyer-side
  // endpoint (creates a grandchild offer).
  const submitBuyerCounter = (id: string) => {
    const amount = Number(counterAmount);
    if (!amount || amount <= 0) return;
    buyerCounterMut.mutate({ id, amount });
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
            // R-02: on the Sent tab, a PENDING row WITH parentOfferId is a
            // seller-initiated counter the buyer can act on.
            const canActReceivedCounter =
              tab === 'sent' &&
              offer.status === 'PENDING' &&
              !!offer.parentOfferId;
            // Withdraw is for buyer-initiated, still-PENDING offers only. Once
            // the seller counters, the parent flips to COUNTERED and the active
            // negotiation has moved to the child — buyer should decline that
            // counter to exit, not "withdraw" the historical parent.
            const canWithdraw =
              tab === 'sent' &&
              offer.status === 'PENDING' &&
              !offer.parentOfferId;
            // R-11 F-#7 — once the offer is accepted, the action moves to the
            // /my/handovers page. Surface a direct link so the user doesn't
            // hunt for it in the side nav.
            const showHandoverLink =
              offer.status === 'ACCEPTED' ||
              offer.status === 'HANDOVER_PENDING' ||
              offer.status === 'CONFIRMED';
            const canCancel =
              offer.status === 'ACCEPTED' ||
              offer.status === 'HANDOVER_PENDING';
            const canReveal = canCancel || offer.status === 'CONFIRMED';
            const canDispute = canCancel;
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
                      {offer.listing.photos?.[0]?.url && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={offer.listing.photos[0].url}
                          alt={offer.listing.title}
                          className={styles.listingThumb}
                        />
                      )}
                      <div className={styles.listingMeta}>
                        <p className={styles.listingTitle}>{offer.listing.title}</p>
                        <p className={styles.listingPrice}>
                          {tListing('price')} {offer.listing.askingPrice?.toLocaleString()}
                        </p>
                        <p className={styles.listingDate}>
                          {new Date(offer.listing.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US')}
                        </p>
                      </div>
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

                  {/* R-02: buyer-side Accept/Decline/Re-counter on received counter */}
                  {canActReceivedCounter && counterId !== offer.id && (
                    <div className={styles.actions}>
                      <button
                        type="button"
                        className={`${styles.actionBtn} ${styles.accept}`}
                        disabled={busy}
                        onClick={() => buyerAcceptMut.mutate(offer.id)}
                      >
                        <Check size={14} aria-hidden="true" />
                        {t('acceptCounter')}
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
                        {t('reCounter')}
                      </button>
                      <button
                        type="button"
                        className={`${styles.actionBtn} ${styles.decline}`}
                        disabled={busy}
                        onClick={() => buyerDeclineMut.mutate(offer.id)}
                      >
                        <X size={14} aria-hidden="true" />
                        {t('declineCounter')}
                      </button>
                    </div>
                  )}

                  {/* R-02: inline re-counter input (uses same counterId state) */}
                  {canActReceivedCounter && counterId === offer.id && (
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
                        onClick={() => submitBuyerCounter(offer.id)}
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
                </div>

                <div className={styles.rowMeta}>
                  <span
                    className={`${styles.statusChip} ${
                      styles[`status_${offer.status}`] ?? styles.statusDefault
                    }`}
                  >
                    {tOfferStatus(offer.status as (typeof STATUS_KEYS)[number])}
                  </span>
                  {showHandoverLink && (
                    <Link
                      href={`/${locale}/my/handovers#offer-${offer.id}`}
                      className={`${styles.actionBtn} ${styles.accept}`}
                    >
                      <Handshake size={14} aria-hidden="true" />
                      {t('goToHandover')}
                    </Link>
                  )}
                  {canReveal && (
                    <button
                      type="button"
                      className={`${styles.actionBtn} ${styles.ghost}`}
                      onClick={() => setRevealFor(offer.id)}
                    >
                      <Phone size={14} aria-hidden="true" />
                      {t('revealContact')}
                    </button>
                  )}
                  {canCancel && (
                    <button
                      type="button"
                      className={`${styles.actionBtn} ${styles.decline}`}
                      onClick={() => setCancelFor(offer.id)}
                    >
                      <Ban size={14} aria-hidden="true" />
                      {t('cancelOffer')}
                    </button>
                  )}
                  {canDispute && (
                    <button
                      type="button"
                      className={`${styles.actionBtn} ${styles.ghost}`}
                      onClick={() => setDisputeFor(offer.id)}
                    >
                      <ShieldAlert size={14} aria-hidden="true" />
                      {t('fileDispute')}
                    </button>
                  )}
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

      {revealFor && (
        <ContactRevealModal
          offerId={revealFor}
          onClose={() => setRevealFor(null)}
        />
      )}
      {cancelFor && (
        <CancelOfferModal
          offerId={cancelFor}
          onClose={() => setCancelFor(null)}
          onDone={() => {
            setCancelFor(null);
            invalidateOffers();
          }}
        />
      )}
      {disputeFor && (
        <DisputeModal
          offerId={disputeFor}
          onClose={() => setDisputeFor(null)}
          onDone={() => {
            setDisputeFor(null);
            invalidateOffers();
            queryClient.invalidateQueries({ queryKey: qk.disputesMine() });
            toast.info(t('fileDispute'));
          }}
        />
      )}
    </section>
  );
}
