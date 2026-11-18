'use client';

import React from 'react';
import { SWRConfig } from 'swr';

export function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher: async (resource, init) => {
          const res = await fetch(resource, init);
          if (!res.ok) {
            const error = new Error('An error occurred while fetching the data.');
            const info = await res.json().catch(() => null);
            (error as any).info = info;
            (error as any).status = res.status;
            throw error;
          }
          const json = await res.json();
          return json.data !== undefined ? json.data : json;
        },
        revalidateOnFocus: false,
        shouldRetryOnError: false,
      }}
    >
      {children}
    </SWRConfig>
  );
}

