'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { MacroIndicator, MarketData, Insight } from '@/types';
import { useLocale } from '@/hooks/useLocale';
import { ShieldAlert, Target, RefreshCw } from 'lucide-react';
import MarketContextBar from '@/components/insights/MarketContextBar';
import InsightCard from '@/components/insights/InsightCard';
import MaturityTimeline from '@/components/insights/MaturityTimeline';
import PortfolioPulse from '@/components/insights/PortfolioPulse';

export default function InsightsPage() {
  const { t } = useLocale();
  const [macro, setMacro] = useState<MacroIndicator[]>([]);
  const [market, setMarket] = useState<MarketData[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      api.getMacroIndicators(),
      api.getMarketData(),
      api.getInsights(),
    ]).then(([mac, mkt, ins]) => {
      setMacro(mac);
      setMarket(mkt);
      setInsights(ins);
      setLastUpdated(new Date());
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAll();
    // Auto-refresh every 15 minutes
    const interval = setInterval(fetchAll, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Separate insights by category
  const riskInsights = insights.filter(i =>
    i.category === 'risk' || i.category === 'alert'
  );
  const opportunityInsights = insights.filter(i =>
    i.category === 'opportunity' || i.category === 'recommendation' || i.category === 'status'
  );

  // TRM from market data
  const trm = market.find(m => m.symbol === 'TRM');

  if (loading && insights.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-gray-400">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{t('insights.title') || 'Market & Portfolio Intelligence'}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('insights.subtitle') || 'Proactive analysis powered by Ancalofa AI'}</p>
        </div>
        <button
          onClick={fetchAll}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          disabled={loading}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} strokeWidth={1.5} />
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Market Context Bar */}
      <div>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          {t('insights.market_context') || 'Market Context'}
        </h2>
        <MarketContextBar trm={trm} indicators={macro} />
      </div>

      {/* Main Grid: Risks + Opportunities */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <InsightCard
          title={t('insights.risks') || 'Risks & Alerts'}
          icon={<ShieldAlert className="w-5 h-5 text-warning" strokeWidth={1.5} />}
          insights={riskInsights}
          emptyMessage="No active risks detected"
        />
        <InsightCard
          title={t('insights.opportunities') || 'Opportunities'}
          icon={<Target className="w-5 h-5 text-success" strokeWidth={1.5} />}
          insights={opportunityInsights}
          emptyMessage="No opportunities flagged at this time"
        />
      </div>

      {/* Maturity Timeline */}
      <MaturityTimeline insights={insights} />

      {/* Portfolio Pulse */}
      <PortfolioPulse insights={insights} />

      {/* Footer */}
      <div className="text-center text-xs text-gray-400 py-4 border-t border-gray-200">
        {lastUpdated && (
          <>
            {t('insights.last_updated') || 'Last analysis'}: {lastUpdated.toLocaleTimeString()} &middot; Auto-refreshes every 15 minutes
          </>
        )}
      </div>
    </div>
  );
}
