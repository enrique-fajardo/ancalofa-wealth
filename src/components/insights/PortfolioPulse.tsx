'use client';

import { cn } from '@/lib/formatters';
import { useLocale } from '@/hooks/useLocale';
import { Activity, TrendingUp, TrendingDown, CheckCircle, AlertTriangle } from 'lucide-react';
import Card from '@/components/ui/Card';
import type { Insight } from '@/types';

interface PortfolioPulseProps {
  insights: Insight[];
}

export default function PortfolioPulse({ insights }: PortfolioPulseProps) {
  const { t } = useLocale();

  const perfTop = insights.find(i => i.id === 'perf_top');
  const perfBottom = insights.find(i => i.id === 'perf_bottom');
  const driftInsights = insights.filter(i => i.id.startsWith('drift_'));
  const currencyInsights = insights.filter(i => i.id.startsWith('currency_'));
  const concentrationInsights = insights.filter(i => i.id.startsWith('concentration_'));

  // Overall health: count P1/P2 issues
  const criticalCount = insights.filter(i => i.severity === 'P1').length;
  const warningCount = insights.filter(i => i.severity === 'P2').length;
  const healthStatus = criticalCount > 0 ? 'critical' : warningCount > 0 ? 'warning' : 'healthy';

  return (
    <Card hover={false}>
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-primary" strokeWidth={1.5} />
        <h3 className="text-base font-semibold text-gray-900">{t('insights.portfolio_pulse') || 'Portfolio Pulse'}</h3>
        <span className={cn(
          'ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold',
          healthStatus === 'healthy' && 'bg-success-light text-success',
          healthStatus === 'warning' && 'bg-warning-light text-warning',
          healthStatus === 'critical' && 'bg-error-light text-error',
        )}>
          {healthStatus === 'healthy' ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
          {healthStatus === 'healthy' ? 'Healthy' : healthStatus === 'warning' ? `${warningCount} Warning${warningCount > 1 ? 's' : ''}` : `${criticalCount} Critical`}
        </span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Top Performers */}
        {perfTop && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-success" strokeWidth={2} />
              <span className="text-xs font-semibold text-gray-700">Top Performers</span>
            </div>
            {((perfTop.data?.positions as { symbol: string; pnl_pct: number }[]) || []).map(pos => (
              <div key={pos.symbol} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{pos.symbol}</span>
                <span className="font-semibold text-success">+{(pos.pnl_pct || 0).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        )}

        {/* Bottom Performers */}
        {perfBottom && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingDown className="w-3.5 h-3.5 text-error" strokeWidth={2} />
              <span className="text-xs font-semibold text-gray-700">Underperformers</span>
            </div>
            {((perfBottom.data?.positions as { symbol: string; pnl_pct: number }[]) || []).map(pos => (
              <div key={pos.symbol} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{pos.symbol}</span>
                <span className="font-semibold text-error">{(pos.pnl_pct || 0).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Allocation Drift Summary */}
      {driftInsights.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">Allocation Drift</h4>
          <div className="space-y-1.5">
            {driftInsights.map(drift => {
              const data = drift.data || {};
              const driftVal = data.drift as number ?? 0;
              return (
                <div key={drift.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{(data.sleeve as string || drift.id).replace('drift_', '').replace(/_/g, ' ')}</span>
                  <span className={cn('font-semibold', driftVal > 0 ? 'text-warning' : 'text-info')}>
                    {driftVal > 0 ? '+' : ''}{driftVal.toFixed(1)}pp
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Concentration & Currency Warnings (compact) */}
      {(concentrationInsights.length > 0 || currencyInsights.length > 0) && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">Risk Flags</h4>
          <div className="space-y-1">
            {[...concentrationInsights, ...currencyInsights].map(risk => (
              <p key={risk.id} className="text-xs text-gray-500 flex items-start gap-1.5">
                <AlertTriangle className="w-3 h-3 text-warning shrink-0 mt-0.5" strokeWidth={2} />
                {risk.title}
              </p>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
