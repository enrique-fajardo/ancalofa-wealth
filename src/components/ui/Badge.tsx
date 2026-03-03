'use client';

import { cn } from '@/lib/formatters';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple' | 'p1' | 'p2' | 'p3' | 'p4';
  size?: 'sm' | 'md';
  className?: string;
}

const variantStyles: Record<string, string> = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-success-light text-success',
  warning: 'bg-warning-light text-warning',
  error: 'bg-error-light text-error',
  info: 'bg-info-light text-info',
  purple: 'bg-purple-50 text-purple',
  p1: 'bg-error-light text-error',
  p2: 'bg-warning-light text-warning',
  p3: 'bg-accent-50 text-accent-800',
  p4: 'bg-info-light text-info',
};

const sizeStyles = {
  sm: 'text-[10px] px-1.5 py-0.5',
  md: 'text-xs px-2 py-1',
};

export default function Badge({ children, variant = 'default', size = 'md', className }: BadgeProps) {
  return (
    <span className={cn('rounded-full font-semibold inline-flex items-center', variantStyles[variant], sizeStyles[size], className)}>
      {children}
    </span>
  );
}
