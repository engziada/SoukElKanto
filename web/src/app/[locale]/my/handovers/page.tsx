'use client';

import { useTranslations } from 'next-intl';
import { Handshake } from 'lucide-react';
import tabStyles from '../my.module.css';

export default function MyHandoversPage() {
  const t = useTranslations('my.handovers');
  return (
    <section aria-labelledby="handovers-title">
      <h2 id="handovers-title" className={tabStyles.panelTitle}>
        {t('title')}
      </h2>
      <div className={tabStyles.empty}>
        <Handshake size={32} strokeWidth={1.2} aria-hidden="true" />
        <p>{t('empty')}</p>
      </div>
    </section>
  );
}
