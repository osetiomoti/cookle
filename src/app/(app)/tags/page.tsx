'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import useSWR from 'swr';
import { useApp } from '@/contexts/AppContext';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { TagSelector } from '@/components/TagSelector';
import {
  Tag as TagIcon,
  Search,
  Clock,
  Heart,
  ChevronRight,
  Plus,
  Sparkles,
  Utensils,
} from 'lucide-react';
import { formatCookTime, getUserDisplayName } from '@/lib/utils';

export default function TagsPage() {
  const { currentGroup } = useApp();

  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [tagSearch, setTagSearch] = useState('');
  const [isTagSelectorOpen, setIsTagSelectorOpen] = useState(false);

  // タグ一覧（レシピ数付き）
  const tagsUrl = currentGroup
    ? `/api/tags?groupId=${currentGroup.id}&includeAll=true`
    : `/api/tags?includeAll=true`;
  const { data: tags, isLoading: tagsLoading } = useSWR<any[]>(tagsUrl);

  // レシピ一覧（全体取得してクライアントでグループ化）
  const recipesUrl = currentGroup
    ? `/api/recipes?groupId=${currentGroup.id}`
    : `/api/recipes`;
  const { data: recipes, isLoading: recipesLoading } = useSWR<any[]>(recipesUrl);

  // 検索で絞り込まれたタグ
  const filteredTags = useMemo(() => {
    if (!tags) return [];
    if (!tagSearch.trim()) return tags;
    const q = tagSearch.trim().toLowerCase();
    return tags.filter((t) => t.name.toLowerCase().includes(q));
  }, [tags, tagSearch]);

  // タグごとのレシピマップ（レシピのあるタグのみ優先表示）
  const recipesByTag = useMemo(() => {
    if (!recipes || !tags) return new Map<string, any[]>();
    const map = new Map<string, any[]>();

    tags.forEach((t) => {
      map.set(t.id, []);
    });

    recipes.forEach((r) => {
      if (r.tags && Array.isArray(r.tags)) {
        r.tags.forEach((t: any) => {
          const list = map.get(t.id);
          if (list) {
            list.push(r);
          } else {
            map.set(t.id, [r]);
          }
        });
      }
    });

    return map;
  }, [recipes, tags]);

  // 選択中タグのレシピ
  const currentTagRecipes = useMemo(() => {
    if (!selectedTagId || !recipes) return [];
    return recipes.filter(
      (r) => r.tags && r.tags.some((t: any) => t.id === selectedTagId)
    );
  }, [selectedTagId, recipes]);

  const selectedTagObj = tags?.find((t) => t.id === selectedTagId);

  // 投稿詳細遷移時にスクロール位置を保存
  const handleRecipeClick = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('cookle_recipes_scroll', window.scrollY.toString());
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] pb-28">
      <Header
        title="タグ別レシピ"
        showBack
        backHref="/recipes"
        rightAction={
          <button
            onClick={() => setIsTagSelectorOpen(true)}
            className="p-2 text-primary hover:bg-pink-50 rounded-full transition-colors"
            title="タグ一覧"
          >
            <TagIcon className="w-5 h-5 stroke-[2.2]" />
          </button>
        }
      />

      <div className="px-4 py-4 space-y-5 max-w-2xl mx-auto">
        {/* 検索バー */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="タグ名で絞り込み (例: 時短、お弁当)..."
            value={tagSearch}
            onChange={(e) => setTagSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-pink-100 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary shadow-2xs"
          />
        </div>

        {/* タグピルリスト（横スクロール） */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs -mx-4 px-4">
          <button
            onClick={() => setSelectedTagId(null)}
            className={`px-3.5 py-1.5 rounded-full font-bold shrink-0 transition-all ${
              selectedTagId === null
                ? 'bg-primary text-white shadow-sm shadow-primary/25'
                : 'bg-white text-gray-600 border border-pink-100 hover:bg-pink-50'
            }`}
          >
            すべて
          </button>

          {filteredTags.map((t) => {
            const count = (recipesByTag.get(t.id) || []).length;
            const isSelected = selectedTagId === t.id;

            return (
              <button
                key={t.id}
                onClick={() => setSelectedTagId(isSelected ? null : t.id)}
                className={`px-3 py-1.5 rounded-full shrink-0 transition-all flex items-center gap-1 ${
                  isSelected
                    ? 'bg-primary text-white font-bold shadow-sm shadow-primary/25'
                    : 'bg-white text-gray-700 border border-pink-100/80 hover:bg-pink-50/60'
                }`}
              >
                <span>#{t.name}</span>
                {count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-pink-100 text-primary'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 状態1: 個別タグが選択されている場合 (グリッド表示) */}
        {selectedTagId ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-gray-100">
              <div className="flex items-center gap-1.5">
                <span className="text-xl">🏷️</span>
                <h3 className="text-sm font-extrabold text-gray-900">
                  #{selectedTagObj?.name} のレシピ
                </h3>
                <span className="text-xs text-primary font-bold bg-pink-100 px-2 py-0.5 rounded-full">
                  {currentTagRecipes.length}件
                </span>
              </div>
              <button
                onClick={() => setSelectedTagId(null)}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                すべて表示に戻る
              </button>
            </div>

            {recipesLoading ? (
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="aspect-[4/3] rounded-3xl" />
                ))}
              </div>
            ) : currentTagRecipes.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {currentTagRecipes.map((recipe) => (
                  <Link
                    key={recipe.id}
                    href={`/recipes/${recipe.id}`}
                    onClick={handleRecipeClick}
                    className="block group"
                  >
                    <Card hoverable className="p-0 overflow-hidden border-pink-100/70">
                      <div className="aspect-[4/3] bg-pink-50 relative overflow-hidden">
                        {recipe.mainImageUrl ? (
                          <Image
                            src={recipe.mainImageUrl}
                            alt={recipe.title}
                            fill
                            sizes="(max-width: 640px) 50vw, 250px"
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-3xl">
                            🍽️
                          </div>
                        )}
                        {recipe.isFavorite && (
                          <div className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 text-primary shadow-2xs">
                            <Heart className="w-3.5 h-3.5 fill-primary" />
                          </div>
                        )}
                      </div>
                      <div className="p-2.5 space-y-1">
                        <h4 className="text-xs font-bold text-gray-900 truncate">
                          {recipe.title}
                        </h4>
                        <div className="flex items-center justify-between text-[10px] text-gray-400">
                          {recipe.cookTimeMin && (
                            <span className="flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5 text-gray-400" />
                              {formatCookTime(recipe.cookTimeMin)}
                            </span>
                          )}
                          <span className="text-[9px] text-gray-400">
                            {getUserDisplayName(recipe.creator)}
                          </span>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-200 p-6 space-y-2">
                <div className="text-3xl">🍳</div>
                <h4 className="text-xs font-bold text-gray-700">
                  「#{selectedTagObj?.name}」のレシピはまだありません
                </h4>
                <p className="text-[11px] text-gray-400">
                  新しいレシピを投稿してこのタグをつけてみましょう！
                </p>
                <Link href="/recipes/new" className="inline-block pt-1">
                  <button className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-sm">
                    このタグでレシピを投稿
                  </button>
                </Link>
              </div>
            )}
          </div>
        ) : (
          /* 状態2: 「すべて」の場合 (タグ別のカルーセルセクション一覧) */
          <div className="space-y-6">
            {recipesLoading || tagsLoading ? (
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-6 w-32 rounded-lg" />
                    <div className="flex gap-3 overflow-hidden">
                      <Skeleton className="w-40 h-28 rounded-2xl shrink-0" />
                      <Skeleton className="w-40 h-28 rounded-2xl shrink-0" />
                      <Skeleton className="w-40 h-28 rounded-2xl shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {/* レシピがあるタグを優先的にセクション表示 */}
                {filteredTags
                  .filter((t) => (recipesByTag.get(t.id) || []).length > 0)
                  .map((t) => {
                    const tagRecipes = recipesByTag.get(t.id) || [];

                    return (
                      <div key={t.id} className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => setSelectedTagId(t.id)}
                            className="flex items-center gap-1.5 group text-left"
                          >
                            <span className="text-base font-extrabold text-gray-900 group-hover:text-primary transition-colors">
                              #{t.name}
                            </span>
                            <span className="text-[11px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                              {tagRecipes.length}品
                            </span>
                          </button>

                          <button
                            onClick={() => setSelectedTagId(t.id)}
                            className="text-xs text-primary font-semibold flex items-center hover:underline"
                          >
                            <span>すべて見る</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* 横スクロールカルーセル */}
                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4">
                          {tagRecipes.map((recipe) => (
                            <Link
                              key={recipe.id}
                              href={`/recipes/${recipe.id}`}
                              onClick={handleRecipeClick}
                              className="w-40 shrink-0 block group"
                            >
                              <Card
                                hoverable
                                className="p-0 overflow-hidden border-pink-100/70"
                              >
                                <div className="aspect-[4/3] bg-pink-50 relative overflow-hidden">
                                  {recipe.mainImageUrl ? (
                                    <Image
                                      src={recipe.mainImageUrl}
                                      alt={recipe.title}
                                      fill
                                      sizes="160px"
                                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-2xl">
                                      🍽️
                                    </div>
                                  )}
                                  {recipe.isFavorite && (
                                    <div className="absolute top-1.5 right-1.5 p-1 rounded-full bg-white/90 text-primary shadow-2xs">
                                      <Heart className="w-3 h-3 fill-primary" />
                                    </div>
                                  )}
                                </div>
                                <div className="p-2 space-y-0.5">
                                  <h4 className="text-xs font-bold text-gray-900 truncate">
                                    {recipe.title}
                                  </h4>
                                  <div className="flex items-center justify-between text-[9px] text-gray-400">
                                    {recipe.cookTimeMin && (
                                      <span>{formatCookTime(recipe.cookTimeMin)}</span>
                                    )}
                                    <span>{getUserDisplayName(recipe.creator)}</span>
                                  </div>
                                </div>
                              </Card>
                            </Link>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                {/* まだレシピが1つも登録されていない場合の案内 */}
                {(!recipes || recipes.length === 0) && (
                  <EmptyState
                    icon="🏷️"
                    title="まだレシピがありません"
                    description="新しいレシピを投稿してタグをつけてみましょう！"
                    actionLabel="レシピを投稿する"
                    actionHref="/recipes/new"
                  />
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* フローティング投稿ボタン */}
      <Link
        href="/recipes/new"
        className="fixed right-5 bottom-[calc(5.2rem+env(safe-area-inset-bottom))] z-40 w-14 h-14 rounded-full bg-gradient-to-tr from-primary to-pink-400 text-white flex items-center justify-center shadow-xl shadow-primary/35 transition-transform duration-200 hover:scale-105 active:scale-95"
        aria-label="レシピを作成"
      >
        <Plus className="w-7 h-7 stroke-[2.5]" />
      </Link>

      {/* タグボトムシート */}
      <TagSelector
        isOpen={isTagSelectorOpen}
        onClose={() => setIsTagSelectorOpen(false)}
        selectedTagIds={selectedTagId ? [selectedTagId] : []}
        onSelect={(ids) => {
          setSelectedTagId(ids.length > 0 ? ids[0] : null);
        }}
      />
    </div>
  );
}

