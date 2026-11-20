'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { useApp } from '@/contexts/AppContext';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { TagSelector, type TagItem } from '@/components/TagSelector';
import { useToast } from '@/components/Toast';
import { Plus, Trash2, Clock, Users, Flame, ChevronRight, Check, Tag as TagIcon, X } from 'lucide-react';

interface IngredientInput {
  name: string;
  amount: string;
  unit: string;
}

interface StepInput {
  stepNumber: number;
  description: string;
  imageKey?: string | null;
}

export default function NewRecipePage() {
  const router = useRouter();
  const { currentGroup } = useApp();
  const { success, error } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mainImageKey, setMainImageKey] = useState<string | null>(null);
  const [cookTimeMin, setCookTimeMin] = useState<string>('30');
  const [servings, setServings] = useState<string>('2');
  const [difficulty, setDifficulty] = useState<'EASY' | 'NORMAL' | 'HARD'>('NORMAL');
  const [categoryId, setCategoryId] = useState<string>('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<TagItem[]>([]);
  const [isTagSelectorOpen, setIsTagSelectorOpen] = useState(false);
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);

  // 材料リスト
  const [ingredients, setIngredients] = useState<IngredientInput[]>([
    { name: '', amount: '', unit: '' },
    { name: '', amount: '', unit: '' },
  ]);

  // 作り方手順リスト
  const [steps, setSteps] = useState<StepInput[]>([
    { stepNumber: 1, description: '', imageKey: null },
    { stepNumber: 2, description: '', imageKey: null },
  ]);

  const [isLoading, setIsLoading] = useState(false);

  // カテゴリ一覧
  const { data: categories } = useSWR<any[]>(
    currentGroup ? `/api/categories?groupId=${currentGroup.id}` : '/api/categories'
  );

  // タグ一覧
  const { data: tags } = useSWR<any[]>(
    currentGroup ? `/api/tags?groupId=${currentGroup.id}` : '/api/tags'
  );

  // ともだち一覧
  const { data: friends } = useSWR<any[]>('/api/friends');

  // 材料の操作
  const addIngredient = () => {
    setIngredients([...ingredients, { name: '', amount: '', unit: '' }]);
  };
  const updateIngredient = (index: number, field: keyof IngredientInput, val: string) => {
    const next = [...ingredients];
    next[index][field] = val;
    setIngredients(next);
  };
  const removeIngredient = (index: number) => {
    if (ingredients.length <= 1) return;
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  // 手順の操作
  const addStep = () => {
    setSteps([...steps, { stepNumber: steps.length + 1, description: '', imageKey: null }]);
  };
  const updateStep = (index: number, field: keyof StepInput, val: any) => {
    const next = [...steps];
    next[index] = { ...next[index], [field]: val };
    setSteps(next);
  };
  const removeStep = (index: number) => {
    if (steps.length <= 1) return;
    const next = steps.filter((_, i) => i !== index).map((s, idx) => ({ ...s, stepNumber: idx + 1 }));
    setSteps(next);
  };

  // タグ選択トグル
  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  // ともだち共有トグル
  const toggleFriend = (friendId: string) => {
    setSelectedFriendIds((prev) =>
      prev.includes(friendId) ? prev.filter((id) => id !== friendId) : [...prev, friendId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      error('レシピ名を入力してください');
      return;
    }

    const validIngredients = ingredients.filter((ing) => ing.name.trim() !== '');
    const validSteps = steps.filter((s) => s.description.trim() !== '');

    try {
      setIsLoading(true);
      const payload = {
        groupId: currentGroup?.id || undefined,
        title: title.trim(),
        description: description.trim() || undefined,
        mainImageKey: mainImageKey || undefined,
        cookTimeMin: cookTimeMin ? parseInt(cookTimeMin) : undefined,
        servings: servings ? parseInt(servings) : undefined,
        difficulty,
        categoryId: categoryId || undefined,
        tagIds: selectedTagIds,
        ingredients: validIngredients.map((ing, idx) => ({
          ...ing,
          sortOrder: idx,
        })),
        steps: validSteps.map((st, idx) => ({
          stepNumber: idx + 1,
          description: st.description.trim(),
          imageKey: st.imageKey || undefined,
        })),
        friendUserIds: selectedFriendIds,
      };

      const res = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'レシピ作成に失敗しました');
      }

      success('レシピを投稿しました！');
      router.push(`/recipes/${json.data.id}`);
    } catch (err: any) {
      error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] pb-12">
      <Header title="新しいレシピ" showBack backHref="/recipes" />

      <form onSubmit={handleSubmit} className="px-4 py-4 space-y-6 max-w-xl mx-auto">
        {/* メイン写真 */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-gray-700 ml-1">
            料理の完成写真
          </label>
          <ImageUpload
            value={mainImageKey}
            onChange={setMainImageKey}
            folder="recipes"
            aspectRatio="video"
          />
        </div>

        {/* 基本情報 */}
        <Card className="p-4 space-y-4">
          <Input
            label="レシピ名"
            placeholder="例: 肉じゃが、ふわとろオムライス"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 ml-1">
              紹介文・ひとことメモ
            </label>
            <textarea
              placeholder="このレシピの魅力や美味しく作るポイントなど..."
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-2xl border border-pink-100/80 p-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="調理時間（目安・分）"
              type="number"
              min="1"
              placeholder="30"
              value={cookTimeMin}
              onChange={(e) => setCookTimeMin(e.target.value)}
            />
            <Input
              label="何人分"
              type="number"
              min="1"
              placeholder="2"
              value={servings}
              onChange={(e) => setServings(e.target.value)}
            />
          </div>

          {/* 難易度 */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 ml-1">
              難易度
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['EASY', 'NORMAL', 'HARD'] as const).map((diff) => (
                <button
                  key={diff}
                  type="button"
                  onClick={() => setDifficulty(diff)}
                  className={`py-2 px-1 rounded-xl text-xs font-bold transition-all border text-center truncate ${
                    difficulty === diff
                      ? 'bg-pink-100 text-primary border-primary shadow-sm'
                      : 'bg-white text-gray-600 border-gray-100 hover:bg-pink-50/50'
                  }`}
                >
                  {diff === 'EASY' ? '🍳 かんたん' : diff === 'NORMAL' ? '🍲 ふつう' : '🧑‍🍳 こだわり'}
                </button>
              ))}
            </div>
          </div>

          {/* カテゴリ選択 */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 ml-1">
              カテゴリ
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-2xl border border-pink-100/80 px-4 py-2.5 text-xs text-gray-800 bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
            >
              <option value="">カテゴリを選択（任意）</option>
              {categories?.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* タグ選択（tabereco/futariba準拠のタグ選択モーダル連携） */}
          <div>
            <div className="flex items-center justify-between mb-1.5 ml-1">
              <label className="block text-xs font-bold text-gray-700">
                タグ
              </label>
              <button
                type="button"
                onClick={() => setIsTagSelectorOpen(true)}
                className="text-xs text-primary font-bold flex items-center gap-1 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" /> タグを選択・追加
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 rounded-2xl bg-pink-50/30 border border-pink-100/60">
              {selectedTags.length > 0 ? (
                selectedTags.map((t) => (
                  <span
                    key={t.id}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white border border-pink-200 text-xs font-bold text-primary shadow-2xs animate-in zoom-in-95"
                  >
                    #{t.name}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTagIds((prev) => prev.filter((id) => id !== t.id));
                        setSelectedTags((prev) => prev.filter((item) => item.id !== t.id));
                      }}
                      className="text-gray-400 hover:text-red-500 ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              ) : (
                <button
                  type="button"
                  onClick={() => setIsTagSelectorOpen(true)}
                  className="text-xs text-gray-400 flex items-center gap-1 px-2 py-0.5 hover:text-primary transition-colors"
                >
                  <TagIcon className="w-3.5 h-3.5" />
                  <span>タグを追加（例: #時短 #節約 #主菜）</span>
                </button>
              )}
            </div>
          </div>
        </Card>

        {/* 材料 */}
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900">材料（{servings || 2}人分）</h3>
            <button
              type="button"
              onClick={addIngredient}
              className="text-xs text-primary font-bold flex items-center gap-1 hover:underline"
            >
              <Plus className="w-3.5 h-3.5" /> 材料を追加
            </button>
          </div>

          <div className="space-y-2">
            {ingredients.map((ing, idx) => (
              <div key={idx} className="flex items-center gap-1.5 w-full">
                <input
                  type="text"
                  placeholder={`材料 ${idx + 1}`}
                  value={ing.name}
                  onChange={(e) => updateIngredient(idx, 'name', e.target.value)}
                  className="flex-1 min-w-0 rounded-xl border border-pink-100 px-3 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary"
                />
                <input
                  type="text"
                  placeholder="分量"
                  value={ing.amount}
                  onChange={(e) => updateIngredient(idx, 'amount', e.target.value)}
                  className="w-16 shrink-0 min-w-0 rounded-xl border border-pink-100 px-2 py-2 text-xs text-center text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary"
                />
                <input
                  type="text"
                  placeholder="単位"
                  value={ing.unit}
                  onChange={(e) => updateIngredient(idx, 'unit', e.target.value)}
                  className="w-14 shrink-0 min-w-0 rounded-xl border border-pink-100 px-1.5 py-2 text-xs text-center text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => removeIngredient(idx)}
                  className="p-1.5 shrink-0 text-gray-300 hover:text-red-500 transition-colors"
                  aria-label="削除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </Card>

        {/* 作り方手順 */}
        <Card className="p-4 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900">作り方手順</h3>
            <button
              type="button"
              onClick={addStep}
              className="text-xs text-primary font-bold flex items-center gap-1 hover:underline"
            >
              <Plus className="w-3.5 h-3.5" /> 手順を追加
            </button>
          </div>

          <div className="space-y-4">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-pink-50/30 border border-pink-100/50 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shadow-sm">
                    {step.stepNumber}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeStep(idx)}
                    className="text-gray-300 hover:text-red-500 transition-colors p-1"
                    aria-label="手順を削除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <textarea
                  placeholder={`手順 ${step.stepNumber} の説明（例: 野菜を一口大に切る）`}
                  rows={2}
                  value={step.description}
                  onChange={(e) => updateStep(idx, 'description', e.target.value)}
                  className="w-full rounded-xl border border-pink-100 bg-white p-2.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary resize-none"
                />

                <div className="w-32">
                  <ImageUpload
                    value={step.imageKey}
                    onChange={(key) => updateStep(idx, 'imageKey', key)}
                    folder="recipes"
                    aspectRatio="square"
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* ともだち共有（任意） */}
        {friends && friends.length > 0 && (
          <Card className="p-4 space-y-2">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-primary" />
              <span>ともだちにも共有する（任意）</span>
            </h3>
            <p className="text-[11px] text-gray-400 mb-2">
              選択した友達もこのレシピを閲覧・お気に入りできるようになります。
            </p>
            <div className="grid grid-cols-2 gap-2">
              {friends.map((f) => {
                const isSelected = selectedFriendIds.includes(f.id);
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => toggleFriend(f.id)}
                    className={`flex items-center justify-between p-2 rounded-xl border text-xs text-left transition-all ${
                      isSelected
                        ? 'bg-pink-100 border-primary text-primary font-bold shadow-sm'
                        : 'bg-white border-gray-100 text-gray-600 hover:bg-pink-50/40'
                    }`}
                  >
                    <span className="truncate">{f.name}</span>
                    {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
                  </button>
                );
              })}
            </div>
          </Card>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full py-4 text-base shadow-primary shadow-lg"
          isLoading={isLoading}
        >
          レシピを投稿する
        </Button>
      </form>

      {/* タグ選択ボトムシート */}
      <TagSelector
        isOpen={isTagSelectorOpen}
        onClose={() => setIsTagSelectorOpen(false)}
        selectedTagIds={selectedTagIds}
        onSelect={(ids, tagObjects) => {
          setSelectedTagIds(ids);
          setSelectedTags(tagObjects);
        }}
      />
    </div>
  );
}

