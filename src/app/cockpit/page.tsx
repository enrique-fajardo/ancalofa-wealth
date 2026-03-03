'use client';

import { Suspense, useEffect, useState } from 'react';
import { DollarSign, Wallet, TrendingUp, BarChart3, Users, Building2 } from 'lucide-react';
import api from '@/lib/api';
import type { CockpitData } from '@/types';
import { useLocale } from '@/hooks/useLocale';
import { usePeriod } from '@/hooks/usePeriod';
import { formatCOP, formatCOPCompact, formatUSDCompact, formatPercent, cn } from '@/lib/formatters';
import PeriodSelector from '@/components/ui/PeriodSelector';
import Card from '@/components/ui/Card';
import MetricCard from '@/components/ui/MetricCard';

function CockpitContent() {
  const { t } = useLocale();
  const { period, setPeriod } = usePeriod();
  const [data, setData] = useState<CockpitData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let stale = false;
    setLoading(true);
    api.getCockpit(period)
      .then(d => { if (!stale) { setData(d); setLoading(false); } })
      .catch(() => { if (!stale) setLoading(false); });
    return () => { stale = true; };
  }, [period]);

  return (
    <div className="space-y-6">
      {/* Header + Period Selector */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{t('cockpit.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('cockpit.subtitle')}</p>
        </div>
        <PeriodSelector period={period} onPeriodChange={setPeriod} />
      </div>

      {loading && (
        <div className="flex items-center justify-center h-32">
          <div className="text-sm text-gray-400">{t('common.loading')}</div>
        </div>
      )}

      {!loading && data && (
        <>
          {/* Total KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label={t('cockpit.total_balance')}
              value={formatCOPCompact(data.totals.balance)}
              icon={DollarSign}
              iconColor="text-primary"
            />
            <MetricCard
              label={t('cockpit.total_capital')}
              value={formatCOPCompact(data.totals.capital)}
              icon={Wallet}
              iconColor="text-accent"
            />
            <MetricCard
              label={t('cockpit.total_returns')}
              value={formatCOPCompact(data.totals.returns)}
              delta={formatPercent(data.totals.return_pct)}
              deltaType={data.totals.returns >= 0 ? 'positive' : 'negative'}
              icon={BarChart3}
              iconColor={data.totals.returns >= 0 ? 'text-success' : 'text-error'}
            />
            <MetricCard
              label={t('cockpit.return_pct')}
              value={formatPercent(data.totals.return_pct)}
              icon={TrendingUp}
              iconColor={data.totals.return_pct >= 0 ? 'text-success' : 'text-error'}
            />
          </div>

          {/* By Currency */}
          <Card hover={false}>
            <h3 className="text-base font-semibold text-gray-900 mb-4">{t('cockpit.by_currency')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* COP */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">COP</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase">{t('cockpit.balance')}</p>
                    <p className="text-lg font-semibold text-gray-900">{formatCOPCompact(data.totals.cop_balance)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase">{t('cockpit.capital')}</p>
                    <p className="text-sm text-gray-700">{formatCOPCompact(data.totals.cop_capital)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase">{t('cockpit.returns')}</p>
                    <p className={cn('text-sm font-semibold', data.totals.cop_returns >= 0 ? 'text-success' : 'text-error')}>
                      {formatCOPCompact(data.totals.cop_returns)}
                    </p>
                  </div>
                </div>
              </div>
              {/* USD */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">USD</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase">{t('cockpit.balance')}</p>
                    <p className="text-lg font-semibold text-gray-900">{formatUSDCompact(data.totals.usd_balance)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase">{t('cockpit.capital')}</p>
                    <p className="text-sm text-gray-700">{formatUSDCompact(data.totals.usd_capital)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase">{t('cockpit.returns')}</p>
                    <p className={cn('text-sm font-semibold', data.totals.usd_returns >= 0 ? 'text-success' : 'text-error')}>
                      {formatUSDCompact(data.totals.usd_returns)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* By Investor + By Institution */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* By Investor */}
            <Card hover={false}>
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-primary" />
                <h3 className="text-base font-semibold text-gray-900">{t('cockpit.by_investor')}</h3>
              </div>
              {data.by_investor.length === 0 ? (
                <p className="text-sm text-gray-400">{t('cockpit.no_data')}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-2 text-xs font-semibold text-gray-500 uppercase">{t('cockpit.investor')}</th>
                        <th className="text-right py-2 px-2 text-xs font-semibold text-gray-500 uppercase">{t('cockpit.balance')}</th>
                        <th className="text-right py-2 px-2 text-xs font-semibold text-gray-500 uppercase">{t('cockpit.capital')}</th>
                        <th className="text-right py-2 px-2 text-xs font-semibold text-gray-500 uppercase">{t('cockpit.returns')}</th>
                        <th className="text-right py-2 px-2 text-xs font-semibold text-gray-500 uppercase">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.by_investor.map((inv, i) => (
                        <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-2.5 px-2 font-medium text-gray-800">{inv.name}</td>
                          <td className="py-2.5 px-2 text-right font-semibold text-gray-900">{formatCOP(inv.balance)}</td>
                          <td className="py-2.5 px-2 text-right text-gray-600">{formatCOP(inv.capital)}</td>
                          <td className={cn('py-2.5 px-2 text-right font-semibold', inv.returns >= 0 ? 'text-success' : 'text-error')}>{formatCOP(inv.returns)}</td>
                          <td className={cn('py-2.5 px-2 text-right font-semibold', inv.return_pct >= 0 ? 'text-success' : 'text-error')}>{formatPercent(inv.return_pct)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            {/* By Institution */}
            <Card hover={false}>
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-5 h-5 text-primary" />
                <h3 className="text-base font-semibold text-gray-900">{t('cockpit.by_institution')}</h3>
              </div>
              {data.by_institution.length === 0 ? (
                <p className="text-sm text-gray-400">{t('cockpit.no_data')}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-2 text-xs font-semibold text-gray-500 uppercase">{t('cockpit.institution')}</th>
                        <th className="text-right py-2 px-2 text-xs font-semibold text-gray-500 uppercase">{t('cockpit.balance')}</th>
                        <th className="text-right py-2 px-2 text-xs font-semibold text-gray-500 uppercase">{t('cockpit.capital')}</th>
                        <th className="text-right py-2 px-2 text-xs font-semibold text-gray-500 uppercase">{t('cockpit.returns')}</th>
                        <th className="text-right py-2 px-2 text-xs font-semibold text-gray-500 uppercase">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.by_institution.map((inst, i) => (
                        <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-2.5 px-2 font-medium text-gray-800">{inst.name}</td>
                          <td className="py-2.5 px-2 text-right font-semibold text-gray-900">{formatCOP(inst.balance)}</td>
                          <td className="py-2.5 px-2 text-right text-gray-600">{formatCOP(inst.capital)}</td>
                          <td className={cn('py-2.5 px-2 text-right font-semibold', inst.returns >= 0 ? 'text-success' : 'text-error')}>{formatCOP(inst.returns)}</td>
                          <td className={cn('py-2.5 px-2 text-right font-semibold', inst.return_pct >= 0 ? 'text-success' : 'text-error')}>{formatPercent(inst.return_pct)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        </>
      )}

      {!loading && !data && (
        <p className="text-sm text-gray-400 text-center">{t('cockpit.no_data')}</p>
      )}
    </div>
  );
}

export default function CockpitPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-32"><div className="text-sm text-gray-400">Loading...</div></div>}>
      <CockpitContent />
    </Suspense>
  );
}
