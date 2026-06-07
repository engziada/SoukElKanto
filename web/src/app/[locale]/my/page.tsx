'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldCheck, PlusCircle, Search, Award, ArrowRight,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth/store';
import { qk, fetchKycStatus } from '@/lib/queries';
import {
  deriveTierFromId,
  tierLabelKey,
  tierClassMap,
} from '@/lib/trustTier';
import styles from './overview.module.css';
import tabStyles from './my.module.css';

function formatPhone(phone: string): string {
  if (!phone) return '';
  const local = phone.replace(/^\+20/, '0');
  return local.replace(/^(\d{4})(\d{3})(\d{4})$/, '$1 $2 $3');
}

export default function MyOverviewPage() {
  const t = useTranslations('my.overview');
  const tListings = useTranslations('listing');
  const locale = useLocale();
  const user = useAuthStore((s) => s.user);

  const { data: kyc } = useQuery({
    queryKey: qk.kycStatus(),
    queryFn: fetchKycStatus,
    enabled: Boolean(user),
    staleTime: 5 * 60_000, // 5 min — KYC rarely changes
  });

  if (!user) return null;

  const tier = deriveTierFromId(user.id);
  const isVerified = Boolean(kyc?.isVerified);
  const memberSince = user.metadata?.createdAt
    ? new Date(user.metadata.createdAt as string).toLocaleDateString(locale, {
        year: 'numeric',
        month: 'short',
      })
    : null;

  return (
    <div className={styles.wrap}>
      {/* Hero card: greeting + KYC + tier */}
      <section className={styles.hero}>
        <div className={styles.heroLeft}>
          <h2 className={styles.greet}>
            {t('greet', { phone: formatPhone(user.phoneNumber) })}
          </h2>
          <div className={styles.chips}>
            <span
              className={`${styles.chip} ${
                isVerified ? styles.chipVerified : styles.chipUnverified
              }`}
            >
              <ShieldCheck size={14} aria-hidden="true" />
              {isVerified ? t('kycChip') : t('kycChipNot')}
            </span>
            <span
              className={`${styles.tierChip} ${
                styles[`tier_${tierClassMap[tier]}`]
              }`}
            >
              <Award size={14} aria-hidden="true" />
              {t('tier', { tier: tListings(tierLabelKey(tier)) })}
            </span>
            {memberSince && (
              <span className={styles.chip}>
                {t('memberSince', { date: memberSince })}
              </span>
            )}
          </div>
        </div>
        <Link href={`/${locale}/my/profile`} className={styles.viewProfile}>
          {t('viewProfile')}
          <ArrowRight size={14} aria-hidden="true" className={styles.viewProfileArrow} />
        </Link>
      </section>

      {/* Quick actions */}
      <section className={styles.actions} aria-labelledby="qa-title">
        <h3 id="qa-title" className={tabStyles.panelTitle}>
          {t('quickActions')}
        </h3>
        <div className={styles.actionRow}>
          <Link href={`/${locale}/listings/new`} className={styles.actionCta}>
            <PlusCircle size={18} aria-hidden="true" />
            {t('publishCta')}
          </Link>
          <Link href={`/${locale}/listings`} className={styles.actionGhost}>
            <Search size={16} aria-hidden="true" />
            {t('browseCta')}
          </Link>
        </div>
      </section>

      {/* Recent activity placeholder */}
      <section className={tabStyles.panel} aria-labelledby="ra-title">
        <h3 id="ra-title" className={tabStyles.panelTitle}>
          {t('recentActivity')}
        </h3>
        <p className={styles.activityEmpty}>{t('noActivity')}</p>
      </section>
    </div>
  );
}
