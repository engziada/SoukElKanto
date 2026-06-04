import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

const SUPPORTED = ['ar', 'en'] as const;
type Locale = (typeof SUPPORTED)[number];

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = (SUPPORTED as readonly string[]).includes(requested ?? '')
    ? (requested as Locale)
    : null;
  if (!locale) notFound();

  const messages = (await import(`../messages/${locale}.json`)).default;

  return {
    locale,
    messages,
    timeZone: 'Africa/Cairo',
  };
});
