'use client';

import { useState, useCallback } from 'react';
import { SearchX, Bell, Sparkles } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { ListingCard } from '@/components/ListingCard';
import type { Listing } from '@/lib/api';
import styles from './EmptySearchState.module.css';

interface EmptySearchStateProps {
  query: string;
  suggestions: Listing[];
}

const ALERTS_KEY = 'kanto:searchAlerts';

function hasAlert(query: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(ALERTS_KEY);
    const alerts: Array<{ query: string }> = raw ? JSON.parse(raw) : [];
    return alerts.some((a) => a.query.toLowerCase() === query.toLowerCase());
  } catch {
    return false;
  }
}

function addAlert(query: string): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(ALERTS_KEY);
    const alerts: Array<{ query: string; createdAt: string }> = raw
      ? JSON.parse(raw)
      : [];
    if (!alerts.some((a) => a.query.toLowerCase() === query.toLowerCase())) {
      alerts.push({ query, createdAt: new Date().toISOString() });
      localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts));
    }
  } catch {
    // silently fail on storage errors
  }
}

export function EmptySearchState({ query, suggestions }: EmptySearchStateProps) {
  const t = useTranslations();
  const locale = useLocale();
  const [notified, setNotified] = useState(() => hasAlert(query));

  const handleNotify = useCallback(() => {
    addAlert(query);
    setNotified(true);
  }, [query]);

  return (
    <div className={styles.wrap}>
      <div className={styles.pill}>
        <SearchX size={40} strokeWidth={1.2} />
        <h2 className={styles.heading}>{t('search.noResultsTitle')}</h2>
        <p className={styles.body}>
          {t('search.noResultsBody', { query })}
        </p>

        {notified ? (
          <div className={styles.success}>
            <Sparkles size={16} />
            <span>{t('search.notifySuccess')}</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleNotify}
            className={styles.notifyBtn}
            aria-label={t('search.notifyMe')}
          >
            <Bell size={16} />
            <span>{t('search.notifyMe')}</span>
          </button>
        )}
      </div>

      {suggestions.length > 0 && (
        <section className={styles.suggestions}>
          <header className={styles.suggestionsHead}>
            <h3 className={styles.suggestionsTitle}>
              {t('search.suggestions')}
            </h3>
          </header>
          <div className={styles.suggestionsGrid}>
            {suggestions.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
          <div className={styles.suggestionsFoot}>
            <Link href={`/${locale}/listings`} className={styles.viewAll}>
              {t('home.viewAll')}
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
