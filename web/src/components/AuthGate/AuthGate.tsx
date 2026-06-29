'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useAuthStore } from '@/lib/auth/store';

interface AuthGateProps {
  children: React.ReactNode;
  /** Optional custom fallback while we redirect / hydrate. */
  fallback?: React.ReactNode;
}

/**
 * Client-side auth gate for protected routes.
 *
 * Behaviour:
 *   - SSR + initial paint: render the fallback (or null).
 *   - After hydration: if authenticated, render children; otherwise
 *     redirect to /auth/login?next={current path} preserving the locale.
 *
 * Use inside `/[locale]/my/layout.tsx` so the whole dashboard is gated
 * in one place.
 */
export function AuthGate({ children, fallback = null }: AuthGateProps) {
  const router = useRouter();
  const pathname = usePathname() ?? '/';
  const locale = useLocale();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const refreshUser = useAuthStore((s) => s.refreshUser);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  // Pre-Phase A — reconcile persisted localStorage user with the server on
  // mount. This fixes stale profile data after edits made in another tab or
  // after the cookie was revoked server-side. Fire-and-forget; the redirect
  // effect below reacts to isAuthenticated changes.
  useEffect(() => {
    if (!hydrated) return;
    refreshUser();
  }, [hydrated, refreshUser]);

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated) {
      const next = encodeURIComponent(pathname);
      router.replace(`/${locale}/auth/login?next=${next}`);
    }
  }, [hydrated, isAuthenticated, locale, pathname, router]);

  if (!hydrated || !isAuthenticated) return <>{fallback}</>;
  return <>{children}</>;
}
