'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { useApp } from '@/contexts/AppContext';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  Search,
  Plus,
  Clock,
  Heart,
  SlidersHorizontal,
  X,
  Users,
} from 'lucide-react';
import { formatCookTime } from '@/lib/utils';

export default function RecipesPage() {
  const { currentGroup } = useApp();
  const [keyword, setKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'group' | 'friends'>('group');

  // カテゴリ一覧
  const { data: categories } = useSWR<any[]>(
    currentGroup ? `/api/categories?groupId=${currentGroup.id}` : '/api/categories'
  );

  // タグ一覧
  const { data: tags } = useSWR<any[]>(
    currentGroup ? `/api/tags?groupId=${currentGroup.id}` : '/api/tags'
  );

  // レシピ一覧
  const queryUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (viewMode === 'friends') {
      params.append('includeFriendShared', 'true');
    } else if (currentGroup) {
      params.append('groupId', currentGroup.id);
    }
    if (keyword.trim()) params.append('keyword', keyword.trim());
    if (selectedCategory) params.append('categoryId', selectedCategory);
    if (selectedTag) params.append('tagId', selectedTag);
    if (favoriteOnly) params.append('favoriteOnly', 'true');
    return `/api/recipes?${params.toString()}`;
  }, [currentGroup, viewMode, keyword, selectedCategory, selectedTag, favoriteOnly]);

  const { data: recipes, isLoading } = useSWR<any[]>(queryUrl);

  return (
    <div className="min-h-screen bg-[#fcfcfc]">
      <Header
        title="レシピ一覧"
        showGroupSelector={!!currentGroup}
        groupName={currentGroup?.name || 'マイキッチン'}
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

        {/* カテゴリ横スクロール */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all ${
              selectedCategory === null
                ? 'bg-primary text-white shadow-sm shadow-primary/20'
                : 'bg-white text-gray-600 border border-pink-100 hover:bg-pink-50'
            }`}
          >
            すべて
          </button>
          {categories?.map((cat) => (
            <button
              key={cat.id}
              onClick={() =>
                setSelectedCategory(selectedCategory === cat.id ? null : cat.id)
              }
              className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all ${
                selectedCategory === cat.id
                  ? 'bg-primary text-white shadow-sm shadow-primary/20'
                  : 'bg-white text-gray-600 border border-pink-100 hover:bg-pink-50'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* サブフィルタ（お気に入り、タグ） */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          <button
            onClick={() => setFavoriteOnly(!favoriteOnly)}
            className={`px-2.5 py-1 rounded-xl font-medium shrink-0 flex items-center gap-1 transition-all ${
              favoriteOnly
                ? 'bg-rose-50 text-rose-600 border border-rose-200'
                : 'bg-white text-gray-500 border border-gray-100'
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
              className={`px-2.5 py-1 rounded-xl font-medium shrink-0 transition-all ${
                selectedTag === t.id
                  ? 'bg-pink-100 text-primary border border-pink-300'
                  : 'bg-white text-gray-500 border border-gray-100'
              }`}
            >
              #{t.name}
            </button>
          ))}
        </div>

        {/* レシピ一覧 */}
        {isLoading ? (
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

      {/* フローティング作成ボタン (FAB) */}
      <Link
        href="/recipes/new"
        className="fixed right-5 bottom-20 z-40 w-14 h-14 rounded-full bg-gradient-to-tr from-primary to-pink-400 text-white flex items-center justify-center shadow-lg shadow-primary/30 transition-transform duration-200 hover:scale-105 active:scale-95"
        aria-label="レシピを作成"
      >
        <Plus className="w-7 h-7 stroke-[2.5]" />
      </Link>
    </div>
  );
}

