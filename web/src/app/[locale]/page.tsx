import Link from 'next/link';
import { getTranslations, getLocale } from 'next-intl/server';
import { Search, ShieldCheck, MapPin, Coins, Sparkles, Users, Handshake, MessageCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { ListingCard } from '@/components/ListingCard';
import styles from './page.module.css';

export default async function HomePage() {
  const t = await getTranslations();
  const locale = await getLocale();
  let listings: Awaited<ReturnType<typeof api.listings.list>> | null = null;

  try {
    listings = await api.listings.list({ limit: '12' });
  } catch {
    listings = null;
  }

  const trustParts = t('home.trustBanner').split('·').map((s) => s.trim());

  return (
    <div className={styles.wrap}>
      {/* Hero */}
      <section className={styles.hero}>
        <span className={styles.heroEyebrow}>
          <Sparkles size={12} />
          Souk ElKanto
        </span>
        <h1 className={styles.heroTitle}>{t('hero.title')}</h1>
        <p className={styles.heroSubtitle}>{t('hero.subtitle')}</p>
        <form
          action={`/${locale}/listings`}
          method="get"
          className={styles.heroSearch}
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

      {/* New listings */}
      <section className={styles.section}>
        <header className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>{t('home.newListings')}</h2>
          <Link href={`/${locale}/listings`} className={styles.viewAll}>
            {t('home.viewAll')}
          </Link>
        </header>

        {listings && listings.data.length > 0 ? (
          <div className={styles.grid}>
            {listings.data.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <p>{t('errors.notFound')}</p>
            <p style={{ fontSize: '0.85rem', marginTop: '0.5rem', opacity: 0.7 }}>
              {t('errors.beFirst')}
            </p>
          </div>
        )}
      </section>

      {/* What is ElKanto */}
      <section className={styles.about} aria-labelledby="about-title">
        <h2 id="about-title" className={styles.aboutTitle}>
          {t('home.aboutTitle')}
        </h2>
        <div className={styles.aboutGrid}>
          <div className={styles.aboutCard}>
            <span className={styles.aboutIcon}>
              <Users size={20} />
            </span>
            <h3 className={styles.aboutCardTitle}>{t('home.aboutNeighbors')}</h3>
            <p className={styles.aboutCardBody}>{t('home.aboutNeighborsBody')}</p>
          </div>
          <div className={styles.aboutCard}>
            <span className={styles.aboutIcon}>
              <Handshake size={20} />
            </span>
            <h3 className={styles.aboutCardTitle}>{t('home.aboutBroker')}</h3>
            <p className={styles.aboutCardBody}>{t('home.aboutBrokerBody')}</p>
          </div>
          <div className={styles.aboutCard}>
            <span className={styles.aboutIcon}>
              <MessageCircle size={20} />
            </span>
            <h3 className={styles.aboutCardTitle}>{t('home.aboutWhatsApp')}</h3>
            <p className={styles.aboutCardBody}>{t('home.aboutWhatsAppBody')}</p>
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
