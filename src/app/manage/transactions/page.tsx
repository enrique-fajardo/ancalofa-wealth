'use client';

import { useEffect, useState } from 'react';
import { ArrowRightLeft, Clock, TrendingUp, Plus } from 'lucide-react';
import api from '@/lib/api';
import type { Transaction, Account } from '@/types';
import { useLocale } from '@/hooks/useLocale';
import { cn, formatCOP, formatCOPCompact, formatUSD, formatDateShort } from '@/lib/formatters';
import { useToast } from '@/hooks/useToast';
import Card from '@/components/ui/Card';
import MetricCard from '@/components/ui/MetricCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import DataTable from '@/components/ui/DataTable';
import ToastContainer from '@/components/ui/Toast';
import TransactionForm from '@/components/manage/TransactionForm';

const typeColors: Record<string, 'success' | 'error' | 'info' | 'warning' | 'default'> = {
  buy: 'info',
  sell: 'warning',
  dividend: 'success',
  interest: 'success',
  deposit: 'info',
  withdrawal: 'error',
  fee: 'error',
};

export default function TransactionsPage() {
  const { t } = useLocale();
  const { toasts, showToast, dismissToast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [filterType, setFilterType] = useState('');
  const [filterAccount, setFilterAccount] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const load = () => {
    Promise.all([api.getTransactions(), api.getAccounts()]).then(([txns, accs]) => {
      setTransactions(txns);
      setAccounts(accs);
    });
  };

  useEffect(() => { load(); }, []);

  const types = [...new Set(transactions.map(t => t.transaction_type))];

  const filtered = transactions.filter(tx => {
    if (filterType && tx.transaction_type !== filterType) return false;
    if (filterAccount && tx.account_id !== filterAccount) return false;
    return true;
  }).sort((a, b) => b.transaction_date.localeCompare(a.transaction_date));

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const recentCount = transactions.filter(tx => tx.transaction_date >= thirtyDaysAgo).length;
  const totalVolume = transactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  const handleCreate = async (data: Omit<Transaction, 'transaction_id'>) => {
    await api.createTransaction(data);
    load();
    showToast(t('transactions.transaction_created'), 'success');
  };

  const columns = [
    { key: 'transaction_date' as keyof Transaction, label: t('transactions.date'), sortable: true, width: '110px', render: (v: unknown) => formatDateShort(v as string) },
    { key: 'account_id' as keyof Transaction, label: t('transactions.account'), width: '130px' },
    { key: 'transaction_type' as keyof Transaction, label: t('transactions.transaction_type'), render: (v: unknown) => <Badge variant={typeColors[v as string] || 'default'} size="sm">{v as string}</Badge> },
    { key: 'symbol' as keyof Transaction, label: t('transactions.symbol'), render: (v: unknown) => (v as string) || '—' },
    { key: 'amount' as keyof Transaction, label: t('transactions.amount'), align: 'right' as const, render: (v: unknown, row: Transaction) => row.currency === 'COP' ? formatCOP(v as number) : formatUSD(v as number) },
    { key: 'currency' as keyof Transaction, label: t('transactions.currency'), render: (v: unknown) => <Badge variant="default" size="sm">{v as string}</Badge> },
    { key: 'fees' as keyof Transaction, label: t('transactions.fees'), align: 'right' as const, render: (v: unknown) => (v as number) > 0 ? formatUSD(v as number) : '—' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard label={t('transactions.total_transactions')} value={String(transactions.length)} icon={ArrowRightLeft} iconColor="text-primary" />
        <MetricCard label={t('transactions.recent_transactions')} value={String(recentCount)} icon={Clock} iconColor="text-info" />
        <MetricCard label={t('transactions.total_volume')} value={formatCOPCompact(totalVolume)} icon={TrendingUp} iconColor="text-accent" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => setFilterType('')} className={cn('px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors', !filterType ? 'bg-primary text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-primary hover:text-primary')}>
            {t('transactions.all_types')}
          </button>
          {types.map(ty => (
            <button key={ty} onClick={() => setFilterType(ty)} className={cn('px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors', filterType === ty ? 'bg-primary text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-primary hover:text-primary')}>
              {ty}
            </button>
          ))}
        </div>
        <select value={filterAccount} onChange={e => setFilterAccount(e.target.value)} className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-primary">
          <option value="">{t('transactions.all_accounts')}</option>
          {accounts.map(a => <option key={a.account_id} value={a.account_id}>{a.account_id}</option>)}
        </select>
        <div className="ml-auto">
          <Button variant="primary" icon={Plus} size="sm" onClick={() => setShowCreate(true)}>
            {t('transactions.add_transaction')}
          </Button>
        </div>
      </div>

      <Card>
        <DataTable columns={columns} data={filtered} emptyMessage={t('table.no_data')} />
      </Card>

      {showCreate && (
        <TransactionForm isOpen={true} onClose={() => setShowCreate(false)} onSubmit={handleCreate} accounts={accounts} />
      )}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
