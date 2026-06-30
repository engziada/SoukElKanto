'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { X, GitCompare, Trash2 } from 'lucide-react';
import { useCompare } from '@/lib/compare';
import styles from './CompareBar.module.css';

export function CompareBar() {
  const t = useTranslations('compare');
  const locale = useLocale();
  const { items, mounted, removeFromCompare, clearCompare, maxItems } = useCompare();

  if (!mounted || items.length === 0) return null;

  return (
    <div className={styles.bar}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.items}>
          {items.map((item) => (
            <div key={item.id} className={styles.item}>
              {item.photoUrl && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={item.photoUrl} alt={item.title} className={styles.thumb} />
              )}
              <span className={styles.itemTitle}>{item.title}</span>
              <button
                type="button"
                className={styles.removeBtn}
                onClick={() => removeFromCompare(item.id)}
                aria-label={t('remove')}
              >
                <X size={12} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.clearBtn}
            onClick={clearCompare}
            aria-label={t('clear')}
          >
            <Trash2 size={14} aria-hidden="true" />
            {t('clear')}
          </button>
          <Link
            href={`/${locale}/listings/compare`}
            className={styles.compareBtn}
          >
            <GitCompare size={16} aria-hidden="true" />
            {t('compare')} ({items.length}/{maxItems})
          </Link>
        </div>
      </div>
    </div>
  );
}
