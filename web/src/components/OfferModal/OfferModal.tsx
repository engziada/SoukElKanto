'use client';

/**
 * OfferModal — bottom-sheet (mobile) / centered dialog (desktop).
 *
 * Props:
 *   listing        — the listing being offered on (for title + asking price)
 *   onClose()      — called when dismissed or offer sent
 *   initialAmount  — optional pre-fill (e.g. asking price as suggested)
 */

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { Listing } from '@/lib/api';
import { useAuthStore } from '@/lib/auth/store';
import styles from './OfferModal.module.css';

interface OfferModalProps {
  listing: Listing;
  onClose: () => void;
}

type Phase = 'form' | 'sending' | 'success' | 'error';

export function OfferModal({ listing, onClose }: OfferModalProps) {
  const t = useTranslations();
  const user = useAuthStore((s) => s.user);
  const titleId = useId();

  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [tokenHold, setTokenHold] = useState(false);
  const [phase, setPhase] = useState<Phase>('form');
  const [amountError, setAmountError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const backdropRef = useRef<HTMLDivElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  /* Focus trap: focus amount on mount */
  useEffect(() => {
    amountRef.current?.focus();
  }, []);

  /* Close on Escape */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  /* Prevent body scroll while open */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  /** Close on backdrop click (not panel click) */
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === backdropRef.current) onClose();
    },
    [onClose],
  );

  const validate = useCallback((): boolean => {
    const parsed = Number(amount);
    if (!amount || isNaN(parsed) || parsed <= 0) {
      setAmountError(t('errors.generic'));
      return false;
    }
    setAmountError(null);
    return true;
  }, [amount, t]);

  const handleSend = useCallback(async () => {
    if (!validate()) return;
    setPhase('sending');
    setServerError(null);

    try {
      await api.offers.create({
        listingId: listing.id,
        amount: Number(amount),
        note: note.trim() || undefined,
        // tokenHold: tokenHold,  // wire when BE supports it
      });
      setPhase('success');
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : t('errors.generic'),
      );
      setPhase('error');
    }
  }, [validate, listing.id, amount, note, t]);

  /* Own-listing guard */
  const isOwnListing = user?.id === listing.sellerId;
  const locale = useLocale();

  /* Deal execution guard: require complete profile */
  const is18Plus = (() => {
    if (!user?.birthdate) return false;
    const b = new Date(user.birthdate);
    const now = new Date();
    const age = now.getFullYear() - b.getFullYear();
    const m = now.getMonth() - b.getMonth();
    return age > 18 || (age === 18 && m >= 0 && now.getDate() >= b.getDate());
  })();
  const hasCompleteProfile = !!(user?.fullName && user?.gender && user?.birthdate && is18Plus);

  return (
    <div
      ref={backdropRef}
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={handleBackdropClick}
    >
      <div className={styles.panel}>
        <div className={styles.handle} aria-hidden="true" />

        {/* ── Success state ──────────────────────────────── */}
        {phase === 'success' ? (
          <div className={styles.success}>
            <div className={styles.successIcon} aria-hidden="true">
              <CheckCircle size={28} />
            </div>
            <div>
              <h2 id={titleId} className={styles.successTitle}>
                {t('offer.sentTitle')}
              </h2>
              <p className={styles.successBody}>{t('offer.sentBody')}</p>
            </div>
            <button
              type="button"
              className={styles.doneBtn}
              onClick={onClose}
            >
              {t('offer.done')}
            </button>
          </div>
        ) : (
          <>

            {/* ── Own-listing guard (defense-in-depth) ── */}
            {/* The page-level guard prevents the seller from opening this    */}
            {/* modal in the first place. This block is a safety net for any  */}
            {/* path that could force-open the modal on the seller's listing. */}
            {isOwnListing && (
              <div className={styles.ownListingGate} role="status">
                <AlertCircle size={20} aria-hidden="true" />
                <div>
                  <p className={styles.ownListingTitle}>{t('offer.ownListingTitle')}</p>
                  <p className={styles.ownListingBody}>{t('offer.ownListing')}</p>
                </div>
              </div>
            )}

            {/* ── Profile incomplete guard ─────────────── */}
            {!hasCompleteProfile && !isOwnListing && (
              <div className={styles.profileGate}>
                <AlertCircle size={20} aria-hidden="true" />
                <div>
                  <p className={styles.profileGateTitle}>Complete your profile</p>
                  <p className={styles.profileGateBody}>Full name, gender, and birthdate (18+) are required to make offers.</p>
                  <a href={"/" + locale + "/my/profile"} className={styles.profileGateLink} onClick={onClose}>
                    Go to Profile →
                  </a>
                </div>
              </div>
            )}

            {/* ── Form header ────────────────────────────── */}
            <div className={styles.header}>
              <div>
                <h2 id={titleId} className={styles.title}>
                  {t('offer.yourOffer')}
                </h2>
                <p className={styles.listingTitle}>{listing.title}</p>
              </div>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={onClose}
                aria-label={t('offer.cancel')}
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>

            {/* ── Amount ─────────────────────────────────── */}
            <div className={styles.amountWrap}>
              <label htmlFor="offer-amount" className={styles.label}>
                {t('offer.yourOffer')}
              </label>
              <div className={styles.amountRow}>
                <span className={styles.currencyTag} aria-hidden="true">
                  {t('listing.price')}
                </span>
                <input
                  ref={amountRef}
                  id="offer-amount"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  className={styles.amountInput}
                  placeholder={listing.askingPrice.toString()}
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setAmountError(null);
                  }}
                  aria-invalid={Boolean(amountError)}
                  aria-describedby={amountError ? 'offer-amount-err' : undefined}
                />
              </div>
              <p className={styles.askingHint}>
                {t('offer.askingIs')}{' '}
                <strong>
                  {listing.askingPrice.toLocaleString()} {t('listing.price')}
                </strong>
              </p>
              {amountError && (
                <span
                  id="offer-amount-err"
                  className={styles.fieldError}
                  role="alert"
                >
                  <AlertCircle size={12} aria-hidden="true" />
                  {amountError}
                </span>
              )}
            </div>

            {/* ── Note ───────────────────────────────────── */}
            <div className={styles.noteWrap}>
              <label htmlFor="offer-note" className={styles.label}>
                {t('offer.note')}
              </label>
              <textarea
                id="offer-note"
                className={styles.noteInput}
                rows={3}
                placeholder={t('offer.notePlaceholder')}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={300}
              />
            </div>

            {/* ── Token hold ─────────────────────────────── */}
            <label className={styles.tokenRow}>
              <input
                type="checkbox"
                className={styles.tokenCheckbox}
                checked={tokenHold}
                onChange={(e) => setTokenHold(e.target.checked)}
              />
              <div className={styles.tokenInfo}>
                <span className={styles.tokenLabel}>{t('offer.tokenHold')}</span>
                <span className={styles.tokenHint}>{t('offer.tokenHoldHint')}</span>
              </div>
            </label>

            {/* ── Server error ───────────────────────────── */}
            {phase === 'error' && serverError && (
              <p className={styles.fieldError} role="alert">
                <AlertCircle size={12} aria-hidden="true" />
                {serverError}
              </p>
            )}

            {/* ── Footer ─────────────────────────────────── */}
            <div className={styles.footer}>
              <button
                type="button"
                className={styles.sendBtn}
                onClick={handleSend}
                disabled={phase === 'sending' || isOwnListing}
              >
                {phase === 'sending' ? t('offer.sending') : t('offer.sendOffer')}
              </button>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={onClose}
              >
                {t('offer.cancel')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
