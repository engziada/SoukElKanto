import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getLocale } from 'next-intl/server';
import { Inter, Cairo } from 'next/font/google';
import './globals.css';
import { NavBar } from '@/components/NavBar';

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

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'كانتو — سوق جيران مدينتي',
    description: 'اشتري واتعرف على جيرانك. سوق جار-للجار لسكان مدينتي.',
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const isRtl = locale === 'ar';

  return (
    <html
      lang={locale}
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`${inter.variable} ${cairo.variable}`}
    >
      <body className="min-h-screen antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <NavBar />
          <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </main>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
