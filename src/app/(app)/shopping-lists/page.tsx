'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { useApp } from '@/contexts/AppContext';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/Toast';
import { ShoppingBag, Plus, Check, Trash2, CheckCircle2 } from 'lucide-react';

export default function ShoppingListsPage() {
  const { currentGroup } = useApp();
  const { success, error } = useToast();

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [unit, setUnit] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const { data: list, mutate, isLoading } = useSWR<any>(
    currentGroup ? `/api/shopping-lists?groupId=${currentGroup.id}` : null
  );

  // アイテム追加
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!list) return;
    if (!name.trim()) return;

    try {
      setIsAdding(true);
      const res = await fetch('/api/shopping-lists/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shoppingListId: list.id,
          name: name.trim(),
          amount: amount.trim() || undefined,
          unit: unit.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || '追加に失敗しました');

      setName('');
      setAmount('');
      setUnit('');
      mutate();
    } catch (err: any) {
      error(err.message);
    } finally {
      setIsAdding(false);
    }
  };

  // 購入状態トグル
  const handleTogglePurchased = async (item: any) => {
    try {
      const nextState = !item.isPurchased;
      // 楽観的UI更新
      mutate(
        {
          ...list,
          items: list.items.map((it: any) =>
            it.id === item.id ? { ...it, isPurchased: nextState } : it
          ),
        },
        false
      );

      await fetch('/api/shopping-lists/items', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: item.id,
          isPurchased: nextState,
        }),
      });

      mutate();
    } catch {
      error('更新に失敗しました');
    }
  };

  // アイテム削除
  const handleDeleteItem = async (itemId: string) => {
    try {
      await fetch(`/api/shopping-lists/items?itemId=${itemId}`, {
        method: 'DELETE',
      });
      mutate();
    } catch {
      error('削除に失敗しました');
    }
  };

  const unpurchasedItems = list?.items?.filter((it: any) => !it.isPurchased) || [];
  const purchasedItems = list?.items?.filter((it: any) => it.isPurchased) || [];

  return (
    <div className="min-h-screen bg-[#fcfcfc] pb-16">
      <Header title="買い物リスト" showGroupSelector groupName={currentGroup?.name} />

      <div className="px-4 py-4 space-y-4 max-w-xl mx-auto">
        {/* 素早い追加フォーム */}
        <Card className="p-3.5 shadow-sm">
          <form onSubmit={handleAddItem} className="space-y-2.5">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="買うものを入力 (例: 牛乳、卵)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 rounded-xl border border-pink-100 px-3 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary"
                required
              />
              <input
                type="text"
                placeholder="数 (例: 1)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-20 rounded-xl border border-pink-100 px-2 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary"
              />
              <input
                type="text"
                placeholder="単位"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-16 rounded-xl border border-pink-100 px-2 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary"
              />
            </div>
            <Button
              type="submit"
              size="sm"
              className="w-full flex items-center justify-center gap-1 shadow-sm"
              isLoading={isAdding}
            >
              <Plus className="w-4 h-4" /> リストに追加
            </Button>
          </form>
        </Card>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {/* 未購入リスト */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-gray-700 ml-1">
                買うもの ({unpurchasedItems.length}件)
              </h3>
              {unpurchasedItems.length > 0 ? (
                <div className="space-y-2">
                  {unpurchasedItems.map((item: any) => (
                    <div
                      key={item.id}
                      onClick={() => handleTogglePurchased(item)}
                      className="p-3 bg-white rounded-2xl border border-pink-100/60 shadow-sm flex items-center justify-between gap-3 cursor-pointer hover:bg-pink-50/20 transition-all active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          className="w-5 h-5 rounded-lg border-2 border-primary/50 flex items-center justify-center text-white"
                        />
                        <div>
                          <span className="text-xs font-bold text-gray-900">
                            {item.name}
                          </span>
                          {(item.amount || item.unit) && (
                            <span className="text-xs text-gray-500 ml-2 font-medium">
                              {item.amount} {item.unit}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteItem(item.id);
                        }}
                        className="p-1 text-gray-300 hover:text-red-500 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center bg-white rounded-2xl border border-pink-100/40">
                  <p className="text-xs text-gray-400">買うものはすべて揃っています✨</p>
                </div>
              )}
            </div>

            {/* 購入済みリスト */}
            {purchasedItems.length > 0 && (
              <div className="space-y-2 pt-2">
                <h3 className="text-xs font-bold text-gray-400 ml-1">
                  購入済み ({purchasedItems.length}件)
                </h3>
                <div className="space-y-1.5 opacity-60">
                  {purchasedItems.map((item: any) => (
                    <div
                      key={item.id}
                      onClick={() => handleTogglePurchased(item)}
                      className="p-2.5 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between gap-3 cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-5 h-5 rounded-lg bg-emerald-500 text-white flex items-center justify-center text-xs font-bold">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-medium text-gray-500 line-through">
                          {item.name} {item.amount} {item.unit}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteItem(item.id);
                        }}
                        className="p-1 text-gray-300 hover:text-red-500 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

