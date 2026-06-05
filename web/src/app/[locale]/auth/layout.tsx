import type { ReactNode } from 'react';
import styles from './auth.module.css';

/**
 * Auth-page layout: centered card under the global NavBar + Footer.
 * Server component on purpose — child pages are client components and
 * read `searchParams` themselves.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <div className={styles.shell}>{children}</div>;
}
