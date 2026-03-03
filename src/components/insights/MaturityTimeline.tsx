'use client';

import { cn, formatDate } from '@/lib/formatters';
import { useLocale } from '@/hooks/useLocale';
import { CalendarClock, XCircle, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import Card from '@/components/ui/Card';
import type { Insight } from '@/types';

interface MaturityTimelineProps {
  insights: Insight[];
}

const urgencyConfig: Record<string, { icon: typeof AlertTriangle; color: string; bg: string; label: string }> = {
  P1: { icon: XCircle, color: 'text-error', bg: 'bg-error-light', label: 'EXPIRED' },
  P2: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning-light', label: 'URGENT' },
  P3: { icon: Clock, color: 'text-accent', bg: 'bg-accent-50', label: 'APPROACHING' },
};

export default function MaturityTimeline({ insights }: MaturityTimelineProps) {
  const { t, locale } = useLocale();

  // Filter to maturity-related insights only
  const maturities = insights.filter(i => i.id.startsWith('maturity_'));

  if (maturities.length === 0) {
    return (
      <Card hover={false}>
        <div className="flex items-center gap-2 mb-3">
          <CalendarClock className="w-5 h-5 text-primary" strokeWidth={1.5} />
          <h3 className="text-base font-semibold text-gray-900">{t('insights.maturities') || 'Maturity Timeline'}</h3>
        </div>
        <p className="text-sm text-gray-400 py-4 text-center">{t('maturities.no_maturities')}</p>
      </Card>
    );
  }

  return (
    <Card hover={false}>
      <div className="flex items-center gap-2 mb-3">
        <CalendarClock className="w-5 h-5 text-primary" strokeWidth={1.5} />
        <h3 className="text-base font-semibold text-gray-900">{t('insights.maturities') || 'Maturity Timeline'}</h3>
        <span className="text-xs text-gray-400 ml-auto">{maturities.length} item{maturities.length > 1 ? 's' : ''}</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-500 border-b border-gray-200">
              <th className="text-left py-2 pr-3 font-medium">Status</th>
              <th className="text-left py-2 pr-3 font-medium">{t('maturities.instrument')}</th>
              <th className="text-right py-2 pr-3 font-medium">{t('maturities.days_remaining')}</th>
              <th className="text-right py-2 font-medium">{t('maturities.value')}</th>
            </tr>
          </thead>
          <tbody>
            {maturities.map(item => {
              const data = item.data || {};
              const daysRemaining = data.days_remaining as number ?? 0;
              const config = urgencyConfig[item.severity] || urgencyConfig.P3;
              const Icon = config.icon;
              const value = data.value as number ?? 0;
              const currency = data.currency as string ?? 'COP';
              const valueFmt = currency === 'USD'
                ? `USD $${Math.round(value).toLocaleString('en-US')}`
                : `COP $${Math.round(value).toLocaleString('en-US')}`;

              return (
                <tr key={item.id} className="border-b border-gray-100 last:border-0">
                  <td className="py-2 pr-3">
                    <span className={cn(
                      'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold',
                      config.bg, config.color
                    )}>
                      <Icon className="w-3 h-3" strokeWidth={2} />
                      {config.label}
                    </span>
                  </td>
                  <td className="py-2 pr-3">
                    <p className="font-medium text-gray-900 text-sm">{item.title.split(' matures')[0].split(' EXPIRED')[0]}</p>
                    <p className="text-xs text-gray-400">{(item.message || '').split(' | Maturity:')[0].split(') |')[0]})</p>
                  </td>
                  <td className="py-2 pr-3 text-right">
                    <span className={cn('font-semibold', config.color)}>
                      {daysRemaining <= 0 ? 'Expired' : `${daysRemaining}d`}
                    </span>
                  </td>
                  <td className="py-2 text-right font-medium text-gray-900">{valueFmt}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
