'use client';

import { useLocale } from '@/hooks/useLocale';
import { formatPercent } from '@/lib/formatters';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import AllocationDonut from '@/components/charts/AllocationDonut';
import type { AllocationTarget } from '@/types';

interface AllocationTableProps {
  data: AllocationTarget[];
}

export default function AllocationTable({ data }: AllocationTableProps) {
  const { t } = useLocale();

  const statusBadge = (target: AllocationTarget) => {
    const variant = target.status === 'over' ? 'error' : target.status === 'under' ? 'warning' : 'success';
    return <Badge variant={variant} size="sm">{t(`status.${target.status}`)}</Badge>;
  };

  return (
    <Card hover={false}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900">{t('dashboard.allocation')}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{t('dashboard.allocation_subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Table */}
        <div className="overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="table-header text-left py-2 pr-2">{t('table.sleeve')}</th>
                <th className="table-header text-right py-2 px-2">{t('table.target')}</th>
                <th className="table-header text-right py-2 px-2">{t('table.actual')}</th>
                <th className="table-header text-right py-2 px-2">{t('table.drift')}</th>
                <th className="table-header text-right py-2 pl-2">{t('table.status')}</th>
              </tr>
            </thead>
            <tbody>
              {data.map(target => (
                <tr key={target.sleeve_id} className="border-b border-gray-100 last:border-0">
                  <td className="py-2.5 pr-2 text-sm text-gray-800">{target.description}</td>
                  <td className="py-2.5 px-2 text-sm text-right text-gray-600">{formatPercent(target.target_pct, false)}</td>
                  <td className="py-2.5 px-2 text-sm text-right font-semibold text-gray-900">{formatPercent(target.actual_pct, false)}</td>
                  <td className="py-2.5 px-2 text-sm text-right">
                    <span className={target.drift > 2 ? 'text-error' : target.drift < -2 ? 'text-warning' : 'text-gray-500'}>
                      {formatPercent(target.drift)}
                    </span>
                  </td>
                  <td className="py-2.5 pl-2 text-right">{statusBadge(target)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Donut Chart */}
        <AllocationDonut data={data} />
      </div>
    </Card>
  );
}
