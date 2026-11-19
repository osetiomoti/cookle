'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/contexts/AppContext';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { useToast } from '@/components/Toast';
import {
  User,
  Users,
  UserPlus,
  Heart,
  LogOut,
  ChevronRight,
  Sparkles,
  Camera,
} from 'lucide-react';
import { getImageUrl } from '@/lib/image';

export default function MyPage() {
  const router = useRouter();
  const { user, currentGroup, mutateUser } = useApp();
  const { success, error } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [avatarKey, setAvatarKey] = useState<string | null>(user?.avatarKey || null);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsUpdating(true);
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), avatarKey }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || '更新に失敗しました');

      success('プロフィールを更新しました！');
      mutateUser();
      setIsEditing(false);
    } catch (err: any) {
      error(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = () => {
    if (!confirm('ログアウトしますか？')) return;
    localStorage.removeItem('cookle_rt');
    localStorage.removeItem('cookle_current_group');
    window.location.href = '/api/auth/logout';
  };

  const avatarUrl = user?.avatarKey ? getImageUrl(user.avatarKey) : null;

  return (
    <div className="min-h-screen bg-[#fcfcfc] pb-16">
      <Header title="マイページ" />

      <div className="px-4 py-4 space-y-4 max-w-xl mx-auto">
        {/* ユーザー情報カード */}
        <Card className="p-5">
          {isEditing ? (
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="flex flex-col items-center gap-2">
                <div className="w-24 h-24">
                  <ImageUpload
                    value={avatarKey}
                    onChange={setAvatarKey}
                    folder="users"
                    aspectRatio="square"
                  />
                </div>
                <span className="text-xs text-gray-400">アイコンを変更</span>
              </div>

              <Input
                label="ニックネーム"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsEditing(false)}
                >
                  キャンセル
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  isLoading={isUpdating}
                >
                  保存する
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-16 h-16 rounded-3xl bg-pink-50 overflow-hidden border-2 border-pink-100 flex items-center justify-center text-2xl shadow-sm">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={user?.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    '🧑‍🍳'
                  )}
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">
                    {user?.name || 'ゲスト'}
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">{user?.email}</p>
                  <span className="inline-block mt-1 text-[10px] font-semibold text-primary bg-pink-50 px-2 py-0.5 rounded-full">
                    {currentGroup ? currentGroup.name : 'グループ未選択'}
                  </span>
                </div>
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setName(user?.name || '');
                  setAvatarKey(user?.avatarKey || null);
                  setIsEditing(true);
                }}
              >
                編集
              </Button>
            </div>
          )}
        </Card>

        {/* ナビゲーションリンク一覧 */}
        <div className="space-y-2">
          <Link href="/groups" className="block">
            <Card hoverable className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-pink-100/80 flex items-center justify-center text-primary">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-800">グループ管理</h4>
                  <p className="text-[10px] text-gray-400">
                    招待コードの確認、グループの作成・参加
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </Card>
          </Link>

          <Link href="/friends" className="block">
            <Card hoverable className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-rose-100/80 flex items-center justify-center text-rose-500">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-800">ともだち管理</h4>
                  <p className="text-[10px] text-gray-400">
                    友達一覧、申請の確認
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </Card>
          </Link>

          <Link href="/favorites" className="block">
            <Card hoverable className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-red-100/80 flex items-center justify-center text-red-500">
                  <Heart className="w-5 h-5 fill-red-500" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-800">
                    お気に入りレシピ
                  </h4>
                  <p className="text-[10px] text-gray-400">保存したレシピ一覧</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </Card>
          </Link>
        </div>

        {/* ログアウト */}
        <div className="pt-4">
          <Button
            variant="outline"
            className="w-full text-red-500 hover:bg-red-50 hover:border-red-200 border-pink-100 py-3 flex items-center justify-center gap-2"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            <span>ログアウト</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

