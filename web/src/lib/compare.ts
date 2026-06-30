'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'souk-compare';
const MAX_ITEMS = 4;

export interface CompareItem {
  id: string;
  title: string;
  description: string;
  askingPrice: number;
  category: string;
  condition: string;
  district: string;
  photoUrl?: string;
  photoUrls?: string[];
  sellerRating?: number;
}

function readStore(): CompareItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, MAX_ITEMS);
  } catch {
    return [];
  }
}

function writeStore(items: CompareItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('souk-compare-change'));
  } catch {
    // ignore quota errors
  }
}

export function useCompare() {
  const [items, setItems] = useState<CompareItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setItems(readStore());
    const onChange = () => setItems(readStore());
    window.addEventListener('souk-compare-change', onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener('souk-compare-change', onChange);
      window.removeEventListener('storage', onChange);
    };
  }, []);

  const isInCompare = useCallback(
    (id: string) => items.some((i) => i.id === id),
    [items],
  );

  const addToCompare = useCallback((item: CompareItem) => {
    const current = readStore();
    if (current.some((i) => i.id === item.id)) return;
    if (current.length >= MAX_ITEMS) return;
    writeStore([...current, item]);
  }, []);

  const removeFromCompare = useCallback((id: string) => {
    const current = readStore();
    writeStore(current.filter((i) => i.id !== id));
  }, []);

  const clearCompare = useCallback(() => {
    writeStore([]);
  }, []);

  return {
    items,
    mounted,
    isInCompare,
    addToCompare,
    removeFromCompare,
    clearCompare,
    maxItems: MAX_ITEMS,
  };
}
