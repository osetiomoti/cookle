'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { useApp } from '@/contexts/AppContext';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/Toast';
import {
  ChefHat,
  Plus,
  Check,
  CheckCircle2,
  Trash2,
  Clock,
  MessageCircle,
  Users,
  User as UserIcon,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function RecipeRequestsPage() {
  const { user, currentGroup } = useApp();
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<'all' | 'mine'>('all');
  const [filterPendingOnly, setFilterPendingOnly] = useState(true);

  // リクエスト一覧
  const queryUrl = currentGroup
    ? `/api/recipe-requests?groupId=${currentGroup.id}`
    : `/api/recipe-requests`;
  const { data: requests, mutate, isLoading } = useSWR<any[]>(queryUrl);

  // ともだち一覧
  const { data: friends } = useSWR<any[]>('/api/friends');

  // 新規リクエストモーダル
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [note, setNote] = useState('');
  const [targetType, setTargetType] = useState<'group' | 'friend'>('group');
  const [selectedFriendId, setSelectedFriendId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // リクエスト作成
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) {
      error('作ってほしい料理名を入力してください');
      return;
    }
    if (targetType === 'friend' && !selectedFriendId) {
      error('リクエスト相手の友達を選択してください');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/recipe-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: targetType === 'group' ? currentGroup?.id : undefined,
          targetUserId: targetType === 'friend' ? selectedFriendId : undefined,
          customTitle: customTitle.trim(),
          note: note.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || '作成に失敗しました');

      success('作ってほしいリクエストを投稿しました！💌');
      mutate();
      setIsModalOpen(false);
      setCustomTitle('');
      setNote('');
    } catch (err: any) {
      error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ステータス更新（作るよ / 作ったよ）
  const handleUpdateStatus = async (id: string, status: 'ACCEPTED' | 'COOKED' | 'OPEN') => {
    try {
      const res = await fetch(`/api/recipe-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || '更新に失敗しました');

      if (status === 'ACCEPTED') {
        success('「作ります！」と宣言しました🍳');
      } else if (status === 'COOKED') {
        success('「作ったよ！」を記録しました🎉');
      } else {
        success('ステータスを戻しました');
      }
      mutate();
    } catch (err: any) {
      error(err.message);
    }
  };

  // リクエスト削除
  const handleDelete = async (id: string) => {
    if (!confirm('このリクエストを削除してもよろしいですか？')) return;
    try {
      const res = await fetch(`/api/recipe-requests/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('削除に失敗しました');
      success('リクエストを削除しました');
      mutate();
    } catch (err: any) {
      error(err.message);
    }
  };

  // フィルタリング
  const displayedRequests = (requests || []).filter((req) => {
    if (activeTab === 'mine') {
      if (req.userId !== user?.id) return false;
    }
    if (filterPendingOnly) {
      if (req.status === 'COOKED') return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#fcfcfc] pb-24">
      <Header
        title="作ってほしいリクエスト"
        showBack
        backHref="/home"
        rightAction={
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary text-white text-xs font-bold shadow-sm shadow-primary/25 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>リクエスト</span>
          </button>
        }
      />

      <div className="px-4 py-4 space-y-4 max-w-xl mx-auto">
        {/* 説明カード */}
        <div className="p-4 rounded-3xl bg-gradient-to-r from-pink-500/10 via-rose-500/5 to-amber-500/5 border border-pink-100/80 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-white shadow-2xs text-2xl flex items-center justify-center shrink-0">
            💌
          </div>
          <div className="text-xs">
            <h3 className="font-bold text-gray-900 mb-0.5">
              「これ作って！」をおねだり
            </h3>
            <p className="text-gray-500 leading-relaxed text-[11px]">
              パートナーや友達に作ってほしい料理を気軽にリクエストできます。
            </p>
          </div>
        </div>

        {/* タブ切り替え & 絞り込み */}
        <div className="space-y-2">
          <div className="flex bg-gray-100/90 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'all'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              みんなのリクエスト
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('mine')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'mine'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              自分がしたリクエスト
            </button>
          </div>

          <div className="flex items-center justify-between px-1 text-xs text-gray-500">
            <button
              type="button"
              onClick={() => setFilterPendingOnly(!filterPendingOnly)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-all ${
                filterPendingOnly
                  ? 'bg-pink-100 text-primary border-primary/40'
                  : 'bg-white text-gray-500 border-gray-200'
              }`}
            >
              {filterPendingOnly ? '✓ 募集中・料理中のみ' : 'すべて表示（作った完了分を含む）'}
            </button>
            <span className="text-[11px] text-gray-400">
              {displayedRequests.length} 件
            </span>
          </div>
        </div>

        {/* リクエスト一覧 */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full rounded-3xl" />
            ))}
          </div>
        ) : displayedRequests.length > 0 ? (
          <div className="space-y-3">
            {displayedRequests.map((req) => {
              const isMine = req.userId === user?.id;
              const isCooked = req.status === 'COOKED';
              const isAccepted = req.status === 'ACCEPTED';

              return (
                <Card
                  key={req.id}
                  className={`p-4 space-y-3 transition-all ${
                    isCooked
                      ? 'bg-gray-50/70 border-gray-100 opacity-80'
                      : 'border-pink-100/80 shadow-2xs'
                  }`}
                >
                  {/* ヘッダー: 依頼者情報 & ステータス */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center overflow-hidden shrink-0">
                        {req.requester.avatarUrl ? (
                          <img
                            src={req.requester.avatarUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <UserIcon className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-gray-900">
                            {req.requester.name}
                          </span>
                          {isMine && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-pink-100 text-primary">
                              自分
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-400">
                          {formatDate(req.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* ステータスバッジ */}
                      {isCooked ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold border border-emerald-200">
                          <Check className="w-3 h-3 stroke-[3]" /> 作ったよ！
                        </span>
                      ) : isAccepted ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
                          <ChefHat className="w-3 h-3 stroke-[2.2]" /> 作成予定
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-pink-50 text-primary text-[10px] font-bold border border-pink-200 animate-pulse">
                          💌 リクエスト中
                        </span>
                      )}

                      {/* 削除ボタン */}
                      {isMine && (
                        <button
                          onClick={() => handleDelete(req.id)}
                          className="text-gray-300 hover:text-red-500 p-1 transition-colors"
                          title="削除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* リクエスト料理名 */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🍳</span>
                      <h4 className="text-base font-extrabold text-gray-900">
                        {req.customTitle}
                      </h4>
                    </div>

                    {req.note && (
                      <p className="text-xs text-gray-600 bg-pink-50/40 p-2.5 rounded-2xl border border-pink-100/50 leading-relaxed">
                        💭 {req.note}
                      </p>
                    )}
                  </div>

                  {/* レシピが紐づいている場合 */}
                  {req.recipe && (
                    <Link
                      href={`/recipes/${req.recipe.id}`}
                      className="flex items-center gap-3 p-2.5 rounded-2xl bg-white border border-pink-100 hover:bg-pink-50/40 transition-colors group"
                    >
                      <div className="w-12 h-12 rounded-xl bg-pink-50 overflow-hidden shrink-0">
                        {req.recipe.mainImageUrl ? (
                          <img
                            src={req.recipe.mainImageUrl}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <span className="text-lg">🍽️</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] text-primary font-bold">参考レシピ</span>
                        <h5 className="text-xs font-bold text-gray-900 truncate">
                          {req.recipe.title}
                        </h5>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
                    </Link>
                  )}

                  {/* フッターアクション */}
                  <div className="pt-1 flex items-center justify-between border-t border-gray-50 text-[11px]">
                    <div className="text-gray-400">
                      {req.targetUser ? (
                        <span>👤 {req.targetUser.name} さん宛て</span>
                      ) : req.groupId ? (
                        <span>👥 グループ全員宛て</span>
                      ) : (
                        <span>👥 共有リクエスト</span>
                      )}
                    </div>

                    {/* ステータスに応じたアクションボタン */}
                    <div className="flex items-center gap-2">
                      {!isCooked && !isMine && (
                        <>
                          {!isAccepted ? (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(req.id, 'ACCEPTED')}
                              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1"
                            >
                              <ChefHat className="w-3.5 h-3.5" />
                              <span>作ります！</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(req.id, 'OPEN')}
                              className="px-2.5 py-1 rounded-xl text-gray-400 hover:text-gray-600 text-[11px]"
                            >
                              戻す
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(req.id, 'COOKED')}
                            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>作ったよ！🎉</span>
                          </button>
                        </>
                      )}

                      {/* 自分が依頼した場合、作ってくれた報告への確認 */}
                      {isMine && isCooked && (
                        <span className="text-emerald-600 font-bold">
                          🎉 {req.cookUser?.name || 'だれか'} が作ってくれました！
                        </span>
                      )}

                      {isCooked && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(req.id, 'OPEN')}
                          className="px-2 py-1 text-gray-400 hover:text-gray-600 text-[10px]"
                        >
                          またリクエストする
                        </button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon="💌"
            title="リクエストはありません"
            description="食べたい料理や作ってほしいレシピをリクエストしてみましょう！"
            actionLabel="料理をリクエストする"
            onAction={() => setIsModalOpen(true)}
          />
        )}
      </div>

      {/* 新規リクエスト作成モーダル */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="作ってほしい料理をリクエスト"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="食べたい料理・レシピ名"
            placeholder="例: ふわとろオムライス、特製ハンバーグ"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            required
          />

          {/* 宛先 */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-700 ml-1">
              誰にお願いする？
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTargetType('group')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                  targetType === 'group'
                    ? 'bg-pink-100 text-primary border-primary shadow-2xs'
                    : 'bg-white text-gray-600 border-gray-100 hover:bg-pink-50/40'
                }`}
              >
                {currentGroup ? `👥 ${currentGroup.name}` : '👥 グループ全員'}
              </button>
              <button
                type="button"
                onClick={() => setTargetType('friend')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                  targetType === 'friend'
                    ? 'bg-pink-100 text-primary border-primary shadow-2xs'
                    : 'bg-white text-gray-600 border-gray-100 hover:bg-pink-50/40'
                }`}
              >
                👤 ともだちを指定
              </button>
            </div>

            {targetType === 'friend' && (
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
              placeholder="例: チーズ入れてほしい！、今度の休日に食べたいななど..."
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-2xl border border-pink-100 p-3 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary resize-none"
            />
          </div>

          <Button
            type="submit"
            className="w-full py-3"
            size="lg"
            isLoading={isSubmitting}
          >
            リクエストを送信する 💌
          </Button>
        </form>
      </Modal>
    </div>
  );
}

