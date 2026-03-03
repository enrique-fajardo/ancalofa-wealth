'use client';

import Link from 'next/link';
import { useLocale } from '@/hooks/useLocale';
import { cn } from '@/lib/formatters';
import { AlertTriangle, XCircle, Info, Bell, ArrowRight } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import type { Alert } from '@/types';

interface AlertsPanelProps {
  alerts: Alert[];
}

const severityConfig: Record<string, { icon: typeof AlertTriangle; border: string; color: string }> = {
  P1: { icon: XCircle, border: 'border-l-error', color: 'text-error' },
  P2: { icon: AlertTriangle, border: 'border-l-warning', color: 'text-warning' },
  P3: { icon: Bell, border: 'border-l-accent', color: 'text-accent' },
  P4: { icon: Info, border: 'border-l-info', color: 'text-info' },
};

export default function AlertsPanel({ alerts }: AlertsPanelProps) {
  const { t } = useLocale();
  const active = alerts.filter(a => !a.is_acknowledged).slice(0, 5);

  return (
    <Card hover={false}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900">{t('dashboard.alerts')}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{t('dashboard.alerts_subtitle')}</p>
        </div>
        <Link href="/alerts" className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
          {t('dashboard.view_all')} <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="space-y-2">
        {active.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">{t('dashboard.no_alerts')}</p>
        ) : (
          active.map(alert => {
            const config = severityConfig[alert.severity] || severityConfig.P4;
            const Icon = config.icon;
            return (
              <div
                key={alert.alert_id}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg border-l-4 bg-gray-50/50',
                  config.border
                )}
              >
                <Icon className={cn('w-4 h-4 mt-0.5 shrink-0', config.color)} strokeWidth={1.5} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant={alert.severity.toLowerCase() as 'p1' | 'p2' | 'p3' | 'p4'} size="sm">
                      {t(`severity.${alert.severity}`)}
                    </Badge>
                    <span className="text-[10px] text-gray-400">{alert.category}</span>
                    <span className="text-sm font-medium text-gray-800 truncate">{alert.title}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{alert.message}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
