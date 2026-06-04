'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Moon, Sun } from 'lucide-react';
import styles from './ThemeToggle.module.css';

type Theme = 'light' | 'dark';

const STORAGE_KEY = 'kanto.theme';

function readInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeToggle() {
  const t = useTranslations('theme');
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const initial = readInitialTheme();
    setTheme(initial);
    document.documentElement.setAttribute('data-theme', initial);
    setMounted(true);
  }, []);

  const toggle = () => {
    const next: Theme = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    window.localStorage.setItem(STORAGE_KEY, next);
  };

  // Render a stable placeholder during SSR to avoid hydration mismatch.
  if (!mounted) {
    return (
      <button
        type="button"
        className={styles.button}
        aria-label={t('toggleDark')}
        suppressHydrationWarning
      >
        <Sun size={16} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={styles.button}
      aria-label={theme === 'light' ? t('toggleDark') : t('toggleLight')}
      title={theme === 'light' ? t('toggleDark') : t('toggleLight')}
    >
      <Sun size={16} className={styles.iconShow} aria-hidden="true" />
      <Moon size={16} className={styles.iconHide} aria-hidden="true" />
    </button>
  );
}
