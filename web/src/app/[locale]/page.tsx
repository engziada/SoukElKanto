import { Suspense } from 'react';
import Link from 'next/link';
import { getTranslations, getLocale } from 'next-intl/server';
import {
  Search, ShieldCheck, MapPin, Coins, Users, Handshake, MessageCircle,
  Sofa, Smartphone, Refrigerator, Shirt, Baby, Dumbbell, BookOpen, Car,
  History, Sparkles,
} from 'lucide-react';
import { api } from '@/lib/api';
import { ListingCard } from '@/components/ListingCard';
import { ListingCardSkeletonGrid } from '@/components/ListingCardSkeleton/ListingCardSkeletonGrid';
import { AstroAvatar } from '@/components/AstroAvatar/AstroAvatar';
import styles from './page.module.css';

type CategoryShortcut = {
  key: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
};

const CATEGORY_SHORTCUTS: CategoryShortcut[] = [
  { key: 'FURNITURE', icon: Sofa },
  { key: 'ELECTRONICS', icon: Smartphone },
  { key: 'APPLIANCES', icon: Refrigerator },
  { key: 'FASHION', icon: Shirt },
  { key: 'KIDS_GEAR', icon: Baby },
  { key: 'SPORTS', icon: Dumbbell },
  { key: 'BOOKS', icon: BookOpen },
  { key: 'AUTOMOTIVE', icon: Car },
];

async function HomeListingsGrid() {
  const t = await getTranslations();
  let listings: Awaited<ReturnType<typeof api.listings.list>> | null = null;
  try {
    listings = await api.listings.list({ limit: '12' });
  } catch {
    listings = null;
  }

  if (!listings) {
    return (
      <div className={styles.empty}>
        <p>{t('errors.networkDown')}</p>
      </div>
    );
  }

  if (listings.data.length === 0) {
    return (
      <div className={styles.empty}>
        <p>{t('errors.emptyResults')}</p>
        <p className={styles.emptyHint}>{t('errors.beFirst')}</p>
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {listings.data.map((listing, idx) => (
        <ListingCard key={listing.id} listing={listing} priority={idx < 6} />
      ))}
    </div>
  );
}

export default async function HomePage() {
  const t = await getTranslations();
  const locale = await getLocale();
  const trustParts = t('home.trustBanner').split('·').map((s) => s.trim());

  return (
    <div className={styles.wrap}>
      {/* Hero */}
      <section className={styles.hero} aria-labelledby="hero-title">
        {/* AI glow orb behind Astro */}
        <div className={styles.heroAiGlow} aria-hidden="true" />

        {/* Astro avatar — waving on load */}
        <div className={styles.heroAstro}>
          <AstroAvatar mood="waving" size="lg" />
        </div>

        {/* Decorative awning ornament — top-end corner */}
        <svg
          className={styles.heroOrnament}
          viewBox="0 0 240 160"
          fill="none"
          aria-hidden="true"
        >
          <path d="M0 80 Q60 0 120 80 T240 80" stroke="var(--kanto-coral)" strokeOpacity="0.35" strokeWidth="2" fill="none" />
          <path d="M0 110 Q60 40 120 110 T240 110" stroke="var(--kanto-coral)" strokeOpacity="0.22" strokeWidth="2" fill="none" />
          <path d="M0 140 Q60 70 120 140 T240 140" stroke="var(--sun)" strokeOpacity="0.28" strokeWidth="2" fill="none" />
        </svg>

        <span className={styles.aiPoweredBadge}>
          <Sparkles size={14} />
          {locale === 'ar' ? 'مدعوم بالذكاء الاصطناعي' : 'AI-Powered'}
        </span>

        <h1 id="hero-title" className={styles.heroTitle}>{t('hero.title')}</h1>
        <p className={styles.heroSubtitle}>{t('hero.subtitle')}</p>
        <form
          action={`/${locale}/listings`}
          method="get"
          className={styles.heroSearch}
          role="search"
        >
          <Search size={18} aria-hidden="true" />
          <input
            name="q"
            type="search"
            className={styles.heroSearchInput}
            placeholder={t('hero.searchPlaceholder')}
            aria-label={t('hero.searchPlaceholder')}
          />
        </form>
      </section>

      {/* Categories chip strip */}
      <section className={styles.categoriesSection} aria-labelledby="categories-title">
        <h2 id="categories-title" className={styles.categoriesTitle}>
          {t('home.categoriesTitle')}
        </h2>
        <div className={styles.categoryChips} role="list">
          {CATEGORY_SHORTCUTS.map(({ key, icon: Icon }) => (
            <Link
              key={key}
              href={`/${locale}/listings?category=${key}`}
              className={styles.categoryChip}
              role="listitem"
            >
              <span className={styles.categoryChipIcon} aria-hidden="true">
                <Icon size={18} strokeWidth={1.6} />
              </span>
              <span>{t(`categories.${key}`)}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* New listings */}
      <section className={styles.section}>
        <header className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>{t('home.newListings')}</h2>
          <Link href={`/${locale}/listings`} className={styles.viewAll}>
            {t('home.viewAll')}
          </Link>
        </header>

        <Suspense fallback={<ListingCardSkeletonGrid count={8} />}>
          <HomeListingsGrid />
        </Suspense>
      </section>

      {/* What is ElKanto — flat layout, no wrapping card */}
      <section className={styles.about} aria-labelledby="about-title">
        <h2 id="about-title" className={styles.aboutTitle}>
          {t('home.aboutTitle')}
        </h2>
        <div className={styles.aboutGrid}>
          <div className={styles.aboutItem}>
            <span className={`${styles.aboutIcon} ${styles.aboutIconCoral}`}>
              <Users size={20} />
            </span>
            <div className={styles.aboutText}>
              <h3 className={styles.aboutItemTitle}>{t('home.aboutNeighbors')}</h3>
              <p className={styles.aboutItemBody}>{t('home.aboutNeighborsBody')}</p>
            </div>
          </div>
          <div className={styles.aboutItem}>
            <span className={`${styles.aboutIcon} ${styles.aboutIconTeal}`}>
              <Handshake size={20} />
            </span>
            <div className={styles.aboutText}>
              <h3 className={styles.aboutItemTitle}>{t('home.aboutBroker')}</h3>
              <p className={styles.aboutItemBody}>{t('home.aboutBrokerBody')}</p>
            </div>
          </div>
          <div className={styles.aboutItem}>
            <span className={`${styles.aboutIcon} ${styles.aboutIconMint}`}>
              <MessageCircle size={20} />
            </span>
            <div className={styles.aboutText}>
              <h3 className={styles.aboutItemTitle}>{t('home.aboutWhatsApp')}</h3>
              <p className={styles.aboutItemBody}>{t('home.aboutWhatsAppBody')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Heritage — real Souk ElKanto of Port Said */}
      <section className={styles.heritage} aria-labelledby="heritage-title">
        <div className={styles.heritageInner}>
          <span className={styles.heritageIcon} aria-hidden="true">
            <History size={22} />
          </span>
          <div>
            <h2 id="heritage-title" className={styles.heritageTitle}>
              {t('home.heritageTitle')}
            </h2>
            <p className={styles.heritageBody}>{t('home.heritageBody')}</p>
          </div>
        </div>
      </section>

      {/* Trust banner */}
      <section className={styles.trust} aria-label={t('home.trustBanner')}>
        {trustParts[0] && (
          <span className={styles.trustItem}>
            <ShieldCheck size={16} />
            {trustParts[0].replace(/^✓\s*/, '')}
          </span>
        )}
        {trustParts[1] && (
          <span className={styles.trustItem}>
            <MapPin size={16} />
            {trustParts[1]}
          </span>
        )}
        {trustParts[2] && (
          <span className={styles.trustItem}>
            <Coins size={16} />
            {trustParts[2]}
          </span>
        )}
      </section>
    </div>
  );
}
