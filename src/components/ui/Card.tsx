'use client';

import { cn } from '@/lib/formatters';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glass?: boolean;
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg';
}

const paddingMap = { sm: 'p-3', md: 'p-5', lg: 'p-6' };

export default function Card({ children, className, glass = false, hover = true, padding = 'md' }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl transition-all duration-200',
        glass ? 'glass' : 'bg-white border border-gray-200 shadow-xs',
        hover && 'hover:shadow-md hover:-translate-y-0.5',
        paddingMap[padding],
        className
      )}
      style={{ containerType: 'inline-size' }}
    >
      {children}
    </div>
  );
}
