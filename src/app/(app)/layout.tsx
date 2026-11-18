'use client';

import React from 'react';
import { AppProvider } from '@/contexts/AppContext';
import { BottomNav } from '@/components/layout/BottomNav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <div className="min-h-screen bg-[#fcfcfc] text-gray-800 flex flex-col pb-tab-safe">
        <main className="flex-1 w-full max-w-2xl mx-auto">{children}</main>
        <BottomNav />
      </div>
    </AppProvider>
  );
}
