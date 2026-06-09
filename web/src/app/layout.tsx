import type { Metadata } from 'next';
import { Inter, Cairo, Space_Grotesk, Orbitron, Changa } from 'next/font/google';
import { getLocale, getTranslations } from 'next-intl/server';
import { ReactQueryProvider } from '@/components/ReactQueryProvider';
import { ToastProvider } from '@/components/Toast';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const cairo = Cairo({
  subsets: ['arabic'],
  variable: '--font-cairo',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-orbitron',
  display: 'swap',
});

const changa = Changa({
  subsets: ['arabic'],
  variable: '--font-changa',
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata');
  return {
    title: t('title'),
    description: t('description'),
  };
}

/**
 * Root layout — server-renders `<html lang dir data-theme>` correctly for the
 * resolved locale. This fixes WCAG 3.1.1 (Language of Page) and removes the
 * theme FOUC by setting `data-theme="light"` before hydration.
 *
 * Dark theme is intentionally disabled for v1; the [data-theme="dark"] block
 * in tokens.css stays dormant until we re-enable the toggle in Phase E.
 */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const isRtl = locale === 'ar';

  return (
    <html
      lang={locale}
      dir={isRtl ? 'rtl' : 'ltr'}
      data-theme="light"
      className={`${inter.variable} ${cairo.variable} ${spaceGrotesk.variable} ${orbitron.variable} ${changa.variable}`}
    >
      <body>
        <ReactQueryProvider>
          <ToastProvider>
            <div className="site-bg" aria-hidden="true" />
            {children}
          </ToastProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
