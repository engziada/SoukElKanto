import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { NavBar } from '@/components/NavBar';
import { Footer } from '@/components/Footer';
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
 * Per-locale layout — owns `dir`/`lang` adjustments via a wrapping <div>,
 * provides next-intl context, and mounts NavBar + Footer chrome.
 */
export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;
  if (!SUPPORTED.includes(locale as Locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();
  const isRtl = locale === 'ar';

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div dir={isRtl ? 'rtl' : 'ltr'} lang={locale} className={styles.shell}>
        <NavBar />
        <main className={`${styles.main} container`}>{children}</main>
        <Footer />
      </div>
    </NextIntlClientProvider>
  );
}
