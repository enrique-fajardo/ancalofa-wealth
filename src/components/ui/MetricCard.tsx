'use client';

import { cn } from '@/lib/formatters';
import { TrendingUp, TrendingDown, type LucideIcon } from 'lucide-react';
import Card from './Card';

interface PillProps {
  label: string;
  type: 'success' | 'warning' | 'error';
}

interface MetricCardProps {
  label: string;
  value: string;
  delta?: string;
  deltaType?: 'positive' | 'negative' | 'neutral';
  icon?: LucideIcon;
  iconColor?: string;
  className?: string;
  pill?: PillProps;
}

export default function MetricCard({ label, value, delta, deltaType = 'neutral', icon: Icon, iconColor, className, pill }: MetricCardProps) {
  return (
    <Card glass hover={false} className={cn('relative', className)}>
      {Icon && (
        <div className={cn('absolute top-4 right-4 p-2 rounded-lg', iconColor || 'bg-primary-50')}>
          <Icon className="w-5 h-5 text-primary" />
        </div>
      )}
      <p className="metric-label">{label}</p>
      <p className="metric-value mt-1 text-gray-900 overflow-hidden text-ellipsis">{value}</p>
      {delta && (
        <div className="flex items-center gap-1 mt-2">
          {deltaType === 'positive' && <TrendingUp className="w-3.5 h-3.5 text-success" />}
          {deltaType === 'negative' && <TrendingDown className="w-3.5 h-3.5 text-error" />}
          <span className={cn(
            'text-xs font-semibold',
            deltaType === 'positive' && 'text-success',
            deltaType === 'negative' && 'text-error',
            deltaType === 'neutral' && 'text-gray-500'
          )}>
            {delta}
          </span>
        </div>
      )}
      {pill && (
        <div className={cn(
          'mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold',
          pill.type === 'success' && 'bg-success/10 text-success',
          pill.type === 'warning' && 'bg-warning/10 text-warning',
          pill.type === 'error'   && 'bg-error/10 text-error',
        )}>
          {pill.label}
        </div>
      )}
    </Card>
  );
}
