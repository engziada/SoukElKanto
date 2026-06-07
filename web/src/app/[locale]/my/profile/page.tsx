'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { ShieldCheck, ShieldAlert, ShieldQuestion, LogOut, Phone } from 'lucide-react';
import { api, type KycStatus } from '@/lib/api';
import { useAuthStore } from '@/lib/auth/store';
import tabStyles from '../my.module.css';
import styles from './profile.module.css';

function formatPhone(phone: string): string {
  if (!phone) return '';
  const local = phone.replace(/^\+20/, '0');
  return local.replace(/^(\d{4})(\d{3})(\d{4})$/, '$1 $2 $3');
}

export default function MyProfilePage() {
  const t = useTranslations('my.profile');
  const locale = useLocale();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [kyc, setKyc] = useState<KycStatus | null>(null);

  useEffect(() => {
    if (!user) return;
    api.users
      .kycStatus()
      .then(setKyc)
      .catch(() => setKyc(null));
  }, [user]);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    router.push(`/${locale}`);
  };

  const kycLabelMap = {
    NOT_SUBMITTED: { label: t('kycNotSubmitted'), tone: 'unverified' as const, Icon: ShieldQuestion },
    PENDING: { label: t('kycPending'), tone: 'pending' as const, Icon: ShieldAlert },
    APPROVED: { label: t('kycApproved'), tone: 'verified' as const, Icon: ShieldCheck },
    REJECTED: { label: t('kycRejected'), tone: 'rejected' as const, Icon: ShieldAlert },
  } as const;

  const kycInfo = kyc ? kycLabelMap[kyc.status as keyof typeof kycLabelMap] ?? kycLabelMap.NOT_SUBMITTED : kycLabelMap.NOT_SUBMITTED;

  return (
    <section className={styles.wrap} aria-labelledby="profile-title">
      <h2 id="profile-title" className={tabStyles.panelTitle}>
        {t('title')}
      </h2>

      <dl className={styles.fields}>
        <div className={styles.field}>
          <dt className={styles.fieldLabel}>{t('phone')}</dt>
          <dd className={styles.fieldValue}>
            <Phone size={14} aria-hidden="true" />
            <span className={styles.phoneNum} dir="ltr">{formatPhone(user.phoneNumber)}</span>
          </dd>
        </div>

        <div className={styles.field}>
          <dt className={styles.fieldLabel}>{t('kycStatus')}</dt>
          <dd className={styles.fieldValue}>
            <span className={`${styles.kycChip} ${styles[`kyc_${kycInfo.tone}`]}`}>
              <kycInfo.Icon size={14} aria-hidden="true" />
              {kycInfo.label}
            </span>
          </dd>
        </div>
      </dl>

      <div className={styles.actions}>
        <button type="button" onClick={handleLogout} className={styles.logoutBtn}>
          <LogOut size={14} aria-hidden="true" />
          {t('logout')}
        </button>
      </div>
    </section>
  );
}
