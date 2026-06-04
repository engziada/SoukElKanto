'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { Store, Search, PlusCircle, Tag, LogIn } from 'lucide-react';

export function NavBar() {
  const t = useTranslations('nav');
  const locale = useLocale();

  const otherLocale = locale === 'ar' ? 'en' : 'ar';

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-bg)]/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href={`/${locale}`}
          className="flex items-center gap-2 text-xl font-bold tracking-tight text-[var(--color-text)]"
        >
          <Store className="h-6 w-6 text-[var(--color-kanto-coral)]" />
          <span>كانتو</span>
        </Link>

        {/* Nav Links */}
        <nav className="hidden items-center gap-6 md:flex">
          <NavLink href={`/${locale}`} label={t('home')} icon={<Search className="h-4 w-4" />} />
          <NavLink href={`/${locale}/listings`} label={t('listings')} icon={<Tag className="h-4 w-4" />} />
          <NavLink href={`/${locale}/listings/new`} label={t('create')} icon={<PlusCircle className="h-4 w-4" />} />
          <NavLink href={`/${locale}/offers`} label={t('offers')} icon={<Tag className="h-4 w-4" />} />
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <Link
            href={`/${otherLocale}${typeof window !== 'undefined' ? window.location.pathname.replace(`/${locale}`, '') : ''}`}
            className="rounded-full px-3 py-1 text-sm font-medium text-[var(--color-text-soft)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
          >
            {otherLocale.toUpperCase()}
          </Link>
          <button className="flex items-center gap-2 rounded-full bg-[var(--color-kanto-coral)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90">
            <LogIn className="h-4 w-4" />
            <span className="hidden sm:inline">{t('login')}</span>
          </button>
        </div>
      </div>
    </header>
  );
}

function NavLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-text-soft)] transition-colors hover:text-[var(--color-text)]"
    >
      {icon}
      {label}
    </Link>
  );
}
