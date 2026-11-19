'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Users, Settings } from 'lucide-react';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  backHref?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  showGroupSelector?: boolean;
  groupName?: string;
}

export function Header({
  title = 'くっくる',
  showBack = false,
  backHref,
  onBack,
  rightAction,
  showGroupSelector = false,
  groupName,
}: HeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-pink-100/60 transition-colors">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBack ? (
            <button
              onClick={handleBack}
              aria-label="戻る"
              className="p-1.5 -ml-1 text-gray-600 hover:text-primary transition-colors rounded-full hover:bg-pink-50 active:scale-95"
            >
              <ChevronLeft className="w-6 h-6 stroke-[2.2]" />
            </button>
          ) : (
            <Link href="/home" className="flex items-center gap-2 group">
              <span className="w-8 h-8 rounded-xl overflow-hidden shadow-sm shadow-primary/20 flex-shrink-0">
                <Image
                  src="/icon-192.png"
                  alt="くっくる"
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
              </span>
              <span className="font-bold text-lg text-gray-900 tracking-tight group-hover:text-primary transition-colors">
                くっくる
              </span>
            </Link>
          )}

          {showBack && (
            <h1 className="text-base font-bold text-gray-900 truncate max-w-[200px]">
              {title}
            </h1>
          )}
        </div>

        <div className="flex items-center gap-2">
          {showGroupSelector && (
            <Link
              href="/groups"
              className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-full bg-pink-50 text-primary hover:bg-pink-100 transition-colors"
            >
              <Users className="w-3.5 h-3.5" />
              <span className="truncate max-w-[120px]">{groupName || 'グループ選択'}</span>
            </Link>
          )}

          {rightAction ? (
            rightAction
          ) : (
            <div className="flex items-center gap-1">
              <Link
                href="/mypage"
                className="p-2 text-gray-500 hover:text-primary hover:bg-pink-50 rounded-full transition-colors"
                aria-label="設定"
              >
                <Settings className="w-5 h-5 stroke-[1.8]" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

