'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  /** Login: store token + user. Triggered after successful OTP verify. */
  login: (token: string, user: AuthUser) => void;
  /** Refresh the cached user payload (e.g. after KYC submit). */
  setUser: (user: AuthUser) => void;
  /** Clear local state. Server-side session has no persistent record besides JWT. */
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      login: (token, user) => set({ token, user, isAuthenticated: true }),
      setUser: (user) => set({ user }),
      logout: () => set({ token: null, user: null, isAuthenticated: false }),
    }),
    {
      name: 'kanto.auth.v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        token: s.token,
        user: s.user,
        isAuthenticated: s.isAuthenticated,
      }),
    },
  ),
);

/**
 * Token getter that works in both client and module-load contexts.
 * Used by lib/api.ts to inject Authorization on outbound requests
 * without forcing every consumer to subscribe to the store.
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem('kanto.auth.v1');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: { token?: string | null } };
    return parsed?.state?.token ?? null;
  } catch {
    return null;
  }
}
