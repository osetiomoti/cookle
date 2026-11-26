'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { Header } from '@/components/layout/Header';
import { useApp } from '@/contexts/AppContext';
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
  ChefHat,
  Send,
} from 'lucide-react';
import { formatCookTime, getUserDisplayName } from '@/lib/utils';

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

  // 作ってほしいリクエストモーダル
  const { currentGroup } = useApp();
  const { data: friends } = useSWR<any[]>('/api/friends');
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestTargetType, setRequestTargetType] = useState<'group' | 'friend'>('group');
  const [selectedFriendId, setSelectedFriendId] = useState<string>('');
  const [requestNote, setRequestNote] = useState('');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipe) return;
    if (requestTargetType === 'friend' && !selectedFriendId) {
      error('リクエストを送るともだちを選択してください');
      return;
    }

    try {
      setIsSubmittingRequest(true);
      const res = await fetch('/api/recipe-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: requestTargetType === 'group' ? currentGroup?.id : undefined,
          targetUserId: requestTargetType === 'friend' ? selectedFriendId : undefined,
          recipeId: recipe.id,
          customTitle: recipe.title,
          note: requestNote.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'リクエストに失敗しました');

      success('作ってほしいリクエストを送信しました！💌');
      setIsRequestModalOpen(false);
      setRequestNote('');
    } catch (err: any) {
      error(err.message);
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  // お気に入りトグル（楽観的更新: 応答を待たずにハートを即時切り替え、失敗時のみロールバック）
  const handleToggleFavorite = async () => {
    if (!recipe) return;
    const prevRecipe = recipe;
    const nextFavorite = !recipe.isFavorite;

    // 即時反映
    mutate({ ...recipe, isFavorite: nextFavorite }, false);
    if (nextFavorite) {
      success('お気に入りに追加しました！');
    } else {
      success('お気に入りを解除しました');
    }

    try {
      const res = await fetch(`/api/favorites/${id}`, {
        method: nextFavorite ? 'POST' : 'DELETE',
      });
      if (!res.ok) throw new Error('お気に入り処理に失敗しました');
      mutate();
    } catch (err: any) {
      // 失敗時ロールバック
      mutate(prevRecipe, false);
      error(err.message || 'お気に入りの更新に失敗しました');
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
            <Image
              src={recipe.mainImageUrl}
              alt={recipe.title}
              fill
              priority
              sizes="(max-width: 640px) 100vw, 600px"
              className="object-cover"
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
              投稿者: {getUserDisplayName(recipe.creator)}
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

        {/* アクションボタン（リクエスト / 料理記録） */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => setIsRequestModalOpen(true)}
            className="py-3 px-3 rounded-2xl flex items-center justify-center gap-1.5 bg-gradient-to-r from-pink-500 via-primary to-rose-400 text-white font-bold text-xs shadow-md shadow-primary/25 hover:scale-[1.01] active:scale-98 transition-all"
          >
            <ChefHat className="w-4 h-4 stroke-[2.2]" />
            <span>これ作って！</span>
          </button>

          <Button
            onClick={() => {
              setRecordTitle(`${recipe.title}を作りました！`);
              setIsRecordModalOpen(true);
            }}
            className="py-3 flex items-center justify-center gap-1.5 shadow-2xs text-xs font-bold"
            variant="secondary"
          >
            <Camera className="w-4 h-4 text-primary" />
            <span>作ったよ！記録</span>
          </Button>
        </div>

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
                    {displayAmount ? `${displayAmount} ${ing.unit || ''}`.trim() : ing.unit}
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

      {/* 作ってほしいリクエストモーダル */}
      <Modal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        title="これ作って！リクエスト"
      >
        <form onSubmit={handleCreateRequest} className="space-y-4">
          <div className="p-3 rounded-2xl bg-pink-50/60 border border-pink-100 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white overflow-hidden shrink-0 border border-pink-100 flex items-center justify-center">
              {recipe.mainImageUrl ? (
                <img
                  src={recipe.mainImageUrl}
                  alt={recipe.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xl">🍳</span>
              )}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-primary">リクエストする料理</span>
              <h4 className="text-xs font-bold text-gray-900 truncate">{recipe.title}</h4>
            </div>
          </div>

          {/* 宛先選択 */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-700 ml-1">
              誰にお願いする？
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRequestTargetType('group')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                  requestTargetType === 'group'
                    ? 'bg-pink-100 text-primary border-primary shadow-2xs'
                    : 'bg-white text-gray-600 border-gray-100 hover:bg-pink-50/40'
                }`}
              >
                {currentGroup ? `👥 ${currentGroup.name}` : '👥 グループ全員'}
              </button>
              <button
                type="button"
                onClick={() => setRequestTargetType('friend')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                  requestTargetType === 'friend'
                    ? 'bg-pink-100 text-primary border-primary shadow-2xs'
                    : 'bg-white text-gray-600 border-gray-100 hover:bg-pink-50/40'
                }`}
              >
                👤 ともだちを指定
              </button>
            </div>

            {requestTargetType === 'friend' && (
              <div className="pt-1">
                {friends && friends.length > 0 ? (
                  <select
                    value={selectedFriendId}
                    onChange={(e) => setSelectedFriendId(e.target.value)}
                    required
                    className="w-full rounded-xl border border-pink-100 p-2.5 text-xs text-gray-800 bg-white focus:outline-none focus:border-primary"
                  >
                    <option value="">友達を選択してください</option>
                    {friends.map((f: any) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-[11px] text-gray-400 p-2 bg-gray-50 rounded-xl">
                    まだ友達が登録されていません。「マイページ &gt; ともだち」から友達を追加できます。
                  </p>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 ml-1">
              ひとことメッセージ（任意）
            </label>
            <textarea
              placeholder="例: 今夜これが食べたい！、チーズトッピングでお願いなど..."
              rows={2}
              value={requestNote}
              onChange={(e) => setRequestNote(e.target.value)}
              className="w-full rounded-2xl border border-pink-100 p-3 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary resize-none"
            />
          </div>

          <Button
            type="submit"
            className="w-full py-3"
            size="lg"
            isLoading={isSubmittingRequest}
          >
            作ってほしいリクエストを送る 💌
          </Button>
        </form>
      </Modal>
    </div>
  );
}

