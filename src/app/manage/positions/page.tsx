'use client';

import { useEffect, useState } from 'react';
import { Briefcase, CheckCircle, Layers, Plus, Pencil, Power, DollarSign, Wallet, BarChart3 } from 'lucide-react';
import api from '@/lib/api';
import type { Position, Account } from '@/types';
import { useLocale } from '@/hooks/useLocale';
import { cn, formatCOP, formatCOPCompact, formatUSD, formatPercent } from '@/lib/formatters';
import { useToast } from '@/hooks/useToast';
import Card from '@/components/ui/Card';
import MetricCard from '@/components/ui/MetricCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import DataTable from '@/components/ui/DataTable';
import SearchInput from '@/components/ui/SearchInput';
import ToastContainer from '@/components/ui/Toast';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import PositionForm from '@/components/manage/PositionForm';

export default function PositionsPage() {
  const { t } = useLocale();
  const { toasts, showToast, dismissToast } = useToast();
  const [positions, setPositions] = useState<Position[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterAccount] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editPosition, setEditPosition] = useState<Position | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Position | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = () => {
    Promise.all([api.getPositions(), api.getAccounts()]).then(([pos, accs]) => {
      setPositions(pos);
      setAccounts(accs);
    });
  };

  useEffect(() => { load(); }, []);

  const types = [...new Set(positions.map(p => p.position_type))];

  const filtered = positions.filter(p => {
    if (!showInactive && !p.is_active) return false;
    if (search && !p.symbol.toLowerCase().includes(search.toLowerCase()) && !p.description.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterType && p.position_type !== filterType) return false;
    if (filterAccount && p.account_id !== filterAccount) return false;
    return true;
  });

  const activeCount = positions.filter(p => p.is_active).length;
  const typeCount = types.length;

  // Financial metrics
  const TRM = 3691.75;
  const activePositions = positions.filter(p => p.is_active);
  const totalBalance = activePositions.reduce((s, p) => {
    const v = p.current_value || p.cost_basis || 0;
    return s + (p.cost_currency === 'USD' ? v * TRM : v);
  }, 0);
  const totalCapital = activePositions.reduce((s, p) => {
    const c = p.cost_basis || 0;
    return s + (p.cost_currency === 'USD' ? c * TRM : c);
  }, 0);
  const totalReturns = totalBalance - totalCapital;
  const totalReturnPct = totalCapital > 0 ? (totalReturns / totalCapital) * 100 : 0;

  const handleCreate = async (data: Omit<Position, 'position_id' | 'current_value' | 'pnl' | 'pnl_pct'>) => {
    await api.createPosition(data);
    load();
    showToast(t('positions.position_created'), 'success');
  };

  const handleEdit = async (data: Omit<Position, 'position_id' | 'current_value' | 'pnl' | 'pnl_pct'>) => {
    if (!editPosition) return;
    await api.updatePosition(editPosition.position_id, data);
    load();
    setEditPosition(null);
    showToast(t('positions.position_updated'), 'success');
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    await api.deletePosition(deleteTarget.position_id);
    load();
    setDeleteTarget(null);
    setDeleteLoading(false);
    showToast(t('positions.position_deleted'), 'success');
  };

  const columns = [
    { key: 'symbol' as keyof Position, label: t('positions.symbol'), sortable: true, width: '110px' },
    { key: 'description' as keyof Position, label: t('positions.description'), sortable: true },
    { key: 'account_id' as keyof Position, label: t('positions.account'), width: '130px' },
    { key: 'quantity' as keyof Position, label: t('positions.quantity'), align: 'right' as const },
    { key: 'cost_basis' as keyof Position, label: t('positions.cost_basis'), align: 'right' as const, render: (v: unknown, row: Position) => row.cost_currency === 'COP' ? formatCOP(v as number) : formatUSD(v as number) },
    { key: 'current_value' as keyof Position, label: t('portfolio.current_value'), align: 'right' as const, render: (v: unknown, row: Position) => { const val = (v as number) || row.cost_basis || 0; return <span className="font-semibold">{row.cost_currency === 'COP' ? formatCOP(val) : formatUSD(val)}</span>; } },
    { key: 'pnl_pct' as keyof Position, label: t('accounts.return_pct'), align: 'right' as const, render: (v: unknown) => { const val = (v as number) || 0; return <span className={cn('font-semibold', val >= 0 ? 'text-success' : 'text-error')}>{formatPercent(val)}</span>; } },
    { key: 'position_type' as keyof Position, label: t('positions.position_type'), render: (v: unknown) => <Badge variant="default" size="sm">{v as string}</Badge> },
    { key: 'is_active' as keyof Position, label: t('positions.status'), render: (v: unknown) => <Badge variant={v ? 'success' : 'default'} size="sm">{v ? t('status.active') : t('status.inactive')}</Badge> },
    {
      key: 'position_id' as keyof Position, label: '', width: '80px',
      render: (_: unknown, row: Position) => (
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <button onClick={() => setEditPosition(row)} className="p-1.5 text-gray-400 hover:text-primary rounded-lg hover:bg-primary/5 transition-colors">
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
        <MetricCard label={t('dashboard.balance')} value={formatCOPCompact(totalBalance)} icon={DollarSign} iconColor="text-primary" />
        <MetricCard label={t('dashboard.capital')} value={formatCOPCompact(totalCapital)} icon={Wallet} iconColor="text-accent" />
        <MetricCard
          label={t('dashboard.returns')}
          value={formatCOPCompact(totalReturns)}
          delta={formatPercent(totalReturnPct)}
          deltaType={totalReturns >= 0 ? 'positive' : 'negative'}
          icon={BarChart3}
          iconColor={totalReturns >= 0 ? 'text-success' : 'text-error'}
        />
        <MetricCard label={t('positions.total_positions')} value={String(positions.length)} icon={Briefcase} iconColor="text-primary" />
        <MetricCard label={t('positions.active_positions')} value={String(activeCount)} icon={CheckCircle} iconColor="text-success" />
        <MetricCard label={t('positions.by_type')} value={`${typeCount} types`} icon={Layers} iconColor="text-purple" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {positions.length > 0 && (
          <>
            <div className="max-w-xs flex-1">
              <SearchInput value={search} onChange={setSearch} placeholder={t('common.search')} />
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setFilterType('')} className={cn('px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors', !filterType ? 'bg-primary text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-primary hover:text-primary')}>
                {t('positions.all_types')}
              </button>
              {types.map(ty => (
                <button key={ty} onClick={() => setFilterType(ty)} className={cn('px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors', filterType === ty ? 'bg-primary text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-primary hover:text-primary')}>
                  {ty}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
              <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} className="rounded border-gray-300" />
              {t('positions.show_inactive')}
            </label>
          </>
        )}
        <div className={positions.length > 0 ? 'ml-auto' : ''}>
          <Button variant="primary" icon={Plus} size="sm" onClick={() => setShowCreate(true)}>
            {t('positions.add_position')}
          </Button>
        </div>
      </div>

      <Card>
        <DataTable columns={columns} data={filtered} emptyMessage={t('table.no_data')} />
      </Card>

      {showCreate && (
        <PositionForm isOpen={true} onClose={() => setShowCreate(false)} onSubmit={handleCreate} accounts={accounts} mode="create" />
      )}
      {editPosition && (
        <PositionForm isOpen={true} onClose={() => setEditPosition(null)} onSubmit={handleEdit} accounts={accounts} mode="edit" initialData={editPosition} />
      )}
      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title={t('positions.confirm_delete_title')} message={t('positions.confirm_delete')} confirmLabel={t('form.deactivate')} variant="danger" loading={deleteLoading} />
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
