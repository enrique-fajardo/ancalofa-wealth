'use client';

import { useEffect, useState } from 'react';
import { Landmark, TrendingUp, DollarSign } from 'lucide-react';
import api from '@/lib/api';
import type { Position, PensionContribution, PensionProjection } from '@/types';
import { useLocale } from '@/hooks/useLocale';
import { formatCOP, formatCOPCompact, formatDate } from '@/lib/formatters';
import MetricCard from '@/components/ui/MetricCard';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import DataTable from '@/components/ui/DataTable';
import PortfolioLineChart from '@/components/charts/PortfolioLineChart';

export default function PensionsPage() {
  const { t, locale } = useLocale();
  const [pensionPositions, setPensionPositions] = useState<Position[]>([]);
  const [contributions, setContributions] = useState<PensionContribution[]>([]);
  const [projections, setProjections] = useState<PensionProjection[]>([]);

  useEffect(() => {
    Promise.all([
      api.getPositions(),
      api.getPensionContributions(),
      api.getPensionProjections(),
    ]).then(([pos, contribs, projs]) => {
      setPensionPositions(pos.filter(p => p.position_type === 'pension'));
      setContributions(contribs);
      setProjections(projs);
    });
  }, []);

  const totalValue = pensionPositions.reduce((sum, p) => sum + (p.current_value || 0), 0);
  const currentYear = new Date().getFullYear();
  const contributionsYTD = contributions
    .filter(c => new Date(c.date).getFullYear() === currentYear)
    .reduce((sum, c) => sum + c.amount, 0);
  const projectedRetirement = projections.length > 0 ? projections[projections.length - 1].projected_value : 0;

  const contributionCols = [
    { key: 'date' as keyof PensionContribution, label: t('pensions.date'), sortable: true, width: '120px', render: (v: unknown) => formatDate(v as string, locale) },
    { key: 'amount' as keyof PensionContribution, label: t('pensions.amount'), align: 'right' as const, render: (v: unknown) => formatCOP(v as number) },
    { key: 'type' as keyof PensionContribution, label: t('pensions.type'), render: (v: unknown) => <Badge variant={v === 'voluntary' ? 'info' : 'default'} size="sm">{t(`pensions.${v}`)}</Badge> },
    { key: 'description' as keyof PensionContribution, label: t('pensions.description') },
  ];

  const chartData = projections.map(p => ({
    label: `${p.year} (${p.age})`,
    value: p.projected_value,
    secondary: p.contributions_cumulative,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('pensions.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('pensions.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard label={t('pensions.total_value')} value={formatCOPCompact(totalValue)} icon={Landmark} iconColor="text-primary" />
        <MetricCard label={t('pensions.contributions_ytd')} value={formatCOPCompact(contributionsYTD)} icon={DollarSign} iconColor="text-info" />
        <MetricCard label={t('pensions.projected_retirement')} value={formatCOPCompact(projectedRetirement)} icon={TrendingUp} iconColor="text-success" />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">{t('pensions.pension_positions')}</h2>
        {pensionPositions.length === 0 ? (
          <Card glass padding="lg">
            <p className="text-sm text-gray-400 text-center py-6">{t('pensions.no_pensions')}</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {pensionPositions.map(pos => (
              <Card key={pos.position_id} glass padding="md">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{pos.symbol}</h3>
                    <p className="text-xs text-gray-500">{pos.description}</p>
                  </div>
                  <Badge variant={pos.is_active ? 'success' : 'default'} size="sm">
                    {pos.is_active ? t('status.active') : t('status.inactive')}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500">{t('positions.cost_basis')}</p>
                    <p className="text-sm font-semibold text-gray-900">{formatCOP(pos.cost_basis)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{t('portfolio.current_value')}</p>
                    <p className="text-sm font-semibold text-gray-900">{formatCOP(pos.current_value || 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{t('portfolio.pnl')}</p>
                    <p className="text-sm font-semibold text-green-600">+{formatCOP(pos.pnl || 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{t('portfolio.pnl_pct')}</p>
                    <p className="text-sm font-semibold text-green-600">+{pos.pnl_pct || 0}%</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">{t('pensions.contribution_history')}</h2>
        <Card>
          <DataTable columns={contributionCols} data={contributions} emptyMessage={t('table.no_data')} />
        </Card>
      </div>

      {projections.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">{t('pensions.projection')}</h2>
          <Card glass padding="lg">
            <PortfolioLineChart
              data={chartData}
              formatValue={(v) => `$${Math.round(v / 1000000)}M`}
              primaryLabel={t('pensions.projected_value')}
              secondaryLabel={t('pensions.cumulative_contributions')}
              height={320}
            />
          </Card>
        </div>
      )}
    </div>
  );
}
