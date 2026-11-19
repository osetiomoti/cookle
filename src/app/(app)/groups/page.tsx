'use client';

import React, { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/Toast';
import { Users, Copy, Check, Plus, LogIn, Crown } from 'lucide-react';

export default function GroupsPage() {
  const { groups, currentGroup, setCurrentGroup, mutateGroups } = useApp();
  const { success, error } = useToast();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    success('招待コードをコピーしました！');
    setTimeout(() => setCopiedCode(null), 3000);
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: groupName.trim(), description: description.trim() || undefined }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || '作成に失敗しました');

      success('新しいグループを作成しました！');
      mutateGroups();
      setCurrentGroup(json.data);
      setIsCreateOpen(false);
      setGroupName('');
      setDescription('');
    } catch (err: any) {
      error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: inviteCode.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || '参加に失敗しました');

      success('グループに参加しました！');
      mutateGroups();
      setCurrentGroup(json.data.group);
      setIsJoinOpen(false);
      setInviteCode('');
    } catch (err: any) {
      error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] pb-16">
      <Header title="グループ管理" showBack backHref="/mypage" />

      <div className="px-4 py-4 space-y-4 max-w-xl mx-auto">
        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1 flex items-center justify-center gap-1 shadow-sm"
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus className="w-4 h-4" /> 新規作成
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="flex-1 flex items-center justify-center gap-1"
            onClick={() => setIsJoinOpen(true)}
          >
            <LogIn className="w-4 h-4" /> コードで参加
          </Button>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-bold text-gray-700 ml-1">
            所属グループ一覧 ({groups.length}件)
          </h3>

          {groups.map((group) => {
            const isCurrent = currentGroup?.id === group.id;

            return (
              <Card
                key={group.id}
                className={`p-4 space-y-3 transition-all ${
                  isCurrent ? 'ring-2 ring-primary border-primary bg-pink-50/20' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-pink-300 flex items-center justify-center text-xl text-white shadow-sm font-bold">
                      👥
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-bold text-gray-900">
                          {group.name}
                        </h4>
                        {group.myRole === 'ADMIN' && (
                          <span className="flex items-center gap-0.5 text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200">
                            <Crown className="w-2.5 h-2.5" /> 管理者
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        メンバー: {group.memberCount}名
                      </p>
                    </div>
                  </div>

                  {isCurrent ? (
                    <span className="text-xs font-bold text-primary bg-pink-100 px-2.5 py-1 rounded-full">
                      選択中
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentGroup(group)}
                    >
                      切り替える
                    </Button>
                  )}
                </div>

                {group.description && (
                  <p className="text-xs text-gray-600 bg-white/80 p-2.5 rounded-xl border border-gray-100">
                    {group.description}
                  </p>
                )}

                {/* 招待コード */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-pink-50/50 border border-pink-100/60">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-500">
                      招待コード:
                    </span>
                    <span className="text-xs font-mono font-bold text-primary tracking-wider">
                      {group.inviteCode}
                    </span>
                  </div>

                  <button
                    onClick={() => handleCopyCode(group.inviteCode)}
                    className="flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                  >
                    {copiedCode === group.inviteCode ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-600">コピー完了</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>コピー</span>
                      </>
                    )}
                  </button>
                </div>
              </Card>
            );
          })}

          {groups.length === 0 && (
            <div className="text-center py-10 bg-white rounded-3xl border border-dashed border-pink-200 p-6 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-pink-100 text-2xl flex items-center justify-center mx-auto">
                👥
              </div>
              <h4 className="text-sm font-bold text-gray-800">グループに未参加です</h4>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">
                グループを作ると、家族やパートナーと一緒に献立や買い物リストをリアルタイムで共有できます。個人利用のままでも全機能をお使いいただけます。
              </p>
            </div>
          )}
        </div>
      </div>

      {/* グループ作成モーダル */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="新しいグループを作成"
      >
        <form onSubmit={handleCreateGroup} className="space-y-4">
          <Input
            label="グループ名"
            placeholder="例: たなか家のごはん"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            required
          />
          <Input
            label="説明（任意）"
            placeholder="例: 家族で献立とレシピを共有"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Button
            type="submit"
            className="w-full py-3"
            size="lg"
            isLoading={isSubmitting}
          >
            グループを作成
          </Button>
        </form>
      </Modal>

      {/* グループ参加モーダル */}
      <Modal
        isOpen={isJoinOpen}
        onClose={() => setIsJoinOpen(false)}
        title="招待コードで参加"
      >
        <form onSubmit={handleJoinGroup} className="space-y-4">
          <Input
            label="招待コード"
            placeholder="8文字の招待コード"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            required
          />
          <Button
            type="submit"
            className="w-full py-3"
            size="lg"
            isLoading={isSubmitting}
          >
            参加する
          </Button>
        </form>
      </Modal>
    </div>
  );
}

