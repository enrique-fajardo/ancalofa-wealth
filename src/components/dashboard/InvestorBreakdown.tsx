'use client';

import { useState } from 'react';
import { useLocale } from '@/hooks/useLocale';
import { formatCOPCompact, formatPercent, cn } from '@/lib/formatters';
import { ChevronDown, ChevronRight, User } from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import type { InvestorSummary } from '@/types';

interface InvestorBreakdownProps {
  data: InvestorSummary[];
}

export default function InvestorBreakdown({ data }: InvestorBreakdownProps) {
  const { t } = useLocale();
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <Card hover={false}>
      <h3 className="text-base font-semibold text-gray-900 mb-1">{t('dashboard.investors')}</h3>
      <p className="text-xs text-gray-500 mb-4">{t('dashboard.investors_subtitle')}</p>

      <div className="space-y-2">
        {data.map(summary => {
          const isOpen = expanded === summary.investor.investor_id;
          const typeBadge = summary.investor.investor_type === 'Primary' ? 'info'
            : summary.investor.investor_type === 'Secondary' ? 'purple' : 'default';
          const returns = summary.total_value_cop - summary.total_cost_cop;

          return (
            <div key={summary.investor.investor_id} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setExpanded(isOpen ? null : summary.investor.investor_id)}
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-full bg-primary-50 text-primary flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>

                {/* Left side: 4 lines */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{summary.investor.used_name}</p>
                  <p className="text-xs text-gray-500">
                    {summary.accounts.length} {t('common.accounts')}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatPercent(summary.percentage, false)} {t('common.of_portfolio')}
                  </p>
                  <div className="mt-0.5">
                    <Badge variant={typeBadge as 'info' | 'purple' | 'default'} size="sm">{summary.investor.investor_type}</Badge>
                  </div>
                </div>

                {/* Right side: 4 lines */}
                <div className="text-right mr-2 space-y-0.5">
                  <div className="flex items-center gap-2 justify-end">
                    <span className="text-[10px] text-gray-400 uppercase">{t('dashboard.balance')}</span>
                    <span className="text-sm font-semibold text-gray-900">{formatCOPCompact(summary.total_value_cop)}</span>
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    <span className="text-[10px] text-gray-400 uppercase">{t('dashboard.capital')}</span>
                    <span className="text-xs text-gray-600">{formatCOPCompact(summary.total_cost_cop)}</span>
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    <span className="text-[10px] text-gray-400 uppercase">{t('dashboard.returns')}</span>
                    <span className={cn('text-xs font-semibold', returns >= 0 ? 'text-success' : 'text-error')}>
                      {formatCOPCompact(returns)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 justify-end">
                    <span className={cn('text-xs font-semibold', returns >= 0 ? 'text-success' : 'text-error')}>
                      {formatPercent(summary.return_pct)}
                    </span>
                    {summary.annualized_return_pct != null && summary.annualized_return_pct !== 0 && (
                      <span className="text-[10px] text-gray-500">
                        ({formatPercent(summary.annualized_return_pct)} {t('dashboard.annualized')})
                      </span>
                    )}
                  </div>
                </div>
                {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />}
              </button>

              {isOpen && (
                <div className="px-3 pb-3 border-t border-gray-100">
                  {summary.accounts.map(acc => (
                    <div key={acc.account_id} className="flex items-center justify-between py-2 text-sm">
                      <div>
                        <p className="text-gray-700">{acc.institution}</p>
                        <p className="text-xs text-gray-400">{acc.account_id} &middot; {acc.account_type}</p>
                      </div>
                      <Badge variant="default" size="sm">{acc.currency}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
