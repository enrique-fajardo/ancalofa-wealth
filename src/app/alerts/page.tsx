'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { Alert } from '@/types';
import { useLocale } from '@/hooks/useLocale';
import { cn } from '@/lib/formatters';
import { AlertTriangle, XCircle, Info, Bell, CheckCircle } from 'lucide-react';
import Card from '@/components/ui/Card';
import MetricCard from '@/components/ui/MetricCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

const severityConfig: Record<string, { icon: typeof AlertTriangle; border: string; bg: string; color: string }> = {
  P1: { icon: XCircle, border: 'border-l-error', bg: 'bg-error-light/30', color: 'text-error' },
  P2: { icon: AlertTriangle, border: 'border-l-warning', bg: 'bg-warning-light/30', color: 'text-warning' },
  P3: { icon: Bell, border: 'border-l-accent', bg: 'bg-accent-50/30', color: 'text-accent' },
  P4: { icon: Info, border: 'border-l-info', bg: 'bg-info-light/30', color: 'text-info' },
};

export default function AlertsPage() {
  const { t } = useLocale();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    api.getAlerts().then(setAlerts);
  }, []);

  const filtered = filter === 'all' ? alerts : alerts.filter(a => a.severity === filter);
  const active = alerts.filter(a => !a.is_acknowledged);
  const critical = alerts.filter(a => a.severity === 'P1' && !a.is_acknowledged);

  const handleAcknowledge = async (alertId: number) => {
    await api.acknowledgeAlert(alertId);
    setAlerts(prev => prev.map(a => a.alert_id === alertId ? { ...a, is_acknowledged: true, acknowledged_at: new Date().toISOString() } : a));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">{t('alerts.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('alerts.subtitle')}</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard label={t('alerts.active_alerts')} value={String(active.length)} icon={Bell} />
        <MetricCard label={t('alerts.total_alerts')} value={String(alerts.length)} icon={AlertTriangle} iconColor="bg-warning-light" />
        <MetricCard label={t('alerts.critical_count')} value={String(critical.length)} icon={XCircle} iconColor="bg-error-light" />
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('alerts.filter_severity')}:</span>
        {['all', 'P1', 'P2', 'P3', 'P4'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              'px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors',
              filter === s ? 'bg-primary text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-primary hover:text-primary'
            )}
          >
            {s === 'all' ? t('alerts.all_severities') : t(`severity.${s}`)}
          </button>
        ))}
      </div>

      {/* Alert Cards */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card hover={false}>
            <p className="text-sm text-gray-400 text-center py-8">{t('alerts.no_alerts')}</p>
          </Card>
        ) : (
          filtered.map(alert => {
            const config = severityConfig[alert.severity] || severityConfig.P4;
            const Icon = config.icon;
            return (
              <Card key={alert.alert_id} hover={false} className={cn('border-l-4', config.border, alert.is_acknowledged && 'opacity-60')}>
                <div className="flex items-start gap-4">
                  <div className={cn('p-2 rounded-lg', config.bg)}>
                    <Icon className={cn('w-5 h-5', config.color)} strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={alert.severity.toLowerCase() as 'p1' | 'p2' | 'p3' | 'p4'}>{t(`severity.${alert.severity}`)}</Badge>
                      <Badge variant="default" size="sm">{alert.category}</Badge>
                      {alert.is_acknowledged && (
                        <Badge variant="success" size="sm">
                          <CheckCircle className="w-3 h-3 mr-1" /> {t('alerts.acknowledged')}
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900">{alert.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                    <p className="text-xs text-gray-400 mt-2">{new Date(alert.alert_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  {!alert.is_acknowledged && (
                    <Button variant="ghost" size="sm" onClick={() => handleAcknowledge(alert.alert_id)}>
                      {t('alerts.acknowledge')}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
