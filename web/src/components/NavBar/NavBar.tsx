'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import {
  Store, Search, PlusCircle, Tag, LogIn, User as UserIcon, LayoutGrid, LogOut, BadgeCheck,
  ClipboardList, ArrowLeftRight, Heart, Bell,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth/store';
import { usePendingActions } from '@/lib/usePendingActions';
import styles from './NavBar.module.css';

function userLabel(user: { phoneNumber: string; metadata?: Record<string, unknown> }): string {
  const displayName = user.metadata?.displayName as string | undefined;
  if (displayName) return displayName;
  // Mask all but last 3 digits: +201234567890 → •••••••••890
  const local = user.phoneNumber.replace(/^\+20/, '0');
  if (local.length >= 3) {
    return '•'.repeat(local.length - 3) + local.slice(-3);
  }
  return local;
}

export function NavBar() {
  const t = useTranslations('nav');
  const tAuth = useTranslations('auth');
  const locale = useLocale();
  const pathname = usePathname() ?? '/';
  const router = useRouter();

  const [hydrated, setHydrated] = useState(false);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  // R-11 F-16 — async signOut hits POST /auth/logout to revoke the JWT JTI
  // server-side before clearing client state.
  const signOut = useAuthStore((s) => s.signOut);
  const { newCount } = usePendingActions();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => setHydrated(true), []);

  // Close dropdown on outside click + Esc
  useEffect(() => {
    if (!menuOpen) return;
    const onPointer = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const otherLocale = locale === 'ar' ? 'en' : 'ar';
  const pathWithoutLocale = pathname.replace(new RegExp(`^/${locale}(?=/|$)`), '') || '/';
  const otherLocaleHref = `/${otherLocale}${pathWithoutLocale}`.replace(/\/$/, '') || `/${otherLocale}`;

  const handleLogout = async () => {
    setMenuOpen(false);
    await signOut();
    router.push(`/${locale}`);
  };

  const showUserChip = hydrated && isAuthenticated && user;

  return (
    <header className={styles.header}>
      <div className="container">
        <div className={styles.inner}>
          <Link href={`/${locale}`} className={styles.brand} aria-label="Souk ElKanto home">
            <span className={styles.brandIcon}>
              <Store size={18} strokeWidth={2} />
            </span>
            <span>{locale === 'ar' ? 'سوق الكانتو' : 'Souk ElKanto'}</span>
            <span className={styles.aiBadge}>AI</span>
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
            <Link href={`/${locale}/listings/new`} className={`${styles.navLink} ${styles.navCreate}`}>
              <PlusCircle size={16} />
              {t('create')}
            </Link>
            <Link href={`/${locale}/my/favorites`} className={styles.navLink}>
              <Heart size={16} />
              {t('favorites')}
            </Link>
          </nav>

          <div className={styles.right}>
            {showUserChip && hydrated && newCount > 0 && (
              <Link
                href={`/${locale}/my/offers`}
                className={styles.bellLink}
                aria-label={t('notifications')}
              >
                <Bell size={18} aria-hidden="true" />
                {newCount > 0 && (
                  <span className={styles.bellBadge}>
                    {newCount > 9 ? '9+' : newCount}
                  </span>
                )}
              </Link>
            )}
            <Link
              href={otherLocaleHref}
              className={styles.locale}
              aria-label={otherLocale === 'ar' ? 'تبديل إلى العربية' : 'Switch to English'}
              title={otherLocale.toUpperCase()}
            >
              {otherLocale === 'ar' ? 'ع' : 'EN'}
            </Link>

            {showUserChip ? (
              <div className={styles.userWrap} ref={menuRef}>
                <button
                  type="button"
                  className={styles.userChip}
                  onClick={() => setMenuOpen((s) => !s)}
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                >
                  <span className={styles.userAvatar} aria-hidden="true">
                    <UserIcon size={14} />
                  </span>
                  <span className={styles.userPhone}>{userLabel(user!)}</span>
                  {user!.isVerified && (
                    <span className={styles.verifiedStar} title="Verified">
                      <BadgeCheck size={14} />
                    </span>
                  )}
                </button>
                {menuOpen && (
                  <div className={styles.userMenu} role="menu">
                    <Link
                      href={`/${locale}/my`}
                      className={styles.userMenuItem}
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                    >
                      <LayoutGrid size={14} aria-hidden="true" />
                      {tAuth('myAccount')}
                    </Link>
                    <Link
                      href={`/${locale}/my/listings`}
                      className={styles.userMenuItem}
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                    >
                      <ClipboardList size={14} aria-hidden="true" />
                      {tAuth('myListings')}
                    </Link>
                    <Link
                      href={`/${locale}/my/offers`}
                      className={styles.userMenuItem}
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                    >
                      <ArrowLeftRight size={14} aria-hidden="true" />
                      {tAuth('myOffers')}
                    </Link>
                    <button
                      type="button"
                      className={styles.userMenuItem}
                      role="menuitem"
                      onClick={handleLogout}
                    >
                      <LogOut size={14} aria-hidden="true" />
                      {tAuth('logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href={`/${locale}/auth/login`}
                className={styles.login}
                aria-label={t('login')}
              >
                <LogIn size={16} aria-hidden="true" />
                <span className={styles.loginLabel}>{t('login')}</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
