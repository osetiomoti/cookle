'use client';

import React from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Clock, Heart, Trash2 } from 'lucide-react';
import { formatCookTime } from '@/lib/utils';
import { useToast } from '@/components/Toast';

export default function FavoritesPage() {
  const { success, error } = useToast();
  const { data: favorites, mutate, isLoading } = useSWR<any[]>('/api/favorites');

  const handleRemoveFavorite = async (recipeId: string) => {
    try {
      await fetch(`/api/favorites/${recipeId}`, { method: 'DELETE' });
      success('お気に入りを解除しました');
      mutate();
    } catch {
      error('解除に失敗しました');
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] pb-16">
      <Header title="お気に入りレシピ" showBack backHref="/mypage" />

      <div className="px-4 py-4 space-y-4 max-w-xl mx-auto">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="aspect-[4/3] rounded-3xl" />
            ))}
          </div>
        ) : favorites && favorites.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {favorites.map((recipe) => (
              <Card key={recipe.id} className="p-0 overflow-hidden relative group">
                <Link href={`/recipes/${recipe.id}`} className="block">
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
                    <h4 className="text-xs font-bold text-gray-900 line-clamp-1 mb-1">
                      {recipe.title}
                    </h4>
                    <div className="flex items-center justify-between text-[10px] text-gray-400">
                      {recipe.cookTimeMin ? (
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-3 h-3" />
                          {formatCookTime(recipe.cookTimeMin)}
                        </span>
                      ) : (
                        <span>時間未定</span>
                      )}
                      <span>{recipe.creator?.name}</span>
                    </div>
                  </div>
                </Link>

                <button
                  onClick={() => handleRemoveFavorite(recipe.id)}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 text-rose-500 shadow-sm hover:bg-rose-50 transition-colors"
                  aria-label="お気に入り解除"
                >
                  <Heart className="w-3.5 h-3.5 fill-rose-500" />
                </button>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon="💖"
            title="お気に入りはまだありません"
            description="気に入ったレシピのハートマークをタップして保存しましょう！"
            actionLabel="レシピを探す"
            actionHref="/recipes"
          />
        )}
      </div>
    </div>
  );
}

