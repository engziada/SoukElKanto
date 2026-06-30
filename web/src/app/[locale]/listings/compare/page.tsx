'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { GitCompare, X, ArrowRight, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCompare } from '@/lib/compare';
import styles from './compare.module.css';

function ImageCarousel({ urls, alt }: { urls: string[]; alt: string }) {
  const [idx, setIdx] = useState(0);
  if (!urls || urls.length === 0) return null;
  const hasMultiple = urls.length > 1;

  return (
    <div className={styles.carousel}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={urls[idx]} alt={alt} className={styles.carouselImg} />
      {hasMultiple && (
        <>
          <button
            type="button"
            className={`${styles.carouselNav} ${styles.carouselPrev}`}
            onClick={() => setIdx((i) => (i - 1 + urls.length) % urls.length)}
            aria-label="Previous image"
          >
            <ChevronLeft size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={`${styles.carouselNav} ${styles.carouselNext}`}
            onClick={() => setIdx((i) => (i + 1) % urls.length)}
            aria-label="Next image"
          >
            <ChevronRight size={16} aria-hidden="true" />
          </button>
          <div className={styles.carouselDots}>
            {urls.map((_, i) => (
              <span
                key={i}
                className={i === idx ? styles.dotActive : styles.dot}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function RatingStars({ score }: { score: number }) {
  if (!score || score <= 0) {
    return <span className={styles.noRating}>—</span>;
  }
  return (
    <span className={styles.rating}>
      <Star size={14} fill="currentColor" aria-hidden="true" />
      {score.toFixed(1)}
    </span>
  );
}

export default function ComparePage() {
  const t = useTranslations('compare');
  const tListing = useTranslations('listing');
  const locale = useLocale();
  const { items, mounted, removeFromCompare, clearCompare } = useCompare();

  if (!mounted) {
    return (
      <section className={styles.section}>
        <div className={styles.loading}>…</div>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className={styles.section}>
        <div className={styles.empty}>
          <GitCompare size={48} strokeWidth={1.2} aria-hidden="true" />
          <h2 className={styles.emptyTitle}>{t('emptyTitle')}</h2>
          <p className={styles.emptyText}>{t('emptyText')}</p>
          <Link href={`/${locale}/listings`} className={styles.browseBtn}>
            {t('browseListings')}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </section>
    );
  }

  // Build comparison rows: each attribute becomes a row
  const rows: Array<{ key: string; label: string; getValue: (i: typeof items[0]) => string }> = [
    { key: 'price', label: tListing('price'), getValue: (i) => i.askingPrice.toLocaleString() },
    { key: 'category', label: t('category'), getValue: (i) => i.category },
    { key: 'condition', label: t('condition'), getValue: (i) => i.condition },
    { key: 'district', label: t('district'), getValue: (i) => i.district },
  ];

  // Find best price (lowest)
  const lowestPrice = Math.min(...items.map((i) => i.askingPrice));
  // Find highest rating
  const highestRating = Math.max(...items.map((i) => i.sellerRating ?? 0));

  return (
    <section className={styles.section}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          <GitCompare size={24} aria-hidden="true" />
          {t('pageTitle')}
        </h1>
        <button type="button" className={styles.clearAllBtn} onClick={clearCompare}>
          <X size={14} aria-hidden="true" />
          {t('clear')}
        </button>
      </header>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.specCol} aria-label={t('attribute')} />
              {items.map((item) => (
                <th key={item.id} className={styles.itemCol}>
                  <div className={styles.itemHeader}>
                    <ImageCarousel
                      urls={item.photoUrls ?? (item.photoUrl ? [item.photoUrl] : [])}
                      alt={item.title}
                    />
                    <Link
                      href={`/${locale}/listings/${item.id}`}
                      className={styles.itemTitle}
                    >
                      {item.title}
                    </Link>
                    <button
                      type="button"
                      className={styles.itemRemove}
                      onClick={() => removeFromCompare(item.id)}
                      aria-label={t('remove')}
                    >
                      <X size={12} aria-hidden="true" />
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Description row */}
            <tr key="description">
              <td className={styles.specCol}>{t('description')}</td>
              {items.map((item) => (
                <td key={item.id} className={styles.cellDesc}>
                  {item.description || '—'}
                </td>
              ))}
            </tr>
            {/* Seller rating row */}
            <tr key="rating">
              <td className={styles.specCol}>{t('sellerRating')}</td>
              {items.map((item) => (
                <td
                  key={item.id}
                  className={
                    item.sellerRating === highestRating && item.sellerRating > 0
                      ? `${styles.cell} ${styles.bestRating}`
                      : styles.cell
                  }
                >
                  <RatingStars score={item.sellerRating ?? 0} />
                </td>
              ))}
            </tr>
            {/* Standard attribute rows */}
            {rows.map((row) => (
              <tr key={row.key}>
                <td className={styles.specCol}>{row.label}</td>
                {items.map((item) => (
                  <td
                    key={item.id}
                    className={
                      row.key === 'price' && item.askingPrice === lowestPrice
                        ? `${styles.cell} ${styles.bestPrice}`
                        : styles.cell
                    }
                  >
                    {row.getValue(item)}
                    {row.key === 'price' && item.askingPrice === lowestPrice && (
                      <span className={styles.bestBadge}>{t('bestPrice')}</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
