'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, CheckCircle2, MessageCircle, Send } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { api, ApiError } from '@/lib/api';
import styles from './contact-us.module.css';

const schema = z.object({
  name: z.string().trim().min(1, 'errorName').max(100, 'errorName'),
  phone: z
    .string()
    .trim()
    .min(7, 'errorPhone')
    .max(15, 'errorPhone')
    .regex(/^[0-9+]+$/, 'errorPhone'),
  email: z
    .string()
    .trim()
    .email('errorEmail')
    .optional()
    .or(z.literal('')),
  message: z.string().trim().min(5, 'errorMessage').max(2000, 'errorMessage'),
});

type FormValues = z.infer<typeof schema>;

type Status = 'idle' | 'success' | 'error';

export default function ContactUsPage() {
  const t = useTranslations('contactUs');
  const [status, setStatus] = useState<Status>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', phone: '', email: '', message: '' },
  });

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null);
    setStatus('idle');
    try {
      const res = await api.contactUs.send({
        name: values.name,
        phone: values.phone,
        email: values.email || undefined,
        message: values.message,
      });
      if (res.ok) {
        setStatus('success');
        reset();
      } else {
        setStatus('error');
        setSubmitError(t('error'));
      }
    } catch (e) {
      setStatus('error');
      setSubmitError(
        e instanceof ApiError ? e.message : t('error'),
      );
    }
  };

  return (
    <div className={styles.shell}>
      <div className={styles.panel}>
        <header className={styles.header}>
          <div className={styles.iconBadge} aria-hidden="true">
            <MessageCircle size={22} strokeWidth={1.8} />
          </div>
          <h1 className={styles.title}>{t('title')}</h1>
          <p className={styles.subtitle}>{t('subtitle')}</p>
        </header>

        {status === 'success' && (
          <div className={`${styles.alert} ${styles.alertSuccess}`} role="status">
            <CheckCircle2 size={18} aria-hidden="true" />
            {t('success')}
          </div>
        )}

        {status === 'error' && submitError && (
          <div className={`${styles.alert} ${styles.alertError}`} role="alert">
            <AlertCircle size={18} aria-hidden="true" />
            {submitError}
          </div>
        )}

        <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Name */}
          <div className={styles.field}>
            <label htmlFor="name" className={styles.label}>
              {t('nameLabel')}
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              placeholder={t('namePlaceholder')}
              className={styles.input}
              aria-invalid={Boolean(errors.name)}
              {...register('name')}
            />
            {errors.name && (
              <span className={styles.fieldError} role="alert">
                <AlertCircle size={12} aria-hidden="true" />
                {t(errors.name.message as 'errorName')}
              </span>
            )}
          </div>

          {/* Phone */}
          <div className={styles.field}>
            <label htmlFor="phone" className={styles.label}>
              {t('phoneLabel')}
            </label>
            <input
              id="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder={t('phonePlaceholder')}
              className={styles.input}
              dir="ltr"
              aria-invalid={Boolean(errors.phone)}
              {...register('phone')}
            />
            {errors.phone && (
              <span className={styles.fieldError} role="alert">
                <AlertCircle size={12} aria-hidden="true" />
                {t(errors.phone.message as 'errorPhone')}
              </span>
            )}
          </div>

          {/* Email (optional) */}
          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>
              {t('emailLabel')}
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder={t('emailPlaceholder')}
              className={styles.input}
              dir="ltr"
              aria-invalid={Boolean(errors.email)}
              {...register('email')}
            />
            {errors.email && (
              <span className={styles.fieldError} role="alert">
                <AlertCircle size={12} aria-hidden="true" />
                {t(errors.email.message as 'errorEmail')}
              </span>
            )}
          </div>

          {/* Message */}
          <div className={styles.field}>
            <label htmlFor="message" className={styles.label}>
              {t('messageLabel')}
            </label>
            <textarea
              id="message"
              rows={5}
              placeholder={t('messagePlaceholder')}
              className={styles.textarea}
              aria-invalid={Boolean(errors.message)}
              {...register('message')}
            />
            {errors.message && (
              <span className={styles.fieldError} role="alert">
                <AlertCircle size={12} aria-hidden="true" />
                {t(errors.message.message as 'errorMessage')}
              </span>
            )}
          </div>

          <button type="submit" className={styles.cta} disabled={isSubmitting}>
            {isSubmitting ? t('sending') : t('submit')}
            <Send size={16} aria-hidden="true" className={styles.ctaArrow} />
          </button>
        </form>
      </div>
    </div>
  );
}
