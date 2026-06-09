import Link from 'next/link';
import { getTranslations, getLocale } from 'next-intl/server';
import styles from './Footer.module.css';

/**
 * Public footer with dual ecosystem attribution:
 *   – Souk ElKanto belongs to the MadinatyAI ecosystem (CoreMesh tenant).
 *   – Designed and built by ZSolutions (New Cairo).
 *
 * Both logos ship as theme-paired SVGs (light + dark) in public/brand/.
 * Theme switch toggles which pair is visible via `[data-theme]` on <html>.
 */
export async function Footer() {
  const t = await getTranslations('footer');
  const locale = await getLocale();
  const isRtl = locale === 'ar';

  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.inner}>
          {/* Ecosystem badge — MadinatyAI */}
          <a
            href="https://madinaty-ai.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.brand}
            aria-label={t('madinatyEcosystem')}
          >
            <img
              src="/brand/madinaty-light.svg"
              alt=""
              width={44}
              height={44}
              className={`${styles.brandLogo} ${styles.themeLight}`}
            />
            <img
              src="/brand/madinaty-dark.svg"
              alt=""
              width={44}
              height={44}
              className={`${styles.brandLogo} ${styles.themeDark}`}
            />
            <div className={styles.brandText}>
              <span className={styles.brandTitle}>
                {isRtl ? 'منظومة Madinaty AI' : 'MadinatyAI Ecosystem'}
              </span>
              <span className={styles.brandSlogan}>{t('partOf')}</span>
            </div>
          </a>
        </div>

        {/* Bottom legal bar */}
        <div className={styles.bar}>
          <span className={styles.copyright}>
            <img
              src="/brand/zsolutions-light.svg"
              alt="ZSolutions"
              className={`${styles.copyrightLogo} ${styles.themeLight}`}
            />
            <img
              src="/brand/zsolutions-dark.svg"
              alt="ZSolutions"
              className={`${styles.copyrightLogo} ${styles.themeDark}`}
            />
            {t('copyright', { year: new Date().getFullYear() })}
          </span>
          <nav className={styles.barLinks} aria-label={t('footerLinksLabel')}>
            <Link href={`/${locale}`}>{t('home')}</Link>
            <a href="https://madinaty-ai.vercel.app" target="_blank" rel="noopener noreferrer">
              {t('aboutMadinaty')}
            </a>
            <a href={`mailto:engziada@gmail.com`}>{t('contact')}</a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
