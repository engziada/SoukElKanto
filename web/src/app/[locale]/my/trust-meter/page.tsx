'use client';

import { useTranslations } from 'next-intl';
import { Award } from 'lucide-react';
import { useAuthStore } from '@/lib/auth/store';
import {
  deriveTierFromId,
  tierClassMap,
  tierLabelKey,
} from '@/lib/trustTier';
import tabStyles from '../my.module.css';
import styles from './trust-meter.module.css';

export default function MyTrustMeterPage() {
  const t = useTranslations('my.trustMeter');
  const tListing = useTranslations('listing');
  const user = useAuthStore((s) => s.user);

  if (!user) return null;
  const tier = deriveTierFromId(user.id);
  const tierClass = tierClassMap[tier];

  return (
    <section aria-labelledby="trust-title">
      <h2 id="trust-title" className={tabStyles.panelTitle}>
        {t('title')}
      </h2>

      <div className={styles.card}>
        <div
          className={`${styles.ribbon} ${styles[`tier_${tierClass}`]}`}
          aria-label={tListing(tierLabelKey(tier))}
        >
          <Award size={26} aria-hidden="true" />
          <span>{tListing(tierLabelKey(tier))}</span>
        </div>
        <p className={styles.soon}>{t('soon')}</p>
      </div>
    </section>
  );
}
