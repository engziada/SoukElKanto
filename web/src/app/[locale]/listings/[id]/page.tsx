'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import {
  MapPin, Heart, Share2, Flag, ShieldCheck, BadgeCheck, Check, Pencil, GitCompare,
} from 'lucide-react';
import { api } from '@/lib/api';
import type { Listing, Offer } from '@/lib/api';
import {
  deriveTierFromId,
  tierClassMap,
  tierLabelKey,
} from '@/lib/trustTier';
import { useAuthStore } from '@/lib/auth/store';
import { useFavoritesStore } from '@/lib/favorites/store';
import { useCompare } from '@/lib/compare';
import { OfferModal } from '@/components/OfferModal';
import { ReportModal } from '@/components/ReportModal';
import styles from './detail.module.css';

interface DetailViewProps {
  listing: Listing;
}

function fallbackPhotoUrl(listingId: string, size = '1200/900'): string {
  return `https://picsum.photos/seed/${encodeURIComponent(listingId)}/${size}`;
}

function DetailView({ listing }: DetailViewProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  // Subscribe reactively to the ids array so the heart updates on every toggle.
  const ids = useFavoritesStore((s) => s.ids);
  const toggleFavorite = useFavoritesStore((s) => s.toggle);
  const { isInCompare, addToCompare, removeFromCompare, items: compareItems, maxItems } = useCompare();
  // Defer localStorage-backed reads to after hydration to avoid SSR mismatch.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const saved = hydrated && ids.includes(listing.id);
  const isOwnListing = hydrated && user?.id === listing.sellerId;
  const [hint, setHint] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  // R-11 F-#6 — if the user already has an open offer on this listing, swap
  // "Make Offer" for "View your offer" so they don't get a 409 on submit.
  const [existingOffer, setExistingOffer] = useState<Offer | null>(null);

  useEffect(() => {
    // Only buyers; sellers see "Review Offers" already. Only after hydration
    // so authenticated state is correct.
    if (!hydrated || !isAuthenticated || isOwnListing) {
      setExistingOffer(null);
      return;
    }
    let cancelled = false;
    api.offers
      .listSent()
      .then((sent) => {
        if (cancelled) return;
        // Open = the user still has a live thread on this listing. Terminal
        // statuses (DECLINED, WITHDRAWN, EXPIRED, CLOSED) let them re-offer.
        const open = sent.find(
          (o) =>
            o.listingId === listing.id &&
            ['PENDING', 'ACCEPTED', 'COUNTERED', 'HANDOVER_PENDING', 'CONFIRMED'].includes(
              o.status,
            ),
        );
        setExistingOffer(open ?? null);
      })
      .catch(() => {
        // Not fatal — fall back to Make Offer; BE will 409 on duplicate.
        setExistingOffer(null);
      });
    return () => {
      cancelled = true;
    };
  }, [hydrated, isAuthenticated, isOwnListing, listing.id]);

  const primaryPhoto = listing.photos?.find((p) => p.position === 0);
  const photoUrl = primaryPhoto?.url?.trim() ? primaryPhoto.url : fallbackPhotoUrl(listing.id);
  const tier = deriveTierFromId(`${listing.sellerId}::${listing.id}`);

  const showHint = useCallback((msg: string) => {
    setHint(msg);
    setTimeout(() => setHint(null), 2000);
  }, []);

  const handleShare = useCallback(async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: listing.title, url });
      } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }
    } catch {
      showHint(t('errors.generic'));
    }
  }, [listing.title, t, showHint]);

  const whatsAppHref = (() => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const text =
      locale === 'ar'
        ? `${listing.title} على سوق الكانتو · ${listing.askingPrice.toLocaleString()} ${t('listing.price')}\n${url}`
        : `${listing.title} on Souk ElKanto · ${listing.askingPrice.toLocaleString()} ${t('listing.price')}\n${url}`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  })();

  return (
    <div className={styles.wrap}>
      <div className={styles.photoFrame}>
        <Image
          src={photoUrl}
          alt={listing.title}
          fill
          sizes="(max-width: 900px) 100vw, 50vw"
          className={styles.photoImg}
          priority
        />
      </div>

      <div className={styles.info}>
        {/* Trust comes before price per PRODUCT principle #1 */}
        <div className={styles.trustPanel}>
          <div className={styles.trustBadge}>
            <ShieldCheck size={18} aria-hidden="true" />
          </div>
          <div className={styles.trustText}>
            <span className={styles.trustTitle}>{t('listing.kycVerified')}</span>
            <span className={styles.trustMeta}>
              {t('listing.memberSince')} 2024 · {listing.district}
            </span>
          </div>
          <span
            className={`${styles.tierRibbon} ${styles[tierClassMap[tier]]}`}
            aria-label={t(`listing.${tierLabelKey(tier)}`)}
          >
            <BadgeCheck size={12} aria-hidden="true" />
            {t(`listing.${tierLabelKey(tier)}`)}
          </span>
        </div>

        <div>
          <div className={styles.price}>
            <span className={styles.priceAmount}>
              {listing.askingPrice.toLocaleString()}
            </span>
            <span className={styles.priceUnit}>{t('listing.price')}</span>
          </div>
          <h1 className={styles.h1}>{listing.title}</h1>
        </div>

        <div className={styles.chips}>
          <span className={`${styles.chip} ${styles.chipAccent}`}>
            {t(`categories.${listing.category}`)}
          </span>
          <span className={styles.chip}>
            {t(`conditions.${listing.condition}`)}
          </span>
          <span className={styles.chip}>
            <MapPin size={12} aria-hidden="true" />
            {listing.district}
          </span>
        </div>

        <p className={styles.description}>{listing.description}</p>

        <div className={styles.actions}>
          {hint && (
            <span className={styles.hint} role="status" aria-live="polite">
              {hint}
            </span>
          )}
          {isOwnListing ? (
            <>
              <button
                type="button"
                className={styles.cta}
                onClick={() => router.push(`/${locale}/my/offers`)}
              >
                {t('listing.reviewOffers')}
              </button>
              <button
                type="button"
                className={styles.subBtn}
                onClick={() => router.push(`/${locale}/listings/${listing.id}/edit`)}
              >
                <Pencil size={14} aria-hidden="true" />
                {t('listing.edit')}
              </button>
            </>
          ) : existingOffer ? (
            <button
              type="button"
              className={styles.cta}
              onClick={() => router.push(`/${locale}/my/offers?tab=sent&highlight=${existingOffer.id}`)}
            >
              {t('listing.viewYourOffer')}
            </button>
          ) : (
            <button
              type="button"
              className={styles.cta}
              onClick={() => {
                if (!isAuthenticated) {
                  // Redirect to login, come back after auth
                  const path = typeof window !== 'undefined' ? window.location.pathname : `/${locale}/listings/${listing.id}`;
                  router.push(`/${locale}/auth/login?next=${encodeURIComponent(path)}`);
                  return;
                }
                setOfferOpen(true);
              }}
            >
              {t('listing.makeOffer')}
            </button>
          )}
          <a
            href={whatsAppHref}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.whatsAppBtn}
            aria-label={t('listing.shareWhatsApp')}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.555 4.122 1.522 5.86L0 24l6.296-1.498A11.934 11.934 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.896 0-3.67-.502-5.204-1.381l-.373-.22-3.739.89.942-3.639-.242-.384A9.943 9.943 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
            </svg>
            {t('listing.shareWhatsApp')}
          </a>
          <div className={styles.subActions}>
            {!isOwnListing && (
              <button
                type="button"
                className={`${styles.subBtn} ${saved ? styles.subBtnActive : ''}`}
                onClick={() => {
                  toggleFavorite(listing.id);
                  // `saved` is the state BEFORE toggle → announce the NEW state.
                  showHint(saved ? t('listing.removedDone') : t('listing.savedDone'));
                }}
                aria-pressed={saved}
              >
                <Heart size={14} fill={saved ? 'currentColor' : 'none'} aria-hidden="true" />
                {saved ? t('listing.unsave') : t('listing.save')}
              </button>
            )}
            {!isOwnListing && (
              <button
                type="button"
                className={`${styles.subBtn} ${hydrated && isInCompare(listing.id) ? styles.subBtnActive : ''}`}
                onClick={() => {
                  if (isInCompare(listing.id)) {
                    removeFromCompare(listing.id);
                    showHint(t('compare.removedFromCompare'));
                  } else if (compareItems.length >= maxItems) {
                    showHint(t('compare.maxReached'));
                  } else {
                    addToCompare({
                      id: listing.id,
                      title: listing.title,
                      description: listing.description,
                      askingPrice: listing.askingPrice,
                      category: listing.category,
                      condition: listing.condition,
                      district: listing.district,
                      photoUrl: primaryPhoto?.url,
                      photoUrls: listing.photos?.map((p) => p.url).filter(Boolean) ?? [],
                      sellerRating: tier === 'PLATINUM' ? 5 : tier === 'GOLD' ? 4.5 : tier === 'SILVER' ? 4 : tier === 'BRONZE' ? 3.5 : 0,
                    });
                    showHint(t('compare.addedToCompare'));
                  }
                }}
                aria-pressed={hydrated && isInCompare(listing.id)}
              >
                <GitCompare size={14} aria-hidden="true" />
                {hydrated && isInCompare(listing.id) ? t('compare.removeFromCompare') : t('compare.addToCompare')}
              </button>
            )}
            <button
              type="button"
              className={`${styles.subBtn} ${copied ? styles.subBtnActive : ''}`}
              onClick={handleShare}
            >
              {copied ? <Check size={14} aria-hidden="true" /> : <Share2 size={14} aria-hidden="true" />}
              {copied ? t('listing.shareDone') : t('listing.share')}
            </button>
            <button
              type="button"
              className={styles.subBtn}
              onClick={() => {
                // R-09: route through the same auth-gate as the offer modal.
                // Anonymous users hit /auth/login with a next= deep link back.
                if (!isAuthenticated) {
                  const path =
                    typeof window !== 'undefined'
                      ? window.location.pathname
                      : `/${locale}/listings/${listing.id}`;
                  router.push(
                    `/${locale}/auth/login?next=${encodeURIComponent(path)}`,
                  );
                  return;
                }
                if (isOwnListing) {
                  // Self-report is rejected at the BE; bail out client-side too.
                  showHint(t('listing.cantReportOwn'));
                  return;
                }
                setReportOpen(true);
              }}
            >
              <Flag size={14} aria-hidden="true" />
              {t('listing.report')}
            </button>
          </div>
        </div>
      </div>

      {/* Offer modal — rendered at root level to avoid stacking context issues */}
      {offerOpen && (
        <OfferModal
          listing={listing}
          onClose={() => setOfferOpen(false)}
        />
      )}

      {/* R-09: Report modal — same z-index family as OfferModal */}
      {reportOpen && (
        <ReportModal
          listing={listing}
          onClose={() => setReportOpen(false)}
        />
      )}
    </div>
  );
}

export default function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = useTranslations();
  const [listing, setListing] = useState<Listing | null>(null);
  const [error, setError] = useState<'notFound' | 'networkDown' | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { id } = await params;
      try {
        const res = await api.listings.get(id);
        if (!cancelled) {
          if (res) setListing(res);
          else setError('notFound');
        }
      } catch {
        if (!cancelled) setError('networkDown');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params]);

  if (error) {
    return (
      <div className={styles.errorState}>
        <p>{t(`errors.${error}`)}</p>
      </div>
    );
  }

  if (!listing) {
    return <div className={styles.loadingState} aria-busy="true" />;
  }

  return <DetailView listing={listing} />;
}
