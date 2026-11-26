'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import useSWR from 'swr';
import { useApp } from '@/contexts/AppContext';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/Toast';
import {
  Settings,
  Plus,
  Users,
  UserPlus,
  Heart,
  Calendar,
  Camera,
  BookOpen,
  Copy,
  Check,
  LogOut,
  Clock,
  ChevronRight,
  User as UserIcon,
  Pencil,
  ChefHat,
  Tag as TagIcon,
} from 'lucide-react';
import { getImageUrl } from '@/lib/image';
import { formatCookTime, formatDate, getUserDisplayName } from '@/lib/utils';

export default function MyPage() {
  const { user, groups, currentGroup, mutateUser } = useApp();
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<'recipes' | 'records' | 'favorites'>('recipes');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // プロフィール編集用
  const [name, setName] = useState(user?.name || '');
  const [avatarKey, setAvatarKey] = useState<string | null>(user?.avatarKey || null);
  const [isUpdating, setIsUpdating] = useState(false);

  // 自分のレシピ一覧
  const { data: myRecipes, isLoading: recipesLoading } = useSWR<any[]>('/api/recipes?isMine=true');

  // 自分の料理記録一覧
  const { data: myRecords, isLoading: recordsLoading } = useSWR<any[]>('/api/cooking-records?isMine=true');

  // お気に入りレシピ一覧
  const { data: favorites, isLoading: favoritesLoading } = useSWR<any[]>('/api/favorites');

  // ともだち一覧
  const { data: friends } = useSWR<any[]>('/api/friends');

  // マイページの件数は取得完了まで「-」表示にして「0」のチラつきを防止 (Requirement 8)
  const recipeCount = recipesLoading || !myRecipes ? '-' : myRecipes.length;
  const recordCount = recordsLoading || !myRecords ? '-' : myRecords.length;
  const friendCount = !friends ? '-' : friends.length;
  const favoriteCount = favoritesLoading || !favorites ? '-' : favorites.length;

  // ユーザーIDコピー
  const handleCopyId = () => {
    if (!user?.id) return;
    navigator.clipboard.writeText(user.id);
    setCopiedId(true);
    success('ユーザーIDをコピーしました！');
    setTimeout(() => setCopiedId(false), 2500);
  };

  // プロフィール更新
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
      setIsSettingsOpen(false);
    } catch (err: any) {
      error(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  // ログアウト
  const handleLogout = () => {
    if (!confirm('ログアウトしますか？')) return;
    localStorage.removeItem('cookle_rt');
    localStorage.removeItem('cookle_current_group');
    window.location.href = '/api/auth/logout';
  };

  const avatarUrl = user?.avatarKey ? getImageUrl(user.avatarKey) : null;

  return (
    <div className="min-h-screen bg-white pb-28">
      {/* ヘッダー（右上に設定歯車アイコン） */}
      <Header
        title="マイページ"
        rightAction={
          <button
            onClick={() => {
              setName(getUserDisplayName(user));
              setAvatarKey(user?.avatarKey || null);
              setIsSettingsOpen(true);
            }}
            className="p-2 text-gray-600 hover:text-primary transition-colors rounded-full hover:bg-pink-50"
            aria-label="設定"
          >
            <Settings className="w-5 h-5 stroke-[2]" />
          </button>
        }
      />

      <div className="max-w-xl mx-auto px-4 py-4 space-y-5">
        {/* プロフィール＆統計情報行（tabereco風） */}
        <div className="flex items-center justify-between pt-1">
          {/* アバター（編集ボタン付き） */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-full bg-pink-50 flex items-center justify-center border-2 border-white shadow-md overflow-hidden relative">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={user?.name || 'User'}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-pink-100 to-rose-50 text-primary">
                  <UserIcon className="w-9 h-9" />
                </div>
              )}
            </div>
            <button
              onClick={() => {
                setName(getUserDisplayName(user));
                setAvatarKey(user?.avatarKey || null);
                setIsSettingsOpen(true);
              }}
              className="absolute bottom-0 right-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center border-2 border-white shadow-sm hover:scale-110 active:scale-95 transition-transform"
              aria-label="プロフィールを編集"
            >
              <Pencil className="w-3 h-3 stroke-[2.5]" />
            </button>
          </div>

          {/* Stats Row（レシピ | 料理記録 | ともだち | お気に入り） */}
          <div className="flex-1 flex justify-around ml-2 items-center text-center">
            {/* レシピ */}
            <button
              onClick={() => setActiveTab('recipes')}
              className="flex flex-col items-center hover:scale-105 transition-transform"
            >
              <span className="text-lg font-black text-gray-900 leading-none">
                {recipeCount}
              </span>
              <span className="text-[10px] text-gray-400 font-bold mt-1">レシピ</span>
            </button>

            {/* 料理記録 */}
            <button
              onClick={() => setActiveTab('records')}
              className="flex flex-col items-center hover:scale-105 transition-transform"
            >
              <span className="text-lg font-black text-gray-900 leading-none">
                {recordCount}
              </span>
              <span className="text-[10px] text-gray-400 font-bold mt-1">料理記録</span>
            </button>

            {/* ともだち */}
            <Link
              href="/friends"
              className="flex flex-col items-center hover:scale-105 transition-transform"
            >
              <span className="text-lg font-black text-gray-900 leading-none">
                {friendCount}
              </span>
              <span className="text-[10px] text-gray-400 font-bold mt-1">ともだち</span>
            </Link>

            {/* お気に入り */}
            <button
              onClick={() => setActiveTab('favorites')}
              className="flex flex-col items-center hover:scale-105 transition-transform"
            >
              <span className="text-lg font-black text-primary leading-none">
                {favoriteCount}
              </span>
              <span className="text-[10px] text-gray-400 font-bold mt-1">お気に入り</span>
            </button>
          </div>
        </div>

        {/* ユーザー名＆IDコピー */}
        <div className="space-y-1">
          <h2 className="text-lg font-extrabold text-gray-900">
            {getUserDisplayName(user)}
          </h2>
          {user?.id && (
            <button
              onClick={handleCopyId}
              className="inline-flex items-center gap-1.5 text-[11px] font-mono text-gray-400 bg-gray-50 hover:bg-pink-50 hover:text-primary px-2.5 py-1 rounded-lg border border-gray-100 transition-colors"
            >
              <span>ID: {user.id.slice(0, 8)}...</span>
              {copiedId ? (
                <Check className="w-3 h-3 text-emerald-500" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          )}
        </div>

        {/* 新規レシピ投稿ボタン（tabereco風の大型アクションボタン） */}
        <div>
          <Link
            href="/recipes/new"
            className="w-full py-3.5 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-lg shadow-primary/25 bg-gradient-to-r from-pink-500 via-primary to-rose-400 hover:scale-[1.01] active:scale-98 transition-all"
          >
            <div className="p-1 bg-white/20 rounded-lg">
              <Plus className="w-4 h-4 stroke-[3]" />
            </div>
            <span>新しくレシピを投稿する</span>
          </Link>
        </div>

        {/* 4分割クイックアクション（tabereco風グリッド） */}
        <div className="grid grid-cols-4 gap-2">
          {/* グループ管理 */}
          <Link
            href="/groups"
            className="flex flex-col items-center justify-center p-2.5 bg-gray-50/80 hover:bg-pink-50/60 border border-gray-100 rounded-2xl transition-all shadow-2xs group text-center"
          >
            <Users className="w-5 h-5 text-gray-600 group-hover:text-primary transition-colors mb-1" />
            <span className="text-[10px] font-bold text-gray-700 leading-tight">
              グループ
            </span>
          </Link>

          {/* ともだち */}
          <Link
            href="/friends"
            className="flex flex-col items-center justify-center p-2.5 bg-gray-50/80 hover:bg-pink-50/60 border border-gray-100 rounded-2xl transition-all shadow-2xs group text-center"
          >
            <UserPlus className="w-5 h-5 text-gray-600 group-hover:text-primary transition-colors mb-1" />
            <span className="text-[10px] font-bold text-gray-700 leading-tight">
              ともだち
            </span>
          </Link>

          {/* 献立カレンダー */}
          <Link
            href="/meal-plans"
            className="flex flex-col items-center justify-center p-2.5 bg-gray-50/80 hover:bg-pink-50/60 border border-gray-100 rounded-2xl transition-all shadow-2xs group text-center"
          >
            <Calendar className="w-5 h-5 text-gray-600 group-hover:text-primary transition-colors mb-1" />
            <span className="text-[10px] font-bold text-gray-700 leading-tight">
              献立
            </span>
          </Link>

          {/* 料理記録 */}
          <Link
            href="/cooking-records"
            className="flex flex-col items-center justify-center p-2.5 bg-gray-50/80 hover:bg-pink-50/60 border border-gray-100 rounded-2xl transition-all shadow-2xs group text-center"
          >
            <Camera className="w-5 h-5 text-gray-600 group-hover:text-primary transition-colors mb-1" />
            <span className="text-[10px] font-bold text-gray-700 leading-tight">
              料理記録
            </span>
          </Link>
        </div>

        {/* リクエスト＆タグ別レシピへのショートカット */}
        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/recipe-requests"
            className="flex items-center gap-2.5 p-2.5 bg-pink-50/50 hover:bg-pink-100/60 border border-pink-100 rounded-2xl transition-all shadow-2xs group"
          >
            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-primary shadow-2xs shrink-0">
              <ChefHat className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-gray-800 block truncate">
                作って！リクエスト
              </span>
              <span className="text-[9px] text-gray-400 block truncate">
                おねだり・お願い
              </span>
            </div>
          </Link>

          <Link
            href="/tags"
            className="flex items-center gap-2.5 p-2.5 bg-amber-50/40 hover:bg-amber-100/50 border border-amber-100 rounded-2xl transition-all shadow-2xs group"
          >
            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-amber-600 shadow-2xs shrink-0">
              <TagIcon className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-gray-800 block truncate">
                タグ別レシピ
              </span>
              <span className="text-[9px] text-gray-400 block truncate">
                カテゴリ・人気タグ
              </span>
            </div>
          </Link>
        </div>

        {/* タブ切り替え（マイページのコンテンツ一覧） */}
        <div className="pt-2">
          <div className="flex bg-gray-100/90 p-1 rounded-2xl mb-4">
            <button
              type="button"
              onClick={() => setActiveTab('recipes')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'recipes'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              レシピ {typeof recipeCount === 'number' ? `(${recipeCount})` : ''}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('records')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'records'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              料理記録 {typeof recordCount === 'number' ? `(${recordCount})` : ''}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('favorites')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'favorites'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              お気に入り {typeof favoriteCount === 'number' ? `(${favoriteCount})` : ''}
            </button>
          </div>

          {/* 1. レシピ一覧タブ */}
          {activeTab === 'recipes' && (
            <div>
              {recipesLoading ? (
                <div className="grid grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="aspect-[4/3] rounded-3xl" />
                  ))}
                </div>
              ) : myRecipes && myRecipes.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {myRecipes.map((r: any) => (
                    <Link key={r.id} href={`/recipes/${r.id}`} className="group block">
                      <Card className="overflow-hidden border-pink-100/70 hover:shadow-md transition-all">
                        <div className="aspect-[4/3] bg-pink-50 relative overflow-hidden">
                          {r.mainImageUrl ? (
                            <img
                              src={r.mainImageUrl}
                              alt={r.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl">
                              🍳
                            </div>
                          )}
                          {r.cookTimeMin && (
                            <span className="absolute bottom-2 right-2 text-[10px] font-bold bg-black/60 text-white px-2 py-0.5 rounded-full backdrop-blur-xs flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5" />
                              {formatCookTime(r.cookTimeMin)}
                            </span>
                          )}
                        </div>
                        <div className="p-2.5 space-y-1">
                          <h4 className="text-xs font-bold text-gray-900 truncate">
                            {r.title}
                          </h4>
                          <p className="text-[10px] text-gray-400">
                            {formatDate(r.createdAt)}
                          </p>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-gray-50/70 rounded-3xl border border-dashed border-gray-200 p-6 space-y-2">
                  <div className="text-3xl">📖</div>
                  <h4 className="text-xs font-bold text-gray-700">まだレシピがありません</h4>
                  <p className="text-[11px] text-gray-400">自慢のレシピを投稿してみましょう！</p>
                  <Link href="/recipes/new" className="inline-block pt-1">
                    <Button size="sm" className="text-xs">
                      レシピを投稿する
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* 2. 料理記録一覧タブ */}
          {activeTab === 'records' && (
            <div>
              {recordsLoading ? (
                <div className="space-y-2.5">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-28 w-full rounded-2xl" />
                  ))}
                </div>
              ) : myRecords && myRecords.length > 0 ? (
                <div className="space-y-3">
                  {myRecords.map((rec: any) => (
                    <Card key={rec.id} className="p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-gray-900">{rec.title}</h4>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {formatDate(rec.cookedAt)}
                        </span>
                      </div>
                      {((rec.photos && rec.photos.length > 0 && rec.photos[0].imageUrl) ||
                        (rec.photoUrls && rec.photoUrls.length > 0)) && (
                        <div className="aspect-video w-full rounded-xl overflow-hidden bg-pink-50">
                          <img
                            src={rec.photos?.[0]?.imageUrl || rec.photoUrls?.[0]}
                            alt={rec.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      {rec.memo && (
                        <p className="text-[11px] text-gray-600 bg-pink-50/40 p-2 rounded-xl">
                          {rec.memo}
                        </p>
                      )}
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-gray-50/70 rounded-3xl border border-dashed border-gray-200 p-6 space-y-2">
                  <div className="text-3xl">📸</div>
                  <h4 className="text-xs font-bold text-gray-700">まだ料理記録がありません</h4>
                  <p className="text-[11px] text-gray-400">今日作ったごはんを記録してみましょう！</p>
                  <Link href="/cooking-records" className="inline-block pt-1">
                    <Button size="sm" className="text-xs">
                      料理を記録する
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* 3. お気に入り一覧タブ */}
          {activeTab === 'favorites' && (
            <div>
              {favoritesLoading ? (
                <div className="grid grid-cols-2 gap-3">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="aspect-[4/3] rounded-3xl" />
                  ))}
                </div>
              ) : favorites && favorites.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {favorites.map((fav: any) => {
                    const rId = fav.id || fav.recipe?.id || fav.recipeId;
                    const rTitle = fav.title || fav.recipe?.title || 'レシピ';
                    const rImg = fav.mainImageUrl || fav.recipe?.mainImageUrl;
                    const rCreator = getUserDisplayName(fav.creator || fav.recipe?.creator);

                    return (
                      <Link
                        key={fav.favoriteId || fav.id || rId}
                        href={`/recipes/${rId}`}
                        className="group block"
                      >
                        <Card className="overflow-hidden border-pink-100/70 hover:shadow-md transition-all">
                          <div className="aspect-[4/3] bg-pink-50 relative overflow-hidden">
                            {rImg ? (
                              <img
                                src={rImg}
                                alt={rTitle}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-3xl">
                                🍳
                              </div>
                            )}
                            <span className="absolute top-2 right-2 p-1 rounded-full bg-white/90 text-rose-500 shadow-2xs">
                              <Heart className="w-3.5 h-3.5 fill-rose-500" />
                            </span>
                          </div>
                          <div className="p-2.5 space-y-1">
                            <h4 className="text-xs font-bold text-gray-900 truncate">
                              {rTitle}
                            </h4>
                            {rCreator && (
                              <span className="text-[10px] text-gray-400">
                                {rCreator}
                              </span>
                            )}
                          </div>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10 bg-gray-50/70 rounded-3xl border border-dashed border-gray-200 p-6 space-y-2">
                  <div className="text-3xl">❤️</div>
                  <h4 className="text-xs font-bold text-gray-700">お気に入りはまだありません</h4>
                  <p className="text-[11px] text-gray-400">レシピ詳細のハートボタンでお気に入りに追加できます！</p>
                  <Link href="/recipes" className="inline-block pt-1">
                    <Button size="sm" className="text-xs">
                      レシピを探す
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 設定・プロフィール編集モーダル（右上の歯車タップ時） */}
      <Modal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title="アカウント設定"
      >
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="flex flex-col items-center gap-2">
            <div className="w-20 h-20">
              <ImageUpload
                value={avatarKey}
                onChange={setAvatarKey}
                folder="users"
                aspectRatio="square"
              />
            </div>
            <span className="text-[11px] text-gray-400">アイコン写真を変更</span>
          </div>

          <Input
            label="ニックネーム"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 ml-1">
              メールアドレス
            </label>
            <p className="text-xs text-gray-500 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
              {user?.email || '未設定'}
            </p>
          </div>

          <Button
            type="submit"
            className="w-full py-3"
            size="lg"
            isLoading={isUpdating}
          >
            プロフィールを保存
          </Button>

          <div className="pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full py-2.5 rounded-xl border border-red-200 text-xs font-bold text-red-500 hover:bg-red-50 flex items-center justify-center gap-1.5 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>ログアウト</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
