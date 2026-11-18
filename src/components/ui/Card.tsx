import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export function Card({ className = '', hoverable = false, children, ...props }: CardProps) {
  return (
    <div
      className={`bg-white rounded-card p-4.5 border border-pink-100/50 shadow-soft transition-all duration-200 ${
        hoverable ? 'hover:-translate-y-0.5 hover:shadow-lg hover:border-pink-200' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

