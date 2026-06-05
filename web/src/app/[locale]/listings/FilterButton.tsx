'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { SlidersHorizontal, X } from 'lucide-react';
import styles from './listings.module.css';

const CATEGORY_KEYS = [
  'FURNITURE', 'ELECTRONICS', 'APPLIANCES', 'FASHION',
  'KIDS_TOYS', 'KIDS_CLOTHING', 'KIDS_GEAR', 'SPORTS',
  'BOOKS', 'AUTOMOTIVE', 'HOME_DECOR', 'GARDEN',
  'MUSICAL_INSTRUMENTS', 'COLLECTIBLES', 'CRAFTS', 'OTHER',
] as const;

const CONDITION_KEYS = ['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'FOR_PARTS'] as const;

export function FilterButton() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const [category, setCategory] = useState(searchParams.get('category') ?? '');
  const [condition, setCondition] = useState(searchParams.get('condition') ?? '');
  const [district, setDistrict] = useState(searchParams.get('district') ?? '');

  const activeCount =
    (searchParams.get('category') ? 1 : 0) +
    (searchParams.get('condition') ? 1 : 0) +
    (searchParams.get('district') ? 1 : 0);

  // Close on outside click + Esc
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const apply = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (category) params.set('category', category); else params.delete('category');
    if (condition) params.set('condition', condition); else params.delete('condition');
    if (district) params.set('district', district); else params.delete('district');
    params.delete('page');
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
    setOpen(false);
  };

  const clear = () => {
    setCategory('');
    setCondition('');
    setDistrict('');
    const params = new URLSearchParams(searchParams.toString());
    params.delete('category');
    params.delete('condition');
    params.delete('district');
    params.delete('page');
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
    setOpen(false);
  };

  return (
    <div className={styles.filterWrap} ref={popoverRef}>
      <button
        type="button"
        className={styles.filterBtn}
        onClick={() => setOpen((s) => !s)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={t('filters.title')}
      >
        <SlidersHorizontal size={16} aria-hidden="true" />
        {t('filters.title')}
        {activeCount > 0 && (
          <span className={styles.filterBadge}>{activeCount}</span>
        )}
      </button>

      {open && (
        <div
          className={styles.popover}
          role="dialog"
          aria-label={t('filters.title')}
        >
          <div className={styles.popoverHead}>
            <span>{t('filters.title')}</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className={styles.popoverClose}
              aria-label={t('offer.cancel')}
            >
              <X size={14} aria-hidden="true" />
            </button>
          </div>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>{t('filters.category')}</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={styles.fieldSelect}
            >
              <option value="">{t('filters.category')}</option>
              {CATEGORY_KEYS.map((k) => (
                <option key={k} value={k}>{t(`categories.${k}`)}</option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>{t('filters.condition')}</span>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className={styles.fieldSelect}
            >
              <option value="">{t('filters.condition')}</option>
              {CONDITION_KEYS.map((k) => (
                <option key={k} value={k}>{t(`conditions.${k}`)}</option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>{t('filters.district')}</span>
            <input
              type="text"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              placeholder="B5, LAKE, PARK..."
              className={styles.fieldInput}
            />
          </label>

          <div className={styles.popoverFoot}>
            <button type="button" onClick={clear} className={styles.popoverClear}>
              {t('filters.clear')}
            </button>
            <button type="button" onClick={apply} className={styles.popoverApply}>
              {t('filters.apply')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
