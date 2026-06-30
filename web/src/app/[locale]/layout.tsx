import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { NavBar } from '@/components/NavBar';
import { Footer } from '@/components/Footer';
import { AstroChat } from '@/components/AstroChat/AstroChat';
import { CompareBar } from '@/components/CompareBar/CompareBar';
import styles from './layout.module.css';

const SUPPORTED = ['ar', 'en'] as const;
type Locale = (typeof SUPPORTED)[number];

export function generateStaticParams() {
  return SUPPORTED.map((locale) => ({ locale }));
}

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

/**
 * Per-locale layout. The root layout (`app/layout.tsx`) owns `<html lang dir>`,
 * so this layer just provides next-intl context and mounts NavBar + Footer.
 */
export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;
  if (!SUPPORTED.includes(locale as Locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div className={styles.shell}>
        <NavBar />
        <main className={`${styles.main} container`}>{children}</main>
        <Footer />
        <AstroChat />
        <CompareBar />
      </div>
    </NextIntlClientProvider>
  );
}
