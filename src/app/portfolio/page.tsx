'use client';

import { Suspense, useEffect, useState } from 'react';
import api from '@/lib/api';
import type { Position, Account, PortfolioSummary as PortfolioSummaryType, InflationCumulative } from '@/types';
import { useLocale } from '@/hooks/useLocale';
import { usePeriod } from '@/hooks/usePeriod';
import { formatCOP, formatUSD, formatCOPCompact, formatUSDCompact, formatPercent, cn } from '@/lib/formatters';
import PeriodSelector from '@/components/ui/PeriodSelector';
import Card from '@/components/ui/Card';
import DataTable from '@/components/ui/DataTable';

type PillType = 'success' | 'warning' | 'error';
function wealthPill(
  returns: number | null | undefined,
  inflation: number | null | undefined,
  labels: { loss: string; risk: string; growth: string }
): { label: string; type: PillType } | undefined {
  if (returns == null || inflation == null) return undefined;
  if (returns < inflation)     return { label: labels.loss,   type: 'error' };
  if (returns < inflation + 1) return { label: labels.risk,   type: 'warning' };
  return                              { label: labels.growth, type: 'success' };
}

function PortfolioContent() {
  const { t } = useLocale();
  const { period, setPeriod } = usePeriod();
  const [positions, setPositions] = useState<Position[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [summary, setSummary] = useState<PortfolioSummaryType | null>(null);
  const [filterCurrency, setFilterCurrency] = useState<string>('all');
  const [inflation, setInflation] = useState<InflationCumulative | null>(null);

  // Load positions and accounts once
  useEffect(() => {
    Promise.all([api.getPositions(), api.getAccounts()]).then(([p, a]) => {
      setPositions(p);
      setAccounts(a);
    });
  }, []);

  // Load summary + inflation whenever period changes
  useEffect(() => {
    let stale = false;
    Promise.all([
      api.getPortfolioSummary(period),
      api.getInflationCumulative(period),
    ]).then(([s, inf]) => {
      if (!stale) { setSummary(s); setInflation(inf); }
    });
    return () => { stale = true; };
  }, [period]);

  const filtered = filterCurrency === 'all'
    ? positions
    : positions.filter(p => p.cost_currency === filterCurrency);

  const getAccountLabel = (accountId: string) => {
    const acc = accounts.find(a => a.account_id === accountId);
    return acc ? `${acc.institution}` : accountId;
  };

  type PositionRow = Position & Record<string, unknown>;

  const columns = [
    { key: 'symbol' as keyof PositionRow, label: t('portfolio.symbol'), sortable: true, width: '100px',
      render: (_: unknown, row: PositionRow) => (
        <span className="font-semibold text-gray-900">{row.symbol}</span>
      )
    },
    { key: 'description' as keyof PositionRow, label: t('portfolio.description'), sortable: false },
    { key: 'account_id' as keyof PositionRow, label: t('portfolio.account'), sortable: true,
      render: (val: unknown) => <span className="text-gray-500">{getAccountLabel(val as string)}</span>
    },
    { key: 'quantity' as keyof PositionRow, label: t('portfolio.quantity'), sortable: true, align: 'right' as const,
      render: (val: unknown) => <span>{Number(val).toLocaleString('en-US', { maximumFractionDigits: 4 })}</span>
    },
    { key: 'cost_basis' as keyof PositionRow, label: t('portfolio.cost_basis'), sortable: true, align: 'right' as const,
      render: (_: unknown, row: PositionRow) => (
        <span>{row.cost_currency === 'COP' ? formatCOP(row.cost_basis) : formatUSD(row.cost_basis)}</span>
      )
    },
    { key: 'current_value' as keyof PositionRow, label: t('portfolio.current_value'), sortable: true, align: 'right' as const,
      render: (_: unknown, row: PositionRow) => (
        <span className="font-semibold">{row.cost_currency === 'COP' ? formatCOP(row.current_value || 0) : formatUSD(row.current_value || 0)}</span>
      )
    },
    { key: 'pnl' as keyof PositionRow, label: t('portfolio.pnl'), sortable: true, align: 'right' as const,
      render: (_: unknown, row: PositionRow) => (
        <span className={cn('font-semibold', (row.pnl || 0) >= 0 ? 'text-success' : 'text-error')}>
          {row.cost_currency === 'COP' ? formatCOP(row.pnl || 0) : formatUSD(row.pnl || 0)}
        </span>
      )
    },
    { key: 'pnl_pct' as keyof PositionRow, label: t('portfolio.pnl_pct'), sortable: true, align: 'right' as const,
      render: (_: unknown, row: PositionRow) => (
        <span className={cn('font-semibold', (row.pnl_pct || 0) >= 0 ? 'text-success' : 'text-error')}>
          {formatPercent(row.pnl_pct || 0)}
        </span>
      )
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header + Period Selector */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{t('portfolio.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('portfolio.subtitle')}</p>
        </div>
        <PeriodSelector period={period} onPeriodChange={setPeriod} />
      </div>

      {/* Summary Cards — from API (period-aware) */}
      {summary ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card glass hover={false} padding="md">
              <p className="metric-label">{t('dashboard.balance')} (COP)</p>
              <p className="text-xl font-semibold text-gray-900 mt-1">{formatCOPCompact(summary.total_cop)}</p>
              <p className="text-xs text-gray-500 mt-1">{summary.cop_accounts} COP {t('common.accounts')}</p>
            </Card>
            <Card glass hover={false} padding="md">
              <div className="flex items-center justify-between">
                <p className="metric-label">{t('dashboard.capital')} (COP)</p>
                {period !== 'total' && summary.has_period_data && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary uppercase">
                    {period}
                  </span>
                )}
              </div>
              <p className="text-xl font-semibold text-gray-900 mt-1">
                {period !== 'total' && !summary.has_period_data
                  ? '—'
                  : formatCOPCompact(summary.period_capital_cop ?? summary.capital_cop)}
              </p>
            </Card>
            <Card glass hover={false} padding="md">
              <div className="flex items-center justify-between">
                <p className="metric-label">{t('dashboard.returns')} (COP)</p>
                {period !== 'total' && summary.has_period_data && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary uppercase">
                    {period}
                  </span>
                )}
              </div>
              <p className="text-xl font-semibold text-gray-900 mt-1">
                {period !== 'total' && !summary.has_period_data
                  ? '—'
                  : formatCOPCompact(Math.abs(summary.period_returns_cop ?? summary.returns_cop))}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {period !== 'total' && !summary.has_period_data
                  ? '—'
                  : formatPercent(Math.abs(summary.period_return_pct ?? summary.total_return_pct))}
              </p>
              {(() => {
                const pill = wealthPill(
                  summary.total_return_pct,
                  inflation?.ipc_co ?? null,
                  { loss: t('dashboard.wealth_loss'), risk: t('dashboard.wealth_risk'), growth: t('dashboard.wealth_growth') }
                );
                return pill ? (
                  <div className={cn(
                    'mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold',
                    pill.type === 'success' && 'bg-success/10 text-success',
                    pill.type === 'warning' && 'bg-warning/10 text-warning',
                    pill.type === 'error'   && 'bg-error/10 text-error',
                  )}>
                    {pill.label}
                  </div>
                ) : null;
              })()}
            </Card>
            <Card glass hover={false} padding="md">
              <p className="metric-label">{t('dashboard.balance')} (USD)</p>
              <p className="text-xl font-semibold text-gray-900 mt-1">{formatUSDCompact(summary.total_usd)}</p>
              <p className="text-xs text-gray-500 mt-1">{summary.usd_accounts} USD {t('common.accounts')}</p>
            </Card>
            <Card glass hover={false} padding="md">
              <p className="metric-label">{t('dashboard.capital')} (USD)</p>
              <p className="text-xl font-semibold text-gray-900 mt-1">{formatUSDCompact(summary.capital_usd)}</p>
            </Card>
            <Card glass hover={false} padding="md">
              <p className="metric-label">{t('dashboard.returns')} (USD)</p>
              <p className={cn('text-xl font-semibold mt-1', summary.returns_usd >= 0 ? 'text-success' : 'text-error')}>{formatUSDCompact(summary.returns_usd)}</p>
              <p className={cn('text-xs mt-1', summary.returns_usd >= 0 ? 'text-success' : 'text-error')}>
                {formatPercent(summary.capital_usd > 0 ? (summary.returns_usd / summary.capital_usd) * 100 : 0)}
              </p>
            </Card>
          </div>

          {/* Total P&L */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card glass hover={false} padding="md">
              <p className="metric-label">{t('portfolio.pnl')} ({t('portfolio.all')})</p>
              <p className={cn('text-xl font-semibold mt-1', summary.total_pnl >= 0 ? 'text-success' : 'text-error')}>{formatCOPCompact(summary.total_pnl)}</p>
              <p className={cn('text-xs mt-1', summary.total_return_pct >= 0 ? 'text-success' : 'text-error')}>{formatPercent(summary.total_return_pct)}</p>
            </Card>
            <Card glass hover={false} padding="md">
              <p className="metric-label">{t('portfolio.positions')}</p>
              <p className="text-xl font-semibold text-gray-900 mt-1">{summary.active_positions}</p>
              <p className="text-xs text-gray-500 mt-1">{summary.active_accounts} {t('common.accounts')}</p>
            </Card>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-32">
          <div className="text-sm text-gray-400">{t('common.loading')}</div>
        </div>
      )}

      {/* Currency Filter */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('portfolio.filter_currency')}:</span>
        {['all', 'COP', 'USD'].map(c => (
          <button
            key={c}
            onClick={() => setFilterCurrency(c)}
            className={cn(
              'px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors',
              filterCurrency === c ? 'bg-primary text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-primary hover:text-primary'
            )}
          >
            {c === 'all' ? t('portfolio.all') : c}
          </button>
        ))}
      </div>

      {/* Positions Table */}
      <DataTable<PositionRow>
        columns={columns}
        data={filtered as PositionRow[]}
        emptyMessage={t('table.no_data')}
      />
    </div>
  );
}

export default function PortfolioPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-32"><div className="text-sm text-gray-400">Loading...</div></div>}>
      <PortfolioContent />
    </Suspense>
  );
}
