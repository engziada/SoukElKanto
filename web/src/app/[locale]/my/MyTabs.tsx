'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  LayoutGrid, Tag, ArrowLeftRight, Handshake, Heart, Coins, Award, User as UserIcon,
  History,
} from 'lucide-react';
import styles from './my.module.css';

interface MyTabsProps {
  locale: string;
}

interface TabDef {
  slug: string;
  labelKey: keyof TabLabelKeys;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
}

interface TabLabelKeys {
  overview: string;
  listings: string;
  offers: string;
  handovers: string;
  activity: string;
  favorites: string;
  wallet: string;
  trustMeter: string;
  profile: string;
}

const TABS: TabDef[] = [
  { slug: '',              labelKey: 'overview',   icon: LayoutGrid },
  { slug: 'listings',      labelKey: 'listings',   icon: Tag },
  { slug: 'offers',        labelKey: 'offers',     icon: ArrowLeftRight },
  { slug: 'handovers',     labelKey: 'handovers',  icon: Handshake },
  { slug: 'activity',      labelKey: 'activity',   icon: History },
  { slug: 'favorites',     labelKey: 'favorites',  icon: Heart },
  { slug: 'wallet',        labelKey: 'wallet',     icon: Coins },
  { slug: 'trust-meter',   labelKey: 'trustMeter', icon: Award },
  { slug: 'profile',       labelKey: 'profile',    icon: UserIcon },
];

export function MyTabs({ locale }: MyTabsProps) {
  const t = useTranslations('my.tabs');
  const pathname = usePathname() ?? '';
  // Active when path is /[locale]/my/{slug} or /[locale]/my (overview)
  const myBase = `/${locale}/my`;
  const sub = pathname.startsWith(myBase) ? pathname.slice(myBase.length).replace(/^\//, '') : '';

  return (
    <nav className={styles.tabs} aria-label={t('overview')}>
      {TABS.map(({ slug, labelKey, icon: Icon }) => {
        const href = slug ? `${myBase}/${slug}` : myBase;
        const isActive = sub === slug;
        return (
          <Link
            key={slug || 'overview'}
            href={href}
            className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon size={15} strokeWidth={1.8} aria-hidden="true" />
            <span>{t(labelKey)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
