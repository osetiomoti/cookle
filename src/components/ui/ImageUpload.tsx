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
          className={`w-full ${aspectClass} rounded-2xl border-2 border-dashed border-pink-200 bg-pink-50/50 hover:bg-pink-50 flex flex-col items-center justify-center p-4 transition-colors cursor-pointer group disabled:cursor-not-allowed`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2 text-primary">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-xs font-medium">圧縮・アップロード中...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-gray-400 group-hover:text-primary transition-colors">
              <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center">
                <Camera className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xs font-bold text-gray-600">写真を追加</span>
              <span className="text-[10px] text-gray-400">料理写真を映えさせよう</span>
            </div>
          )}
        </button>
      )}
    </div>
  );
}

