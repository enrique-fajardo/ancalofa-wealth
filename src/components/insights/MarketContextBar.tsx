'use client';

import { cn } from '@/lib/formatters';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { MacroIndicator, MarketData } from '@/types';

interface MarketContextBarProps {
  trm?: MarketData;
  indicators: MacroIndicator[];
}

function formatValue(indicator: MacroIndicator): string {
  if (indicator.value == null) return '—';
  if (indicator.unit === 'percent') return `${indicator.value.toFixed(2)}%`;
  if (indicator.unit === 'index') return indicator.value.toLocaleString('en-US', { maximumFractionDigits: 0 });
  return `$${indicator.value.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}

export default function MarketContextBar({ trm, indicators }: MarketContextBarProps) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
      {/* TRM pill */}
      {trm && (
        <ContextPill
          label="TRM"
          value={`$${trm.price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
          change={trm.change_pct}
          country="CO"
        />
      )}

      {/* Macro indicator pills */}
      {indicators.map(ind => (
        <ContextPill
          key={ind.id}
          label={ind.name}
          value={formatValue(ind)}
          change={ind.change}
          country={ind.country}
        />
      ))}
    </div>
  );
}

function ContextPill({ label, value, change, country }: {
  label: string;
  value: string;
  change?: number;
  country: 'CO' | 'US';
}) {
  const hasChange = change !== undefined && change !== 0;
  const isPositive = (change ?? 0) >= 0;

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-xs shrink-0 min-w-[140px]">
      <span className={cn(
        'text-[9px] font-bold px-1 py-0.5 rounded shrink-0',
        country === 'CO' ? 'bg-accent-50 text-accent-800' : 'bg-info-light text-info'
      )}>
        {country}
      </span>
      <div className="flex flex-col">
        <span className="text-[10px] text-gray-500 whitespace-nowrap">{label}</span>
        <div className="flex items-baseline gap-1">
          <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">{value}</span>
          {hasChange && (
            <span className={cn('flex items-center gap-0.5 text-[10px] font-semibold', isPositive ? 'text-success' : 'text-error')}>
              {isPositive ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
              {isPositive ? '+' : ''}{change?.toFixed(1)}%
            </span>
          )}
          {!hasChange && (
            <Minus className="w-2.5 h-2.5 text-gray-300" />
          )}
        </div>
      </div>
    </div>
  );
}
