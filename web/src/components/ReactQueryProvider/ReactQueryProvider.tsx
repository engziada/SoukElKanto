'use client';

/**
 * ReactQueryProvider — wraps the app in a QueryClientProvider.
 *
 * Using a client component boundary so the server root layout stays async.
 * staleTime of 30s keeps browse pages snappy without hammering the BE.
 */

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

interface ReactQueryProviderProps {
  children: React.ReactNode;
}

export function ReactQueryProvider({ children }: ReactQueryProviderProps) {
  /**
   * Instantiate QueryClient per request (not a module-level singleton)
   * so server-render and each browser tab get isolated caches.
   * See: https://tanstack.com/query/latest/docs/framework/react/guides/ssr#using-the-app-router
   */
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,          // 30 s — cache stays fresh
            gcTime: 5 * 60 * 1_000,    // 5 min — garbage collect after hidden
            retry: 1,
            refetchOnWindowFocus: false, // avoid refetch on every tab switch
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
