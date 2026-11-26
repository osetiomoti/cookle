'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import Image from 'next/image';
import { Utensils, Calendar, ShoppingCart, Sparkles, Clock, Users, ArrowRight } from 'lucide-react';

const SAMPLE_PREVIEWS = [
  {
    title: 'ふんわり卵のとろとろオムライス',
    emoji: '🍳',
    tag: '時短',
    time: 15,
    servings: 2,
    desc: '基本のチキンライスに半熟たまごをのせる絶品オムライス。',
    ingredients: ['卵 4個', 'ごはん 300g', '鶏もも肉 100g', 'ケチャップ'],
  },
  {
    title: '豚バラとキャベツのうま塩炒め',
    emoji: '🥓',
    tag: '節約',
    time: 10,
    servings: 2,
    desc: 'ごま油とにんにくの香りが食欲をそそる！10分スピードおかず。',
    ingredients: ['豚バラ肉 200g', 'キャベツ 1/4個', 'ごま油 大さじ1'],
  },
  {
    title: 'ほっこり定番肉じゃが',
    emoji: '🍲',
    tag: '定番',
    time: 25,
    servings: 3,
    desc: '甘辛だれがホクホクじゃがいもにじゅわっと染み込む家庭の味。',
    ingredients: ['牛肉 180g', 'じゃがいも 3個', '玉ねぎ 1個', '醤油・みりん'],
  },
];

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
    <div className="min-h-screen bg-gradient-to-b from-pink-50/70 via-white to-pink-50/30 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-md space-y-8">
        {/* ヒーローセクション */}
        <div className="text-center pt-4">
          <div className="inline-block mb-3 animate-bounce-slow">
            <Image
              src="/icon-512.png"
              alt="くっくる"
              width={110}
              height={110}
              className="drop-shadow-xl rounded-[2.2rem] mx-auto"
              priority
            />
          </div>

          <h1 className="text-3xl font-extrabold text-primary mb-1 tracking-tight">
            くっくる
          </h1>
          <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
            レシピ共有・献立作成・買い物リストがひとつに。<br />毎日の料理をもっと楽しく、もっとスムーズに。
          </p>

          {errorMessage && (
            <div className="w-full bg-red-50 border border-red-200 rounded-2xl px-4 py-2.5 my-4 text-xs text-red-600 font-medium">
              {errorMessage}
            </div>
          )}

          <div className="mt-5 max-w-xs mx-auto">
            <Button
              size="lg"
              className="w-full text-sm font-bold py-3.5 shadow-md shadow-primary/25"
              onClick={handleLogin}
              isLoading={isLoading || isRestoring}
            >
              {isRestoring ? '自動復元中...' : 'ログイン / 新規登録'}
            </Button>
          </div>
        </div>

        {/* アプリでできること 3つのポイント */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 px-1">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider">
              くっくるでできること
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            <Card className="p-3.5 border-pink-100/80 bg-white/90 flex items-start gap-3 shadow-2xs">
              <div className="w-9 h-9 rounded-2xl bg-pink-100/70 flex items-center justify-center text-primary shrink-0">
                <Utensils className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-xs font-bold text-gray-900">
                  ① レシピを楽しく共有・記録
                </h3>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  材料や手順をすっきり管理。家族や友達とリアルタイムでシェアできます。
                </p>
              </div>
            </Card>

            <Card className="p-3.5 border-pink-100/80 bg-white/90 flex items-start gap-3 shadow-2xs">
              <div className="w-9 h-9 rounded-2xl bg-orange-100/70 flex items-center justify-center text-orange-500 shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-xs font-bold text-gray-900">
                  ② 献立カレンダーで迷わない
                </h3>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  今日・今週のごはんを一覧化。「今日何作ろう？」の悩みをすっきり解消。
                </p>
              </div>
            </Card>

            <Card className="p-3.5 border-pink-100/80 bg-white/90 flex items-start gap-3 shadow-2xs">
              <div className="w-9 h-9 rounded-2xl bg-rose-100/70 flex items-center justify-center text-rose-500 shrink-0">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-xs font-bold text-gray-900">
                  ③ 人数に合わせて買い物リスト自動連携
                </h3>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  作りたい人数を選ぶだけで材料を自動計算し、ワンタップで買い物リストへ追加！
                </p>
              </div>
            </Card>
          </div>
        </div>

        {/* サンプルレシピプレビューカード */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">🍳</span>
              <h2 className="text-xs font-extrabold text-gray-800">
                こんなレシピが作れます
              </h2>
            </div>
            <span className="text-[10px] text-primary font-bold bg-pink-100 px-2 py-0.5 rounded-full">
              すぐ使えるサンプル付き
            </span>
          </div>

          <div className="space-y-2.5">
            {SAMPLE_PREVIEWS.map((recipe, idx) => (
              <Card
                key={idx}
                className="p-3 border-pink-100/70 bg-white hover:border-primary/40 transition-all cursor-pointer shadow-2xs"
                onClick={handleLogin}
              >
                <div className="flex gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-50 to-orange-50 flex items-center justify-center text-3xl shrink-0 border border-pink-100/60">
                    {recipe.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[10px] font-bold text-primary bg-pink-50 px-1.5 py-0.2 rounded">
                        #{recipe.tag}
                      </span>
                      <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" /> {recipe.time}分
                      </span>
                      <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                        <Users className="w-2.5 h-2.5" /> {recipe.servings}人分
                      </span>
                    </div>
                    <h3 className="text-xs font-bold text-gray-900 truncate">
                      {recipe.title}
                    </h3>
                    <p className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">
                      {recipe.ingredients.join(' ・ ')}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* 下部CTA */}
        <div className="pt-2 pb-6 text-center space-y-3">
          <Button
            size="lg"
            className="w-full max-w-xs mx-auto text-sm font-bold py-3.5 shadow-md shadow-primary/25 flex items-center justify-center gap-1.5"
            onClick={handleLogin}
            isLoading={isLoading || isRestoring}
          >
            <span>無料でくっくるをはじめる</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
          <p className="text-[10px] text-gray-400">
            家族や友達とつながるレシピ共有アプリ
          </p>
        </div>
      </div>
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
