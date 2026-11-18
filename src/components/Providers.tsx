'use client';

import React from 'react';
import { SWRProvider } from './SWRProvider';
import { ToastProvider } from './Toast';
import { SessionKeepAlive } from './SessionKeepAlive';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SWRProvider>
      <ToastProvider>
        <SessionKeepAlive />
        {children}
      </ToastProvider>
    </SWRProvider>
  );
}

