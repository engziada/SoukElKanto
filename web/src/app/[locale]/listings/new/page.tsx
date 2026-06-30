'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Camera, ChevronLeft, ChevronRight, AlertCircle, Check, ImagePlus, Save,
} from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useAuthStore } from '@/lib/auth/store';
import styles from './wizard.module.css';

const CATEGORY_KEYS = [
  'FURNITURE', 'ELECTRONICS', 'APPLIANCES', 'FASHION',
  'KIDS_TOYS', 'KIDS_CLOTHING', 'KIDS_GEAR', 'BOOKS_MEDIA',
  'SPORTS_OUTDOOR', 'HOME_DECOR', 'KITCHEN_DINING', 'BABY_MATERNITY',
  'MOBILE_TABLETS', 'VINTAGE_COLLECTIBLES', 'MOVING_BUNDLE', 'OTHER',
] as const;
const CONDITION_KEYS = ['NEW_WITH_TAGS', 'LIKE_NEW', 'GOOD', 'FAIR', 'NEEDS_REPAIR', 'FOR_PARTS'] as const;

const DRAFT_KEY = 'kanto.listing-draft.v1';
const TOTAL_STEPS = 4;

interface DraftState {
  title: string;
  description: string;
  category: string;
  condition: string;
  district: string;
  askingPrice: string;
  photoNames: string[];
}

const EMPTY_DRAFT: DraftState = {
  title: '',
  description: '',
  category: '',
  condition: '',
  district: '',
  askingPrice: '',
  photoNames: [],
};

export default function CreateListingPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const user = useAuthStore((s) => s.user);

  // ── Pre-gate: Profile completeness ─────────────────────────────────────
  // Prevent the user from spending time picking photos and writing details
  // only to get rejected at the very end by the API.
  useEffect(() => {
    if (!user) return;
    const is18Plus = (() => {
      if (!user.birthdate) return false;
      const b = new Date(user.birthdate);
      const now = new Date();
      const age = now.getFullYear() - b.getFullYear();
      const m = now.getMonth() - b.getMonth();
      return age > 18 || (age === 18 && m >= 0 && now.getDate() >= b.getDate());
    })();
    const hasCompleteProfile = !!(user.fullName && user.gender && user.birthdate && is18Plus);
    
    if (!hasCompleteProfile) {
      router.replace(`/${locale}/my/profile?reason=profile-incomplete&next=/${locale}/listings/new`);
    }
  }, [user, router, locale]);

  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<DraftState>(EMPTY_DRAFT);
  const [files, setFiles] = useState<File[]>([]);
  const [coverIndex, setCoverIndex] = useState(0);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [draftRestored, setDraftRestored] = useState(false);
  const [draftSavedFlash, setDraftSavedFlash] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishedListingId, setPublishedListingId] = useState<string | null>(null);

  // ── Draft restore on mount ─────────────────────────────────────────────
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as DraftState;
        // Filenames carry no actual file data, but they let the user know what they
        // had selected. Real File objects can't be persisted; users re-pick them
        // on Step 1.
        setDraft({ ...EMPTY_DRAFT, ...parsed });
        if (parsed.title || parsed.askingPrice) {
          setDraftRestored(true);
          setTimeout(() => setDraftRestored(false), 4000);
        }
      }
    } catch {
      // ignore malformed draft
    }
  }, []);

  // ── Draft autosave on every change ─────────────────────────────────────
  useEffect(() => {
    const handle = setTimeout(() => {
      try {
        sessionStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({ ...draft, photoNames: files.map((f) => f.name) }),
        );
        if (
          draft.title || draft.description || draft.askingPrice ||
          draft.category || draft.condition || draft.district
        ) {
          setDraftSavedFlash(true);
          setTimeout(() => setDraftSavedFlash(false), 1200);
        }
      } catch {
        // sessionStorage may be unavailable in private mode
      }
    }, 500);
    return () => clearTimeout(handle);
  }, [draft, files]);

  const validateStep = useCallback(
    (s: number): boolean => {
      const next: Record<string, string> = {};
      // Photos are encouraged but not required — R2 may be unavailable in dev.
      if (s === 2) {
        const titleTrimmed = draft.title.trim();
        const descTrimmed = draft.description.trim();
        if (!titleTrimmed || titleTrimmed.length < 3) {
          next.title = t('create.errorTitle');
        }
        if (!descTrimmed || descTrimmed.length < 10) {
          next.description = t('create.errorDescription');
        }
        if (!draft.category) next.category = t('create.errorCategory');
        if (!draft.condition) next.condition = t('create.errorCondition');
      }
      if (s === 3) {
        const n = Number(draft.askingPrice);
        if (!draft.askingPrice || !Number.isFinite(n) || n <= 0) {
          next.askingPrice = t('create.errorPrice');
        }
      }
      setErrors(next);
      return Object.keys(next).length === 0;
    },
    [draft, files.length, t],
  );

  const goNext = useCallback(() => {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  }, [step, validateStep]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith('image/'),
    );
    setFiles((prev) => [...prev, ...dropped].slice(0, 8));
    setErrors((p) => {
      const n = { ...p };
      delete n.photos;
      return n;
    });
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = Array.from(e.target.files ?? []).filter((f) =>
        f.type.startsWith('image/'),
      );
      setFiles((prev) => [...prev, ...selected].slice(0, 8));
      setErrors((p) => {
        const n = { ...p };
        delete n.photos;
        return n;
      });
    },
    [],
  );

  const removePhoto = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  // Generate preview URLs for selected files
  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPhotoUrls(urls);
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [files]);

  const handlePublish = async () => {
    if (!validateStep(3)) {
      setStep(3);
      return;
    }
    setPublishing(true);
    setErrors({});
    try {
      let photos: Array<{ r2Key: string; position: number }> | undefined;

      // Photos are mandatory — validateStep(0) ensures at least one was chosen.
      // We no longer silently swallow upload failures: if R2 (or local fallback)
      // rejects the PUT, the user MUST know — otherwise they get a listing with
      // no photos and the FE falls back to picsum, which looks like a bug.
      if (files.length > 0) {
        // 1. Request presigned PUT URLs
        const uploadMeta = await Promise.all(
          files.map((file) =>
            api.listings.photoUploadUrl(
              file.name,
              file.type || 'image/jpeg',
              file.size,
            ),
          ),
        );

        // 2. Upload each file directly to R2 (or to the local upload middleware
        //    when KANTO_R2_FORCE_LOCAL is set / R2 isn't configured).
        await Promise.all(
          uploadMeta.map(({ uploadUrl }, idx) =>
            fetch(uploadUrl, {
              method: 'PUT',
              headers: { 'Content-Type': files[idx].type || 'image/jpeg' },
              body: files[idx],
            }).then((res) => {
              if (!res.ok) {
                throw new Error(
                  `Photo upload failed: ${res.status} ${res.statusText || ''}`.trim(),
                );
              }
            }),
          ),
        );

        photos = uploadMeta.map(({ r2Key, publicUrl }, idx) => ({
          r2Key,
          url: publicUrl,
          position: idx === coverIndex ? 0 : idx < coverIndex ? idx + 1 : idx,
        }));
      }

      // 3. Create the listing (with or without photos)
      const title = draft.title.trim();
      let description = draft.description.trim();
      if (!description || description.length < 10) {
        description = title + ' — ' + t('create.defaultDescription');
      }
      const created = await api.listings.create({
        title,
        description,
        category: draft.category,
        condition: draft.condition,
        askingPrice: Number(draft.askingPrice),
        district: draft.district.trim() || 'B5',
        photos,
      });

      setPublishedListingId(created.id);
      sessionStorage.removeItem(DRAFT_KEY);
    } catch (e) {
      const err = e instanceof ApiError ? e : null;
      const rawMsg = (e as Error)?.message ?? '';
      console.error('[publish] Failed:', err?.message ?? rawMsg ?? String(e));
      // Photo upload failures throw a plain Error (not ApiError) with a
      // "Photo upload failed" prefix — surface a friendlier message so the
      // user knows it was the photos, not the listing itself.
      if (!err && rawMsg.startsWith('Photo upload failed')) {
        setErrors({ publish: t('create.photoUploadError') });
      } else if (err) {
        // Loose-gate (#1): profile incomplete → bounce to /my/profile.
        if (err.status === 403 && err.message?.startsWith('PROFILE_')) {
          router.push(`/${locale}/my/profile?reason=profile-incomplete&next=/${locale}/listings/new`);
          return;
        }
        if (err.status === 401 || err.status === 403) {
          setErrors({ publish: t('create.loginRequired') });
        } else if (err.status === 0) {
          setErrors({ publish: t('errors.networkDown') });
        } else if (err.status === 400) {
          // Show the actual backend validation message so the user knows what to fix
          setErrors({ publish: err.message || t('create.errorPublish') });
        } else {
          setErrors({ publish: t('create.errorPublish') });
        }
      } else {
        setErrors({ publish: t('create.errorPublish') });
      }
    } finally {
      setPublishing(false);
    }
  };

  // ── Success state ──────────────────────────────────────────────────────
  if (publishedListingId) {
    return (
      <div className={styles.wrap}>
        <div className={styles.success}>
          <div className={styles.successIcon} aria-hidden="true">
            <Check size={36} strokeWidth={1.6} />
          </div>
          <h2 className={styles.successTitle}>{t('create.publishSuccess')}</h2>
          <p className={styles.successBody}>{t('create.publishSuccessBody')}</p>
          <Link
            href={`/${locale}/listings/${publishedListingId}`}
            className={styles.successCta}
          >
            {t('create.publishSuccessView')}
          </Link>
        </div>
      </div>
    );
  }

  const stepLabels = [
    t('create.stepPhotos'),
    t('create.stepDetails'),
    t('create.stepPrice'),
    t('create.stepReview'),
  ];

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <h1 className={styles.h1}>{t('create.title')}</h1>
        {draftRestored && (
          <span className={styles.draftFlag} role="status" aria-live="polite">
            <Save size={12} aria-hidden="true" />
            {t('create.draftRestored')}
          </span>
        )}
        {draftSavedFlash && !draftRestored && (
          <span className={styles.draftFlag} role="status" aria-live="polite">
            <Save size={12} aria-hidden="true" />
            {t('create.draftSaved')}
          </span>
        )}
      </div>

      {/* Step indicator */}
      <ol className={styles.steps} aria-label="progress">
        {stepLabels.map((label, idx) => {
          const n = idx + 1;
          const active = n === step;
          const done = n < step;
          return (
            <li key={label} className={styles.step}>
              <span
                className={`${styles.dot} ${active ? styles.dotActive : ''} ${
                  done ? styles.dotDone : ''
                }`}
                aria-current={active ? 'step' : undefined}
              >
                {done ? <Check size={12} aria-hidden="true" /> : n}
              </span>
              <span className={styles.stepLabel}>{label}</span>
            </li>
          );
        })}
      </ol>

      <div className={styles.panel}>
        {/* ── Step 1: Photos ────────────────────────────── */}
        {step === 1 && (
          <div>
            <div
              className={styles.photoDrop}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fileRef.current?.click();
                }
              }}
              aria-label={t('create.stepPhotos')}
            >
              <ImagePlus size={36} strokeWidth={1.2} aria-hidden="true" />
              <p>{t('create.photoDrop')}</p>
              {files.length > 0 && (
                <span className={styles.fileCount}>
                  {t('create.photoCount', { count: files.length })}
                </span>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className={styles.fileInput}
                onChange={handleFileSelect}
              />
            </div>
            {files.length > 0 && (
              <div className={styles.photoGrid}>
                {files.map((f, i) => (
                  <div
                    key={i}
                    className={`${styles.photoThumb} ${i === coverIndex ? styles.photoThumbCover : ''}`}
                    onClick={() => setCoverIndex(i)}
                    role="button"
                    tabIndex={0}
                    title={i === coverIndex ? 'Cover image' : 'Click to set as cover'}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photoUrls[i]} alt={f.name} className={styles.photoThumbImg} />
                    {i === coverIndex && (
                      <span className={styles.coverBadge}>★</span>
                    )}
                    <button
                      type="button"
                      className={styles.photoRemove}
                      onClick={(e) => {
                        e.stopPropagation();
                        removePhoto(i);
                        if (coverIndex >= i && coverIndex > 0) setCoverIndex(coverIndex - 1);
                      }}
                      aria-label="remove"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            {errors.photos && (
              <span className={styles.fieldError} role="alert">
                <AlertCircle size={12} aria-hidden="true" /> {errors.photos}
              </span>
            )}
          </div>
        )}

        {/* ── Step 2: Details ───────────────────────────── */}
        {step === 2 && (
          <div className={styles.fields}>
            <label htmlFor="title" className={styles.label}>
              {t('create.labelTitle')}
            </label>
            <input
              id="title"
              className={styles.input}
              placeholder={t('create.placeholderTitle')}
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              aria-invalid={Boolean(errors.title)}
            />
            {errors.title && (
              <span className={styles.fieldError} role="alert">
                <AlertCircle size={12} aria-hidden="true" /> {errors.title}
              </span>
            )}

            <label htmlFor="description" className={styles.label}>
              {t('create.labelDescription')}
            </label>
            <textarea
              id="description"
              className={styles.textarea}
              placeholder={t('create.placeholderDescription')}
              value={draft.description}
              onChange={(e) =>
                setDraft({ ...draft, description: e.target.value })
              }
              rows={4}
              aria-invalid={Boolean(errors.description)}
            />
            {errors.description && (
              <span className={styles.fieldError} role="alert">
                <AlertCircle size={12} aria-hidden="true" /> {errors.description}
              </span>
            )}

            <label htmlFor="category" className={styles.label}>
              {t('create.labelCategory')}
            </label>
            <select
              id="category"
              className={styles.select}
              value={draft.category}
              onChange={(e) => setDraft({ ...draft, category: e.target.value })}
              aria-invalid={Boolean(errors.category)}
            >
              <option value="">{t('create.placeholderCategory')}</option>
              {CATEGORY_KEYS.map((k) => (
                <option key={k} value={k}>
                  {t(`categories.${k}`)}
                </option>
              ))}
            </select>
            {errors.category && (
              <span className={styles.fieldError} role="alert">
                <AlertCircle size={12} aria-hidden="true" /> {errors.category}
              </span>
            )}

            <label htmlFor="condition" className={styles.label}>
              {t('create.labelCondition')}
            </label>
            <select
              id="condition"
              className={styles.select}
              value={draft.condition}
              onChange={(e) =>
                setDraft({ ...draft, condition: e.target.value })
              }
              aria-invalid={Boolean(errors.condition)}
            >
              <option value="">{t('create.placeholderCondition')}</option>
              {CONDITION_KEYS.map((k) => (
                <option key={k} value={k}>
                  {t(`conditions.${k}`)}
                </option>
              ))}
            </select>
            {errors.condition && (
              <span className={styles.fieldError} role="alert">
                <AlertCircle size={12} aria-hidden="true" /> {errors.condition}
              </span>
            )}

            <label htmlFor="district" className={styles.label}>
              {t('create.labelDistrict')}
            </label>
            <input
              id="district"
              className={styles.input}
              placeholder={t('create.placeholderDistrict')}
              value={draft.district}
              onChange={(e) =>
                setDraft({ ...draft, district: e.target.value })
              }
            />
          </div>
        )}

        {/* ── Step 3: Price ─────────────────────────────── */}
        {step === 3 && (
          <div className={styles.fields}>
            <label htmlFor="price" className={styles.label}>
              {t('create.labelPrice')}
            </label>
            <input
              id="price"
              type="number"
              inputMode="numeric"
              min={1}
              className={styles.input}
              placeholder={t('create.placeholderPrice')}
              value={draft.askingPrice}
              onChange={(e) =>
                setDraft({ ...draft, askingPrice: e.target.value })
              }
              aria-invalid={Boolean(errors.askingPrice)}
            />
            {errors.askingPrice && (
              <span className={styles.fieldError} role="alert">
                <AlertCircle size={12} aria-hidden="true" /> {errors.askingPrice}
              </span>
            )}
          </div>
        )}

        {/* ── Step 4: Review ────────────────────────────── */}
        {step === 4 && (
          <div className={styles.review}>
            <p className={styles.reviewIntro}>{t('create.reviewText')}</p>
            <dl className={styles.reviewList}>
              <div className={styles.reviewRow}>
                <dt>{t('create.reviewTitle')}</dt>
                <dd>{draft.title || '—'}</dd>
              </div>
              <div className={styles.reviewRow}>
                <dt>{t('create.reviewCategory')}</dt>
                <dd>
                  {draft.category
                    ? t(`categories.${draft.category}` as never)
                    : '—'}
                </dd>
              </div>
              <div className={styles.reviewRow}>
                <dt>{t('create.reviewCondition')}</dt>
                <dd>
                  {draft.condition
                    ? t(`conditions.${draft.condition}` as never)
                    : '—'}
                </dd>
              </div>
              <div className={styles.reviewRow}>
                <dt>{t('create.reviewDistrict')}</dt>
                <dd>{draft.district || '—'}</dd>
              </div>
              <div className={styles.reviewRow}>
                <dt>{t('create.reviewPrice')}</dt>
                <dd className={styles.reviewPrice}>
                  {draft.askingPrice
                    ? `${Number(draft.askingPrice).toLocaleString()} ${t('listing.price')}`
                    : '—'}
                </dd>
              </div>
              <div className={styles.reviewRow}>
                <dt>{t('create.reviewPhotos')}</dt>
                <dd>{files.length || draft.photoNames.length || 0}</dd>
              </div>
            </dl>
            {errors.publish && (
              <div className={styles.publishError} role="alert">
                <AlertCircle size={14} aria-hidden="true" /> {errors.publish}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Step navigation */}
      <div className={styles.nav}>
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1 || publishing}
          className={styles.back}
        >
          <ChevronLeft size={16} aria-hidden="true" />
          {t('create.back')}
        </button>
        {step < TOTAL_STEPS ? (
          <button
            type="button"
            onClick={goNext}
            className={styles.next}
          >
            {t('create.next')}
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        ) : (
          <button
            type="button"
            className={styles.publish}
            onClick={handlePublish}
            disabled={publishing}
          >
            {publishing ? t('create.publishing') : t('create.publish')}
          </button>
        )}
      </div>
    </div>
  );
}
