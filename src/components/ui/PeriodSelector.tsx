'use client';

import { cn } from '@/lib/formatters';
import { useLocale } from '@/hooks/useLocale';
import type { PeriodKey } from '@/types';

const PERIOD_OPTIONS: PeriodKey[] = ['total', 'ytd', 'mtd', '12m', '3y', '5y'];

// Minimum months of data required for each period to be meaningful
const PERIOD_MIN_MONTHS: Record<string, number> = {
  '12m': 1,   // show if any data exists (will be partial)
  '3y': 1,
  '5y': 1,
  'mtd': 0,
  'ytd': 0,
  'total': 0,
};

// Full months for each period (for partial detection)
const PERIOD_FULL_MONTHS: Record<string, number> = {
  '12m': 12,
  '3y': 36,
  '5y': 60,
};

interface PeriodSelectorProps {
  period: PeriodKey;
  onPeriodChange: (period: PeriodKey) => void;
  className?: string;
  dataCoverageMonths?: number | null;
  isPartialPeriod?: boolean;
}

export default function PeriodSelector({
  period,
  onPeriodChange,
  className,
  dataCoverageMonths,
  isPartialPeriod,
}: PeriodSelectorProps) {
  const { t } = useLocale();

  const coverage = dataCoverageMonths ?? 0;

  return (
    <div className={cn('flex items-center gap-1 bg-white rounded-lg border border-gray-200 p-1 w-fit shadow-sm', className)}>
      {PERIOD_OPTIONS.map(key => {
        const fullMonths = PERIOD_FULL_MONTHS[key];
        const isDisabled = fullMonths !== undefined && coverage < PERIOD_MIN_MONTHS[key];
        const isPartial = !isDisabled && fullMonths !== undefined && coverage < fullMonths;
        const isSelected = period === key;

        return (
          <button
            key={key}
            onClick={() => !isDisabled && onPeriodChange(key)}
            disabled={isDisabled}
            title={
              isDisabled
                ? `Necesita al menos ${PERIOD_MIN_MONTHS[key]} meses de datos`
                : isPartial && isSelected
                  ? `${coverage}m de ${fullMonths}m disponibles`
                  : undefined
            }
            className={cn(
              'px-3 py-1.5 text-xs font-semibold rounded-md transition-all relative',
              isDisabled
                ? 'text-gray-300 cursor-not-allowed'
                : isSelected
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            )}
          >
            {t(`period.${key}`)}
            {/* Partial period indicator dot */}
            {isPartial && isSelected && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-400 rounded-full border border-white" />
            )}
          </button>
        );
      })}
      {/* Partial period label */}
      {isPartialPeriod && coverage > 0 && (
        <span className="ml-1 px-2 py-1 text-[10px] font-medium text-amber-600 bg-amber-50 rounded-md border border-amber-200">
          {coverage}m
        </span>
      )}
    </div>
  );
}
