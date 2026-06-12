'use client';

/**
 * /my/trust-meter — R-03c
 *
 * Real user-facing reputation view:
 *   - Current tier ribbon (NEW / BRONZE / SILVER / GOLD / PLATINUM)
 *   - Current score + progress bar to next tier
 *   - Tier ladder (5 tiers with thresholds)
 *   - Recent bonus grants (token rewards on tier-up)
 *
 * Replaces the previous deterministic-hash-derived placeholder. Data comes
 * from /api/v1/trust-meter/me + /api/v1/trust-meter/me/bonus-grants.
 */

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Award, Coins, TrendingUp } from 'lucide-react';
import { api } from '@/lib/api';
import type {
  TrustMeterSummary,
  TrustMeterBonusGrant,
  TrustMeterTier,
} from '@/lib/api';
import { useAuthStore } from '@/lib/auth/store';
import tabStyles from '../my.module.css';
import styles from './trust-meter.module.css';

interface TierDef {
  key: TrustMeterTier;
  min: number;
  max: number;
}

const TIERS: TierDef[] = [
  { key: 'NEW', min: 0, max: 200 },
  { key: 'BRONZE', min: 201, max: 500 },
  { key: 'SILVER', min: 501, max: 1000 },
  { key: 'GOLD', min: 1001, max: 2000 },
  { key: 'PLATINUM', min: 2001, max: 3000 },
];

function tierClassFor(tier: TrustMeterTier): string {
  return `tier_${tier.toLowerCase()}`;
}

export default function MyTrustMeterPage() {
  const t = useTranslations('my.trustMeter');
  const locale = useLocale();
  const user = useAuthStore((s) => s.user);

  const [summary, setSummary] = useState<TrustMeterSummary | null>(null);
  const [grants, setGrants] = useState<TrustMeterBonusGrant[]>([]);
  const [errorKey, setErrorKey] = useState<'networkDown' | 'generic' | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    Promise.all([api.trustMeter.me(), api.trustMeter.bonusGrants()])
      .then(([s, g]) => {
        if (cancelled) return;
        setSummary(s);
        setGrants(g);
      })
      .catch((err: { status?: number }) => {
        if (cancelled) return;
        setErrorKey(err?.status === 0 ? 'networkDown' : 'generic');
      });
    return () => { cancelled = true; };
  }, [user]);

  function fmtNum(n: number): string {
    return n.toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-US');
  }

  function fmtDate(iso: string): string {
    return new Date(iso).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US');
  }

  if (errorKey) {
    return (
      <section aria-labelledby="trust-title">
        <h2 id="trust-title" className={tabStyles.panelTitle}>
          {t('title')}
        </h2>
        <div className={tabStyles.empty}>
          <Award size={32} strokeWidth={1.2} aria-hidden="true" />
          <p>{t(errorKey === 'networkDown' ? 'errorNetwork' : 'errorGeneric')}</p>
        </div>
      </section>
    );
  }

  if (!summary) {
    return (
      <section aria-labelledby="trust-title">
        <h2 id="trust-title" className={tabStyles.panelTitle}>
          {t('title')}
        </h2>
        <div className={`${styles.card} ${styles.skeleton}`} aria-busy="true" />
      </section>
    );
  }

  // Progress bar: percentage from current tier's floor to next tier's floor.
  const currentTier = TIERS.find((tier) => tier.key === summary.tier) ?? TIERS[0];
  const nextTier = TIERS.find((tier) => tier.key === summary.nextTier);
  const progressMin = currentTier.min;
  const progressMax = nextTier ? nextTier.min : 3000;
  const progressSpan = Math.max(1, progressMax - progressMin);
  const progressValue = Math.max(0, Math.min(progressSpan, summary.total - progressMin));
  const progressPct = Math.round((progressValue / progressSpan) * 100);

  return (
    <section aria-labelledby="trust-title">
      <h2 id="trust-title" className={tabStyles.panelTitle}>
        {t('title')}
      </h2>

      {/* Hero: tier ribbon + score */}
      <div className={`${styles.card} ${styles[tierClassFor(summary.tier)]}`}>
        <div className={styles.ribbon} aria-hidden="true">
          <Award size={26} />
          <span className={styles.tierName}>{t(`tier.${summary.tier}`)}</span>
        </div>
        <div className={styles.scoreRow}>
          <span className={styles.scoreValue}>{fmtNum(summary.total)}</span>
          <span className={styles.scoreCeiling}>/ {fmtNum(3000)}</span>
        </div>
        {summary.tierReachedAt && (
          <p className={styles.tierReached}>
            {t('tierReachedAt', { date: fmtDate(summary.tierReachedAt) })}
          </p>
        )}

        {/* Progress to next tier */}
        {summary.nextTier && (
          <div className={styles.progressWrap}>
            <div className={styles.progressLabel}>
              <span>{t('progressToNext', { tier: t(`tier.${summary.nextTier}`) })}</span>
              <span className={styles.progressPct}>
                {summary.pointsToNextTier !== null && summary.pointsToNextTier !== undefined
                  ? t('pointsToGo', { n: fmtNum(summary.pointsToNextTier) })
                  : `${progressPct}%`}
              </span>
            </div>
            <div className={styles.progressTrack} role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100}>
              <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Tier ladder */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <TrendingUp size={16} aria-hidden="true" />
          {t('ladderTitle')}
        </h3>
        <ul className={styles.tierLadder}>
          {TIERS.map((tier) => {
            const isCurrent = tier.key === summary.tier;
            const isAchieved = TIERS.findIndex((tt) => tt.key === summary.tier) >= TIERS.findIndex((tt) => tt.key === tier.key);
            return (
              <li
                key={tier.key}
                className={`${styles.tierItem} ${styles[tierClassFor(tier.key)]} ${isCurrent ? styles.tierItemCurrent : ''} ${isAchieved ? styles.tierItemAchieved : ''}`}
              >
                <Award size={18} aria-hidden="true" />
                <div className={styles.tierItemText}>
                  <span className={styles.tierItemName}>{t(`tier.${tier.key}`)}</span>
                  <span className={styles.tierItemRange}>
                    {fmtNum(tier.min)} – {fmtNum(tier.max)}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Recent bonus grants */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <Coins size={16} aria-hidden="true" />
          {t('grantsTitle')}
          <span className={styles.sectionCount}>{grants.length}</span>
        </h3>
        {grants.length === 0 ? (
          <p className={styles.grantsEmpty}>{t('grantsEmpty')}</p>
        ) : (
          <ul className={styles.grantsList}>
            {grants.slice(0, 10).map((g) => (
              <li key={g.id} className={styles.grantRow}>
                <Award size={14} aria-hidden="true" />
                <span className={styles.grantDescription}>
                  {t('grantDescription', { tier: t(`tier.${g.tier}`) })}
                </span>
                <span className={styles.grantAmount}>+{fmtNum(g.amount)}</span>
                <span className={styles.grantDate}>{fmtDate(g.grantedAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
