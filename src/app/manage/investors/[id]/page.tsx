'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import api from '@/lib/api';
import type { Investor, Account, Position } from '@/types';
import { useLocale } from '@/hooks/useLocale';
import { formatDate, formatCOP, formatUSD } from '@/lib/formatters';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import DataTable from '@/components/ui/DataTable';

export default function InvestorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t, locale } = useLocale();
  const id = params.id as string;

  const [investor, setInvestor] = useState<Investor | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);

  useEffect(() => {
    Promise.all([
      api.getInvestorById(id),
      api.getAccountsByInvestor(id),
      api.getPositions(),
    ]).then(([inv, accs, allPos]) => {
      setInvestor(inv);
      setAccounts(accs);
      const accountIds = accs.map(a => a.account_id);
      setPositions(allPos.filter(p => accountIds.includes(p.account_id)));
    });
  }, [id]);

  if (!investor) return <p className="text-gray-500">{t('common.loading')}</p>;

  const accountCols = [
    { key: 'account_id' as keyof Account, label: t('accounts.account_id'), sortable: true },
    { key: 'institution' as keyof Account, label: t('accounts.institution'), sortable: true },
    { key: 'account_type' as keyof Account, label: t('accounts.account_type') },
    { key: 'currency' as keyof Account, label: t('accounts.currency'), render: (v: unknown) => <Badge variant="default" size="sm">{v as string}</Badge> },
    { key: 'sleeve' as keyof Account, label: t('accounts.sleeve') },
    { key: 'is_active' as keyof Account, label: t('accounts.status'), render: (v: unknown) => <Badge variant={v ? 'success' : 'default'} size="sm">{v ? t('status.active') : t('status.inactive')}</Badge> },
  ];

  const positionCols = [
    { key: 'symbol' as keyof Position, label: t('positions.symbol'), sortable: true },
    { key: 'description' as keyof Position, label: t('positions.description') },
    { key: 'account_id' as keyof Position, label: t('positions.account') },
    { key: 'quantity' as keyof Position, label: t('positions.quantity'), align: 'right' as const },
    { key: 'cost_basis' as keyof Position, label: t('positions.cost_basis'), align: 'right' as const, render: (v: unknown, row: Position) => row.cost_currency === 'COP' ? formatCOP(v as number) : formatUSD(v as number) },
    { key: 'position_type' as keyof Position, label: t('positions.position_type'), render: (v: unknown) => <Badge variant="default" size="sm">{v as string}</Badge> },
  ];

  return (
    <div className="space-y-6">
      <Button variant="ghost" icon={ArrowLeft} onClick={() => router.push('/manage/investors')}>
        {t('common.back')}
      </Button>

      <Card glass padding="lg">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('investors.full_name')}</p>
            <p className="text-lg font-semibold text-gray-900 mt-1">{investor.full_name}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('investors.id_number')}</p>
            <p className="text-sm text-gray-700 mt-1">{investor.investor_id}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('investors.investor_type')}</p>
            <Badge variant={investor.investor_type === 'Primary' ? 'info' : investor.investor_type === 'Secondary' ? 'purple' : 'default'} size="sm" className="mt-1">
              {investor.investor_type}
            </Badge>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('investors.birth_date')}</p>
            <p className="text-sm text-gray-700 mt-1">{formatDate(investor.birth_date, locale)}</p>
          </div>
        </div>
      </Card>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">{t('investors.investor_accounts')} ({accounts.length})</h2>
        <Card>
          <DataTable columns={accountCols} data={accounts} onRowClick={(row) => router.push(`/manage/accounts/${row.account_id}`)} emptyMessage={t('table.no_data')} />
        </Card>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">{t('investors.investor_positions')} ({positions.length})</h2>
        <Card>
          <DataTable columns={positionCols} data={positions} emptyMessage={t('table.no_data')} />
        </Card>
      </div>
    </div>
  );
}
