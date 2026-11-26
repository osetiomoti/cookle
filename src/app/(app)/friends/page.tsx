'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { useApp } from '@/contexts/AppContext';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/Toast';
import { UserPlus, Copy, Check, UserCheck, Trash2 } from 'lucide-react';
import { getImageUrl } from '@/lib/image';
import { getUserDisplayName } from '@/lib/utils';

export default function FriendsPage() {
  const { user } = useApp();
  const { success, error } = useToast();

  const [friendUserId, setFriendUserId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // ともだち一覧
  const { data: friends, mutate: mutateFriends, isLoading: friendsLoading } =
    useSWR<any[]>('/api/friends');

  // 申請中リクエスト
  const { data: pending, mutate: mutatePending } =
    useSWR<any[]>('/api/friends/pending');

  const handleCopyMyId = () => {
    if (!user?.id) return;
    navigator.clipboard.writeText(user.id);
    setCopiedId(true);
    success('ユーザーIDをコピーしました！友達に共有してください。');
    setTimeout(() => setCopiedId(false), 3000);
  };

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendUserId.trim()) return;

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendUserId: friendUserId.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || '申請に失敗しました');

      success('ともだち申請を送信しました！');
      setFriendUserId('');
      mutateFriends();
    } catch (err: any) {
      error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAccept = async (friendshipId: string) => {
    try {
      const res = await fetch(`/api/friends/${friendshipId}/accept`, {
        method: 'PUT',
      });
      if (!res.ok) throw new Error('承認に失敗しました');
      success('ともだち申請を承認しました！');
      mutatePending();
      mutateFriends();
    } catch (err: any) {
      error(err.message);
    }
  };

  const handleRemoveFriend = async (friendshipId: string) => {
    if (!confirm('ともだちを解除しますか？')) return;
    try {
      const res = await fetch(`/api/friends/${friendshipId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('解除に失敗しました');
      success('ともだちを解除しました');
      mutateFriends();
    } catch (err: any) {
      error(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] pb-16">
      <Header title="ともだち管理" showBack backHref="/mypage" />

      <div className="px-4 py-4 space-y-5 max-w-xl mx-auto">
        {/* 自分のID共有カード */}
        <Card className="p-4 bg-gradient-to-r from-pink-50 to-white border-pink-100/80 space-y-2">
          <span className="text-[10px] font-bold text-primary bg-white px-2 py-0.5 rounded-full border border-pink-200">
            あなたのユーザーID
          </span>
          <div className="flex items-center justify-between gap-2 pt-1">
            <span className="text-xs font-mono text-gray-700 truncate select-all">
              {user?.id}
            </span>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleCopyMyId}
              className="shrink-0 flex items-center gap-1 py-1 px-3 text-xs"
            >
              {copiedId ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>コピー済</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>IDコピー</span>
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* ともだち追加フォーム */}
        <Card className="p-4 space-y-3">
          <h3 className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
            <UserPlus className="w-4 h-4 text-primary" />
            <span>ともだちを追加する</span>
          </h3>
          <form onSubmit={handleSendRequest} className="flex gap-2">
            <input
              type="text"
              placeholder="友達のユーザーID (UUID)"
              value={friendUserId}
              onChange={(e) => setFriendUserId(e.target.value)}
              className="flex-1 rounded-2xl border border-pink-100 px-3.5 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary"
              required
            />
            <Button size="sm" type="submit" isLoading={isSubmitting}>
              申請
            </Button>
          </form>
        </Card>

        {/* 申請中のリクエスト（届いているもの） */}
        {pending && pending.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-rose-500 ml-1">
              届いているともだち申請 ({pending.length}件)
            </h3>
            <div className="space-y-2">
              {pending.map((p) => (
                <Card
                  key={p.id}
                  className="p-3.5 flex items-center justify-between border-rose-100 bg-rose-50/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-lg">
                      🧑‍🍳
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-900">
                        {getUserDisplayName(p.user)}
                      </h4>
                      {p.user?.email && (
                        <p className="text-[10px] text-gray-400">{p.user.email}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      onClick={() => handleAccept(p.id)}
                      className="py-1 px-3 text-xs"
                    >
                      承認
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ともだち一覧 */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-gray-700 ml-1">
            ともだち一覧 ({friends?.length || 0}人)
          </h3>

          {friendsLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-2xl" />
              ))}
            </div>
          ) : friends && friends.length > 0 ? (
            <div className="space-y-2">
              {friends.map((f) => {
                const avatar = f.avatarKey ? getImageUrl(f.avatarKey) : null;

                return (
                  <Card key={f.id} className="p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-pink-50 overflow-hidden border border-pink-100 flex items-center justify-center text-lg">
                        {avatar ? (
                          <img
                            src={avatar}
                            alt={f.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          '🧑‍🍳'
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-900">{getUserDisplayName(f)}</h4>
                        {f.email && <p className="text-[10px] text-gray-400">{f.email}</p>}
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveFriend(f.friendshipId)}
                      className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg transition-colors"
                      aria-label="解除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center bg-white rounded-2xl border border-pink-100/40">
              <p className="text-xs text-gray-400">ともだちはまだいません。</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

