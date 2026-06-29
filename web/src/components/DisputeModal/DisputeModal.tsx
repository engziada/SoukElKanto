'use client';

/**
 * DisputeModal — file a dispute on an offer.
 *
 * Props:
 *   offerId  — the offer to dispute
 *   onClose  — dismiss
 *   onDone   — called after successful submission
 *
 * Behavior:
 *   - Reason dropdown (DisputeReason enum)
 *   - Optional description textarea
 *   - Escape / backdrop click closes
 */

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { api, ApiError, type DisputeReason } from '@/lib/api';
import styles from './DisputeModal.module.css';

interface DisputeModalProps {
  offerId: string;
  onClose: () => void;
  onDone?: () => void;
}

type Phase = 'form' | 'sending' | 'error';

const REASONS: DisputeReason[] = [
  'ITEM_NOT_AS_DESCRIBED',
  'ITEM_DEFECTIVE',
  'NO_SHOW',
  'PAYMENT_ISSUE',
  'COUNTERFEIT',
  'SELLER_BACKED_OUT',
  'BUYER_BACKED_OUT',
  'SAFETY_CONCERN',
  'OTHER',
];

export function DisputeModal({ offerId, onClose, onDone }: DisputeModalProps) {
  const t = useTranslations('my.disputes');
  const titleId = useId();
  const backdropRef = useRef<HTMLDivElement>(null);

  const [reason, setReason] = useState<DisputeReason>('ITEM_NOT_AS_DESCRIBED');
  const [description, setDescription] = useState('');
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
    setPhase('sending');
    setServerError(null);
    try {
      await api.disputes.create({
        offerId,
        reason,
        description: description.trim() || undefined,
      });
      onDone?.();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : t('actionError');
      setServerError(msg);
      setPhase('error');
    }
  }, [offerId, reason, description, onDone, t]);

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
          <h2 id={titleId} className={styles.title}>{t('title')}</h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label={t('actionError')}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div className={styles.fieldWrap}>
          <label htmlFor="dispute-reason" className={styles.label}>
            {t('reasonLabel')}
          </label>
          <select
            id="dispute-reason"
            className={styles.selectInput}
            value={reason}
            onChange={(e) => setReason(e.target.value as DisputeReason)}
          >
            {REASONS.map((r) => (
              <option key={r} value={r}>
                {t(`reason.${r}`)}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.fieldWrap}>
          <label htmlFor="dispute-description" className={styles.label}>
            {t('descriptionLabel')}
          </label>
          <textarea
            id="dispute-description"
            className={styles.textInput}
            rows={4}
            placeholder={t('descriptionPlaceholder')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={1000}
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
            {t('actionError')}
          </button>
          <button
            type="button"
            className={styles.submitBtn}
            onClick={handleSubmit}
            disabled={phase === 'sending'}
          >
            {phase === 'sending' ? t('submitting') : t('submit')}
          </button>
        </div>
      </div>
    </div>
  );
}
