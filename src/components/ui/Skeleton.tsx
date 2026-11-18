import React from 'react';

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-pink-100/50 rounded-2xl ${className}`} />;
}

