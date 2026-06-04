import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = (await requestLocale) ?? 'ar';

  const messages = (await import(`../messages/${locale}.json`)).default;

  return {
    locale,
    messages,
    timeZone: 'Africa/Cairo',
  };
});
