'use client';

/**
 * RatingModal — post-handover rating capture.
 *
 * Props:
 *   offer    — the handover-completed offer to rate
 *   onClose  — dismiss without submitting
 *   onRated  — called after a successful POST /api/v1/ratings
 *
 * Behavior:
 *   - 1-5 star selector (keyboard accessible: arrow keys + Enter)
 *   - Optional comment (max 500 chars; matches BE DTO)
 *   - Escape closes
 *   - Backdrop click closes
 *   - Submits via api.ratings.create; on 4xx, surfaces the message inline.
 */

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { X, Star, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { api, ApiError } from '@/lib/api';
import type { Offer } from '@/lib/api';
import styles from './RatingModal.module.css';

interface RatingModalProps {
  offer: Offer;
  onClose: () => void;
  onRated?: () => void;
}

type Phase = 'form' | 'sending' | 'error';

export function RatingModal({ offer, onClose, onRated }: RatingModalProps) {
  const t = useTranslations('rating');
  const titleId = useId();
  const backdropRef = useRef<HTMLDivElement>(null);

  const [score, setScore] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [phase, setPhase] = useState<Phase>('form');
  const [serverError, setServerError] = useState<string | null>(null);

  // Escape closes
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Body scroll lock while open
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
    if (score < 1 || score > 5) return;
    setPhase('sending');
    setServerError(null);
    try {
      await api.ratings.create(offer.id, score, comment.trim() || undefined);
      onRated?.();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : t('errorGeneric');
      setServerError(msg);
      setPhase('error');
    }
  }, [score, comment, offer.id, onRated, t]);

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
          <div>
            <h2 id={titleId} className={styles.title}>{t('title')}</h2>
            <p className={styles.listingTitle}>{offer.listing?.title ?? ''}</p>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label={t('cancel')}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {/* Star picker */}
        <div className={styles.starsWrap} role="radiogroup" aria-label={t('scoreLabel')}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={score === n}
              data-score={n}
              className={`${styles.starBtn} ${n <= score ? styles.starBtnActive : ''}`}
              onClick={() => setScore(n)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowLeft' && score > 1) setScore(score - 1);
                if (e.key === 'ArrowRight' && score < 5) setScore(score + 1);
              }}
            >
              <Star
                size={28}
                fill={n <= score ? 'currentColor' : 'none'}
                aria-hidden="true"
              />
              <span className={styles.srOnly}>{n}</span>
            </button>
          ))}
        </div>

        {/* Comment */}
        <div className={styles.commentWrap}>
          <label htmlFor="rating-comment" className={styles.label}>
            {t('commentLabel')}
          </label>
          <textarea
            id="rating-comment"
            className={styles.commentInput}
            rows={3}
            placeholder={t('commentPlaceholder')}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
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
            className={styles.sendBtn}
            onClick={handleSubmit}
            disabled={phase === 'sending' || score < 1}
          >
            {phase === 'sending' ? t('sending') : t('submit')}
          </button>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onClose}
          >
            {t('cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
