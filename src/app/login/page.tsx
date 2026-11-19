'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import Image from 'next/image';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const [isLoading, setIsLoading] = useState(true);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    const tryRestore = async () => {
      const storedRt = localStorage.getItem('cookle_rt');
      if (!storedRt) {
        setIsLoading(false);
        return;
      }

      setIsRestoring(true);
      try {
        const res = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: storedRt }),
        });

        if (res.ok) {
          router.replace('/home');
          return;
        } else {
          localStorage.removeItem('cookle_rt');
        }
      } catch {
        console.error('[Login] Restore request failed');
      }

      setIsRestoring(false);
      setIsLoading(false);
    };

    tryRestore();
  }, [router]);

  const handleLogin = () => {
    setIsLoading(true);
    window.location.href = '/api/auth/login';
  };

  const errorMessage =
    error === 'auth_failed'
      ? 'ログインに失敗しました。もう一度お試しください。'
      : error === 'token_exchange_failed'
      ? '認証処理に失敗しました。しばらくしてからお試しください。'
      : error === 'config_missing'
      ? '認証の設定が不完全です。管理者に問い合わせてください。'
      : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/60 to-white flex flex-col items-center justify-center p-6 text-center">
      {/* キャラクターアイコン（食べレコ同様の表示スタイル） */}
      <div className="mb-4 animate-bounce-slow">
        <Image
          src="/icon-512.png"
          alt="くっくる"
          width={140}
          height={140}
          className="drop-shadow-xl rounded-[2.8rem]"
          priority
        />
      </div>

      <h1 className="text-3xl font-extrabold text-primary mb-2 tracking-tight">
        くっくる
      </h1>
      <p className="text-sm text-gray-500 mb-8 max-w-xs leading-relaxed">
        みんなでレシピを共有して、<br />毎日の料理をもっと楽しく。
      </p>

      {errorMessage && (
        <div className="w-full max-w-xs bg-red-50 border border-red-200 rounded-2xl px-4 py-3 mb-6 text-xs text-red-600 font-medium">
          {errorMessage}
        </div>
      )}

      <div className="w-full max-w-xs space-y-3">
        <Button
          size="lg"
          className="w-full text-base py-3.5 shadow-md shadow-primary/30"
          onClick={handleLogin}
          isLoading={isLoading || isRestoring}
        >
          {isRestoring ? '自動復元中...' : 'ログイン / 新規登録'}
        </Button>
      </div>

      <p className="mt-10 text-[11px] text-gray-400">
        家族や友達とつながるレシピ共有アプリ
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-primary">読み込み中...</div>}>
      <LoginForm />
    </Suspense>
  );
}
