'use client';

import React, { useState, useRef } from 'react';
import { Camera, X, Loader2 } from 'lucide-react';
import { uploadImageToS3 } from '@/lib/clientUpload';
import { getImageUrl } from '@/lib/image';

interface ImageUploadProps {
  value?: string | null; // S3キーまたはURL
  onChange: (s3Key: string | null) => void;
  folder?: 'recipes' | 'cooking-records' | 'groups' | 'users';
  className?: string;
  aspectRatio?: 'square' | 'video' | 'wide';
}

export function ImageUpload({
  value,
  onChange,
  folder = 'recipes',
  className = '',
  aspectRatio = 'video',
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const s3Key = await uploadImageToS3(file, folder);
      onChange(s3Key);
    } catch (err: any) {
      console.error('[ImageUpload] Error:', err);
      alert(err.message || '画像のアップロードに失敗しました');
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  const previewUrl = value ? getImageUrl(value) : null;

  const aspectClass =
    aspectRatio === 'square'
      ? 'aspect-square'
      : aspectRatio === 'wide'
      ? 'aspect-[16/9]'
      : 'aspect-[4/3]';

  return (
    <div className={`relative ${className}`}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {previewUrl ? (
        <div
          onClick={() => inputRef.current?.click()}
          className={`relative w-full ${aspectClass} rounded-2xl overflow-hidden border border-pink-100 group cursor-pointer shadow-sm`}
        >
          <img
            src={previewUrl}
            alt="Uploaded preview"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold backdrop-blur-[2px]">
            タップして変更
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors shadow-md"
            aria-label="削除"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className={`w-full ${aspectClass} rounded-3xl border-2 border-dashed border-pink-200/90 bg-gradient-to-br from-pink-50/80 via-orange-50/40 to-pink-100/60 hover:from-pink-100/60 hover:to-orange-100/50 flex flex-col items-center justify-center p-4 transition-all cursor-pointer group disabled:cursor-not-allowed shadow-2xs hover:shadow-sm`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2 text-primary">
              <Loader2 className="w-7 h-7 animate-spin" />
              <span className="text-xs font-bold">圧縮・アップロード中...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  🍳
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shadow-xs">
                  <Camera className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="space-y-0.5">
                <span className="block text-xs font-extrabold text-gray-800 group-hover:text-primary transition-colors">
                  完成した料理の写真をのせよう📸
                </span>
                <span className="block text-[10px] text-gray-500 font-medium leading-relaxed">
                  美味しそうな写真を追加すると食欲をそそります✨（タップして選択）
                </span>
              </div>
            </div>
          )}
        </button>
      )}
    </div>
  );
}

