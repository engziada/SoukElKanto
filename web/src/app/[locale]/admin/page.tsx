'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Users, List, ShieldCheck, ArrowLeft,
  BarChart3, AlertTriangle,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth/store';
import { api } from '@/lib/api';
import type { Listing } from '@/lib/api';
import styles from './admin.module.css';

export default function AdminPage() {
  const t = useTranslations('admin');
  const locale = useLocale();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [stats, setStats] = useState({
    listings: 0,
    users: 0,
    pendingKyc: 0,
    activeOffers: 0,
  });
  const [recentListings, setRecentListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push(`/${locale}/auth/login`);
      return;
    }
    if (user.role !== 'PLATFORM_ADMIN') {
      router.push(`/${locale}`);
      return;
    }

    // Fetch stats
    api.listings.list({ limit: '5' }).then((listings) => {
      setStats({
        listings: listings.pagination?.total_items || 0,
        users: 0, // TODO: add endpoint
        pendingKyc: 0, // TODO: add endpoint
        activeOffers: 0, // TODO: add endpoint
      });
      setRecentListings(listings.data || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, [user, locale, router]);

  if (!user || user.role !== 'PLATFORM_ADMIN') return null;
  if (loading) return <div className={styles.loading}>…</div>;

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <Link href={`/${locale}`} className={styles.back}>
          <ArrowLeft size={16} /> {t('backToSite')}
        </Link>
        <h1 className={styles.title}>
          <LayoutDashboard size={20} />
          {t('title')}
        </h1>
      </header>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <List size={20} className={styles.statIcon} />
          <div>
            <span className={styles.statValue}>{stats.listings}</span>
            <span className={styles.statLabel}>{t('listings')}</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <Users size={20} className={styles.statIcon} />
          <div>
            <span className={styles.statValue}>{stats.users}</span>
            <span className={styles.statLabel}>{t('users')}</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <ShieldCheck size={20} className={styles.statIcon} />
          <div>
            <span className={styles.statValue}>{stats.pendingKyc}</span>
            <span className={styles.statLabel}>{t('pendingKyc')}</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <BarChart3 size={20} className={styles.statIcon} />
          <div>
            <span className={styles.statValue}>{stats.activeOffers}</span>
            <span className={styles.statLabel}>{t('activeOffers')}</span>
          </div>
        </div>
      </div>

      {/* Recent Listings Table */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('recentListings')}</h2>
        {recentListings.length === 0 ? (
          <p className={styles.empty}>{t('noListings')}</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t('colTitle')}</th>
                <th>{t('colPrice')}</th>
                <th>{t('colStatus')}</th>
                <th>{t('colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {recentListings.map((l) => (
                <tr key={l.id}>
                  <td>
                    <Link href={`/${locale}/listings/${l.id}`} className={styles.tableLink}>
                      {l.title}
                    </Link>
                  </td>
                  <td>{l.askingPrice.toLocaleString()} EGP</td>
                  <td>
                    <span className={`${styles.statusBadge} ${styles[l.status.toLowerCase()]}`}>
                      {l.status}
                    </span>
                  </td>
                  <td>
                    <button className={styles.actionBtn} onClick={() => router.push(`/${locale}/listings/${l.id}`)}>
                      {t('view')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Quick Actions */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('quickActions')}</h2>
        <div className={styles.actionsGrid}>
          <Link href={`/${locale}/listings`} className={styles.actionCard}>
            <List size={20} />
            {t('browseListings')}
          </Link>
          <Link href={`/${locale}/my`} className={styles.actionCard}>
            <Users size={20} />
            {t('userManagement')}
          </Link>
        </div>
      </section>
    </div>
  );
}
