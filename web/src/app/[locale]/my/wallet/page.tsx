'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Coins } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth/store';
import tabStyles from '../my.module.css';
import styles from './wallet.module.css';

interface WalletPayload {
  userId: string;
  businessTokens: number;
  individualTokens: number;
}

export default function MyWalletPage() {
  const t = useTranslations('my.wallet');
  const user = useAuthStore((s) => s.user);
  const [wallet, setWallet] = useState<WalletPayload | null>(null);

  useEffect(() => {
    if (!user) return;
    api.tokens
      .walletMe()
      .then((w) =>
        setWallet({
          userId: w.userId,
          businessTokens: w.businessTokens,
          individualTokens: w.individualTokens,
        }),
      )
      .catch(() =>
        setWallet({
          userId: user.id,
          businessTokens: 0,
          individualTokens: 0,
        }),
      );
  }, [user]);

  return (
    <section aria-labelledby="wallet-title">
      <h2 id="wallet-title" className={tabStyles.panelTitle}>
        {t('title')}
      </h2>

      {wallet && (wallet.businessTokens > 0 || wallet.individualTokens > 0) ? (
        <div className={styles.balances}>
          <div className={styles.balance}>
            <span className={styles.balanceLabel}>{t('individualTokens')}</span>
            <span className={styles.balanceValue}>
              {wallet.individualTokens.toLocaleString()}
            </span>
          </div>
          <div className={styles.balance}>
            <span className={styles.balanceLabel}>{t('businessTokens')}</span>
            <span className={styles.balanceValue}>
              {wallet.businessTokens.toLocaleString()}
            </span>
          </div>
        </div>
      ) : (
        <div className={tabStyles.empty}>
          <Coins size={32} strokeWidth={1.2} aria-hidden="true" />
          <p>{t('noBalance')}</p>
          <p className={tabStyles.emptyHint}>{t('soon')}</p>
        </div>
      )}
    </section>
  );
}
