import type { Metadata } from 'next';
import { Inter, Cairo, Space_Grotesk, Orbitron, Changa } from 'next/font/google';
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

export const metadata: Metadata = {
  title: 'كانتو — سوق جيران مدينتي',
  description: 'اشتري واتعرف على جيرانك. سوق جار-للجار لسكان مدينتي.',
};

/**
 * Root layout — locale-agnostic. The `[locale]/layout.tsx` owns the
 * `<div dir lang>` wrapper + next-intl provider per-request.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      className={`${inter.variable} ${cairo.variable} ${spaceGrotesk.variable} ${orbitron.variable} ${changa.variable}`}
      suppressHydrationWarning
    >
      <body>
        <div className="site-bg" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
