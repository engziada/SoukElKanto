'use client';

/**
 * /my/wallet — R-03b
 *
 * Read-only wallet view: two balance pills (business + individual tokens),
 * a closed-loop policy explainer, allocations (reserved holds), and recent
 * transactions. No user-driven mutations — admin-only crediting per the
 * @madinatyai/tokens module.
 */

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Coins, Info, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { api } from '@/lib/api';
import type { TokenWallet, TokenTransaction } from '@/lib/api';
import { useAuthStore } from '@/lib/auth/store';
import tabStyles from '../my.module.css';
import styles from './wallet.module.css';

export default function MyWalletPage() {
  const t = useTranslations('my.wallet');
  const locale = useLocale();
  const user = useAuthStore((s) => s.user);

  const [wallet, setWallet] = useState<TokenWallet | null>(null);
  const [errorKey, setErrorKey] = useState<'networkDown' | 'generic' | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    api.tokens
      .walletMe()
      .then((w) => { if (!cancelled) setWallet(w); })
      .catch((err: { status?: number }) => {
        if (cancelled) return;
        setErrorKey(err?.status === 0 ? 'networkDown' : 'generic');
      });
    return () => { cancelled = true; };
  }, [user]);

  function fmtAmount(n: number): string {
    return n.toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-US');
  }

  function fmtDate(iso: string): string {
    return new Date(iso).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US');
  }

  if (errorKey) {
    return (
      <section aria-labelledby="wallet-title">
        <h2 id="wallet-title" className={tabStyles.panelTitle}>
          {t('title')}
        </h2>
        <div className={tabStyles.empty}>
          <Coins size={32} strokeWidth={1.2} aria-hidden="true" />
          <p>{t(errorKey === 'networkDown' ? 'errorNetwork' : 'errorGeneric')}</p>
        </div>
      </section>
    );
  }

  if (!wallet) {
    return (
      <section aria-labelledby="wallet-title">
        <h2 id="wallet-title" className={tabStyles.panelTitle}>
          {t('title')}
        </h2>
        <div className={styles.balances} aria-busy="true">
          <div className={`${styles.balance} ${styles.skeleton}`} />
          <div className={`${styles.balance} ${styles.skeleton}`} />
        </div>
      </section>
    );
  }

  const txns = wallet.recentTransactions ?? [];
  const allocations = wallet.allocations ?? [];

  return (
    <section aria-labelledby="wallet-title">
      <h2 id="wallet-title" className={tabStyles.panelTitle}>
        {t('title')}
      </h2>

      {/* Closed-loop policy explainer */}
      <div className={styles.policyBanner} role="note">
        <Info size={16} aria-hidden="true" />
        <span>{t('closedLoopNote')}</span>
      </div>

      {/* Balance pills */}
      <div className={styles.balances}>
        <div className={styles.balance}>
          <span className={styles.balanceLabel}>{t('individualTokens')}</span>
          <span className={styles.balanceValue}>
            {fmtAmount(wallet.individualTokens)}
          </span>
        </div>
        <div className={styles.balance}>
          <span className={styles.balanceLabel}>{t('businessTokens')}</span>
          <span className={styles.balanceValue}>
            {fmtAmount(wallet.businessTokens)}
          </span>
        </div>
      </div>

      {/* Allocations (held tokens) */}
      {allocations.length > 0 && (
        <details className={styles.section} open>
          <summary className={styles.sectionTitle}>
            {t('allocationsTitle')}
            <span className={styles.sectionCount}>{allocations.length}</span>
          </summary>
          <ul className={styles.allocationsList}>
            {allocations.map((a, idx) => (
              <li key={idx} className={styles.allocationRow}>
                <span className={styles.allocationAmount}>
                  {fmtAmount(a.amount)}
                </span>
                <span className={styles.allocationReason}>
                  {a.reason ?? '—'}
                </span>
                {a.expiresAt && (
                  <span className={styles.allocationDate}>
                    {t('expiresAt', { date: fmtDate(a.expiresAt) })}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </details>
      )}

      {/* Recent transactions */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>
          {t('recentTitle')}
          <span className={styles.sectionCount}>{txns.length}</span>
        </h3>
        {txns.length === 0 ? (
          <p className={styles.txEmpty}>{t('recentEmpty')}</p>
        ) : (
          <ul className={styles.txList}>
            {txns.map((tx: TokenTransaction, idx) => {
              const isCredit = tx.activityType === 'CREDIT';
              return (
                <li
                  key={idx}
                  className={`${styles.txRow} ${isCredit ? styles.txCredit : styles.txDebit}`}
                >
                  <span className={styles.txIcon} aria-hidden="true">
                    {isCredit ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                  </span>
                  <span className={styles.txDescription}>{tx.description}</span>
                  <span className={styles.txAmount}>
                    {isCredit ? '+' : '−'}
                    {fmtAmount(Math.abs(tx.amount))}
                  </span>
                  <span className={styles.txDate}>{fmtDate(tx.createdAt)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </section>
  );
}
