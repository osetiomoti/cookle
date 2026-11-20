'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import useSWR from 'swr';
import { Search, Plus, X } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

export interface TagItem {
  id: string;
  name: string;
}

interface TagSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTagIds: string[];
  onSelect: (selectedIds: string[], selectedTags: TagItem[]) => void;
}

export function TagSelector({
  isOpen,
  onClose,
  selectedTagIds,
  onSelect,
}: TagSelectorProps) {
  const { currentGroup } = useApp();
  const [showGroupTags, setShowGroupTags] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tempSelectedIds, setTempSelectedIds] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 通常タグ一覧
  const baseQuery = currentGroup
    ? `/api/tags?groupId=${currentGroup.id}`
    : '/api/tags';
  const { data: myTags, mutate: mutateMyTags, isLoading } = useSWR<TagItem[]>(
    isOpen ? (showGroupTags ? `${baseQuery}${baseQuery.includes('?') ? '&' : '?'}includeAll=true` : baseQuery) : null
  );

  // モーダルオープン時の初期化
  useEffect(() => {
    if (isOpen) {
      setTempSelectedIds([...selectedTagIds]);
      setSearchQuery('');
      setIsCreating(false);
      setNewTagName('');
    }
  }, [isOpen, selectedTagIds]);

  const availableTags = useMemo(() => {
    return myTags || [];
  }, [myTags]);

  // 選択中タグ一覧
  const selectedTagItems = useMemo(() => {
    return availableTags.filter((t) => tempSelectedIds.includes(t.id));
  }, [availableTags, tempSelectedIds]);

  // 検索フィルタリング
  const filteredTags = useMemo(() => {
    const query = searchQuery.trim().replace(/^#/, '').toLowerCase();
    if (!query) return availableTags;
    return availableTags.filter((t) => t.name.toLowerCase().includes(query));
  }, [availableTags, searchQuery]);

  const toggleTag = (tagId: string) => {
    setTempSelectedIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  // 新規タグ作成・選択
  const handleCreateTag = async (name: string) => {
    const trimmed = name.trim().replace(/^#/, '');
    if (!trimmed) return;

    try {
      const res = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: currentGroup?.id || undefined,
          name: trimmed,
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        const newTag: TagItem = json.data;
        mutateMyTags();
        if (!tempSelectedIds.includes(newTag.id)) {
          setTempSelectedIds((prev) => [...prev, newTag.id]);
        }
      }
    } catch (err) {
      console.error('Failed to create tag', err);
    } finally {
      setIsCreating(false);
      setNewTagName('');
      setSearchQuery('');
    }
  };

  const handleConfirm = () => {
    const selectedObjects = availableTags.filter((t) =>
      tempSelectedIds.includes(t.id)
    );
    onSelect(tempSelectedIds, selectedObjects);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end overflow-hidden animate-in fade-in duration-200">
      {/* 背景オーバーレイ */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* ボトムシート */}
      <div className="relative w-full max-w-lg mx-auto bg-white rounded-t-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300 max-h-[85vh] flex flex-col">
        {/* 上部ハンドルバー */}
        <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mt-3 mb-1" />

        {/* ヘッダー */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-500">タグを選択</h2>
          <button
            type="button"
            onClick={handleConfirm}
            className="text-primary font-bold text-base hover:opacity-80 transition-opacity px-2 py-1"
          >
            決定
          </button>
        </div>

        {/* 全員のタグを含むトグル */}
        <div className="px-6 pt-3 pb-1 flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100 hover:bg-pink-50/40 transition-colors">
            <span className="text-xs font-bold text-gray-500 whitespace-nowrap">
              全員のタグを含む
            </span>
            <div className="relative flex items-center">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={showGroupTags}
                onChange={(e) => setShowGroupTags(e.target.checked)}
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary shadow-inner"></div>
            </div>
          </label>
        </div>

        {/* 検索バー */}
        <div className="px-6 py-3">
          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={16}
            />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="タグ検索"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  e.preventDefault();
                  handleCreateTag(searchQuery);
                }
              }}
              className="w-full bg-gray-50 border-none rounded-2xl py-3 pl-11 pr-4 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-medium"
            />
          </div>
        </div>

        {/* 選択中のタグ表示 */}
        {selectedTagItems.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-6 pb-2 min-h-8">
            {selectedTagItems.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-900 text-white rounded-full text-xs font-bold animate-in zoom-in-95 duration-150"
              >
                #{tag.name}
                <X
                  size={12}
                  className="cursor-pointer opacity-70 hover:opacity-100"
                  onClick={() => toggleTag(tag.id)}
                />
              </span>
            ))}
          </div>
        )}

        {/* タグ一覧エリア */}
        <div className="flex-1 overflow-y-auto px-6 py-3 pb-8">
          <div className="flex flex-wrap gap-2">
            {/* "+ 新しいタグ" ボタン（インライン作成） */}
            {isCreating ? (
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-pink-200 bg-pink-50/50 text-primary animate-in zoom-in-95">
                <span className="text-xs font-bold opacity-70">#</span>
                <input
                  type="text"
                  placeholder="タグ名を入力"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onBlur={() => {
                    setTimeout(() => {
                      if (!newTagName.trim()) setIsCreating(false);
                    }, 200);
                  }}
                  className="bg-transparent border-none p-0 text-xs font-medium text-gray-800 placeholder:text-gray-400 focus:outline-none w-24"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCreateTag(newTagName);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleCreateTag(newTagName)}
                  className="text-xs font-bold text-primary hover:text-pink-600 whitespace-nowrap ml-1"
                >
                  追加
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsCreating(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border border-gray-200 bg-white text-gray-500 font-bold text-xs transition-all hover:border-primary hover:text-primary active:scale-95"
              >
                <Plus size={14} strokeWidth={2.5} />
                <span>新しいタグ</span>
              </button>
            )}

            {/* 検索入力時に一致するタグがない場合「# [文字] 追加」ボタン */}
            {searchQuery.trim() &&
              !availableTags.some(
                (t) =>
                  t.name.toLowerCase() ===
                  searchQuery.trim().replace(/^#/, '').toLowerCase()
              ) && (
                <button
                  type="button"
                  onClick={() => handleCreateTag(searchQuery)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border border-dashed border-primary bg-pink-50/40 text-primary font-bold text-xs transition-all active:scale-95 animate-in zoom-in-95"
                >
                  <Plus size={13} strokeWidth={2.5} />
                  <span>#{searchQuery.trim().replace(/^#/, '')} を追加</span>
                </button>
              )}

            {/* 既存タグ候補一覧 */}
            {isLoading ? (
              <div className="w-full flex items-center justify-center py-6 text-gray-300 text-xs">
                読み込み中...
              </div>
            ) : (
              filteredTags.map((tag) => {
                const isSelected = tempSelectedIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`
                      flex items-center gap-1 px-3.5 py-2 rounded-2xl border font-bold text-xs transition-all active:scale-95
                      ${
                        isSelected
                          ? 'bg-pink-50 border-primary text-primary shadow-sm'
                          : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'
                      }
                    `}
                  >
                    <span className="opacity-60">#</span>
                    <span>{tag.name}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

