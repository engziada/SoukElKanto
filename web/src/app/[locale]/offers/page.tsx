'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Tag, Clock, Inbox } from 'lucide-react';
import { api } from '@/lib/api';
import type { Offer } from '@/lib/api';
import styles from './offers.module.css';

const STATUS_CLASS_MAP: Record<string, string> = {
  PENDING:   'statusPending',
  ACCEPTED:  'statusAccepted',
  DECLINED:  'statusDeclined',
  COUNTERED: 'statusCountered',
  WITHDRAWN: 'statusWithdrawn',
  EXPIRED:   'statusExpired',
};

function StatusBadge({ status, label }: { status: string; label: string }) {
  const cls = STATUS_CLASS_MAP[status] ?? 'statusPending';
  return (
    <span className={`${styles.status} ${styles[cls]}`}>
      {label}
    </span>
  );
}

export default function OffersPage() {
  const t = useTranslations();
  const [sent, setSent] = useState<Offer[]>([]);
  const [received, setReceived] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorKey, setErrorKey] = useState<'unauthorized' | 'networkDown' | 'generic' | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setErrorKey(null);
      try {
        const [s, r] = await Promise.all([
          api.offers.listSent(),
          api.offers.listReceived(),
        ]);
        if (!cancelled) {
          setSent(s);
          setReceived(r);
        }
      } catch (e: unknown) {
        if (cancelled) return;
        const err = e as { status?: number };
        const status = err?.status ?? 0;
        if (status === 401 || status === 403) setErrorKey('unauthorized');
        else if (status === 0) setErrorKey('networkDown');
        else setErrorKey('generic');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const allOffers = [...sent, ...received];

  if (loading) {
    return (
      <div className={styles.wrap}>
        <h1 className={styles.h1}>{t('nav.offers')}</h1>
        <div className={styles.empty}>
          <Inbox size={36} strokeWidth={1.2} aria-hidden="true" />
          <p>{t('errors.retry')}...</p>
        </div>
      </div>
    );
  }

  if (errorKey) {
    return (
      <div className={styles.wrap}>
        <h1 className={styles.h1}>{t('nav.offers')}</h1>
        <div className={styles.empty}>
          <Inbox size={36} strokeWidth={1.2} aria-hidden="true" />
          <p>{t(`errors.${errorKey}`)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <h1 className={styles.h1}>{t('nav.offers')}</h1>

      {allOffers.length > 0 ? (
        <div className={styles.list}>
          {allOffers.map((offer) => (
            <div key={offer.id} className={styles.row}>
              <div className={styles.left}>
                <div className={styles.iconBox} aria-hidden="true">
                  <Tag size={18} />
                </div>
                <div className={styles.amountWrap}>
                  <div className={styles.amount}>
                    <span className={styles.amountValue}>
                      {offer.amount.toLocaleString()}
                    </span>
                    <span className={styles.amountUnit}>
                      {t('listing.price')}
                    </span>
                  </div>
                  <StatusBadge
                    status={offer.status}
                    label={t(`offers.status.${offer.status}` as never)}
                  />
                </div>
              </div>
              <span className={styles.ts}>
                <Clock size={12} aria-hidden="true" />
                {new Date(offer.createdAt).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.empty}>
          <Inbox size={36} strokeWidth={1.2} aria-hidden="true" />
          <p>{t('errors.emptyOffers')}</p>
          <p className={styles.emptyHint}>{t('offers.emptyHint')}</p>
        </div>
      )}
    </div>
  );
}
