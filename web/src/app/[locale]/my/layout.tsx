import { getTranslations } from 'next-intl/server';
import { AuthGate } from '@/components/AuthGate';
import { MyTabs } from './MyTabs';
import styles from './my.module.css';

interface MyLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function MyLayout({ children, params }: MyLayoutProps) {
  const { locale } = await params;
  const t = await getTranslations('my');

  return (
    <AuthGate
      fallback={
        <div className={styles.skeleton} aria-busy="true" aria-live="polite" />
      }
    >
      <div className={styles.wrap}>
        <header className={styles.header}>
          <h1 className={styles.title}>{t('shellTitle')}</h1>
        </header>
        <MyTabs locale={locale} />
        <section className={styles.content}>{children}</section>
      </div>
    </AuthGate>
  );
}
