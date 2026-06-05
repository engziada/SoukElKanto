import { getTranslations } from 'next-intl/server';
import { Tag, Clock, Inbox } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
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

export default async function OffersPage() {
  const t = await getTranslations();

  let sent: Awaited<ReturnType<typeof api.offers.listSent>> | null = null;
  let received: Awaited<ReturnType<typeof api.offers.listReceived>> | null = null;
  let errorKey: 'unauthorized' | 'networkDown' | 'generic' | null = null;

  try {
    sent = await api.offers.listSent();
    received = await api.offers.listReceived();
  } catch (e) {
    if (e instanceof ApiError) {
      if (e.status === 401 || e.status === 403) errorKey = 'unauthorized';
      else if (e.status === 0) errorKey = 'networkDown';
      else errorKey = 'generic';
    } else {
      errorKey = 'generic';
    }
  }

  const allOffers = [...(sent ?? []), ...(received ?? [])];

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
