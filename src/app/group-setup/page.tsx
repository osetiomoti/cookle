'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/Toast';
import { Users, PlusCircle, ArrowRight } from 'lucide-react';

export default function GroupSetupPage() {
  const router = useRouter();
  const { success, error } = useToast();
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    try {
      setIsLoading(true);
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: groupName, description }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'グループ作成に失敗しました');
      }

      success('グループを作成しました！');
      localStorage.setItem('cookle_current_group', json.data.id);
      router.push('/home');
    } catch (err: any) {
      error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    try {
      setIsLoading(true);
      const res = await fetch('/api/groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: inviteCode.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'グループ参加に失敗しました');
      }

      success('グループに参加しました！');
      localStorage.setItem('cookle_current_group', json.data.group.id);
      router.push('/home');
    } catch (err: any) {
      error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/70 to-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-3xl bg-pink-100 flex items-center justify-center text-3xl mx-auto mb-3 shadow-sm">
            👥
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            グループの準備
          </h1>
          <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
            くっくるはグループで料理やレシピを共有するアプリです。<br />
            新しくグループを作るか、招待コードで参加しましょう。
          </p>
        </div>

        <div className="flex bg-gray-100/80 p-1 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => setMode('create')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              mode === 'create'
                ? 'bg-white text-primary shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            新しくグループを作る
          </button>
          <button
            type="button"
            onClick={() => setMode('join')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              mode === 'join'
                ? 'bg-white text-primary shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            招待コードで参加する
          </button>
        </div>

        <Card className="p-6">
          {mode === 'create' ? (
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <Input
                label="グループ名"
                placeholder="例: たなか家の食卓、ふたりのごはん"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                required
              />
              <Input
                label="説明（任意）"
                placeholder="例: 毎日の献立やレシピを共有する場所"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <Button
                type="submit"
                className="w-full mt-2"
                size="lg"
                isLoading={isLoading}
              >
                グループを作成して始める
              </Button>
            </form>
          ) : (
            <form onSubmit={handleJoinGroup} className="space-y-4">
              <Input
                label="招待コード"
                placeholder="8文字の招待コード（例: A1B2C3D4）"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                required
              />
              <p className="text-[11px] text-gray-400">
                家族や友達から共有された8文字のコードを入力してください。
              </p>
              <Button
                type="submit"
                className="w-full mt-2"
                size="lg"
                isLoading={isLoading}
              >
                グループに参加して始める
              </Button>
            </form>
          )}
        </Card>
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => router.push('/home')}
            className="text-xs text-gray-500 hover:text-primary transition-colors font-semibold inline-flex items-center gap-1 py-2 px-3 rounded-lg hover:bg-pink-50"
          >
            <span>グループを作らずに始める（個人利用）</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

