'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { useApp } from '@/contexts/AppContext';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/Toast';
import { Camera, Plus, Calendar, Trash2, BookOpen } from 'lucide-react';
import { formatDate, getUserDisplayName } from '@/lib/utils';

export default function CookingRecordsPage() {
  const { currentGroup } = useApp();
  const { success, error } = useToast();

  const { data: records, mutate, isLoading } = useSWR<any[]>(
    currentGroup ? `/api/cooking-records?groupId=${currentGroup.id}` : '/api/cooking-records'
  );

  // 新規記録モーダル
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [title, setTitle] = useState('');
  const [cookedAt, setCookedAt] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [memo, setMemo] = useState('');
  const [photoKey, setPhotoKey] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      error('料理名を入力してください');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/cooking-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: currentGroup?.id || undefined,
          title: title.trim(),
          cookedAt,
          memo: memo.trim() || undefined,
          photoKeys: photoKey ? [photoKey] : [],
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || '作成に失敗しました');

      success('料理記録を追加しました！');
      mutate();
      setIsOpenModal(false);
      setTitle('');
      setMemo('');
      setPhotoKey(null);
    } catch (err: any) {
      error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (recordId: string) => {
    if (!confirm('この記録を削除しますか？')) return;
    try {
      const res = await fetch(`/api/cooking-records/${recordId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('削除に失敗しました');
      success('記録を削除しました');
      mutate();
    } catch (err: any) {
      error(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] pb-16">
      <Header
        title="料理記録"
        showBack
        backHref="/home"
        rightAction={
          <Button
            size="sm"
            onClick={() => setIsOpenModal(true)}
            className="flex items-center gap-1 shadow-sm"
          >
            <Plus className="w-4 h-4" /> 記録する
          </Button>
        }
      />

      <div className="px-4 py-4 space-y-4 max-w-xl mx-auto">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-44 w-full rounded-3xl" />
            ))}
          </div>
        ) : records && records.length > 0 ? (
          <div className="space-y-4">
            {records.map((record) => (
              <Card key={record.id} className="p-4 space-y-3">
                {/* 料理写真 */}
                {record.photos && record.photos.length > 0 && (
                  <div className="aspect-video rounded-2xl overflow-hidden bg-pink-50 border border-pink-100">
                    <img
                      src={record.photos[0].imageUrl}
                      alt={record.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">
                      {record.title}
                    </h3>
                    <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-primary" />
                      {formatDate(record.cookedAt)} ・ 作った人: {getUserDisplayName(record.user)}
                    </p>
                  </div>

                  {record.isOwner && (
                    <button
                      onClick={() => handleDelete(record.id)}
                      className="text-gray-300 hover:text-red-500 p-1 transition-colors"
                      aria-label="削除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {record.memo && (
                  <p className="text-xs text-gray-600 bg-pink-50/40 p-2.5 rounded-xl border border-pink-100/40 leading-relaxed">
                    {record.memo}
                  </p>
                )}

                {record.recipe && (
                  <Link
                    href={`/recipes/${record.recipe.id}`}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary bg-pink-50 px-2.5 py-1 rounded-full hover:bg-pink-100 transition-colors"
                  >
                    <BookOpen className="w-3 h-3" />
                    レシピ: {record.recipe.title}
                  </Link>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon="📸"
            title="料理記録がまだありません"
            description="作った料理の写真や感想を投稿して、美味しい思い出を残しましょう！"
            actionLabel="料理を記録する"
            onAction={() => setIsOpenModal(true)}
          />
        )}
      </div>

      {/* 新規記録モーダル */}
      <Modal
        isOpen={isOpenModal}
        onClose={() => setIsOpenModal(false)}
        title="料理を記録する"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="料理名"
            placeholder="例: チキン南蛮、特製カレー"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <Input
            label="作った日"
            type="date"
            value={cookedAt}
            onChange={(e) => setCookedAt(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 ml-1">
              料理写真
            </label>
            <ImageUpload
              value={photoKey}
              onChange={setPhotoKey}
              folder="cooking-records"
              aspectRatio="video"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 ml-1">
              感想・メモ
            </label>
            <textarea
              placeholder="感想や工夫した点、次回のメモなど..."
              rows={3}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="w-full rounded-2xl border border-pink-100 p-3 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary resize-none"
            />
          </div>

          <Button
            type="submit"
            className="w-full py-3"
            size="lg"
            isLoading={isSubmitting}
          >
            記録を保存する
          </Button>
        </form>
      </Modal>
    </div>
  );
}

