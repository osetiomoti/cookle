'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { useToast } from '@/components/Toast';
import {
  Clock,
  Users,
  Heart,
  Share2,
  Edit,
  Trash2,
  CheckCircle2,
  Camera,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { formatCookTime } from '@/lib/utils';

export default function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { success, error } = useToast();

  const { data: recipe, mutate, isLoading } = useSWR<any>(`/api/recipes/${id}`);

  // 人数倍率計算用
  const [currentServings, setCurrentServings] = useState<number | null>(null);

  // 手順チェック状態
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // 料理記録作成モーダル
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [recordTitle, setRecordTitle] = useState('');
  const [recordMemo, setRecordMemo] = useState('');
  const [recordPhotoKey, setRecordPhotoKey] = useState<string | null>(null);
  const [recordDate, setRecordDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [isSubmittingRecord, setIsSubmittingRecord] = useState(false);

  // お気に入りトグル
  const handleToggleFavorite = async () => {
    if (!recipe) return;
    try {
      if (recipe.isFavorite) {
        await fetch(`/api/favorites/${id}`, { method: 'DELETE' });
        mutate({ ...recipe, isFavorite: false }, false);
        success('お気に入りを解除しました');
      } else {
        await fetch(`/api/favorites/${id}`, { method: 'POST' });
        mutate({ ...recipe, isFavorite: true }, false);
        success('お気に入りに追加しました！');
      }
    } catch {
      error('お気に入り処理に失敗しました');
    }
  };

  // 削除処理
  const handleDelete = async () => {
    if (!confirm('このレシピを削除してもよろしいですか？')) return;
    try {
      const res = await fetch(`/api/recipes/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('削除に失敗しました');
      success('レシピを削除しました');
      router.push('/recipes');
    } catch (err: any) {
      error(err.message);
    }
  };

  // 手順完了トグル
  const toggleStep = (stepNumber: number) => {
    setCompletedSteps((prev) =>
      prev.includes(stepNumber)
        ? prev.filter((s) => s !== stepNumber)
        : [...prev, stepNumber]
    );
  };

  // 料理記録作成
  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipe) return;

    try {
      setIsSubmittingRecord(true);
      const res = await fetch('/api/cooking-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: recipe.groupId,
          recipeId: recipe.id,
          title: recordTitle || `${recipe.title}を作りました！`,
          cookedAt: recordDate,
          memo: recordMemo || undefined,
          photoKeys: recordPhotoKey ? [recordPhotoKey] : [],
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || '記録に失敗しました');

      success('料理記録を作成しました！');
      setIsRecordModalOpen(false);
      setRecordMemo('');
      setRecordPhotoKey(null);
    } catch (err: any) {
      error(err.message);
    } finally {
      setIsSubmittingRecord(false);
    }
  };

  if (isLoading || !recipe) {
    return (
      <div className="min-h-screen bg-[#fcfcfc]">
        <Header title="読み込み中..." showBack backHref="/recipes" />
        <div className="p-4 space-y-4">
          <Skeleton className="aspect-video w-full rounded-3xl" />
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  const baseServings = recipe.servings || 2;
  const activeServings = currentServings ?? baseServings;
  const servingRatio = activeServings / baseServings;

  return (
    <div className="min-h-screen bg-[#fcfcfc] pb-16">
      <Header
        title={recipe.title}
        showBack
        backHref="/recipes"
        rightAction={
          <div className="flex items-center gap-1">
            <button
              onClick={handleToggleFavorite}
              className="p-2 text-primary hover:bg-pink-50 rounded-full transition-colors active:scale-95"
              aria-label="お気に入り"
            >
              <Heart
                className={`w-6 h-6 ${
                  recipe.isFavorite ? 'fill-primary text-primary' : 'text-gray-400'
                }`}
              />
            </button>
            {recipe.isOwner && (
              <button
                onClick={handleDelete}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                aria-label="削除"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        }
      />

      <div className="px-4 py-4 space-y-5 max-w-xl mx-auto">
        {/* メイン写真 */}
        <div className="aspect-video w-full rounded-3xl bg-pink-50 overflow-hidden relative shadow-sm border border-pink-100">
          {recipe.mainImageUrl ? (
            <img
              src={recipe.mainImageUrl}
              alt={recipe.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl">
              🍳
            </div>
          )}
          {recipe.category && (
            <span className="absolute top-3 left-3 text-xs font-bold px-3 py-1 rounded-full bg-white/95 text-primary backdrop-blur-md shadow-sm">
              {recipe.category.name}
            </span>
          )}
        </div>

        {/* タイトル・情報 */}
        <div className="space-y-2">
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
            {recipe.title}
          </h1>

          {recipe.description && (
            <p className="text-xs text-gray-600 leading-relaxed bg-pink-50/40 p-3 rounded-2xl border border-pink-100/50">
              {recipe.description}
            </p>
          )}

          {/* メタタグ（調理時間、難易度、投稿者） */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-gray-500">
            {recipe.cookTimeMin && (
              <span className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-gray-100 shadow-sm font-medium">
                <Clock className="w-3.5 h-3.5 text-primary" />
                {formatCookTime(recipe.cookTimeMin)}
              </span>
            )}
            <span className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-gray-100 shadow-sm font-medium">
              🍳 {recipe.difficulty === 'EASY' ? 'かんたん' : recipe.difficulty === 'HARD' ? 'こだわり' : 'ふつう'}
            </span>
            <span className="text-[11px] text-gray-400 ml-auto">
              投稿者: {recipe.creator?.name}
            </span>
          </div>

          {recipe.tags && recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {recipe.tags.map((t: any) => (
                <span
                  key={t.id}
                  className="text-[10px] font-semibold text-primary bg-pink-50 px-2.5 py-0.5 rounded-full"
                >
                  #{t.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 「作ったよ！」ボタン */}
        <Button
          onClick={() => {
            setRecordTitle(`${recipe.title}を作りました！`);
            setIsRecordModalOpen(true);
          }}
          className="w-full py-3.5 flex items-center justify-center gap-2 shadow-sm"
          variant="secondary"
        >
          <Camera className="w-4 h-4 text-primary" />
          <span>このレシピを作った！（写真・記録を残す）</span>
        </Button>

        {/* 材料セクション（人数変更による自動計算付き） */}
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
              <span>材料</span>
            </h2>

            {/* 人数セレクター */}
            <div className="flex items-center gap-1 bg-pink-50 p-1 rounded-xl">
              {[1, 2, 3, 4].map((num) => (
                <button
                  key={num}
                  onClick={() => setCurrentServings(num)}
                  className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all ${
                    activeServings === num
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-gray-500 hover:text-primary'
                  }`}
                >
                  {num}人分
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-gray-50">
            {recipe.ingredients.map((ing: any) => {
              // 分量の自動計算（数値の場合）
              let displayAmount = ing.amount;
              if (ing.amount && !isNaN(parseFloat(ing.amount))) {
                const calculated = parseFloat(ing.amount) * servingRatio;
                displayAmount = Number.isInteger(calculated)
                  ? calculated.toString()
                  : calculated.toFixed(1);
              }

              return (
                <div
                  key={ing.id}
                  className="py-2.5 flex items-center justify-between text-xs"
                >
                  <span className="font-medium text-gray-800">{ing.name}</span>
                  <span className="font-bold text-gray-900">
                    {displayAmount} {ing.unit}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* 作り方手順セクション */}
        <Card className="p-4 space-y-4">
          <h2 className="text-sm font-bold text-gray-900 pb-2 border-b border-gray-100">
            作り方
          </h2>

          <div className="space-y-4">
            {recipe.steps.map((step: any) => {
              const isChecked = completedSteps.includes(step.stepNumber);
              return (
                <div
                  key={step.id}
                  onClick={() => toggleStep(step.stepNumber)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex gap-3 ${
                    isChecked
                      ? 'bg-emerald-50/40 border-emerald-200 opacity-70'
                      : 'bg-white border-pink-100/60 hover:bg-pink-50/20'
                  }`}
                >
                  <button
                    type="button"
                    className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-xs font-bold transition-colors ${
                      isChecked
                        ? 'bg-emerald-500 text-white'
                        : 'bg-primary text-white shadow-sm'
                    }`}
                  >
                    {isChecked ? <CheckCircle2 className="w-4 h-4" /> : step.stepNumber}
                  </button>

                  <div className="flex-1 space-y-2">
                    <p
                      className={`text-xs text-gray-800 leading-relaxed ${
                        isChecked ? 'line-through text-gray-400' : ''
                      }`}
                    >
                      {step.description}
                    </p>

                    {step.imageUrl && (
                      <div className="w-28 aspect-square rounded-xl overflow-hidden border border-pink-100">
                        <img
                          src={step.imageUrl}
                          alt={`手順 ${step.stepNumber}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* 料理記録作成モーダル */}
      <Modal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        title="料理記録を追加"
      >
        <form onSubmit={handleCreateRecord} className="space-y-4">
          <Input
            label="料理名・タイトル"
            value={recordTitle}
            onChange={(e) => setRecordTitle(e.target.value)}
            required
          />

          <Input
            label="作った日"
            type="date"
            value={recordDate}
            onChange={(e) => setRecordDate(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 ml-1">
              完成写真
            </label>
            <ImageUpload
              value={recordPhotoKey}
              onChange={setRecordPhotoKey}
              folder="cooking-records"
              aspectRatio="video"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 ml-1">
              感想・メモ
            </label>
            <textarea
              placeholder="美味しくできた！少し薄味にしたなど..."
              rows={3}
              value={recordMemo}
              onChange={(e) => setRecordMemo(e.target.value)}
              className="w-full rounded-2xl border border-pink-100 p-3 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary resize-none"
            />
          </div>

          <Button
            type="submit"
            className="w-full py-3"
            size="lg"
            isLoading={isSubmittingRecord}
          >
            記録を保存する
          </Button>
        </form>
      </Modal>
    </div>
  );
}

