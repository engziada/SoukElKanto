'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { api } from '@/lib/api';

export interface AuthUser {
  id: string;
  phoneNumber: string;
  role: 'USER' | 'PROVIDER' | 'TENANT_ADMIN' | 'PLATFORM_ADMIN';
  isVerified?: boolean;
  trustScore?: number;
  metadata?: Record<string, unknown>;
  // Profile fields (stored in metadata, flattened for convenience)
  fullName?: string;
  gender?: 'MALE' | 'FEMALE' | string;
  birthdate?: string; // ISO date YYYY-MM-DD
  address?: string;
  madinatyGroup?: string;
  buildingNo?: string;
  aptNo?: string;
}

/**
 * R-11 F-15 — the JWT lives in the httpOnly `madinaty.access` cookie, NEVER
 * in localStorage. We persist only `user` + `isAuthenticated` for UX (so the
 * navbar can render the correct chrome on hydration without a `/me` round
 * trip). These are NOT credentials; whoever steals them still can't make
 * authenticated requests without the cookie.
 *
 * The `token` field is kept on the in-memory state for one release cycle so
 * existing pre-cookie sessions don't get logged out — `login(token, user)`
 * still accepts it from `verify-otp`'s body, but `partialize` excludes it
 * from the persisted snapshot. The token survives only until tab close.
 */
interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  /** Login: store user + (transient, in-memory) token. Cookie is the auth channel. */
  login: (token: string, user: AuthUser) => void;
  /** Refresh the cached user payload (e.g. after KYC submit). */
  setUser: (user: AuthUser) => void;
  /**
   * R-11 F-16 — revoke server-side (adds JTI to deny-list, clears cookie),
   * then drop client state. Falls back to local-only logout on network error.
   */
  signOut: () => Promise<void>;
  /** Synchronous local clear — escape hatch when /logout is undesirable. */
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      login: (token, user) => set({ token, user, isAuthenticated: true }),
      setUser: (user) => set({ user }),
      signOut: async () => {
        try {
          await api.auth.logout();
        } catch {
          // Best-effort: the cookie will expire anyway and /me will start failing.
        } finally {
          get().logout();
        }
      },
      logout: () => set({ token: null, user: null, isAuthenticated: false }),
    }),
    {
      name: 'kanto.auth.v1',
      storage: createJSONStorage(() => localStorage),
      // R-11 F-15 — DO NOT persist `token`. Cookie is the source of truth.
      partialize: (s) => ({
        user: s.user,
        isAuthenticated: s.isAuthenticated,
      }),
    },
  ),
);

/**
 * R-11 F-15 — DEPRECATED. The JWT is no longer accessible to JavaScript; it
 * lives in the httpOnly cookie. Kept as a no-op so any straggler caller during
 * the migration doesn't crash, but it always returns null.
 */
export function getAuthToken(): string | null {
  return null;
}
