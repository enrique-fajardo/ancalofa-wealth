'use client';

import { DollarSign, TrendingUp, Wallet, BarChart3, Users, Activity } from 'lucide-react';
import MetricCard from '@/components/ui/MetricCard';
import { formatCOPCompact, formatUSDCompact, formatPercent } from '@/lib/formatters';
import type { PortfolioSummary as PortfolioSummaryType, InflationCumulative } from '@/types';
import { useLocale } from '@/hooks/useLocale';

type PillType = 'success' | 'warning' | 'error';

function wealthPill(
  returns: number | null | undefined,
  inflation: number | null | undefined,
  labels: { loss: string; risk: string; growth: string }
): { label: string; type: PillType } | undefined {
  if (returns == null || inflation == null) return undefined;
  if (returns < inflation)         return { label: labels.loss,   type: 'error' };
  if (returns < inflation + 1)     return { label: labels.risk,   type: 'warning' };
  return                                  { label: labels.growth, type: 'success' };
}

interface PortfolioSummaryProps {
  data: PortfolioSummaryType;
  inflation?: InflationCumulative | null;
}

export default function PortfolioSummaryRow({ data, inflation }: PortfolioSummaryProps) {
  const { t } = useLocale();

  return (
    <div className="space-y-4">
      {/* Row 1: Balance / Capital / Returns — COP + USD */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard
          label={t('dashboard.balance_cop')}
          value={formatCOPCompact(data.total_cop)}
          icon={DollarSign}
          iconColor="text-primary"
        />
        <MetricCard
          label={t('dashboard.capital_cop')}
          value={formatCOPCompact(data.capital_cop)}
          icon={Wallet}
          iconColor="text-accent"
        />
        <MetricCard
          label={t('dashboard.returns_cop')}
          value={formatCOPCompact(data.returns_cop)}
          delta={formatPercent(data.capital_cop > 0 ? (data.returns_cop / data.capital_cop) * 100 : 0)}
          deltaType={data.returns_cop >= 0 ? 'positive' : 'negative'}
          icon={TrendingUp}
          iconColor={data.returns_cop >= 0 ? 'text-success' : 'text-error'}
        />
        {/* USD */}
        <MetricCard
          label={t('dashboard.balance_usd')}
          value={formatUSDCompact(data.total_usd)}
          icon={DollarSign}
          iconColor="text-primary"
        />
        <MetricCard
          label={t('dashboard.capital_usd')}
          value={formatUSDCompact(data.capital_usd)}
          icon={Wallet}
          iconColor="text-accent"
        />
        <MetricCard
          label={t('dashboard.returns_usd')}
          value={formatUSDCompact(data.returns_usd)}
          delta={formatPercent(data.capital_usd > 0 ? (data.returns_usd / data.capital_usd) * 100 : 0)}
          deltaType={data.returns_usd >= 0 ? 'positive' : 'negative'}
          icon={TrendingUp}
          iconColor={data.returns_usd >= 0 ? 'text-success' : 'text-error'}
        />
      </div>

      {/* Row 2: Returns ($) | Returns (%) | Inflation (IPC) | Active Accounts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Returns ($) */}
        <MetricCard
          label={t('dashboard.returns_absolute')}
          value={formatCOPCompact(data.total_pnl)}
          delta={`${formatCOPCompact(data.total_cost_basis)} ${t('dashboard.capital').toLowerCase()}`}
          deltaType={data.total_pnl >= 0 ? 'positive' : 'negative'}
          icon={BarChart3}
          iconColor={data.total_pnl >= 0 ? 'text-success' : 'text-error'}
        />
        {/* Card 2: Returns (%) Cumulative — cumulative returns vs cumulative IPC */}
        <MetricCard
          label={t('dashboard.returns_cumulative')}
          value={`${formatPercent(data.total_return_pct)} ${t('dashboard.cumulative')}`}
          delta={
            inflation != null && inflation.months > 0 && inflation.ipc_co != null
              ? `${formatPercent(inflation.ipc_co, true)} IPC ${t('dashboard.cumulative')} (${(inflation.months / 12).toFixed(1)}yr)`
              : undefined
          }
          deltaType="neutral"
          icon={BarChart3}
          iconColor={data.total_return_pct >= 0 ? 'text-success' : 'text-error'}
          pill={wealthPill(data.total_return_pct, inflation?.ipc_co ?? null, {
            loss:   t('dashboard.wealth_loss'),
            risk:   t('dashboard.wealth_risk'),
            growth: t('dashboard.wealth_growth'),
          })}
        />
        {/* Card 3: Returns (%) Annualized — annualized returns vs annualized IPC */}
        <MetricCard
          label={t('dashboard.returns_percent')}
          value={
            data.annualized_return_pct != null
              ? `${formatPercent(data.annualized_return_pct)} ${t('dashboard.annualized')}`
              : `${formatPercent(data.total_return_pct)} ${t('dashboard.annualized')}`
          }
          delta={
            inflation?.ipc_co_annualized != null
              ? `${formatPercent(inflation.ipc_co_annualized, true)} IPC ${t('dashboard.annualized')}`
              : undefined
          }
          deltaType="neutral"
          icon={TrendingUp}
          iconColor={data.annualized_return_pct != null && data.annualized_return_pct >= 0 ? 'text-success' : 'text-error'}
          pill={wealthPill(data.annualized_return_pct ?? data.total_return_pct, inflation?.ipc_co_annualized ?? null, {
            loss:   t('dashboard.wealth_loss'),
            risk:   t('dashboard.wealth_risk'),
            growth: t('dashboard.wealth_growth'),
          })}
        />
        {/* Card 4: Active Accounts */}
        <MetricCard
          label={t('dashboard.active_accounts')}
          value={`${data.active_accounts} ${t('common.accounts')}`}
          delta={`${data.cop_accounts} COP · ${data.usd_accounts} USD`}
          deltaType="neutral"
          icon={Users}
        />
      </div>
    </div>
  );
}
