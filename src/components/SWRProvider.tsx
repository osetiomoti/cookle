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
        revalidateIfStale: true, // キャッシュがあれば即時表示しつつ裏で再検証（stale-while-revalidate）
        revalidateOnReconnect: false,
        dedupingInterval: 10000, // 10秒間は重複フェッチを抑止しキャッシュを即時返却
        shouldRetryOnError: false,
      }}
    >
      {children}
    </SWRConfig>
  );
}
