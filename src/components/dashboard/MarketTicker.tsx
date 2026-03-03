'use client';

import { useLocale } from '@/hooks/useLocale';
import { cn, formatPrice, formatCOPCompact, formatPercent } from '@/lib/formatters';
import { TrendingUp, TrendingDown, Globe } from 'lucide-react';
import Card from '@/components/ui/Card';
import type { MarketData, MacroIndicator } from '@/types';

interface MarketTickerProps {
  data: MarketData[];
  macro?: MacroIndicator[];
}

function formatMacroValue(indicator: MacroIndicator): string {
  if (indicator.unit === 'percent') return formatPercent(indicator.value, false);
  if (indicator.unit === 'index') return indicator.value.toLocaleString('en-US', { maximumFractionDigits: 0 });
  return formatPrice(indicator.value, 2);
}

export default function MarketTicker({ data, macro = [] }: MarketTickerProps) {
  const { t } = useLocale();

  return (
    <Card hover={false}>
      <h3 className="text-base font-semibold text-gray-900 mb-1">{t('dashboard.market')}</h3>
      <p className="text-xs text-gray-500 mb-4">{t('dashboard.market_subtitle')}</p>

      <div className="space-y-3">
        {data.map(item => {
          const isPositive = item.change_pct >= 0;
          // Exchange rates/stocks: plain $price. Fund balances (large COP): COP $X.XXX M
          const isRate = item.source === 'Banco de la República' || item.symbol === 'TRM';
          const priceStr = isRate
            ? formatPrice(item.price, 2)
            : item.currency === 'COP' && item.price >= 1_000_000
              ? formatCOPCompact(item.price)
              : item.currency === 'USD'
                ? formatPrice(item.price, item.price >= 1000 ? 0 : 2)
                : formatPrice(item.price, 0);

          return (
            <div key={item.symbol} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <div>
                <p className="text-sm font-semibold text-gray-800">{item.symbol}</p>
                <p className="text-xs text-gray-400">{item.name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">{priceStr}</p>
                <div className={cn('flex items-center gap-0.5 justify-end text-xs font-semibold', isPositive ? 'text-success' : 'text-error')}>
                  {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {formatPercent(item.change_pct)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Macro Indicators Section */}
      {macro.length > 0 && (
        <>
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="flex items-center gap-1.5 mb-3">
              <Globe className="w-3.5 h-3.5 text-primary" strokeWidth={1.5} />
              <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">{t('dashboard.macro') || 'Macro Indicators'}</h4>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
              {macro.map(indicator => {
                const hasChange = indicator.change !== undefined && indicator.change !== 0;
                const isPositive = (indicator.change ?? 0) >= 0;

                return (
                  <div key={indicator.id} className="flex flex-col" title={`Source: ${indicator.source} | As of: ${indicator.as_of}`}>
                    <div className="flex items-center gap-1">
                      <span className={cn(
                        'text-[9px] font-bold px-1 py-0.5 rounded',
                        indicator.country === 'CO' ? 'bg-accent-50 text-accent-800' : 'bg-info-light text-info'
                      )}>
                        {indicator.country}
                      </span>
                      <span className="text-[11px] text-gray-500 truncate">{indicator.name}</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-semibold text-gray-900">{formatMacroValue(indicator)}</span>
                      {hasChange && (
                        <span className={cn('text-[10px] font-semibold', isPositive ? 'text-success' : 'text-error')}>
                          {formatPercent(indicator.change)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
