'use client';

import { useEffect, useState, useCallback } from 'react';
import { api, type Offer } from '@/lib/api';
import { useAuthStore } from '@/lib/auth/store';

const STORAGE_KEY = 'souk-seen-offers';
const POLL_INTERVAL = 30_000; // 30s

/**
 * Tracks pending actions that need the user's attention:
 * - Seller: received offers in PENDING or COUNTERED (buyer countered back) status
 * - Buyer: offers where seller COUNTERED (needs buyer accept/decline)
 * - Both: HANDOVER_PENDING confirmations
 *
 * Persists "seen" offer IDs in localStorage so the badge only shows
 * for new actions the user hasn't opened yet.
 */
export function usePendingActions() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [pendingCount, setPendingCount] = useState(0);
  const [newCount, setNewCount] = useState(0);

  const getSeenIds = useCallback((): Set<string> => {
    if (typeof window === 'undefined') return new Set();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return new Set();
      const arr = JSON.parse(raw);
      return new Set(Array.isArray(arr) ? arr : []);
    } catch {
      return new Set();
    }
  }, []);

  const markAllSeen = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY) ?? '[]';
      const parsed = JSON.parse(raw);
      const seen = new Set<string>(Array.isArray(parsed) ? parsed : []);
      // Merge current pending IDs into seen
      const currentRaw = sessionStorage.getItem('souk-pending-ids');
      if (currentRaw) {
        const ids: string[] = JSON.parse(currentRaw);
        ids.forEach((id) => seen.add(id));
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...seen]));
      setNewCount(0);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setPendingCount(0);
      setNewCount(0);
      return;
    }

    let cancelled = false;

    const fetchPending = async () => {
      try {
        const [sent, received] = await Promise.all([
          api.offers.listSent().catch(() => [] as Offer[]),
          api.offers.listReceived().catch(() => [] as Offer[]),
        ]);

        if (cancelled) return;

        // Seller-side: received offers needing action
        const sellerPending = received.filter((o) =>
          ['PENDING', 'COUNTERED', 'HANDOVER_PENDING'].includes(o.status),
        );

        // Buyer-side: sent offers where seller countered (needs buyer action),
        // or handover pending confirmation
        const buyerPending = sent.filter((o) =>
          ['COUNTERED', 'HANDOVER_PENDING', 'CONFIRMED'].includes(o.status),
        );

        const allPending = [...sellerPending, ...buyerPending];
        const pendingIds = allPending.map((o) => o.id);

        // Store current pending IDs for markAllSeen
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('souk-pending-ids', JSON.stringify(pendingIds));
        }

        setPendingCount(allPending.length);

        // Compute new (unseen) count
        const seen = getSeenIds();
        const unseen = pendingIds.filter((id) => !seen.has(id));
        setNewCount(unseen.length);
      } catch {
        // Silent fail — don't spam errors
      }
    };

    fetchPending();
    const interval = setInterval(fetchPending, POLL_INTERVAL);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isAuthenticated, getSeenIds]);

  return { pendingCount, newCount, markAllSeen };
}
