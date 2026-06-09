'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Camera, ChevronLeft, AlertCircle, Check, ImagePlus, X, ArrowLeft,
} from 'lucide-react';
import { api, type Listing, ApiError } from '@/lib/api';
import styles from '../../new/wizard.module.css';

const CATEGORY_KEYS = [
  'FURNITURE', 'ELECTRONICS', 'APPLIANCES', 'FASHION',
  'KIDS_TOYS', 'KIDS_CLOTHING', 'KIDS_GEAR', 'BOOKS_MEDIA',
  'SPORTS_OUTDOOR', 'HOME_DECOR', 'KITCHEN_DINING', 'BABY_MATERNITY',
  'MOBILE_TABLETS', 'VINTAGE_COLLECTIBLES', 'MOVING_BUNDLE', 'OTHER',
] as const;
const CONDITION_KEYS = ['NEW_WITH_TAGS', 'LIKE_NEW', 'GOOD', 'FAIR', 'NEEDS_REPAIR', 'FOR_PARTS'] as const;

export default function EditListingPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const fileRef = useRef<HTMLInputElement>(null);

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('');
  const [askingPrice, setAskingPrice] = useState('');
  const [district, setDistrict] = useState('');

  // Photos
  const [existingPhotos, setExistingPhotos] = useState<Array<{ id: string; url: string; position: number }>>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPhotoUrls, setNewPhotoUrls] = useState<string[]>([]);
  const [coverIndex, setCoverIndex] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load listing
  useEffect(() => {
    if (!id) return;
    api.listings.get(id).then((data: Listing) => {
      setListing(data);
      setTitle(data.title);
      setDescription(data.description);
      setCategory(data.category);
      setCondition(data.condition);
      setAskingPrice(String(data.askingPrice));
      setDistrict(data.district);
      const photos = data.photos?.sort((a: { position: number }, b: { position: number }) => a.position - b.position) || [];
      setExistingPhotos(photos.map((p: { id: string; url: string; position: number }) => ({ id: p.id, url: p.url, position: p.position })));
      setCoverIndex(0);
    }).catch(() => {
      setErrors({ load: t('create.loadError') });
    }).finally(() => setLoading(false));
  }, [id, t]);

  // Preview URLs for new files
  useEffect(() => {
    const urls = newFiles.map((f) => URL.createObjectURL(f));
    setNewPhotoUrls(urls);
    return () => { urls.forEach((u) => URL.revokeObjectURL(u)); };
  }, [newFiles]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
    setNewFiles((prev) => [...prev, ...dropped].slice(0, 8 - existingPhotos.length));
  }, [existingPhotos.length]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []).filter((f) => f.type.startsWith('image/'));
    setNewFiles((prev) => [...prev, ...selected].slice(0, 8 - existingPhotos.length));
  }, [existingPhotos.length]);

  const removeExistingPhoto = (idx: number) => {
    setExistingPhotos((prev) => prev.filter((_, i) => i !== idx));
    if (coverIndex >= idx && coverIndex > 0) setCoverIndex(coverIndex - 1);
  };

  const removeNewFile = (idx: number) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== idx));
    if (coverIndex >= existingPhotos.length + idx && coverIndex > 0) setCoverIndex(coverIndex - 1);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!title.trim() || title.trim().length < 3) e.title = t('create.errorTitle');
    if (!description.trim() || description.trim().length < 10) e.description = t('create.errorDescription');
    if (!category) e.category = t('create.errorCategory');
    if (!condition) e.condition = t('create.errorCondition');
    if (!askingPrice || Number(askingPrice) <= 0) e.askingPrice = t('create.errorPrice');
    if (!district.trim()) e.district = t('create.errorDistrict');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      let allPhotos: Array<{ r2Key: string; position: number; url?: string }> = [];

      // Reorder existing photos by new positions
      const reorderedExisting = existingPhotos.map((p, i) => ({
        r2Key: `existing-${p.id}`,
        url: p.url,
        position: i,
      }));

      // Upload new files
      if (newFiles.length > 0) {
        const uploadMeta = await Promise.all(
          newFiles.map((file) =>
            api.listings.photoUploadUrl(file.name, file.type || 'image/jpeg', file.size),
          ),
        );
        await Promise.all(
          uploadMeta.map(({ uploadUrl }, idx) =>
            fetch(uploadUrl, {
              method: 'PUT',
              headers: { 'Content-Type': newFiles[idx].type || 'image/jpeg' },
              body: newFiles[idx],
            }).then((res) => { if (!res.ok) throw new Error(`Upload failed ${res.status}`); }),
          ),
        );
        const newPhotos = uploadMeta.map(({ r2Key, publicUrl }, idx) => ({
          r2Key,
          url: publicUrl,
          position: existingPhotos.length + idx,
        }));
        allPhotos = [...reorderedExisting, ...newPhotos];
      } else {
        allPhotos = reorderedExisting;
      }

      // Re-assign cover (position 0)
      const withCover = allPhotos.map((p, i) => ({
        ...p,
        position: i === coverIndex ? 0 : i < coverIndex ? i + 1 : i,
      }));

      await api.listings.update(id, {
        title: title.trim(),
        description: description.trim(),
        category,
        condition,
        askingPrice: Number(askingPrice),
        district: district.trim() || 'B5',
        photos: withCover,
      });

      router.push(`/${locale}/listings/${id}`);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : (err as Error)?.message;
      setErrors({ save: msg || t('create.publishError') });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="container" style={{ padding: '2rem' }}>…</div>;
  if (!listing) return (
    <div className="container" style={{ padding: '2rem' }}>
      <p>{errors.load || t('create.loadError')}</p>
      <Link href={`/${locale}/listings`} className={styles.backLink}>
        <ArrowLeft size={16} /> {t('create.backToListings')}
      </Link>
    </div>
  );

  const totalPhotos = existingPhotos.length + newFiles.length;

  return (
    <div className="container" style={{ maxWidth: '42rem', marginInline: 'auto', paddingBlock: '2rem' }}>
      <div className={styles.head}>
        <Link href={`/${locale}/listings/${id}`} className={styles.backLink}>
          <ArrowLeft size={16} /> {t('create.back')}
        </Link>
        <h1 className={styles.h1}>{t('create.editTitle')}</h1>
      </div>

      {/* ── Photos ── */}
      <section className={styles.panel}>
        <h3 className={styles.stepTitle}><Camera size={16} /> {t('create.stepPhotos')}</h3>
        <div
          className={styles.photoDrop}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileRef.current?.click(); } }}
          aria-label={t('create.stepPhotos')}
        >
          <ImagePlus size={36} strokeWidth={1.2} aria-hidden="true" />
          <p>{t('create.photoDrop')}</p>
          {totalPhotos > 0 && (
            <span className={styles.fileCount}>{t('create.photoCount', { count: totalPhotos })}</span>
          )}
          <input ref={fileRef} type="file" accept="image/*" multiple className={styles.fileInput} onChange={handleFileSelect} />
        </div>

        {/* Existing photos */}
        {existingPhotos.length > 0 && (
          <div className={styles.photoGrid}>
            {existingPhotos.map((p, i) => (
              <div
                key={`existing-${p.id}`}
                className={`${styles.photoThumb} ${i === coverIndex ? styles.photoThumbCover : ''}`}
                onClick={() => setCoverIndex(i)}
                role="button"
                tabIndex={0}
                title={i === coverIndex ? 'Cover image' : 'Click to set as cover'}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt="" className={styles.photoThumbImg} />
                {i === coverIndex && <span className={styles.coverBadge}>★</span>}
                <button type="button" className={styles.photoRemove} onClick={(e) => { e.stopPropagation(); removeExistingPhoto(i); }} aria-label="remove">×</button>
              </div>
            ))}
          </div>
        )}

        {/* New file previews */}
        {newFiles.length > 0 && (
          <div className={styles.photoGrid}>
            {newFiles.map((f, i) => (
              <div
                key={`new-${i}`}
                className={`${styles.photoThumb} ${existingPhotos.length + i === coverIndex ? styles.photoThumbCover : ''}`}
                onClick={() => setCoverIndex(existingPhotos.length + i)}
                role="button"
                tabIndex={0}
                title={existingPhotos.length + i === coverIndex ? 'Cover image' : 'Click to set as cover'}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={newPhotoUrls[i]} alt={f.name} className={styles.photoThumbImg} />
                {existingPhotos.length + i === coverIndex && <span className={styles.coverBadge}>★</span>}
                <button type="button" className={styles.photoRemove} onClick={(e) => { e.stopPropagation(); removeNewFile(i); }} aria-label="remove">×</button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Details ── */}
      <section className={styles.panel}>
        <h3 className={styles.stepTitle}>{t('create.stepDetails')}</h3>
        <div className={styles.field}>
          <label className={styles.label}>{t('create.title')}</label>
          <input className={styles.input} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
          {errors.title && <span className={styles.fieldError}><AlertCircle size={12} /> {errors.title}</span>}
        </div>
        <div className={styles.field}>
          <label className={styles.label}>{t('create.description')}</label>
          <textarea className={styles.textarea} value={description} onChange={(e) => setDescription(e.target.value)} rows={4} maxLength={2000} />
          {errors.description && <span className={styles.fieldError}><AlertCircle size={12} /> {errors.description}</span>}
        </div>
        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <label className={styles.label}>{t('create.category')}</label>
            <select className={styles.select} value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">{t('create.selectCategory')}</option>
              {CATEGORY_KEYS.map((k) => <option key={k} value={k}>{t(`categories.${k}`)}</option>)}
            </select>
            {errors.category && <span className={styles.fieldError}><AlertCircle size={12} /> {errors.category}</span>}
          </div>
          <div className={styles.field}>
            <label className={styles.label}>{t('create.condition')}</label>
            <select className={styles.select} value={condition} onChange={(e) => setCondition(e.target.value)}>
              <option value="">{t('create.selectCondition')}</option>
              {CONDITION_KEYS.map((k) => <option key={k} value={k}>{t(`conditions.${k}`)}</option>)}
            </select>
            {errors.condition && <span className={styles.fieldError}><AlertCircle size={12} /> {errors.condition}</span>}
          </div>
        </div>
      </section>

      {/* ── Price & Location ── */}
      <section className={styles.panel}>
        <h3 className={styles.stepTitle}>{t('create.stepPrice')}</h3>
        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <label className={styles.label}>{t('create.askingPrice')}</label>
            <input type="number" min={0} className={styles.input} value={askingPrice} onChange={(e) => setAskingPrice(e.target.value)} />
            {errors.askingPrice && <span className={styles.fieldError}><AlertCircle size={12} /> {errors.askingPrice}</span>}
          </div>
          <div className={styles.field}>
            <label className={styles.label}>{t('create.district')}</label>
            <input className={styles.input} value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="B5" />
            {errors.district && <span className={styles.fieldError}><AlertCircle size={12} /> {errors.district}</span>}
          </div>
        </div>
      </section>

      {/* ── Save ── */}
      {errors.save && (
        <div className={styles.publishError} role="alert">
          <AlertCircle size={14} aria-hidden="true" /> {errors.save}
        </div>
      )}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
        <button type="button" className={styles.publishBtn} disabled={saving} onClick={handleSave}>
          {saving ? '…' : <><Check size={16} /> {t('create.saveChanges')}</>}
        </button>
        <Link href={`/${locale}/listings/${id}`} className={styles.ghostBtn}>
          <X size={16} /> {t('create.cancel')}
        </Link>
      </div>
    </div>
  );
}
