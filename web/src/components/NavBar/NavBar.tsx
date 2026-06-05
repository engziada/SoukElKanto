'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Store, Search, PlusCircle, Tag, LogIn } from 'lucide-react';
import styles from './NavBar.module.css';

export function NavBar() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname() ?? '/';
  const [loginMsg, setLoginMsg] = useState(false);

  // Build the mirrored URL for the alternate locale by replacing the prefix.
  const otherLocale = locale === 'ar' ? 'en' : 'ar';
  const pathWithoutLocale = pathname.replace(new RegExp(`^/${locale}(?=/|$)`), '') || '/';
  const otherLocaleHref = `/${otherLocale}${pathWithoutLocale}`.replace(/\/$/, '') || `/${otherLocale}`;

  return (
    <header className={styles.header}>
      <div className="container">
        <div className={styles.inner}>
          <Link href={`/${locale}`} className={styles.brand} aria-label="Souk ElKanto home">
            <span className={styles.brandIcon}>
              <Store size={18} strokeWidth={2} />
            </span>
            <span>{locale === 'ar' ? 'كانتو' : 'Kanto'}</span>
          </Link>

          <nav className={styles.nav} aria-label="Primary">
            <Link href={`/${locale}`} className={styles.navLink}>
              <Search size={16} />
              {t('home')}
            </Link>
            <Link href={`/${locale}/listings`} className={styles.navLink}>
              <Tag size={16} />
              {t('listings')}
            </Link>
            <Link href={`/${locale}/listings/new`} className={styles.navLink}>
              <PlusCircle size={16} />
              {t('create')}
            </Link>
            <Link href={`/${locale}/offers`} className={styles.navLink}>
              <Tag size={16} />
              {t('offers')}
            </Link>
          </nav>

          <div className={styles.right}>
            <Link
              href={otherLocaleHref}
              className={styles.locale}
              aria-label={otherLocale === 'ar' ? 'تبديل إلى العربية' : 'Switch to English'}
              title={otherLocale.toUpperCase()}
            >
              {otherLocale === 'ar' ? 'ع' : 'EN'}
            </Link>
            <div className={styles.loginWrap}>
              <button
                type="button"
                className={styles.login}
                aria-label={t('login')}
                onClick={() => setLoginMsg((s) => !s)}
              >
                <LogIn size={16} />
                <span className={styles.loginLabel}>{t('login')}</span>
              </button>
              {loginMsg && (
                <span className={styles.loginHint} role="status" aria-live="polite">
                  {t('loginComingSoon')}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
