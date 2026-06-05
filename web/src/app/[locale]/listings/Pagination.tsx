'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './listings.module.css';

interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
}

export function Pagination({ page, totalPages, totalItems }: PaginationProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const goToPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (p > 1) {
      params.set('page', String(p));
    } else {
      params.delete('page');
    }
    router.push(`/${locale}${pathname}?${params.toString()}`);
  };

  return (
    <div className={styles.pagination}>
      <span className={styles.pageInfo}>
        {totalItems} {t('nav.listings')}
      </span>
      <div className={styles.pageControls}>
        <button
          type="button"
          className={styles.pageBtn}
          onClick={() => goToPage(page - 1)}
          disabled={page <= 1}
          aria-label={t('pagination.prev')}
        >
          <ChevronLeft size={16} />
        </button>
        <span className={styles.pageCurrent}>
          {page} / {totalPages}
        </span>
        <button
          type="button"
          className={styles.pageBtn}
          onClick={() => goToPage(page + 1)}
          disabled={page >= totalPages}
          aria-label={t('pagination.next')}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
