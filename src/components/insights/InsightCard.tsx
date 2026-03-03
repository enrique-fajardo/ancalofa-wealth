'use client';

import { cn } from '@/lib/formatters';
import { useLocale } from '@/hooks/useLocale';
import { XCircle, AlertTriangle, Bell, Info, ShieldAlert, Target, TrendingUp, TrendingDown } from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import type { Insight } from '@/types';

interface InsightCardProps {
  title: string;
  icon: React.ReactNode;
  insights: Insight[];
  emptyMessage?: string;
}

const severityConfig: Record<string, { icon: typeof AlertTriangle; color: string; bg: string; label: string }> = {
  P1: { icon: XCircle, color: 'text-error', bg: 'bg-error-light', label: 'CRITICAL' },
  P2: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning-light', label: 'WARNING' },
  P3: { icon: Bell, color: 'text-accent', bg: 'bg-accent-50', label: 'NOTICE' },
  P4: { icon: Info, color: 'text-info', bg: 'bg-info-light', label: 'INFO' },
};

const categoryIcons: Record<string, typeof ShieldAlert> = {
  risk: ShieldAlert,
  opportunity: Target,
  alert: AlertTriangle,
  recommendation: TrendingUp,
  status: Info,
};

export default function InsightCard({ title, icon, insights, emptyMessage }: InsightCardProps) {
  const { t } = useLocale();

  return (
    <Card hover={false}>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {insights.length > 0 && (
          <Badge variant={insights.some(i => i.severity === 'P1') ? 'p1' : insights.some(i => i.severity === 'P2') ? 'p2' : 'default'} size="sm">
            {insights.length}
          </Badge>
        )}
      </div>

      {insights.length === 0 ? (
        <p className="text-sm text-gray-400 py-4 text-center">{emptyMessage || t('table.no_data')}</p>
      ) : (
        <div className="space-y-2.5">
          {insights.map(insight => {
            const config = severityConfig[insight.severity] || severityConfig.P4;
            const Icon = config.icon;
            const CatIcon = categoryIcons[insight.category] || Info;

            return (
              <div
                key={insight.id}
                className={cn(
                  'flex items-start gap-2.5 p-2.5 rounded-lg border-l-3',
                  insight.severity === 'P1' && 'border-l-error bg-error-light/20',
                  insight.severity === 'P2' && 'border-l-warning bg-warning-light/20',
                  insight.severity === 'P3' && 'border-l-accent bg-accent-50/20',
                  insight.severity === 'P4' && 'border-l-info bg-info-light/20',
                )}
              >
                <Icon className={cn('w-4 h-4 mt-0.5 shrink-0', config.color)} strokeWidth={2} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={cn(
                      'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold',
                      config.bg, config.color
                    )}>
                      {config.label}
                    </span>
                    <CatIcon className="w-3 h-3 text-gray-400" strokeWidth={1.5} />
                  </div>
                  <p className="text-sm font-medium text-gray-900 mt-1">{insight.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{insight.message}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
