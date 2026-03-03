'use client';

import { useEffect, useState } from 'react';
import { CalendarClock, AlertTriangle, Clock, DollarSign } from 'lucide-react';
import api from '@/lib/api';
import type { MaturityItem } from '@/types';
import { useLocale } from '@/hooks/useLocale';
import { cn, formatCOP, formatCOPCompact } from '@/lib/formatters';
import MetricCard from '@/components/ui/MetricCard';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';

type Horizon = 30 | 60 | 90 | 0;

export default function MaturitiesPage() {
  const { t } = useLocale();
  const [items, setItems] = useState<MaturityItem[]>([]);
  const [horizon, setHorizon] = useState<Horizon>(0);

  useEffect(() => {
    api.getMaturityItems().then(setItems);
  }, []);

  const today = new Date();
  const getDaysRemaining = (dateStr: string) => {
    const matDate = new Date(dateStr + 'T00:00:00');
    return Math.ceil((matDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const withDays = items.map(item => ({
    ...item,
    daysRemaining: getDaysRemaining(item.maturity_date),
  }));

  const filtered = horizon === 0
    ? withDays
    : withDays.filter(i => i.daysRemaining > 0 && i.daysRemaining <= horizon);

  const upcoming90 = withDays.filter(i => i.daysRemaining > 0 && i.daysRemaining <= 90).length;
  const totalMaturing = withDays.filter(i => i.daysRemaining > 0).length;
  const totalValue = withDays.filter(i => i.daysRemaining > 0).reduce((sum, i) => sum + i.value_at_maturity, 0);

  const getUrgencyColor = (days: number) => {
    if (days <= 0) return 'border-l-red-500 bg-red-50/30';
    if (days <= 30) return 'border-l-red-500 bg-red-50/20';
    if (days <= 90) return 'border-l-orange-400 bg-orange-50/20';
    return 'border-l-green-500 bg-green-50/20';
  };

  const getUrgencyBadge = (days: number): { label: string; variant: 'error' | 'warning' | 'success' } => {
    if (days <= 30) return { label: t('maturities.urgent'), variant: 'error' };
    if (days <= 90) return { label: t('maturities.approaching'), variant: 'warning' };
    return { label: t('maturities.on_track'), variant: 'success' };
  };

  const horizonOptions: { value: Horizon; label: string }[] = [
    { value: 0, label: t('maturities.all') },
    { value: 30, label: t('maturities.days_30') },
    { value: 60, label: t('maturities.days_60') },
    { value: 90, label: t('maturities.days_90') },
  ];

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('maturities.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('maturities.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard label={t('maturities.upcoming')} value={String(upcoming90)} icon={Clock} iconColor="text-warning" />
        <MetricCard label={t('maturities.total_maturing')} value={String(totalMaturing)} icon={CalendarClock} iconColor="text-primary" />
        <MetricCard label={t('maturities.total_value')} value={formatCOPCompact(totalValue)} icon={DollarSign} iconColor="text-success" />
      </div>

      <div className="flex items-center gap-2">
        {horizonOptions.map(opt => (
          <button
            key={opt.value}
            onClick={() => setHorizon(opt.value)}
            className={cn(
              'px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors',
              horizon === opt.value
                ? 'bg-primary text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-primary hover:text-primary'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card glass padding="lg">
          <div className="text-center py-10">
            <CalendarClock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-400">{t('maturities.no_maturities')}</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered
            .sort((a, b) => a.daysRemaining - b.daysRemaining)
            .map(item => {
              const urgency = getUrgencyBadge(item.daysRemaining);
              return (
                <Card key={item.id} className={cn('border-l-4', getUrgencyColor(item.daysRemaining))} padding="md">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">{item.instrument_name}</h3>
                        <Badge variant="default" size="sm">{item.type.toUpperCase()}</Badge>
                        <Badge variant={urgency.variant} size="sm">{urgency.label}</Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                        <span>{t('maturities.investor')}: <span className="text-gray-700 font-medium">{item.investor_name}</span></span>
                        <span>{t('maturities.account')}: <span className="text-gray-700 font-medium">{item.account_id}</span></span>
                        <span>{t('maturities.rate')}: <span className="text-gray-700 font-medium">{item.interest_rate}% EA</span></span>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 sm:text-right">
                      <div>
                        <p className="text-xs text-gray-500">{t('maturities.maturity_date')}</p>
                        <p className="text-sm font-semibold text-gray-900">{formatDate(item.maturity_date)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">{t('maturities.days_remaining')}</p>
                        <p className={cn('text-sm font-bold', item.daysRemaining <= 30 ? 'text-red-600' : item.daysRemaining <= 90 ? 'text-orange-500' : 'text-green-600')}>
                          {item.daysRemaining <= 0 ? (
                            <span className="flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> {t('maturities.urgent')}</span>
                          ) : (
                            `${item.daysRemaining}d`
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">{t('maturities.value')}</p>
                        <p className="text-sm font-semibold text-gray-900">{formatCOP(item.value_at_maturity)}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
        </div>
      )}
    </div>
  );
}
