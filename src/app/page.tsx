'use client';

import { Suspense, useEffect, useState } from 'react';
import api from '@/lib/api';
import type { PortfolioSummary, AllocationTarget, Alert, MarketData, InvestorSummary, MacroIndicator, InflationCumulative } from '@/types';
import { useLocale } from '@/hooks/useLocale';
import { usePeriod } from '@/hooks/usePeriod';
import PeriodSelector from '@/components/ui/PeriodSelector';
import PortfolioSummaryRow from '@/components/dashboard/PortfolioSummary';
import AllocationTable from '@/components/dashboard/AllocationTable';
import AlertsPanel from '@/components/dashboard/AlertsPanel';
import MarketTicker from '@/components/dashboard/MarketTicker';
import InvestorBreakdown from '@/components/dashboard/InvestorBreakdown';

function DashboardContent() {
  const { t } = useLocale();
  const { period, setPeriod } = usePeriod();
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [allocations, setAllocations] = useState<AllocationTarget[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [market, setMarket] = useState<MarketData[]>([]);
  const [investors, setInvestors] = useState<InvestorSummary[]>([]);
  const [macro, setMacro] = useState<MacroIndicator[]>([]);
  const [inflationCumulative, setInflationCumulative] = useState<InflationCumulative | null>(null);

  // Load static (non-period-sensitive) data once
  useEffect(() => {
    Promise.all([
      api.getAllocationTargets(),
      api.getAlerts(false),
      api.getMarketData(),
      api.getMacroIndicators(),
    ]).then(([a, al, m, mac]) => {
      setAllocations(a);
      setAlerts(al);
      setMarket(m);
      setMacro(mac);
    });
  }, []);

  // Load period-sensitive data whenever period changes
  useEffect(() => {
    let stale = false;
    Promise.all([
      api.getPortfolioSummary(period),
      api.getInvestorSummaries(period),
      api.getInflationCumulative(period),
    ]).then(([s, inv, infl]) => {
      if (!stale) {
        setSummary(s);
        setInvestors(inv);
        setInflationCumulative(infl);
      }
    });
    return () => { stale = true; };
  }, [period]);

  if (!summary) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-gray-400">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header + Period Selector */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{t('dashboard.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('dashboard.subtitle')}</p>
        </div>
        <PeriodSelector
          period={period}
          onPeriodChange={setPeriod}
          dataCoverageMonths={summary.data_coverage_months}
          isPartialPeriod={summary.is_partial_period}
        />
      </div>

      {/* KPI Row */}
      <PortfolioSummaryRow data={summary} inflation={inflationCumulative} />

      {/* Main Grid: Allocation + Alerts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <AllocationTable data={allocations} />
        </div>
        <div>
          <AlertsPanel alerts={alerts} />
        </div>
      </div>

      {/* Bottom Grid: Investors + Market */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <InvestorBreakdown data={investors} />
        </div>
        <div>
          <MarketTicker data={market} macro={macro} />
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-400 py-4 border-t border-gray-200">
        ANCALOFA Wealth &middot; Fajardo L&oacute;pez Family &middot; v0.1.0
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="text-sm text-gray-400">Loading...</div></div>}>
      <DashboardContent />
    </Suspense>
  );
}
