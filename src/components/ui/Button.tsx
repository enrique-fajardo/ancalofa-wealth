'use client';

import { cn } from '@/lib/formatters';
import { Loader2, type LucideIcon } from 'lucide-react';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

const variantStyles = {
  primary: 'bg-primary text-white hover:bg-primary-dark',
  secondary: 'bg-white text-primary border border-primary hover:bg-primary-50',
  accent: 'bg-accent text-dark hover:bg-accent-dark',
  ghost: 'bg-transparent text-primary hover:bg-primary-50',
  danger: 'bg-error text-white hover:bg-error/90',
};

const sizeStyles = {
  sm: 'text-xs h-8 px-3 gap-1.5',
  md: 'text-sm h-9 px-4 gap-2',
  lg: 'text-base h-11 px-5 gap-2',
};

export default function Button({
  children, variant = 'primary', size = 'md', icon: Icon, iconPosition = 'left',
  loading = false, disabled = false, className, onClick, type = 'button',
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200',
        variantStyles[variant],
        sizeStyles[size],
        (disabled || loading) && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {!loading && Icon && iconPosition === 'left' && <Icon className="w-4 h-4" />}
      {children}
      {!loading && Icon && iconPosition === 'right' && <Icon className="w-4 h-4" />}
    </button>
  );
}
