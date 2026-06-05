'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, ShieldCheck, ChevronRight } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useAuthStore } from '@/lib/auth/store';
import styles from '../auth.module.css';

const schema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'errorInvalidCode'),
});

type FormValues = z.infer<typeof schema>;

export default function VerifyPage() {
  const t = useTranslations('auth');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useAuthStore((s) => s.login);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const phone = searchParams.get('phone') ?? '';
  const next = searchParams.get('next') ?? `/${locale}`;
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [resentFlash, setResentFlash] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { code: '' },
  });

  const { ref: rhfRef, ...rhfRest } = register('code');

  // Redirect back to /auth/login if phone is missing in query string.
  useEffect(() => {
    if (!phone) {
      router.replace(`/${locale}/auth/login`);
    } else {
      inputRef.current?.focus();
    }
  }, [phone, locale, router]);

  const onSubmit = async ({ code }: FormValues) => {
    setSubmitError(null);
    try {
      const res = await api.auth.verifyOtp(phone, code);
      login(res.token, res.user);
      router.replace(next.startsWith('/') ? next : `/${locale}`);
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.status === 0) {
          setSubmitError(t('errorWrongCode'));
        } else if (e.status === 429) {
          setSubmitError(t('errorTooManyAttempts'));
        } else {
          setSubmitError(t('errorWrongCode'));
        }
      } else {
        setSubmitError(t('errorWrongCode'));
      }
    }
  };

  const handleResend = async () => {
    setSubmitError(null);
    try {
      await api.auth.resend(phone);
      setResentFlash(true);
      setTimeout(() => setResentFlash(false), 2200);
    } catch {
      // swallow — UI just won't flash success
    }
  };

  if (!phone) return null;

  const showDevHint = process.env.NEXT_PUBLIC_AUTH_DEV_HINT === '1';

  return (
    <div className={styles.panel}>
      <header className={styles.header}>
        <div className={styles.iconBadge} aria-hidden="true">
          <ShieldCheck size={22} strokeWidth={1.8} />
        </div>
        <h1 className={styles.title}>{t('verifyTitle')}</h1>
        <p className={styles.subtitle}>{t('verifySubtitle', { phone })}</p>
      </header>

      <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        <label htmlFor="code" className={styles.label}>
          {t('otpLabel')}
        </label>
        <input
          id="code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="000000"
          className={styles.otpInput}
          aria-invalid={Boolean(errors.code)}
          {...rhfRest}
          ref={(el) => {
            rhfRef(el);
            inputRef.current = el;
          }}
        />
        {errors.code && (
          <span className={styles.fieldError} role="alert">
            <AlertCircle size={12} aria-hidden="true" />
            {t(errors.code.message as 'errorInvalidCode')}
          </span>
        )}
        {submitError && (
          <span className={styles.fieldError} role="alert">
            <AlertCircle size={12} aria-hidden="true" />
            {submitError}
          </span>
        )}

        <button type="submit" className={styles.cta} disabled={isSubmitting}>
          {isSubmitting ? t('verifying') : t('verify')}
          <ChevronRight size={16} aria-hidden="true" className={styles.ctaArrow} />
        </button>

        {showDevHint && (
          <p className={styles.devHint} role="note">{t('devHint')}</p>
        )}

        <div className={styles.resendRow}>
          <button
            type="button"
            onClick={handleResend}
            className={styles.resendBtn}
            disabled={isSubmitting}
          >
            {resentFlash ? t('resentSuccess') : t('resend')}
          </button>
          <button
            type="button"
            onClick={() => router.push(`/${locale}/auth/login`)}
            className={styles.changePhoneBtn}
          >
            {t('changePhone')}
          </button>
        </div>
      </form>
    </div>
  );
}
