'use client';

/**
 * /my/disputes — list disputes filed by or against the current user.
 *
 * Each row shows:
 *   - Dispute reason (localized)
 *   - Status chip (OPEN / RESOLVED / REJECTED)
 *   - Whether filed by user or against user
 *   - Description (if any)
 *   - Created date
 *   - Resolution text (if resolved)
 */

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { ShieldAlert } from 'lucide-react';
import { useAuthStore } from '@/lib/auth/store';
import { qk, fetchMyDisputes } from '@/lib/queries';
import type { Dispute, DisputeStatus } from '@/lib/api';
import tabStyles from '../my.module.css';
import styles from './disputes.module.css';

const STATUS_CLASS: Record<DisputeStatus, string> = {
  OPEN: 'statusOpen',
  RESOLVED: 'statusResolved',
  REJECTED: 'statusRejected',
};

export default function MyDisputesPage() {
  const t = useTranslations('my.disputes');
  const locale = useLocale();
  const user = useAuthStore((s) => s.user);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { data: disputes, isLoading } = useQuery({
    queryKey: qk.disputesMine(),
    queryFn: fetchMyDisputes,
    enabled: Boolean(user),
  });

  if (!mounted || !user) {
    return <div className={tabStyles.empty} aria-busy="true">…</div>;
  }

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US');

  return (
    <section aria-labelledby="disputes-title">
      <header className={styles.header}>
        <h2 id="disputes-title" className={tabStyles.panelTitle}>
          {t('title')}
        </h2>
      </header>

      {isLoading ? (
        <div className={tabStyles.empty} aria-busy="true">…</div>
      ) : !disputes || disputes.length === 0 ? (
        <div className={tabStyles.empty}>
          <ShieldAlert size={28} strokeWidth={1.2} aria-hidden="true" />
          <p>{t('empty')}</p>
        </div>
      ) : (
        <ul className={styles.list}>
          {disputes.map((d: Dispute) => {
            const filedByMe = d.filedById === user.id;
            return (
              <li key={d.id} className={styles.row}>
                <div className={styles.rowMain}>
                  <div className={styles.rowHeader}>
                    <span
                      className={`${styles.statusChip} ${styles[STATUS_CLASS[d.status]] ?? styles.statusOpen}`}
                    >
                      {d.status === 'OPEN' && t('statusOpen')}
                      {d.status === 'RESOLVED' && t('statusResolved')}
                      {d.status === 'REJECTED' && t('statusRejected')}
                    </span>
                    <span className={styles.filedBy}>
                      {filedByMe ? t('filedByYou') : t('filedAgainstYou')}
                    </span>
                  </div>

                  <p className={styles.reason}>
                    {t(`reason.${d.reason}`)}
                  </p>

                  {d.description && (
                    <p className={styles.description}>{d.description}</p>
                  )}

                  {d.resolution && (
                    <p className={styles.resolution}>
                      <strong>{t('statusResolved')}:</strong> {d.resolution}
                    </p>
                  )}
                </div>

                <div className={styles.rowMeta}>
                  <span className={styles.ts}>{fmtDate(d.createdAt)}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
