'use client';

import { useState, useCallback, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck, Upload, Camera, ArrowLeft, AlertCircle, Check,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth/store';
import styles from './verify.module.css';

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data:image/... prefix, keep only base64
      const base64 = result.split(',')[1] ?? '';
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function KycVerifyPage() {
  const t = useTranslations('my.verify');
  const locale = useLocale();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [fullName, setFullName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith('image/')) {
      setErrors((p) => ({ ...p, document: t('errorImageOnly') }));
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setErrors((p) => ({ ...p, document: t('errorTooLarge') }));
      return;
    }
    setFile(f);
    setErrors((p) => { const n = { ...p }; delete n.document; return n; });
    const url = URL.createObjectURL(f);
    setPreview(url);
  }, [t]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    const nameTrim = fullName.trim();
    if (!nameTrim || nameTrim.length < 2) next.fullName = t('errorName');
    const idTrim = idNumber.trim();
    if (!idTrim || idTrim.length < 4) next.idNumber = t('errorId');
    if (!file) next.document = t('errorDocument');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !file || !user) return;
    setSubmitting(true);
    try {
      const base64 = await fileToBase64(file);
      await api.users.submitKyc({
        fullName: fullName.trim(),
        idNumber: idNumber.trim(),
        documentBase64: base64,
      });
      setSubmitted(true);
    } catch (e) {
      const msg = (e as Error)?.message ?? String(e);
      setErrors({ submit: msg });
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className={styles.wrap}>
        <p className={styles.hint}>{t('loginRequired')}</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className={styles.wrap}>
        <div className={styles.successCard}>
          <div className={styles.successIcon}>
            <Check size={32} />
          </div>
          <h2 className={styles.successTitle}>{t('successTitle')}</h2>
          <p className={styles.successBody}>{t('successBody')}</p>
          <Link href={`/${locale}/my/profile`} className={styles.backLink}>
            <ArrowLeft size={14} />
            {t('backToProfile')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <Link href={`/${locale}/my/profile`} className={styles.back}>
          <ArrowLeft size={16} />
          {t('back')}
        </Link>
        <h1 className={styles.title}>
          <ShieldCheck size={20} />
          {t('title')}
        </h1>
        <p className={styles.subtitle}>{t('subtitle')}</p>
      </header>

      <section className={styles.form}>
        <label className={styles.field}>
          <span className={styles.label}>{t('fullName')}</span>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder={t('fullNamePlaceholder')}
            className={styles.input}
          />
          {errors.fullName && <span className={styles.error}>{errors.fullName}</span>}
        </label>

        <label className={styles.field}>
          <span className={styles.label}>{t('idNumber')}</span>
          <input
            type="text"
            value={idNumber}
            onChange={(e) => setIdNumber(e.target.value)}
            placeholder={t('idNumberPlaceholder')}
            className={styles.input}
            dir="ltr"
          />
          {errors.idNumber && <span className={styles.error}>{errors.idNumber}</span>}
        </label>

        <div className={styles.field}>
          <span className={styles.label}>{t('document')}</span>
          <div
            className={`${styles.dropzone} ${preview ? styles.dropzoneHasImage : ''}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            role="button"
            tabIndex={0}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className={styles.fileInput}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
            {preview ? (
              <img src={preview} alt={t('documentPreview')} className={styles.preview} />
            ) : (
              <div className={styles.dropzoneHint}>
                <Camera size={28} />
                <p>{t('dropHint')}</p>
                <span>{t('orClick')}</span>
              </div>
            )}
          </div>
          {errors.document && <span className={styles.error}>{errors.document}</span>}
        </div>

        {errors.submit && (
          <div className={styles.submitError}>
            <AlertCircle size={14} />
            {errors.submit}
          </div>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className={styles.submitBtn}
        >
          {submitting ? (
            <span className={styles.spinner} />
          ) : (
            <>
              <Upload size={14} />
              {t('submit')}
            </>
          )}
        </button>
      </section>
    </div>
  );
}
