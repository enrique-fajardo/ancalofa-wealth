'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import api from '@/lib/api';
import type { PortfolioSnapshot, Transaction, InflationDataPoint } from '@/types';
import { useLocale } from '@/hooks/useLocale';
import { formatCOP, formatUSD, formatPercent, formatDateShort } from '@/lib/formatters';
import MetricCard from '@/components/ui/MetricCard';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import DataTable from '@/components/ui/DataTable';
import PortfolioComboChart from '@/components/charts/PortfolioComboChart';
import type { ComboChartData } from '@/components/charts/PortfolioComboChart';

const typeColors: Record<string, 'success' | 'error' | 'info' | 'warning' | 'default'> = {
  buy: 'info', sell: 'warning', dividend: 'success', interest: 'success',
  deposit: 'info', withdrawal: 'error', fee: 'error',
};

export default function HistoryPage() {
  const { t } = useLocale();
  const [snapshots, setSnapshots] = useState<PortfolioSnapshot[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [inflation, setInflation] = useState<InflationDataPoint[]>([]);

  useEffect(() => {
    Promise.all([
      api.getPortfolioSnapshots(),
      api.getTransactions(),
      api.getInflationHistory(),
    ]).then(([snaps, txns, infl]) => {
      setSnapshots(snaps);
      setTransactions(txns);
      setInflation(infl);
    });
  }, []);

  // Compound return: (1 + r1) * (1 + r2) * ... - 1
  const totalReturn = snapshots.length > 0
    ? (snapshots.reduce((prod, s) => prod * (1 + s.return_pct / 100), 1) - 1) * 100
    : 0;
  const best = snapshots.length > 0 ? snapshots.reduce((b, s) => s.return_pct > b.return_pct ? s : b) : null;
  const worst = snapshots.length > 0 ? snapshots.reduce((w, s) => s.return_pct < w.return_pct ? s : w) : null;

  const computePeriodReturn = (months: number) => {
    const slice = snapshots.slice(-months);
    return slice.length > 0
      ? (slice.reduce((prod, s) => prod * (1 + s.return_pct / 100), 1) - 1) * 100
      : 0;
  };

  const computeYTDReturn = () => {
    const ytdSlice = snapshots.filter(s => s.date >= `${new Date().getFullYear()}`);
    return ytdSlice.length > 0
      ? (ytdSlice.reduce((prod, s) => prod * (1 + s.return_pct / 100), 1) - 1) * 100
      : 0;
  };

  const periods = [
    { label: t('history.one_month'), value: computePeriodReturn(1) },
    { label: t('history.three_months'), value: computePeriodReturn(3) },
    { label: t('history.six_months'), value: computePeriodReturn(6) },
    { label: t('history.ytd'), value: computeYTDReturn() },
    { label: t('history.one_year'), value: computePeriodReturn(12) },
  ];

  // ─── Merge snapshots + inflation for combo chart ──────────────────────────
  const inflationMap = new Map(inflation.map(i => [i.period, i]));

  const comboData: ComboChartData[] = snapshots.map(s => {
    const period = s.date.slice(0, 7); // "YYYY-MM-DD" → "YYYY-MM"
    const infl = inflationMap.get(period);
    return {
      label: s.month_label,
      capital: s.capital,
      returns: s.returns,
      return_pct: s.return_pct,
      ipc_co: infl?.ipc_co,
      cpi_us: infl?.cpi_us,
    };
  });

  // ─── Transaction table ────────────────────────────────────────────────────
  const sortedTxns = [...transactions].sort((a, b) => b.transaction_date.localeCompare(a.transaction_date));

  const txnCols = [
    { key: 'transaction_date' as keyof Transaction, label: t('transactions.date'), sortable: true, width: '110px', render: (v: unknown) => formatDateShort(v as string) },
    { key: 'transaction_type' as keyof Transaction, label: t('transactions.transaction_type'), render: (v: unknown) => <Badge variant={typeColors[v as string] || 'default'} size="sm">{v as string}</Badge> },
    { key: 'symbol' as keyof Transaction, label: t('transactions.symbol'), render: (v: unknown) => (v as string) || '—' },
    { key: 'description' as keyof Transaction, label: t('transactions.description') },
    { key: 'amount' as keyof Transaction, label: t('transactions.amount'), align: 'right' as const, render: (v: unknown, row: Transaction) => row.currency === 'COP' ? formatCOP(v as number) : formatUSD(v as number) },
    { key: 'currency' as keyof Transaction, label: t('transactions.currency'), render: (v: unknown) => <Badge variant="default" size="sm">{v as string}</Badge> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('history.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('history.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label={t('history.total_return')}
          value={formatPercent(computePeriodReturn(12), true)}
          icon={BarChart3}
          iconColor="text-primary"
          delta={formatPercent(computePeriodReturn(12), true)}
          deltaType={computePeriodReturn(12) >= 0 ? 'positive' : 'negative'}
        />
        <MetricCard
          label={t('history.best_month')}
          value={best ? `${best.month_label}` : '—'}
          icon={TrendingUp}
          iconColor="text-success"
          delta={best ? formatPercent(best.return_pct, true) : undefined}
          deltaType="positive"
        />
        <MetricCard
          label={t('history.worst_month')}
          value={worst ? `${worst.month_label}` : '—'}
          icon={TrendingDown}
          iconColor="text-error"
          delta={worst ? formatPercent(worst.return_pct, true) : undefined}
          deltaType="negative"
        />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">{t('history.combo_chart_title')}</h2>
        <Card glass padding="lg">
          <PortfolioComboChart
            data={comboData}
            height={420}
            labels={{
              capital: t('history.capital'),
              returns: t('history.returns'),
              monthlyReturn: t('history.monthly_return'),
              ipcColombia: t('history.ipc_colombia'),
              cpiUs: t('history.cpi_us'),
            }}
            formatCurrency={(v) => `$${Math.round(v / 1000000)}M`}
          />
        </Card>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">{t('history.return_breakdown')}</h2>
        <Card glass padding="md">
          <div className="grid grid-cols-5 gap-4">
            {periods.map(p => (
              <div key={p.label} className="text-center">
                <p className="text-xs font-semibold text-gray-500 uppercase">{p.label}</p>
                <p className={`text-lg font-bold mt-1 ${p.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercent(p.value, true)}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">{t('history.transaction_timeline')}</h2>
        <Card>
          <DataTable columns={txnCols} data={sortedTxns} emptyMessage={t('table.no_data')} />
        </Card>
      </div>
    </div>
  );
}
