'use client';

import React, { useRef, useState, useEffect, useLayoutEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, UtensilsCrossed, Calendar, ShoppingCart, User } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/home', icon: Home, label: 'ホーム', match: (p: string) => p === '/home' || p === '/' },
  { href: '/recipes', icon: UtensilsCrossed, label: 'レシピ', match: (p: string) => p.startsWith('/recipes') },
  { href: '/meal-plans', icon: Calendar, label: '献立', match: (p: string) => p.startsWith('/meal-plans') },
  { href: '/shopping-lists', icon: ShoppingCart, label: '買い物', match: (p: string) => p.startsWith('/shopping-lists') },
  { href: '/mypage', icon: User, label: 'マイページ', match: (p: string) => p.startsWith('/mypage') || p.startsWith('/groups') || p.startsWith('/friends') },
];

export function BottomNav() {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const buttonRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [pillStyle, setPillStyle] = useState<{ left: number; width: number } | null>(null);

  const activeIndex = NAV_ITEMS.findIndex((item) => item.match(pathname));

  useEffect(() => {
    const updatePill = () => {
      if (activeIndex < 0) {
        setPillStyle(null);
        return;
      }
      const btn = buttonRefs.current[activeIndex];
      if (!btn) return;

      const btnWidth = btn.offsetWidth;
      const pillWidth = Math.round(Math.min(60, Math.max(44, btnWidth * 0.72)));
      const left = btn.offsetLeft + Math.round((btnWidth - pillWidth) / 2);

      setPillStyle({ left, width: pillWidth });
    };

    updatePill();
    window.addEventListener('resize', updatePill);
    return () => window.removeEventListener('resize', updatePill);
  }, [activeIndex]);

  // ログイン画面などではBottomNavを表示しない
  if (pathname === '/login' || pathname.startsWith('/group-setup') || pathname.startsWith('/nickname-setup')) {
    return null;
  }

  return (
    <nav
      ref={navRef}
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-pink-100/70 pb-safe transition-all shadow-[0_-4px_20px_rgba(0,0,0,0.03)]"
    >
      <div className="relative max-w-md mx-auto h-16 flex items-center justify-around px-2">
        {/* スライドアニメーションピル */}
        {pillStyle && (
          <div
            className="absolute top-2 h-10 rounded-full bg-pink-100/70 transition-all duration-300 ease-out pointer-events-none"
            style={{
              left: `${pillStyle.left}px`,
              width: `${pillStyle.width}px`,
            }}
          />
        )}

        {NAV_ITEMS.map((item, index) => {
          const isActive = activeIndex === index;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              ref={(el) => {
                buttonRefs.current[index] = el;
              }}
              className={`relative z-10 flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-transform duration-150 active:scale-95 ${
                isActive ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon
                className={`w-5 h-5 transition-transform duration-200 ${
                  isActive ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'
                }`}
              />
              <span className={`text-[10px] mt-1 tracking-tight font-medium ${isActive ? 'font-bold' : ''}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

