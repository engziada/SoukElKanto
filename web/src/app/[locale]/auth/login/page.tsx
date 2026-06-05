'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, MessageCircle, ChevronRight } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import styles from '../auth.module.css';

const schema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^\d{10}$/, 'errorInvalidPhone'),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const t = useTranslations('auth');
  const locale = useLocale();
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { phone: '' },
  });

  const onSubmit = async ({ phone }: FormValues) => {
    setSubmitError(null);
    const fullPhone = `+20${phone}`;
    try {
      await api.auth.register(fullPhone);
    } catch (e) {
      // BE is idempotent on register; treat 409 / "already exists" as success
      const isConflict = e instanceof ApiError && (e.status === 409 || /exists|conflict/i.test(e.message));
      if (!isConflict) {
        try {
          await api.auth.resend(fullPhone);
        } catch (e2) {
          if (e2 instanceof ApiError && e2.status === 0) {
            setSubmitError(t('errorWrongCode'));
            return;
          }
          // fall through to verify page anyway; user may have valid OTP
        }
      }
    }
    router.push(`/${locale}/auth/verify?phone=${encodeURIComponent(fullPhone)}`);
  };

  const showDevHint = process.env.NEXT_PUBLIC_AUTH_DEV_HINT === '1';

  return (
    <div className={styles.panel}>
      <header className={styles.header}>
        <div className={styles.iconBadge} aria-hidden="true">
          <MessageCircle size={22} strokeWidth={1.8} />
        </div>
        <h1 className={styles.title}>{t('loginTitle')}</h1>
        <p className={styles.subtitle}>{t('loginSubtitle')}</p>
      </header>

      <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        <label htmlFor="phone" className={styles.label}>
          {t('phoneLabel')}
        </label>
        <div className={styles.phoneRow} dir="ltr">
          <span className={styles.cc}>{t('countryCode')}</span>
          <input
            id="phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder={t('phonePlaceholder')}
            maxLength={10}
            className={styles.phoneInput}
            aria-invalid={Boolean(errors.phone)}
            {...register('phone')}
          />
        </div>
        {errors.phone && (
          <span className={styles.fieldError} role="alert">
            <AlertCircle size={12} aria-hidden="true" />
            {t(errors.phone.message as 'errorInvalidPhone')}
          </span>
        )}
        {submitError && (
          <span className={styles.fieldError} role="alert">
            <AlertCircle size={12} aria-hidden="true" />
            {submitError}
          </span>
        )}

        <button type="submit" className={styles.cta} disabled={isSubmitting}>
          {isSubmitting ? t('sending') : t('sendOtp')}
          <ChevronRight size={16} aria-hidden="true" className={styles.ctaArrow} />
        </button>

        {showDevHint && (
          <p className={styles.devHint} role="note">{t('devHint')}</p>
        )}

        <p className={styles.footnote}>
          <Link href={`/${locale}`} className={styles.footnoteLink}>
            ← {t('changePhone')}
          </Link>
        </p>
      </form>
    </div>
  );
}
