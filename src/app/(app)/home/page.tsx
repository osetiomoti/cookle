'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useApp } from '@/contexts/AppContext';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import useSWR from 'swr';
import {
  UtensilsCrossed,
  Calendar,
  ShoppingCart,
  Camera,
  Plus,
  ChevronRight,
  Clock,
  Heart,
  Tag as TagIcon,
  ChefHat,
  MessageSquareHeart,
  Check,
} from 'lucide-react';
import { formatCookTime } from '@/lib/utils';

export default function HomePage() {
  const { user, groups, currentGroup, isLoading } = useApp();

  // 今日の献立
  const todayStr = new Date().toISOString().split('T')[0];
  const mealPlansUrl = currentGroup
    ? `/api/meal-plans?groupId=${currentGroup.id}`
    : `/api/meal-plans`;
  const { data: mealPlans } = useSWR<any[]>(mealPlansUrl);
  const todayPlan = mealPlans?.find((p) => p.dateString === todayStr);

  // レシピ一覧（上位4件）
  const recipesUrl = currentGroup
    ? `/api/recipes?groupId=${currentGroup.id}`
    : `/api/recipes`;
  const { data: recipes } = useSWR<any[]>(recipesUrl);

  // 料理記録一覧（上位3件）
  const recordsUrl = currentGroup
    ? `/api/cooking-records?groupId=${currentGroup.id}`
    : `/api/cooking-records`;
  const { data: records } = useSWR<any[]>(recordsUrl);

  // 作ってほしいリクエスト（未完了の募集中一覧）
  const requestsUrl = currentGroup
    ? `/api/recipe-requests?groupId=${currentGroup.id}&status=OPEN`
    : `/api/recipe-requests?status=OPEN`;
  const { data: openRequests, mutate: mutateRequests } = useSWR<any[]>(requestsUrl);

  // 買い物リスト未完了件数
  const shoppingUrl = currentGroup
    ? `/api/shopping-lists?groupId=${currentGroup.id}`
    : `/api/shopping-lists`;
  const { data: shoppingList } = useSWR<any>(shoppingUrl);
  const unpurchasedCount =
    shoppingList?.items?.filter((item: any) => !item.isPurchased)?.length || 0;

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  const currentTitle = currentGroup ? currentGroup.name : 'マイキッチン';

  return (
    <div className="min-h-screen bg-[#fcfcfc] pb-24">
      <Header
        showGroupSelector={groups.length > 0}
        groupName={currentGroup?.name || 'グループ未参加'}
      />

      <div className="px-4 py-4 space-y-5 max-w-xl mx-auto">
        {/* ウェルカムバナー */}
        <div className="bg-gradient-to-r from-pink-500 via-primary to-rose-400 rounded-3xl p-5 text-white shadow-primary relative overflow-hidden">
          <div className="relative z-10">
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 text-[11px] font-semibold backdrop-blur-sm mb-1.5">
              {currentTitle}
            </span>
            <h2 className="text-xl font-bold tracking-tight mb-1">
              こんにちは、{user?.name || 'ゲスト'}さん！
            </h2>
            <p className="text-xs text-white/90 leading-relaxed">
              今日のごはんは何にしますか？<br />
              美味しい料理やレシピを記録・共有しましょう🍳
            </p>
          </div>
          <div className="absolute -right-2 -bottom-4 opacity-25 select-none">
            <Image
              src="/icon-192.png"
              alt=""
              width={80}
              height={80}
              className="rounded-2xl"
              aria-hidden
            />
          </div>
        </div>

        {/* グループ未参加時の案内カード */}
        {groups.length === 0 && (
          <Card className="p-4 bg-gradient-to-r from-pink-50/70 to-white border-pink-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-pink-100 flex items-center justify-center text-primary text-xl font-bold">
                👥
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900">
                  家族や友達と共有しませんか？
                </h4>
                <p className="text-[11px] text-gray-500">
                  グループを作ると献立や買い物をリアルタイム共有できます。
                </p>
              </div>
            </div>
            <Link href="/group-setup" className="shrink-0">
              <Button size="sm" variant="secondary" className="text-xs py-1.5 px-3">
                作成・参加
              </Button>
            </Link>
          </Card>
        )}

        {/* クイックアクション（6分割グリッド） */}
        <div className="grid grid-cols-3 gap-2">
          {/* レシピ投稿 */}
          <Link href="/recipes/new" className="block">
            <Card hoverable className="p-2.5 text-center flex flex-col items-center justify-center gap-1 bg-gradient-to-b from-white to-pink-50/50">
              <div className="w-9 h-9 rounded-2xl bg-pink-100/80 flex items-center justify-center text-primary shadow-2xs">
                <Plus className="w-4 h-4 stroke-[2.8]" />
              </div>
              <span className="text-[11px] font-bold text-gray-800">レシピ投稿</span>
            </Card>
          </Link>

          {/* 作って！リクエスト */}
          <Link href="/recipe-requests" className="block">
            <Card hoverable className="p-2.5 text-center flex flex-col items-center justify-center gap-1 bg-gradient-to-b from-white to-pink-50/50 relative">
              <div className="w-9 h-9 rounded-2xl bg-rose-100/80 flex items-center justify-center text-rose-500 shadow-2xs">
                <ChefHat className="w-4 h-4 stroke-[2.3]" />
              </div>
              <span className="text-[11px] font-bold text-gray-800">リクエスト</span>
              {openRequests && openRequests.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                  {openRequests.length}
                </span>
              )}
            </Card>
          </Link>

          {/* タグ別レシピ */}
          <Link href="/tags" className="block">
            <Card hoverable className="p-2.5 text-center flex flex-col items-center justify-center gap-1 bg-gradient-to-b from-white to-pink-50/50">
              <div className="w-9 h-9 rounded-2xl bg-amber-100/80 flex items-center justify-center text-amber-600 shadow-2xs">
                <TagIcon className="w-4 h-4 stroke-[2.3]" />
              </div>
              <span className="text-[11px] font-bold text-gray-800">タグ別</span>
            </Card>
          </Link>

          {/* 料理記録 */}
          <Link href="/cooking-records" className="block">
            <Card hoverable className="p-2.5 text-center flex flex-col items-center justify-center gap-1 bg-gradient-to-b from-white to-pink-50/50">
              <div className="w-9 h-9 rounded-2xl bg-purple-100/80 flex items-center justify-center text-purple-600 shadow-2xs">
                <Camera className="w-4 h-4 stroke-[2.2]" />
              </div>
              <span className="text-[11px] font-bold text-gray-800">料理記録</span>
            </Card>
          </Link>

          {/* 献立カレンダー */}
          <Link href="/meal-plans" className="block">
            <Card hoverable className="p-2.5 text-center flex flex-col items-center justify-center gap-1 bg-gradient-to-b from-white to-pink-50/50">
              <div className="w-9 h-9 rounded-2xl bg-emerald-100/80 flex items-center justify-center text-emerald-600 shadow-2xs">
                <Calendar className="w-4 h-4 stroke-[2.2]" />
              </div>
              <span className="text-[11px] font-bold text-gray-800">献立表</span>
            </Card>
          </Link>

          {/* 買い物リスト */}
          <Link href="/shopping-lists" className="block">
            <Card hoverable className="p-2.5 text-center flex flex-col items-center justify-center gap-1 bg-gradient-to-b from-white to-pink-50/50 relative">
              <div className="w-9 h-9 rounded-2xl bg-blue-100/80 flex items-center justify-center text-blue-600 shadow-2xs">
                <ShoppingCart className="w-4 h-4 stroke-[2.2]" />
              </div>
              <span className="text-[11px] font-bold text-gray-800">買い物</span>
              {unpurchasedCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center">
                  {unpurchasedCount}
                </span>
              )}
            </Card>
          </Link>
        </div>

        {/* 作ってほしいリクエスト（注目セクション） */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
              <ChefHat className="w-4 h-4 text-primary" />
              <span>作ってほしい！リクエスト</span>
              {openRequests && openRequests.length > 0 && (
                <span className="text-[10px] font-bold bg-pink-100 text-primary px-2 py-0.5 rounded-full">
                  {openRequests.length}件
                </span>
              )}
            </h3>
            <Link
              href="/recipe-requests"
              className="text-xs text-primary font-semibold flex items-center hover:underline"
            >
              すべて見る <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {openRequests && openRequests.length > 0 ? (
            <div className="space-y-2.5">
              {openRequests.slice(0, 2).map((req) => (
                <Card
                  key={req.id}
                  className="p-3.5 border-pink-100/80 bg-white shadow-2xs space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-pink-100 overflow-hidden flex items-center justify-center text-xs">
                        {req.requester.avatarUrl ? (
                          <img
                            src={req.requester.avatarUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          '👤'
                        )}
                      </div>
                      <span className="text-xs font-bold text-gray-800">
                        {req.requester.name} からのお願い
                      </span>
                    </div>

                    <span className="px-2 py-0.5 rounded-full bg-pink-50 text-primary text-[10px] font-bold border border-pink-200">
                      💌 募集中
                    </span>
                  </div>

                  <div className="pl-1">
                    <h4 className="text-sm font-extrabold text-gray-900 flex items-center gap-1.5">
                      <span>🍳</span>
                      <span>{req.customTitle}</span>
                    </h4>
                    {req.note && (
                      <p className="text-[11px] text-gray-500 mt-1 pl-6">
                        💭 {req.note}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-gray-50 text-[11px]">
                    <span className="text-gray-400 text-[10px]">
                      {new Date(req.createdAt).toLocaleDateString('ja-JP')}
                    </span>
                    <Link
                      href="/recipe-requests"
                      className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      <span>リクエストを見る</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-4 bg-gradient-to-r from-pink-50/40 to-white border-pink-100 flex items-center justify-between">
              <div className="text-xs">
                <p className="font-bold text-gray-700">募集中のお願いはありません</p>
                <p className="text-[11px] text-gray-400">
                  食べたい料理をリクエストしてみましょう！
                </p>
              </div>
              <Link href="/recipe-requests">
                <Button size="sm" variant="secondary" className="text-xs py-1.5 px-3">
                  + お願いする
                </Button>
              </Link>
            </Card>
          )}
        </div>

        {/* 今日の献立 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-primary" />
              <span>今日のごはん</span>
            </h3>
            <Link
              href="/meal-plans"
              className="text-xs text-primary font-semibold flex items-center hover:underline"
            >
              献立表を見る <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <Card className="p-4 bg-white border-pink-100">
            {todayPlan && todayPlan.items && todayPlan.items.length > 0 ? (
              <div className="space-y-2.5">
                {todayPlan.items.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-pink-50/40 border border-pink-100/40"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-primary border border-pink-200">
                        {item.mealType === 'BREAKFAST'
                          ? '朝'
                          : item.mealType === 'LUNCH'
                          ? '昼'
                          : item.mealType === 'DINNER'
                          ? '夜'
                          : '間食'}
                      </span>
                      <span className="text-xs font-semibold text-gray-800">
                        {item.recipe?.title || item.note || '未設定'}
                      </span>
                    </div>
                    {item.recipe && (
                      <Link
                        href={`/recipes/${item.recipe.id}`}
                        className="text-[11px] text-primary hover:underline"
                      >
                        レシピを見る
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-xs text-gray-400 mb-2">
                  今日の献立はまだ決まっていません
                </p>
                <Link href="/meal-plans">
                  <Button size="sm" variant="secondary">
                    献立を決める
                  </Button>
                </Link>
              </div>
            )}
          </Card>
        </div>

        {/* 最近のレシピ */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
              <UtensilsCrossed className="w-4 h-4 text-primary" />
              <span>{currentGroup ? `${currentGroup.name}のレシピ` : 'レシピ'}</span>
            </h3>
            <Link
              href="/recipes"
              className="text-xs text-primary font-semibold flex items-center hover:underline"
            >
              すべて見る <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recipes && recipes.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {recipes.slice(0, 4).map((recipe) => (
                <Link
                  key={recipe.id}
                  href={`/recipes/${recipe.id}`}
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      sessionStorage.setItem(
                        'cookle_recipes_scroll',
                        window.scrollY.toString()
                      );
                    }
                  }}
                  className="block group"
                >
                  <Card hoverable className="p-0 overflow-hidden border-pink-100/70">
                    <div className="aspect-[4/3] bg-pink-50 relative overflow-hidden">
                      {recipe.mainImageUrl ? (
                        <img
                          src={recipe.mainImageUrl}
                          alt={recipe.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl">
                          🍽️
                        </div>
                      )}
                      {recipe.category && (
                        <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/90 text-primary backdrop-blur-sm shadow-sm">
                          {recipe.category.name}
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <h4 className="text-xs font-bold text-gray-800 line-clamp-1 mb-1">
                        {recipe.title}
                      </h4>
                      <div className="flex items-center justify-between text-[10px] text-gray-400">
                        {recipe.cookTimeMin ? (
                          <span className="flex items-center gap-0.5">
                            <Clock className="w-3 h-3" />
                            {formatCookTime(recipe.cookTimeMin)}
                          </span>
                        ) : (
                          <span>調理時間未定</span>
                        )}
                        <span className="flex items-center gap-0.5 text-primary">
                          <Heart className="w-3 h-3 fill-primary" />
                          {recipe._count?.favorites || 0}
                        </span>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="p-6 text-center">
              <p className="text-xs text-gray-400 mb-3">
                まだレシピが投稿されていません
              </p>
              <Link href="/recipes/new">
                <Button size="sm">最初のレシピを投稿</Button>
              </Link>
            </Card>
          )}
        </div>

        {/* 最近の料理記録 */}
        {records && records.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-rose-500" />
                <span>最近の料理記録</span>
              </h3>
              <Link
                href="/cooking-records"
                className="text-xs text-primary font-semibold flex items-center hover:underline"
              >
                すべて見る <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-2">
              {records.slice(0, 3).map((record) => (
                <Card key={record.id} className="p-3 flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-pink-50 overflow-hidden shrink-0 border border-pink-100/50">
                    {record.photos && record.photos[0]?.imageUrl ? (
                      <img
                        src={record.photos[0].imageUrl}
                        alt={record.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl">
                        🍳
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-gray-800 truncate">
                      {record.title}
                    </h4>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {new Date(record.cookedAt).toLocaleDateString('ja-JP')} ・ 作った人: {record.user?.name}
                    </p>
                    {record.memo && (
                      <p className="text-[11px] text-gray-600 truncate mt-1">
                        {record.memo}
                      </p>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* フローティング作成ボタン（ホーム画面の投稿ボタン） */}
      <Link
        href="/recipes/new"
        className="fixed right-5 bottom-[calc(5.2rem+env(safe-area-inset-bottom))] z-40 w-14 h-14 rounded-full bg-gradient-to-tr from-primary to-pink-400 text-white flex items-center justify-center shadow-xl shadow-primary/35 transition-transform duration-200 hover:scale-105 active:scale-95"
        aria-label="レシピを作成"
      >
        <Plus className="w-7 h-7 stroke-[2.5]" />
      </Link>
    </div>
  );
}
