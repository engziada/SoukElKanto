/**
 * Favorites store — Zustand + persist (localStorage: kanto.favorites.v1).
 *
 * Stores an array of saved listing IDs.  Full listing objects are NOT cached
 * here to avoid stale data; the /my/favorites page fetches from the API
 * and filters client-side.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface FavoritesState {
  /** Set of saved listing IDs (stored as array for JSON serialization) */
  ids: string[];

  /** Add a listing ID to favorites */
  save: (id: string) => void;

  /** Remove a listing ID from favorites */
  unsave: (id: string) => void;

  /** Toggle save/unsave */
  toggle: (id: string) => void;

  /** True if the given listing ID is saved */
  isSaved: (id: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      ids: [],

      save: (id: string) =>
        set((s) =>
          s.ids.includes(id) ? s : { ids: [...s.ids, id] },
        ),

      unsave: (id: string) =>
        set((s) => ({ ids: s.ids.filter((x) => x !== id) })),

      toggle: (id: string) => {
        const { ids, save, unsave } = get();
        ids.includes(id) ? unsave(id) : save(id);
      },

      isSaved: (id: string) => get().ids.includes(id),
    }),
    {
      name: 'kanto.favorites.v1',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined'
          ? localStorage
          : {
              // SSR no-op: avoid hydration errors
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            },
      ),
    },
  ),
);
