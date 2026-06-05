'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowUpDown } from 'lucide-react';
import styles from './listings.module.css';

export function SortSelect() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSort = searchParams.get('sort') ?? 'newest';

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'newest') {
      params.set('sort', value);
    } else {
      params.delete('sort');
    }
    params.delete('page');
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  return (
    <label className={styles.sortWrap}>
      <ArrowUpDown size={14} aria-hidden="true" />
      <select
        className={styles.sortSelect}
        value={currentSort}
        onChange={(e) => handleChange(e.target.value)}
        aria-label={t('filters.sort')}
      >
        <option value="newest">{t('filters.sortNewest')}</option>
        <option value="price_asc">{t('filters.sortPriceAsc')}</option>
        <option value="price_desc">{t('filters.sortPriceDesc')}</option>
        <option value="popular">{t('filters.sortPopular')}</option>
      </select>
    </label>
  );
}
