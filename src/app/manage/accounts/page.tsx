'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wallet, CheckCircle, DollarSign, Plus, Pencil, Power, TrendingUp, BarChart3 } from 'lucide-react';
import api from '@/lib/api';
import type { Institution, Investor, Account, Position } from '@/types';
import { useLocale } from '@/hooks/useLocale';
import { cn, formatCOP, formatCOPCompact, formatPercent, computeCAGR } from '@/lib/formatters';
import { useToast } from '@/hooks/useToast';
import Card from '@/components/ui/Card';
import MetricCard from '@/components/ui/MetricCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import DataTable from '@/components/ui/DataTable';
import SearchInput from '@/components/ui/SearchInput';
import ToastContainer from '@/components/ui/Toast';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import AccountForm from '@/components/manage/AccountForm';

export default function AccountsPage() {
  const { t } = useLocale();
  const router = useRouter();
  const { toasts, showToast, dismissToast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [search, setSearch] = useState('');
  const [filterInst, setFilterInst] = useState('');
  const [filterCurrency, setFilterCurrency] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editAccount, setEditAccount] = useState<Account | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = () => {
    Promise.all([api.getAccounts(), api.getInvestors(), api.getInstitutions(), api.getPositions()]).then(([accs, invs, insts, pos]) => {
      setAccounts(accs);
      setInvestors(invs);
      setInstitutions(insts);
      setPositions(pos);
    });
  };

  useEffect(() => { load(); }, []);

  const institutionNames = [...new Set(accounts.map(a => a.institution))];

  const filtered = accounts.filter(a => {
    if (search && !a.account_id.toLowerCase().includes(search.toLowerCase()) && !a.institution.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterInst && a.institution !== filterInst) return false;
    if (filterCurrency && a.currency !== filterCurrency) return false;
    return true;
  });

  const activeCount = accounts.filter(a => a.is_active).length;
  const copCount = accounts.filter(a => a.currency === 'COP').length;
  const usdCount = accounts.filter(a => a.currency === 'USD').length;

  // Compute balance, capital, returns per account from positions
  const TRM = 3691.75;
  const accountBalances: Record<string, number> = {};
  const accountCapitals: Record<string, number> = {};
  positions.filter(p => p.is_active).forEach(p => {
    const val = p.current_value || p.cost_basis || 0;
    const cost = p.cost_basis || 0;
    const valCop = p.cost_currency === 'USD' ? val * TRM : val;
    const costCop = p.cost_currency === 'USD' ? cost * TRM : cost;
    accountBalances[p.account_id] = (accountBalances[p.account_id] || 0) + valCop;
    accountCapitals[p.account_id] = (accountCapitals[p.account_id] || 0) + costCop;
  });
  const totalAUM = Object.values(accountBalances).reduce((s, v) => s + v, 0);
  const totalCapital = Object.values(accountCapitals).reduce((s, v) => s + v, 0);
  const totalReturns = totalAUM - totalCapital;
  const totalReturnPct = totalCapital > 0 ? (totalReturns / totalCapital) * 100 : 0;

  const getInvestorName = (id: string) => investors.find(i => i.investor_id === id)?.used_name || id;

  const handleCreate = async (data: Account) => {
    await api.createAccount(data);
    load();
    showToast(t('accounts.account_created'), 'success');
  };

  const handleEdit = async (data: Account) => {
    await api.updateAccount(data.account_id, data);
    load();
    setEditAccount(null);
    showToast(t('accounts.account_updated'), 'success');
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    await api.deleteAccount(deleteTarget.account_id);
    load();
    setDeleteTarget(null);
    setDeleteLoading(false);
    showToast(t('accounts.account_deleted'), 'success');
  };

  const columns = [
    { key: 'account_id' as keyof Account, label: t('accounts.account_id'), sortable: true, width: '140px' },
    { key: 'name' as keyof Account, label: t('accounts.account_name'), render: (v: unknown) => <span className="font-medium">{(v as string) || '—'}</span> },
    { key: 'investor_id' as keyof Account, label: t('accounts.investor'), render: (v: unknown) => getInvestorName(v as string) },
    { key: 'institution' as keyof Account, label: t('accounts.institution'), sortable: true },
    { key: 'account_type' as keyof Account, label: t('accounts.account_type') },
    { key: 'currency' as keyof Account, label: t('accounts.currency'), render: (v: unknown) => <Badge variant="default" size="sm">{v as string}</Badge> },
    { key: 'sleeve' as keyof Account, label: t('dashboard.balance') + ' / ' + t('dashboard.capital') + ' / ' + t('dashboard.returns'), align: 'right' as const, render: (_: unknown, row: Account) => { const bal = accountBalances[row.account_id] || 0; const cap = accountCapitals[row.account_id] || 0; const ret = bal - cap; const retPct = cap > 0 ? (ret / cap) * 100 : 0; const cagr = row.first_deposit_date && cap > 0 ? computeCAGR(bal, cap, row.first_deposit_date) : null; return bal > 0 ? <div className="text-right leading-tight"><p className="font-semibold text-gray-900">{formatCOP(bal)}</p><p className="text-[10px] text-gray-500">{formatCOP(cap)}</p><p className={cn('text-[10px] font-semibold', ret >= 0 ? 'text-success' : 'text-error')}>{formatCOP(ret)} ({formatPercent(retPct)})</p>{cagr?.is_annualized && <p className="text-[10px] text-gray-500">{formatPercent(cagr.annualized_pct)} {t('dashboard.annualized')} ({cagr.years}yr)</p>}</div> : <span className="text-gray-400">—</span>; } },
    { key: 'is_active' as keyof Account, label: t('accounts.status'), render: (v: unknown) => <Badge variant={v ? 'success' : 'default'} size="sm">{v ? t('status.active') : t('status.inactive')}</Badge> },
    {
      key: 'notes' as keyof Account, label: '', width: '80px',
      render: (_: unknown, row: Account) => (
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <button onClick={() => setEditAccount(row)} className="p-1.5 text-gray-400 hover:text-primary rounded-lg hover:bg-primary/5 transition-colors">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          {row.is_active && (
            <button onClick={() => setDeleteTarget(row)} className="p-1.5 text-gray-400 hover:text-error rounded-lg hover:bg-error/5 transition-colors">
              <Power className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard label={t('dashboard.balance')} value={formatCOPCompact(totalAUM)} icon={DollarSign} iconColor="text-primary" />
        <MetricCard label={t('dashboard.capital')} value={formatCOPCompact(totalCapital)} icon={Wallet} iconColor="text-accent" />
        <MetricCard
          label={t('dashboard.returns')}
          value={formatCOPCompact(totalReturns)}
          delta={formatPercent(totalReturnPct)}
          deltaType={totalReturns >= 0 ? 'positive' : 'negative'}
          icon={BarChart3}
          iconColor={totalReturns >= 0 ? 'text-success' : 'text-error'}
        />
        <MetricCard label={t('accounts.total_accounts')} value={String(accounts.length)} icon={Wallet} iconColor="text-primary" />
        <MetricCard label={t('accounts.active_accounts')} value={String(activeCount)} icon={CheckCircle} iconColor="text-success" />
        <MetricCard label={t('accounts.by_currency')} value={`${copCount} COP / ${usdCount} USD`} icon={DollarSign} iconColor="text-accent" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {accounts.length > 0 && (
          <>
            <div className="max-w-xs flex-1">
              <SearchInput value={search} onChange={setSearch} placeholder={t('common.search')} />
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setFilterInst('')} className={cn('px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors', !filterInst ? 'bg-primary text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-primary hover:text-primary')}>
                {t('accounts.all_institutions')}
              </button>
              {institutionNames.map(inst => (
                <button key={inst} onClick={() => setFilterInst(inst)} className={cn('px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors', filterInst === inst ? 'bg-primary text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-primary hover:text-primary')}>
                  {inst}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              {['', 'COP', 'USD'].map(c => (
                <button key={c} onClick={() => setFilterCurrency(c)} className={cn('px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors', filterCurrency === c ? 'bg-primary text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-primary hover:text-primary')}>
                  {c || t('portfolio.all')}
                </button>
              ))}
            </div>
          </>
        )}
        <div className={accounts.length > 0 ? 'ml-auto' : ''}>
          <Button variant="primary" icon={Plus} size="sm" onClick={() => setShowCreate(true)}>
            {t('accounts.add_account')}
          </Button>
        </div>
      </div>

      <Card>
        <DataTable columns={columns} data={filtered} onRowClick={(row) => router.push(`/manage/accounts/${row.account_id}`)} emptyMessage={t('table.no_data')} />
      </Card>

      {showCreate && (
        <AccountForm isOpen={true} onClose={() => setShowCreate(false)} onSubmit={handleCreate} investors={investors} institutions={institutions} mode="create" existingAccounts={accounts} />
      )}
      {editAccount && (
        <AccountForm isOpen={true} onClose={() => setEditAccount(null)} onSubmit={handleEdit} investors={investors} institutions={institutions} mode="edit" initialData={editAccount} existingAccounts={accounts} />
      )}
      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title={t('accounts.confirm_delete_title')} message={t('accounts.confirm_delete')} confirmLabel={t('form.deactivate')} variant="danger" loading={deleteLoading} />
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
