import { getTranslations } from 'next-intl/server';
import { Tag, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import styles from './offers.module.css';

export default async function OffersPage() {
  const t = await getTranslations();

  let sent: Awaited<ReturnType<typeof api.offers.listSent>> | null = null;
  let received: Awaited<ReturnType<typeof api.offers.listReceived>> | null = null;

  try {
    sent = await api.offers.listSent();
    received = await api.offers.listReceived();
  } catch {
    sent = null;
    received = null;
  }

  const allOffers = [...(sent ?? []), ...(received ?? [])];

  return (
    <div className={styles.wrap}>
      <h1 className={styles.h1}>{t('nav.offers')}</h1>

      {allOffers.length > 0 ? (
        <div className={styles.list}>
          {allOffers.map((offer) => (
            <div key={offer.id} className={styles.row}>
              <div className={styles.left}>
                <div className={styles.iconBox}>
                  <Tag size={18} />
                </div>
                <div>
                  <div className={styles.amount}>
                    {offer.amount.toLocaleString()} {t('listing.price')}
                  </div>
                  <div className={styles.status}>{offer.status}</div>
                </div>
              </div>
              <span className={styles.ts}>
                <Clock size={12} />
                {new Date(offer.createdAt).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.empty}>{t('errors.notFound')}</div>
      )}
    </div>
  );
}
