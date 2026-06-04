import { getTranslations } from 'next-intl/server';
import { MapPin, Heart, Share2, Flag, ShieldCheck, ImageOff } from 'lucide-react';
import { api } from '@/lib/api';
import styles from './detail.module.css';

interface ListingDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ListingDetailPage({ params }: ListingDetailPageProps) {
  const t = await getTranslations();
  const { id } = await params;

  let listing: Awaited<ReturnType<typeof api.listings.get>> | null = null;
  try {
    listing = await api.listings.get(id);
  } catch {
    listing = null;
  }

  if (!listing) {
    return <div className={styles.placeholder}>{t('errors.notFound')}</div>;
  }

  const primaryPhoto = listing.photos?.find((p) => p.position === 0);

  return (
    <div className={styles.wrap}>
      <div className={styles.photoFrame}>
        {primaryPhoto?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={primaryPhoto.url} alt={listing.title} />
        ) : (
          <div className={styles.placeholder}>
            <ImageOff size={48} />
          </div>
        )}
      </div>

      <div className={styles.info}>
        <div>
          <div className={styles.price}>
            {listing.askingPrice.toLocaleString()} {t('listing.price')}
          </div>
          <h1 className={styles.h1}>{listing.title}</h1>
        </div>

        <div className={styles.trustPanel}>
          <div className={styles.trustBadge}>
            <ShieldCheck size={18} />
          </div>
          <div className={styles.trustText}>
            <span className={styles.trustTitle}>{t('listing.kycVerified')}</span>
            <span className={styles.trustMeta}>
              {t('listing.memberSince')} — {listing.district}
            </span>
          </div>
        </div>

        <div className={styles.chips}>
          <span className={`${styles.chip} ${styles.chipAccent}`}>
            {t(`categories.${listing.category}`)}
          </span>
          <span className={styles.chip}>
            {t(`conditions.${listing.condition}`)}
          </span>
          <span className={styles.chip}>
            <MapPin size={12} />
            {listing.district}
          </span>
        </div>

        <p className={styles.description}>{listing.description}</p>

        <div className={styles.actions}>
          <button type="button" className={styles.cta}>
            {t('listing.makeOffer')}
          </button>
          <div className={styles.subActions}>
            <button type="button" className={styles.subBtn}>
              <Heart size={14} />
              {t('listing.save')}
            </button>
            <button type="button" className={styles.subBtn}>
              <Share2 size={14} />
              {t('listing.share')}
            </button>
            <button type="button" className={styles.subBtn}>
              <Flag size={14} />
              {t('listing.report')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
