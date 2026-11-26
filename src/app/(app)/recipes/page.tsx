'use client';

import React, { useState, useMemo, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { useApp } from '@/contexts/AppContext';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { TagSelector } from '@/components/TagSelector';
import {
  Search,
  Plus,
  Clock,
  Heart,
  X,
  Tag as TagIcon,
  RotateCw,
} from 'lucide-react';
import { formatCookTime } from '@/lib/utils';

function RecipesContent() {
  const { currentGroup } = useApp();
  const searchParams = useSearchParams();
  const initialTagId = searchParams.get('tagId');

  // フィルター状態をsessionStorageから復元、または初期値
  const [keyword, setKeyword] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem('cookle_recipes_filter');
        if (saved) return JSON.parse(saved).keyword || '';
      } catch {}
    }
    return '';
  });

  const [selectedTag, setSelectedTag] = useState<string | null>(() => {
    if (initialTagId) return initialTagId;
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem('cookle_recipes_filter');
        if (saved) return JSON.parse(saved).selectedTag ?? null;
      } catch {}
    }
    return null;
  });

  const [favoriteOnly, setFavoriteOnly] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem('cookle_recipes_filter');
        if (saved) return !!JSON.parse(saved).favoriteOnly;
      } catch {}
    }
    return false;
  });

  const [viewMode, setViewMode] = useState<'group' | 'friends'>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem('cookle_recipes_filter');
        if (saved) return JSON.parse(saved).viewMode || 'group';
      } catch {}
    }
    return 'group';
  });

  const [isTagSelectorOpen, setIsTagSelectorOpen] = useState(false);
  const scrollRestoredRef = useRef(false);

  // URLパラメータでタグが指定された場合反映
  useEffect(() => {
    if (initialTagId) {
      setSelectedTag(initialTagId);
    }
  }, [initialTagId]);

  // フィルター状態をsessionStorageに保存
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(
          'cookle_recipes_filter',
          JSON.stringify({ keyword, selectedTag, favoriteOnly, viewMode })
        );
      } catch {}
    }
  }, [keyword, selectedTag, favoriteOnly, viewMode]);

  // タグ一覧
  const { data: tags } = useSWR<any[]>(
    currentGroup ? `/api/tags?groupId=${currentGroup.id}` : '/api/tags'
  );

  // レシピ一覧クエリ
  const queryUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (viewMode === 'friends') {
      params.append('includeFriendShared', 'true');
    } else if (currentGroup) {
      params.append('groupId', currentGroup.id);
    }
    if (keyword.trim()) params.append('keyword', keyword.trim());
    if (selectedTag) params.append('tagId', selectedTag);
    if (favoriteOnly) params.append('favoriteOnly', 'true');
    return `/api/recipes?${params.toString()}`;
  }, [currentGroup, viewMode, keyword, selectedTag, favoriteOnly]);

  const { data: recipes, isLoading, mutate, isValidating } = useSWR<any[]>(queryUrl, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 60000,
  });

  // スクロール位置の復元
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!isLoading && recipes && recipes.length > 0 && !scrollRestoredRef.current) {
      scrollRestoredRef.current = true;
      const savedScroll = sessionStorage.getItem('cookle_recipes_scroll');
      if (savedScroll) {
        const top = parseInt(savedScroll, 10);
        if (!isNaN(top) && top > 0) {
          // DOM描画直後にスクロール位置を復元
          requestAnimationFrame(() => {
            window.scrollTo({ top, behavior: 'instant' });
          });
        }
      }
    }
  }, [isLoading, recipes]);

  // 詳細ページ遷移時に現在のスクロール位置を記録
  const handleRecipeClick = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('cookle_recipes_scroll', window.scrollY.toString());
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc]">
      <Header
        title="レシピ一覧"
        showGroupSelector={!!currentGroup}
        groupName={currentGroup?.name || 'マイキッチン'}
        rightAction={
          <div className="flex items-center gap-1">
            <Link
              href="/tags"
              className="p-2 text-gray-500 hover:text-primary transition-colors rounded-full hover:bg-pink-50"
              title="タグ別レシピ"
            >
              <TagIcon className="w-5 h-5 stroke-[2]" />
            </Link>
            <button
              onClick={() => mutate()}
              disabled={isValidating}
              className={`p-2 text-gray-500 hover:text-primary transition-colors rounded-full hover:bg-pink-50 ${
                isValidating ? 'animate-spin text-primary' : ''
              }`}
              title="再読み込み"
              aria-label="再読み込み"
            >
              <RotateCw className="w-4 h-4 stroke-[2.2]" />
            </button>
          </div>
        }
      />

      <div className="px-4 py-4 space-y-4">
        {/* タブ切り替え（グループまたはマイレシピ / ともだち共有） */}
        <div className="flex bg-gray-100/90 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setViewMode('group')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'group'
                ? 'bg-white text-primary shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            {currentGroup ? 'グループのレシピ' : 'マイレシピ'}
          </button>
          <button
            type="button"
            onClick={() => setViewMode('friends')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'friends'
                ? 'bg-white text-primary shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            ともだちのレシピ
          </button>
        </div>

        {/* 検索バー */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="レシピ名、材料で検索..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-white border border-pink-100/80 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 shadow-sm transition-all"
          />
          {keyword && (
            <button
              onClick={() => setKeyword('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* タグ・お気に入り横スクロールフィルター（tabereco準拠の一本化） */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs -mx-4 px-4">
          <button
            onClick={() => {
              setSelectedTag(null);
              setFavoriteOnly(false);
            }}
            className={`px-3.5 py-1.5 rounded-full font-bold shrink-0 transition-all ${
              selectedTag === null && !favoriteOnly
                ? 'bg-primary text-white shadow-sm shadow-primary/20'
                : 'bg-white text-gray-600 border border-pink-100 hover:bg-pink-50'
            }`}
          >
            すべて
          </button>

          <button
            onClick={() => setFavoriteOnly(!favoriteOnly)}
            className={`px-3 py-1.5 rounded-full font-medium shrink-0 flex items-center gap-1 transition-all ${
              favoriteOnly
                ? 'bg-rose-50 text-rose-600 border border-rose-200 font-bold shadow-2xs'
                : 'bg-white text-gray-500 border border-gray-100 hover:bg-pink-50/50'
            }`}
          >
            <Heart
              className={`w-3.5 h-3.5 ${
                favoriteOnly ? 'fill-rose-500 text-rose-500' : ''
              }`}
            />
            <span>お気に入り</span>
          </button>

          {tags?.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTag(selectedTag === t.id ? null : t.id)}
              className={`px-3 py-1.5 rounded-full font-medium shrink-0 transition-all ${
                selectedTag === t.id
                  ? 'bg-primary text-white font-bold shadow-sm shadow-primary/20'
                  : 'bg-white text-gray-600 border border-pink-100 hover:bg-pink-50'
              }`}
            >
              #{t.name}
            </button>
          ))}

          <Link
            href="/tags"
            className="px-3 py-1.5 rounded-full font-bold shrink-0 flex items-center gap-1 bg-gradient-to-r from-pink-50 to-rose-50 text-primary border border-pink-200 hover:bg-pink-100 transition-colors shadow-2xs"
          >
            <TagIcon className="w-3.5 h-3.5" />
            <span>タグ別で見る</span>
          </Link>

          <button
            type="button"
            onClick={() => setIsTagSelectorOpen(true)}
            className="px-3 py-1.5 rounded-full font-bold shrink-0 flex items-center gap-1 bg-pink-50 text-primary border border-pink-200 hover:bg-pink-100 transition-colors"
          >
            <span>タグ一覧</span>
          </button>
        </div>

        {/* レシピ一覧 */}
        {isLoading && !recipes ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="aspect-[4/3] rounded-3xl" />
            ))}
          </div>
        ) : recipes && recipes.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 pb-8">
            {recipes.map((recipe) => (
              <Link
                key={recipe.id}
                href={`/recipes/${recipe.id}`}
                onClick={handleRecipeClick}
                className="block group"
              >
                <Card hoverable className="p-0 overflow-hidden">
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
                    {recipe.isFavorite && (
                      <div className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 backdrop-blur-sm text-primary shadow-sm">
                        <Heart className="w-3.5 h-3.5 fill-primary" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h4 className="text-xs font-bold text-gray-900 line-clamp-1 mb-1">
                      {recipe.title}
                    </h4>
                    <p className="text-[10px] text-gray-400 line-clamp-1 mb-2">
                      {recipe.description || '美味しいレシピ'}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-gray-50">
                      {recipe.cookTimeMin ? (
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-3 h-3 text-gray-400" />
                          {formatCookTime(recipe.cookTimeMin)}
                        </span>
                      ) : (
                        <span>時間未定</span>
                      )}
                      <span className="text-[9px] text-gray-400">
                        {recipe.creator?.name}
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon="📖"
            title="レシピが見つかりません"
            description="条件を変えて検索するか、新しいレシピを登録してみましょう！"
            actionLabel="レシピを投稿する"
            actionHref="/recipes/new"
          />
        )}
      </div>

      {/* フローティング作成ボタン (FAB: tabereco準拠でタブバーの上に配置) */}
      <Link
        href="/recipes/new"
        className="fixed right-5 bottom-[calc(5.2rem+env(safe-area-inset-bottom))] z-40 w-14 h-14 rounded-full bg-gradient-to-tr from-primary to-pink-400 text-white flex items-center justify-center shadow-xl shadow-primary/35 transition-transform duration-200 hover:scale-105 active:scale-95"
        aria-label="レシピを作成"
      >
        <Plus className="w-7 h-7 stroke-[2.5]" />
      </Link>

      {/* タグ選択ボトムシート */}
      <TagSelector
        isOpen={isTagSelectorOpen}
        onClose={() => setIsTagSelectorOpen(false)}
        selectedTagIds={selectedTag ? [selectedTag] : []}
        onSelect={(ids) => {
          setSelectedTag(ids.length > 0 ? ids[0] : null);
        }}
      />
    </div>
  );
}

export default function RecipesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#fcfcfc] p-4 space-y-4">
          <Skeleton className="h-14 w-full rounded-2xl" />
          <Skeleton className="h-10 w-full rounded-2xl" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="aspect-[4/3] rounded-3xl" />
            ))}
          </div>
        </div>
      }
    >
      <RecipesContent />
    </Suspense>
  );
}
