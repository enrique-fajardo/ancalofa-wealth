'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Users, UserCheck, Crown } from 'lucide-react';
import api from '@/lib/api';
import type { Investor, Account } from '@/types';
import { useLocale } from '@/hooks/useLocale';
import { formatDate } from '@/lib/formatters';
import Card from '@/components/ui/Card';
import MetricCard from '@/components/ui/MetricCard';
import Badge from '@/components/ui/Badge';
import DataTable from '@/components/ui/DataTable';
import SearchInput from '@/components/ui/SearchInput';

export default function InvestorsPage() {
  const { t, locale } = useLocale();
  const router = useRouter();
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    Promise.all([api.getInvestors(), api.getAccounts()]).then(([inv, acc]) => {
      setInvestors(inv);
      setAccounts(acc);
    });
  }, []);

  const filtered = investors.filter(i =>
    !search || i.full_name.toLowerCase().includes(search.toLowerCase()) || i.investor_id.includes(search)
  );

  const activeCount = investors.filter(i => i.status === 'Active').length;
  const primaryCount = investors.filter(i => i.investor_type === 'Primary').length;

  const getAccountCount = useCallback((investorId: string) => {
    return accounts.filter(a => a.investor_id === investorId).length;
  }, [accounts]);

  const typeVariant = (type: string) => {
    if (type === 'Primary') return 'info' as const;
    if (type === 'Secondary') return 'purple' as const;
    return 'default' as const;
  };

  const columns = [
    { key: 'investor_id' as keyof Investor, label: t('investors.id_number'), width: '130px' },
    { key: 'full_name' as keyof Investor, label: t('investors.full_name'), sortable: true },
    { key: 'investor_type' as keyof Investor, label: t('investors.investor_type'), sortable: true, render: (v: unknown) => <Badge variant={typeVariant(v as string)} size="sm">{v as string}</Badge> },
    { key: 'birth_date' as keyof Investor, label: t('investors.birth_date'), render: (v: unknown) => formatDate(v as string, locale) },
    { key: 'status' as keyof Investor, label: t('investors.status'), render: (v: unknown) => <Badge variant={(v as string) === 'Active' ? 'success' : 'default'} size="sm">{t(`status.${(v as string).toLowerCase()}`)}</Badge> },
    { key: 'investor_id' as keyof Investor, label: t('investors.accounts_count'), render: (_: unknown, row: Investor) => <span className="text-gray-600">{getAccountCount(row.investor_id)}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard label={t('investors.total_investors')} value={String(investors.length)} icon={Users} iconColor="text-primary" />
        <MetricCard label={t('investors.active_investors')} value={String(activeCount)} icon={UserCheck} iconColor="text-success" />
        <MetricCard label={t('investors.primary_count')} value={String(primaryCount)} icon={Crown} iconColor="text-accent" />
      </div>

      <div className="max-w-sm">
        <SearchInput value={search} onChange={setSearch} placeholder={t('common.search')} />
      </div>

      <Card>
        <DataTable
          columns={columns}
          data={filtered}
          onRowClick={(row) => router.push(`/manage/investors/${row.investor_id}`)}
          emptyMessage={t('table.no_data')}
        />
      </Card>
    </div>
  );
}
