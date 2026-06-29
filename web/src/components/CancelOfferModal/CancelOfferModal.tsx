'use client';

/**
 * CancelOfferModal — cancel an accepted deal.
 *
 * Props:
 *   offerId  — the offer to cancel
 *   onClose  — dismiss without submitting
 *   onDone   — called after successful cancel
 *
 * Behavior:
 *   - Text input for cancellation reason
 *   - Warning text about irreversibility
 *   - Escape / backdrop click closes
 */

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { X, AlertTriangle, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { api, ApiError } from '@/lib/api';
import styles from './CancelOfferModal.module.css';

interface CancelOfferModalProps {
  offerId: string;
  onClose: () => void;
  onDone?: () => void;
}

type Phase = 'form' | 'sending' | 'error';

export function CancelOfferModal({ offerId, onClose, onDone }: CancelOfferModalProps) {
  const t = useTranslations('my.offers');
  const titleId = useId();
  const backdropRef = useRef<HTMLDivElement>(null);

  const [reason, setReason] = useState('');
  const [phase, setPhase] = useState<Phase>('form');
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === backdropRef.current) onClose();
    },
    [onClose],
  );

  const handleSubmit = useCallback(async () => {
    if (!reason.trim()) return;
    setPhase('sending');
    setServerError(null);
    try {
      await api.offers.cancel(offerId, reason.trim());
      onDone?.();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : t('actionError');
      setServerError(msg);
      setPhase('error');
    }
  }, [reason, offerId, onDone, t]);

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

        <div className={styles.header}>
          <h2 id={titleId} className={styles.title}>{t('cancelOffer')}</h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label={t('cancel')}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div className={styles.warning}>
          <AlertTriangle size={16} aria-hidden="true" />
          <p>{t('cancelWarning')}</p>
        </div>

        <div className={styles.fieldWrap}>
          <label htmlFor="cancel-reason" className={styles.label}>
            {t('cancelReasonLabel')}
          </label>
          <textarea
            id="cancel-reason"
            className={styles.textInput}
            rows={3}
            placeholder={t('cancelReasonPlaceholder')}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
            autoFocus
          />
        </div>

        {phase === 'error' && serverError && (
          <p className={styles.fieldError} role="alert">
            <AlertCircle size={12} aria-hidden="true" />
            {serverError}
          </p>
        )}

        <div className={styles.footer}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onClose}
            disabled={phase === 'sending'}
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            className={styles.confirmBtn}
            onClick={handleSubmit}
            disabled={phase === 'sending' || !reason.trim()}
          >
            {phase === 'sending' ? '…' : t('cancelConfirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
