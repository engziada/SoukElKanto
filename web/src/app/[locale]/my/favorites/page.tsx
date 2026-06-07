'use client';

import { useTranslations } from 'next-intl';
import { Heart } from 'lucide-react';
import tabStyles from '../my.module.css';

export default function MyFavoritesPage() {
  const t = useTranslations('my.favorites');
  return (
    <section aria-labelledby="favs-title">
      <h2 id="favs-title" className={tabStyles.panelTitle}>
        {t('title')}
      </h2>
      <div className={tabStyles.empty}>
        <Heart size={32} strokeWidth={1.2} aria-hidden="true" />
        <p>{t('empty')}</p>
      </div>
    </section>
  );
}
