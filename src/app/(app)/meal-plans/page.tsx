'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { useApp } from '@/contexts/AppContext';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/Toast';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Utensils,
  BookOpen,
} from 'lucide-react';

const MEAL_TYPES = [
  { type: 'BREAKFAST', label: '朝食', icon: '🌅' },
  { type: 'LUNCH', label: '昼食', icon: '☀️' },
  { type: 'DINNER', label: '夕食', icon: '🌙' },
  { type: 'SNACK', label: '間食・おやつ', icon: '☕' },
] as const;

export default function MealPlansPage() {
  const { currentGroup } = useApp();
  const { success, error } = useToast();

  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  // 選択中の日付（初期値は今日）
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // 献立登録モーダル
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK'>('DINNER');
  const [recipeId, setRecipeId] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 月間献立
  const { data: mealPlans, mutate } = useSWR<any[]>(
    currentGroup
      ? `/api/meal-plans?groupId=${currentGroup.id}&year=${year}&month=${month}`
      : null
  );

  // グループのレシピ一覧（モーダルでの選択用）
  const { data: recipes } = useSWR<any[]>(
    currentGroup ? `/api/recipes?groupId=${currentGroup.id}` : null
  );

  // 前月・次月
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 2, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(year, month, 1));
  };

  // カレンダーマトリックス計算
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1).getDay(); // 0: 日曜
    const totalDays = new Date(year, month, 0).getDate();

    const days: ({ day: number; dateStr: string; hasPlan: boolean } | null)[] = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let d = 1; d <= totalDays; d++) {
      const dStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const plan = mealPlans?.find((p) => p.dateString === dStr);
      const hasPlan = !!(plan && plan.items && plan.items.length > 0);
      days.push({ day: d, dateStr: dStr, hasPlan });
    }
    return days;
  }, [year, month, mealPlans]);

  // 選択中の日の献立
  const selectedPlan = mealPlans?.find((p) => p.dateString === selectedDateStr);

  // 献立追加
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentGroup) return;
    if (!recipeId && !note.trim()) {
      error('レシピを選択するか、料理名を入力してください');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/meal-plans/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: currentGroup.id,
          date: selectedDateStr,
          mealType: selectedMealType,
          recipeId: recipeId || undefined,
          note: note.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || '登録に失敗しました');

      success('献立を追加しました！');
      mutate();
      setIsModalOpen(false);
      setRecipeId('');
      setNote('');
    } catch (err: any) {
      error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 献立アイテム削除
  const handleDeleteItem = async (itemId: string) => {
    try {
      const res = await fetch(`/api/meal-plans/items?itemId=${itemId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('削除に失敗しました');
      success('献立を削除しました');
      mutate();
    } catch (err: any) {
      error(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] pb-16">
      <Header title="献立カレンダー" showGroupSelector groupName={currentGroup?.name} />

      <div className="px-4 py-4 space-y-4 max-w-xl mx-auto">
        {/* 月切り替えヘッダー */}
        <div className="flex items-center justify-between bg-white rounded-2xl p-3 border border-pink-100 shadow-sm">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-full hover:bg-pink-50 text-gray-600 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-sm font-bold text-gray-900">
            {year}年 {month}月
          </h2>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-full hover:bg-pink-50 text-gray-600 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* カレンダーグリッド */}
        <Card className="p-3">
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-gray-400 mb-2">
            <span className="text-red-400">日</span>
            <span>月</span>
            <span>火</span>
            <span>水</span>
            <span>木</span>
            <span>金</span>
            <span className="text-blue-400">土</span>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((item, idx) => {
              if (!item) {
                return <div key={`empty-${idx}`} className="h-10" />;
              }
              const isSelected = item.dateStr === selectedDateStr;
              const isToday =
                item.dateStr === new Date().toISOString().split('T')[0];

              return (
                <button
                  key={item.dateStr}
                  onClick={() => setSelectedDateStr(item.dateStr)}
                  className={`h-11 rounded-xl flex flex-col items-center justify-center relative transition-all ${
                    isSelected
                      ? 'bg-primary text-white font-bold shadow-sm shadow-primary/30'
                      : isToday
                      ? 'bg-pink-50 text-primary font-bold border border-pink-200'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <span className="text-xs">{item.day}</span>
                  {item.hasPlan && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                        isSelected ? 'bg-white' : 'bg-primary'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        {/* 選択日の献立詳細 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
              <CalendarIcon className="w-4 h-4 text-primary" />
              <span>{selectedDateStr} の献立</span>
            </h3>
            <Button
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1 shadow-sm"
            >
              <Plus className="w-4 h-4" /> 献立を追加
            </Button>
          </div>

          <div className="space-y-2.5">
            {MEAL_TYPES.map(({ type, label, icon }) => {
              const items =
                selectedPlan?.items?.filter((it: any) => it.mealType === type) || [];

              return (
                <Card key={type} className="p-3.5 space-y-2">
                  <div className="flex items-center justify-between pb-1.5 border-b border-gray-100">
                    <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                      <span>{icon}</span>
                      <span>{label}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMealType(type);
                        setIsModalOpen(true);
                      }}
                      className="text-[11px] text-primary font-semibold hover:underline flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" /> 追加
                    </button>
                  </div>

                  {items.length > 0 ? (
                    <div className="space-y-1.5">
                      {items.map((it: any) => (
                        <div
                          key={it.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-pink-50/40 border border-pink-100/50"
                        >
                          <div className="flex items-center gap-2">
                            {it.recipe?.mainImageUrl && (
                              <img
                                src={it.recipe.mainImageUrl}
                                alt={it.recipe.title}
                                className="w-8 h-8 rounded-lg object-cover"
                              />
                            )}
                            <div>
                              <span className="text-xs font-bold text-gray-800">
                                {it.recipe?.title || it.note}
                              </span>
                              {it.recipe && it.note && (
                                <p className="text-[10px] text-gray-400">
                                  メモ: {it.note}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            {it.recipe && (
                              <Link
                                href={`/recipes/${it.recipe.id}`}
                                className="p-1 text-primary hover:bg-pink-100 rounded-lg text-[10px] font-semibold"
                              >
                                レシピ
                              </Link>
                            )}
                            <button
                              onClick={() => handleDeleteItem(it.id)}
                              className="p-1 text-gray-300 hover:text-red-500 rounded-lg"
                              aria-label="削除"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-gray-400 py-1">未定</p>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* 献立追加モーダル */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="献立を追加"
      >
        <form onSubmit={handleAddItem} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 ml-1">
              食事の区分
            </label>
            <div className="grid grid-cols-2 gap-2">
              {MEAL_TYPES.map(({ type, label, icon }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedMealType(type)}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    selectedMealType === type
                      ? 'bg-pink-100 text-primary border-primary shadow-sm'
                      : 'bg-white text-gray-600 border-gray-100'
                  }`}
                >
                  <span>{icon}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 ml-1">
              登録済みレシピから選ぶ（任意）
            </label>
            <select
              value={recipeId}
              onChange={(e) => setRecipeId(e.target.value)}
              className="w-full rounded-2xl border border-pink-100 px-3.5 py-2.5 text-xs text-gray-800 bg-white focus:outline-none focus:border-primary"
            >
              <option value="">レシピを選択しない（手入力メモ）</option>
              {recipes?.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="料理名またはメモ"
            placeholder="例: 肉じゃが、味噌汁、サラダ"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          <Button
            type="submit"
            className="w-full py-3"
            size="lg"
            isLoading={isSubmitting}
          >
            献立に追加する
          </Button>
        </form>
      </Modal>
    </div>
  );
}

