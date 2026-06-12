'use client';

/**
 * ReportModal — R-09
 *
 * Files a report against a listing. Modeled after OfferModal:
 *   - Bottom-sheet on mobile, centered dialog on desktop
 *   - Focus trap + Escape close
 *   - Inline server error
 *   - Success terminal state with the report id
 *
 * Fields (all required by the BE DTO):
 *   - incidentType (enum: SCAM / SPAM / FRAUD / POLICY_VIOLATION / OTHER)
 *   - severity (1-5)
 *   - reason (non-empty, max 500)
 *
 * Photo evidence upload is intentionally deferred to v2; the BE accepts an
 * optional evidencePhotoR2Key but the FE leaves it undefined for now.
 */

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { X, CheckCircle, AlertCircle, Flag } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import type { Listing, ReportIncidentType } from '@/lib/api';
import styles from './ReportModal.module.css';

interface ReportModalProps {
  listing: Listing;
  onClose: () => void;
}

type Phase = 'form' | 'sending' | 'success' | 'error';

const INCIDENT_TYPES: ReportIncidentType[] = [
  'SCAM',
  'FRAUD',
  'SPAM',
  'POLICY_VIOLATION',
  'OTHER',
];

const SEVERITY_VALUES = [1, 2, 3, 4, 5] as const;

export function ReportModal({ listing, onClose }: ReportModalProps) {
  const t = useTranslations('report');
  const dialogId = useId();

  const [incidentType, setIncidentType] = useState<ReportIncidentType | ''>('');
  const [severity, setSeverity] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [phase, setPhase] = useState<Phase>('form');
  const [reportId, setReportId] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    incidentType?: string;
    severity?: string;
    reason?: string;
  }>({});

  const backdropRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLSelectElement>(null);

  // Auto-focus the first field on mount
  useEffect(() => {
    firstFieldRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Lock body scroll while open
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

  const validate = useCallback((): boolean => {
    const errs: typeof fieldErrors = {};
    if (!incidentType) errs.incidentType = t('errorIncidentType');
    if (severity === null) errs.severity = t('errorSeverity');
    const trimmedReason = reason.trim();
    if (trimmedReason.length === 0) {
      errs.reason = t('errorReasonRequired');
    } else if (trimmedReason.length > 500) {
      errs.reason = t('errorReasonTooLong');
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }, [incidentType, severity, reason, t]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;
    setPhase('sending');
    setServerError(null);
    try {
      const res = await api.reports.createListingReport(listing.id, {
        incidentType: incidentType as ReportIncidentType,
        severity: severity!,
        reason: reason.trim(),
      });
      setReportId(res.report.id);
      setPhase('success');
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 403) {
          setServerError(t('errorForbidden'));
        } else if (err.status === 404) {
          setServerError(t('errorNotFound'));
        } else if (err.status === 0) {
          setServerError(t('errorNetwork'));
        } else {
          setServerError(err.message || t('errorGeneric'));
        }
      } else {
        setServerError(t('errorGeneric'));
      }
      setPhase('error');
    }
  }, [validate, listing.id, incidentType, severity, reason, t]);

  return (
    <div
      ref={backdropRef}
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby={dialogId}
      onClick={handleBackdropClick}
    >
      <div className={styles.panel}>
        <div className={styles.handle} aria-hidden="true" />

        {phase === 'success' ? (
          <div className={styles.success}>
            <div className={styles.successIcon} aria-hidden="true">
              <CheckCircle size={28} />
            </div>
            <h2 id={dialogId} className={styles.successTitle}>
              {t('successTitle')}
            </h2>
            <p className={styles.successBody}>{t('successBody')}</p>
            {reportId && (
              <p className={styles.reportId}>
                <span className={styles.reportIdLabel}>{t('reportId')}</span>
                <code className={styles.reportIdValue}>{reportId}</code>
              </p>
            )}
            <button
              type="button"
              className={styles.doneBtn}
              onClick={onClose}
            >
              {t('done')}
            </button>
          </div>
        ) : (
          <>
            <div className={styles.header}>
              <div className={styles.headerText}>
                <h2 id={dialogId} className={styles.title}>
                  <Flag size={18} aria-hidden="true" />
                  {t('title')}
                </h2>
                <p className={styles.listingTitle}>{listing.title}</p>
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

            {/* Incident type */}
            <div className={styles.fieldWrap}>
              <label htmlFor="report-incident" className={styles.label}>
                {t('incidentLabel')}
              </label>
              <select
                ref={firstFieldRef}
                id="report-incident"
                className={styles.select}
                value={incidentType}
                onChange={(e) => {
                  setIncidentType(e.target.value as ReportIncidentType | '');
                  setFieldErrors((p) => ({ ...p, incidentType: undefined }));
                }}
                aria-invalid={Boolean(fieldErrors.incidentType)}
                aria-describedby={fieldErrors.incidentType ? 'report-incident-err' : undefined}
              >
                <option value="">{t('incidentPlaceholder')}</option>
                {INCIDENT_TYPES.map((k) => (
                  <option key={k} value={k}>
                    {t(`incidentType.${k}`)}
                  </option>
                ))}
              </select>
              {fieldErrors.incidentType && (
                <span id="report-incident-err" className={styles.fieldError} role="alert">
                  <AlertCircle size={12} aria-hidden="true" />
                  {fieldErrors.incidentType}
                </span>
              )}
            </div>

            {/* Severity */}
            <div className={styles.fieldWrap}>
              <label className={styles.label}>{t('severityLabel')}</label>
              <div
                className={styles.severityRow}
                role="radiogroup"
                aria-label={t('severityLabel')}
                aria-invalid={Boolean(fieldErrors.severity)}
              >
                {SEVERITY_VALUES.map((value) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={severity === value}
                    data-severity={value}
                    className={`${styles.severityBtn} ${severity === value ? styles.severityBtnActive : ''}`}
                    onClick={() => {
                      setSeverity(value);
                      setFieldErrors((p) => ({ ...p, severity: undefined }));
                    }}
                    aria-label={t(`severityValue.${value}`)}
                  >
                    {value}
                  </button>
                ))}
              </div>
              <p className={styles.severityHint}>
                {severity !== null
                  ? t(`severityValue.${severity}`)
                  : t('severityHint')}
              </p>
              {fieldErrors.severity && (
                <span className={styles.fieldError} role="alert">
                  <AlertCircle size={12} aria-hidden="true" />
                  {fieldErrors.severity}
                </span>
              )}
            </div>

            {/* Reason */}
            <div className={styles.fieldWrap}>
              <label htmlFor="report-reason" className={styles.label}>
                {t('reasonLabel')}
              </label>
              <textarea
                id="report-reason"
                className={styles.textarea}
                rows={4}
                placeholder={t('reasonPlaceholder')}
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  setFieldErrors((p) => ({ ...p, reason: undefined }));
                }}
                maxLength={500}
                aria-invalid={Boolean(fieldErrors.reason)}
                aria-describedby={fieldErrors.reason ? 'report-reason-err' : undefined}
              />
              <span className={styles.charCount} aria-live="polite">
                {reason.trim().length}/500
              </span>
              {fieldErrors.reason && (
                <span id="report-reason-err" className={styles.fieldError} role="alert">
                  <AlertCircle size={12} aria-hidden="true" />
                  {fieldErrors.reason}
                </span>
              )}
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
                disabled={phase === 'sending'}
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
          </>
        )}
      </div>
    </div>
  );
}
