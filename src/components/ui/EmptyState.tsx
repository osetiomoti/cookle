import React from 'react';
import Link from 'next/link';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: string | React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = '🍽️',
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-20 h-20 rounded-3xl bg-pink-50 border border-pink-100 flex items-center justify-center text-4xl mb-4 shadow-sm animate-bounce-slow">
        {icon}
      </div>
      <h3 className="text-base font-bold text-gray-800 mb-1.5">{title}</h3>
      {description && <p className="text-xs text-gray-500 max-w-xs mb-6 leading-relaxed">{description}</p>}

      {actionLabel && actionHref && (
        <Link href={actionHref}>
          <Button size="sm">{actionLabel}</Button>
        </Link>
      )}

      {actionLabel && onAction && !actionHref && (
        <Button size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

