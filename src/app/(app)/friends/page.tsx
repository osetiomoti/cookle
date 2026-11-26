'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import QRCode from 'qrcode';
import { useApp } from '@/contexts/AppContext';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/Toast';
import { UserPlus, Copy, Check, UserCheck, Trash2, QrCode, Share2, Link as LinkIcon, Sparkles } from 'lucide-react';
import { getImageUrl } from '@/lib/image';
import { getUserDisplayName } from '@/lib/utils';

function FriendsContent() {
  const { user } = useApp();
  const { success, error } = useToast();
  const searchParams = useSearchParams();

  const [friendUserId, setFriendUserId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [invitedFromParam, setInvitedFromParam] = useState<string | null>(null);

  // URLの招待パラメータ（?add=UUID または ?invite=UUID）を自動検出
  useEffect(() => {
    const addId = searchParams.get('add') || searchParams.get('invite');
    if (addId && addId !== user?.id) {
      setFriendUserId(addId);
      setInvitedFromParam(addId);
    }
  }, [searchParams, user?.id]);

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
    success('ユーザーIDをコピーしました！');
    setTimeout(() => setCopiedId(false), 3000);
  };

  const getInviteUrl = () => {
    if (typeof window === 'undefined' || !user?.id) return '';
    return `${window.location.origin}/friends?add=${user.id}`;
  };

  const handleCopyInviteLink = () => {
    const url = getInviteUrl();
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    success('招待リンクをコピーしました！LINEやSNSで友達に送信してください。');
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleOpenQrModal = async () => {
    const url = getInviteUrl();
    if (!url) return;
    try {
      const dataUrl = await QRCode.toDataURL(url, {
        width: 320,
        margin: 2,
        color: {
          dark: '#E11D48',
          light: '#FFFFFF',
        },
      });
      setQrDataUrl(dataUrl);
      setIsQrModalOpen(true);
    } catch {
      error('QRコードの生成に失敗しました');
    }
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
      setInvitedFromParam(null);
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
        {/* 招待リンクからアクセスした時のバナー */}
        {invitedFromParam && (
          <Card className="p-3.5 bg-gradient-to-r from-pink-100/80 via-white to-pink-50 border-primary/40 shadow-sm animate-in fade-in">
            <div className="flex items-center gap-2 text-primary font-bold text-xs mb-1">
              <Sparkles className="w-4 h-4" />
              <span>ともだち招待が届いています！</span>
            </div>
            <p className="text-[11px] text-gray-600 mb-2.5">
              招待者のユーザーIDが自動入力されています。下の「申請する」ボタンを押してつながりましょう！
            </p>
          </Card>
        )}

        {/* 自分の招待・共有カード（ID・招待リンク・QRコード） */}
        <Card className="p-4 bg-gradient-to-br from-pink-50 via-white to-orange-50/30 border-pink-100 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-primary bg-white px-2 py-0.5 rounded-full border border-pink-200">
              あなたの招待コード・リンク
            </span>
            <span className="text-[11px] text-gray-400">ワンタップで共有</span>
          </div>

          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white/90 border border-pink-100/70">
            <span className="text-xs font-mono text-gray-700 truncate select-all">
              {user?.id}
            </span>
            <button
              onClick={handleCopyMyId}
              className="text-primary hover:text-rose-600 text-xs font-bold flex items-center gap-1 shrink-0 px-2 py-1 rounded-lg hover:bg-pink-50 transition-colors"
            >
              {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>ID</span>
            </button>
          </div>

          {/* 招待リンク & QRコードボタン */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleCopyInviteLink}
              className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold border-pink-200 text-primary shadow-2xs hover:bg-pink-50/70"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>リンクコピー済</span>
                </>
              ) : (
                <>
                  <LinkIcon className="w-3.5 h-3.5 text-primary" />
                  <span>招待リンクをコピー</span>
                </>
              )}
            </Button>

            <Button
              size="sm"
              variant="secondary"
              onClick={handleOpenQrModal}
              className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold border-pink-200 text-primary shadow-2xs hover:bg-pink-50/70"
            >
              <QrCode className="w-3.5 h-3.5 text-primary" />
              <span>QRコードを表示</span>
            </Button>
          </div>
        </Card>

        {/* ともだち追加フォーム */}
        <Card className="p-4 space-y-3">
          <h3 className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
            <UserPlus className="w-4 h-4 text-primary" />
            <span>ともだちを追加する（ID手入力）</span>
          </h3>
          <form onSubmit={handleSendRequest} className="flex gap-2">
            <input
              type="text"
              placeholder="友達のユーザーID (UUID)"
              value={friendUserId}
              onChange={(e) => setFriendUserId(e.target.value)}
              className="flex-1 rounded-2xl border border-pink-100 px-3.5 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary shadow-2xs"
              required
            />
            <Button size="sm" type="submit" isLoading={isSubmitting}>
              申請する
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
              {friends.map((f) => (
                <Card
                  key={f.id}
                  className="p-3 flex items-center justify-between border-pink-100/70"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-pink-50 border border-pink-100 flex items-center justify-center text-lg">
                      🧑‍🍳
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-900">
                        {getUserDisplayName(f)}
                      </h4>
                      {f.email && (
                        <p className="text-[10px] text-gray-400">{f.email}</p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveFriend(f.friendshipId)}
                    className="p-2 text-gray-300 hover:text-red-500 rounded-lg transition-colors"
                    title="ともだち解除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center border-dashed border-gray-200">
              <UserCheck className="w-8 h-8 text-pink-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-gray-600 mb-1">
                まだともだちがいません
              </p>
              <p className="text-[11px] text-gray-400">
                招待リンクやQRコードを友達に送って、レシピを共有してみましょう！
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* QRコード表示モーダル */}
      <Modal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        title="ともだち追加用QRコード"
      >
        <div className="p-4 flex flex-col items-center space-y-4 text-center">
          <p className="text-xs text-gray-600">
            友達のスマホのカメラでこのQRコードを読み取ると、簡単にともだち申請できます。
          </p>

          <div className="p-4 bg-white rounded-3xl border-2 border-pink-200 shadow-md">
            {qrDataUrl && (
              <img
                src={qrDataUrl}
                alt="招待QRコード"
                className="w-56 h-56 rounded-xl object-contain"
              />
            )}
          </div>

          <div className="w-full space-y-2 pt-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleCopyInviteLink}
              className="w-full text-xs font-bold py-2.5 flex items-center justify-center gap-1.5"
            >
              <LinkIcon className="w-3.5 h-3.5 text-primary" />
              <span>招待リンクをコピー</span>
            </Button>
            <Button
              size="sm"
              onClick={() => setIsQrModalOpen(false)}
              className="w-full text-xs font-bold py-2.5"
            >
              閉じる
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function FriendsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fcfcfc] p-6 text-center text-xs text-gray-400">読み込み中...</div>}>
      <FriendsContent />
    </Suspense>
  );
}
