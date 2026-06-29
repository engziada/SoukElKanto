'use client';

/**
 * ContactRevealModal — shows counterpart contact info after reveal.
 *
 * Props:
 *   offerId  — the offer to reveal contact for
 *   onClose  — dismiss
 *
 * Behavior:
 *   - Fetches contact info on mount via api.offers.revealContact
 *   - Shows counterpart name, phone, trust tier, WhatsApp link
 *   - Escape / backdrop click closes
 */

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { X, Phone, Shield, ExternalLink, AlertCircle, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { api, ApiError, type ContactReveal } from '@/lib/api';
import styles from './ContactRevealModal.module.css';

interface ContactRevealModalProps {
  offerId: string;
  onClose: () => void;
}

type Phase = 'loading' | 'loaded' | 'error';

export function ContactRevealModal({ offerId, onClose }: ContactRevealModalProps) {
  const t = useTranslations('my.offers');
  const titleId = useId();
  const backdropRef = useRef<HTMLDivElement>(null);

  const [contact, setContact] = useState<ContactReveal | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.offers.revealContact(offerId);
        if (!cancelled) {
          setContact(data);
          setPhase('loaded');
        }
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof ApiError ? err.message : t('actionError');
        setErrorMsg(msg);
        setPhase('error');
      }
    })();
    return () => { cancelled = true; };
  }, [offerId, t]);

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

  const tierLabel = (tier: string) => {
    switch (tier) {
      case 'GOLD': return 'Gold';
      case 'SILVER': return 'Silver';
      case 'BRONZE': return 'Bronze';
      default: return 'New';
    }
  };

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
          <h2 id={titleId} className={styles.title}>{t('revealContact')}</h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label={t('cancel')}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {phase === 'loading' && (
          <div className={styles.loading}>
            <Loader2 size={24} className={styles.spinner} aria-hidden="true" />
          </div>
        )}

        {phase === 'error' && errorMsg && (
          <p className={styles.fieldError} role="alert">
            <AlertCircle size={12} aria-hidden="true" />
            {errorMsg}
          </p>
        )}

        {phase === 'loaded' && contact && (
          <div className={styles.contactInfo}>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>{t('revealContact')}</span>
              <p className={styles.fieldValue}>{contact.fullName}</p>
            </div>

            <div className={styles.field}>
              <Phone size={14} aria-hidden="true" />
              <a href={`tel:${contact.phoneNumber}`} className={styles.phoneLink}>
                {contact.phoneNumber}
              </a>
            </div>

            <div className={styles.field}>
              <Shield size={14} aria-hidden="true" />
              <span className={styles.trustTier}>
                {tierLabel(contact.trustTier)} · {contact.trustScore}
              </span>
            </div>

            <a
              href={contact.waMeLink}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.waLink}
            >
              <ExternalLink size={14} aria-hidden="true" />
              WhatsApp
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
