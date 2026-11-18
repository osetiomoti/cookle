'use client';

import { useEffect } from 'react';

export function SessionKeepAlive() {
  useEffect(() => {
    // 1. rt_transfer cookie を確認して localStorage に移行
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };

    const rtTransfer = getCookie('rt_transfer');
    if (rtTransfer) {
      localStorage.setItem('cookle_rt', rtTransfer);
      // 即座に消費・クッキー削除
      document.cookie = 'rt_transfer=; Max-Age=0; path=/;';
    }

    // 2. 定期的にトークン更新を試みる (20分毎)
    const interval = setInterval(async () => {
      const storedRt = localStorage.getItem('cookle_rt');
      try {
        await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: storedRt ? JSON.stringify({ refresh_token: storedRt }) : undefined,
        });
      } catch (err) {
        console.error('[SessionKeepAlive] Refresh error:', err);
      }
    }, 20 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return null;
}

