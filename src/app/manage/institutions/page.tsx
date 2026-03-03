'use client';

import { useEffect, useState } from 'react';
import { Building2, CheckCircle, Layers, Plus, Pencil, Power, DollarSign, Wallet, BarChart3 } from 'lucide-react';
import api from '@/lib/api';
import type { Institution, Account, Position } from '@/types';
import { useLocale } from '@/hooks/useLocale';
import { cn, formatCOP, formatCOPCompact, formatPercent } from '@/lib/formatters';
import { useToast } from '@/hooks/useToast';
import Card from '@/components/ui/Card';
import MetricCard from '@/components/ui/MetricCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import DataTable from '@/components/ui/DataTable';
import SearchInput from '@/components/ui/SearchInput';
import ToastContainer from '@/components/ui/Toast';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import InstitutionForm from '@/components/manage/InstitutionForm';

export default function InstitutionsPage() {
  const { t } = useLocale();
  const { toasts, showToast, dismissToast } = useToast();
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editInstitution, setEditInstitution] = useState<Institution | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Institution | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = () => {
    Promise.all([api.getInstitutions(), api.getAccounts(), api.getPositions()]).then(([insts, accs, pos]) => {
      setInstitutions(insts);
      setAccounts(accs);
      setPositions(pos);
    });
  };

  useEffect(() => { load(); }, []);

  const types = [...new Set(institutions.map(i => i.institution_type))];

  const filtered = institutions.filter(i => {
    if (search && !i.name.toLowerCase().includes(search.toLowerCase()) && !i.short_code.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterType && i.institution_type !== filterType) return false;
    return true;
  });

  const activeCount = institutions.filter(i => i.is_active).length;
  const typeCount = types.length;

  // Compute balance, capital, returns per institution (COP equivalent)
  const TRM = 3691.75;
  const institutionBalances: Record<string, number> = {};
  const institutionCapitals: Record<string, number> = {};
  // Map account_id → institution name
  const accountInst: Record<string, string> = {};
  accounts.forEach(a => { accountInst[a.account_id] = a.institution; });
  positions.filter(p => p.is_active).forEach(p => {
    const instName = accountInst[p.account_id];
    if (!instName) return;
    const val = p.current_value || p.cost_basis || 0;
    const cost = p.cost_basis || 0;
    const valCop = p.cost_currency === 'USD' ? val * TRM : val;
    const costCop = p.cost_currency === 'USD' ? cost * TRM : cost;
    institutionBalances[instName] = (institutionBalances[instName] || 0) + valCop;
    institutionCapitals[instName] = (institutionCapitals[instName] || 0) + costCop;
  });
  const grandBalance = Object.values(institutionBalances).reduce((s, v) => s + v, 0);
  const grandCapital = Object.values(institutionCapitals).reduce((s, v) => s + v, 0);
  const grandReturns = grandBalance - grandCapital;
  const grandReturnPct = grandCapital > 0 ? (grandReturns / grandCapital) * 100 : 0;

  const handleCreate = async (data: Omit<Institution, 'institution_id'>) => {
    await api.createInstitution(data);
    load();
    showToast(t('institutions.institution_created'), 'success');
  };

  const handleEdit = async (data: Omit<Institution, 'institution_id'>) => {
    if (!editInstitution) return;
    await api.updateInstitution(editInstitution.institution_id, data);
    load();
    setEditInstitution(null);
    showToast(t('institutions.institution_updated'), 'success');
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    await api.deleteInstitution(deleteTarget.institution_id);
    load();
    setDeleteTarget(null);
    setDeleteLoading(false);
    showToast(t('institutions.institution_deleted'), 'success');
  };

  const formatType = (type: string) => type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  const columns = [
    { key: 'name' as keyof Institution, label: t('institutions.name'), sortable: true, render: (v: unknown) => <span className="font-medium">{v as string}</span> },
    { key: 'short_code' as keyof Institution, label: t('institutions.short_code'), width: '100px', render: (v: unknown) => <code className="text-xs bg-gray-100 px-2 py-0.5 rounded">{v as string}</code> },
    { key: 'institution_type' as keyof Institution, label: t('institutions.institution_type'), render: (v: unknown) => <Badge variant="default" size="sm">{formatType(v as string)}</Badge> },
    { key: 'country' as keyof Institution, label: t('institutions.country') },
    { key: 'notes' as keyof Institution, label: t('dashboard.balance') + ' / ' + t('dashboard.capital') + ' / ' + t('dashboard.returns'), align: 'right' as const, render: (_: unknown, row: Institution) => { const bal = institutionBalances[row.name] || 0; const cap = institutionCapitals[row.name] || 0; const ret = bal - cap; const retPct = cap > 0 ? (ret / cap) * 100 : 0; return bal > 0 ? <div className="text-right leading-tight"><p className="font-semibold text-gray-900">{formatCOP(bal)}</p><p className="text-[10px] text-gray-500">{formatCOP(cap)}</p><p className={cn('text-[10px] font-semibold', ret >= 0 ? 'text-success' : 'text-error')}>{formatCOP(ret)} ({formatPercent(retPct)})</p></div> : <span className="text-gray-400">—</span>; } },
    { key: 'is_active' as keyof Institution, label: t('institutions.status'), render: (v: unknown) => <Badge variant={v ? 'success' : 'default'} size="sm">{v ? t('status.active') : t('status.inactive')}</Badge> },
    {
      key: 'institution_id' as keyof Institution, label: '', width: '80px',
      render: (_: unknown, row: Institution) => (
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <button onClick={() => setEditInstitution(row)} className="p-1.5 text-gray-400 hover:text-primary rounded-lg hover:bg-primary/5 transition-colors">
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
        <MetricCard label={t('dashboard.balance')} value={formatCOPCompact(grandBalance)} icon={DollarSign} iconColor="text-primary" />
        <MetricCard label={t('dashboard.capital')} value={formatCOPCompact(grandCapital)} icon={Wallet} iconColor="text-accent" />
        <MetricCard
          label={t('dashboard.returns')}
          value={formatCOPCompact(grandReturns)}
          delta={formatPercent(grandReturnPct)}
          deltaType={grandReturns >= 0 ? 'positive' : 'negative'}
          icon={BarChart3}
          iconColor={grandReturns >= 0 ? 'text-success' : 'text-error'}
        />
        <MetricCard label={t('institutions.total_institutions')} value={String(institutions.length)} icon={Building2} iconColor="text-primary" />
        <MetricCard label={t('institutions.active_institutions')} value={String(activeCount)} icon={CheckCircle} iconColor="text-success" />
        <MetricCard label={t('institutions.by_type')} value={`${typeCount} types`} icon={Layers} iconColor="text-purple" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {institutions.length > 0 && (
          <>
            <div className="max-w-xs flex-1">
              <SearchInput value={search} onChange={setSearch} placeholder={t('common.search')} />
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setFilterType('')} className={cn('px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors', !filterType ? 'bg-primary text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-primary hover:text-primary')}>
                {t('institutions.all_types')}
              </button>
              {types.map(ty => (
                <button key={ty} onClick={() => setFilterType(ty)} className={cn('px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors', filterType === ty ? 'bg-primary text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-primary hover:text-primary')}>
                  {formatType(ty)}
                </button>
              ))}
            </div>
          </>
        )}
        <div className={institutions.length > 0 ? 'ml-auto' : ''}>
          <Button variant="primary" icon={Plus} size="sm" onClick={() => setShowCreate(true)}>
            {t('institutions.add_institution')}
          </Button>
        </div>
      </div>

      <Card>
        <DataTable columns={columns} data={filtered} emptyMessage={t('table.no_data')} />
      </Card>

      {showCreate && (
        <InstitutionForm isOpen={true} onClose={() => setShowCreate(false)} onSubmit={handleCreate} mode="create" />
      )}
      {editInstitution && (
        <InstitutionForm isOpen={true} onClose={() => setEditInstitution(null)} onSubmit={handleEdit} mode="edit" initialData={editInstitution} />
      )}
      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title={t('institutions.confirm_delete_title')} message={t('institutions.confirm_delete')} confirmLabel={t('form.deactivate')} variant="danger" loading={deleteLoading} />
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
