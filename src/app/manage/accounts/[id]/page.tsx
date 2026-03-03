'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Pencil, DollarSign, Wallet, TrendingUp, BarChart3 } from 'lucide-react';
import api from '@/lib/api';
import type { Account, Position, Investor, Institution } from '@/types';
import { useLocale } from '@/hooks/useLocale';
import { formatCOP, formatUSD, formatCOPCompact, formatUSDCompact, formatDate, formatPercent, cn, computeCAGR } from '@/lib/formatters';
import { useToast } from '@/hooks/useToast';
import Card from '@/components/ui/Card';
import MetricCard from '@/components/ui/MetricCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import DataTable from '@/components/ui/DataTable';
import ToastContainer from '@/components/ui/Toast';
import AccountForm from '@/components/manage/AccountForm';

export default function AccountDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t, locale } = useLocale();
  const { toasts, showToast, dismissToast } = useToast();
  const id = params.id as string;

  const [account, setAccount] = useState<Account | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [showEdit, setShowEdit] = useState(false);

  const load = () => {
    Promise.all([
      api.getAccountById(id),
      api.getPositionsByAccount(id),
      api.getInvestors(),
      api.getInstitutions(),
    ]).then(([acc, pos, invs, insts]) => {
      setAccount(acc);
      setPositions(pos);
      setInvestors(invs);
      setInstitutions(insts);
    });
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [id]);

  if (!account) return <p className="text-gray-500">{t('common.loading')}</p>;

  const investorName = investors.find(i => i.investor_id === account.investor_id)?.full_name || account.investor_id;

  const handleEdit = async (data: Account) => {
    await api.updateAccount(data.account_id, data);
    load();
    setShowEdit(false);
    showToast(t('accounts.account_updated'), 'success');
  };

  // Financial metrics
  const totalCurrentValue = positions.reduce((sum, p) => sum + (p.current_value || p.cost_basis || 0), 0);
  const totalCostBasis = positions.reduce((sum, p) => sum + (p.cost_basis || 0), 0);
  const totalPnl = totalCurrentValue - totalCostBasis;
  const returnPct = totalCostBasis > 0 ? (totalPnl / totalCostBasis) * 100 : 0;
  const fmt = account.currency === 'COP' ? formatCOP : formatUSD;
  const fmtCompact = account.currency === 'COP' ? formatCOPCompact : formatUSDCompact;

  const positionCols = [
    { key: 'symbol' as keyof Position, label: t('positions.symbol'), sortable: true },
    { key: 'description' as keyof Position, label: t('positions.description') },
    { key: 'quantity' as keyof Position, label: t('positions.quantity'), align: 'right' as const },
    { key: 'cost_basis' as keyof Position, label: t('positions.cost_basis'), align: 'right' as const, render: (v: unknown, row: Position) => row.cost_currency === 'COP' ? formatCOP(v as number) : formatUSD(v as number) },
    { key: 'current_value' as keyof Position, label: t('accounts.current_value'), align: 'right' as const, render: (v: unknown, row: Position) => row.cost_currency === 'COP' ? formatCOP((v as number) || row.cost_basis) : formatUSD((v as number) || row.cost_basis) },
    { key: 'pnl_pct' as keyof Position, label: t('accounts.return_pct'), align: 'right' as const, render: (v: unknown) => { const val = (v as number) || 0; return <span className={cn('font-semibold', val >= 0 ? 'text-success' : 'text-error')}>{formatPercent(val)}</span>; } },
    { key: 'position_type' as keyof Position, label: t('positions.position_type'), render: (v: unknown) => <Badge variant="default" size="sm">{v as string}</Badge> },
    { key: 'acquisition_date' as keyof Position, label: t('positions.acquisition_date'), render: (v: unknown) => formatDate(v as string, locale) },
    { key: 'is_active' as keyof Position, label: t('positions.status'), render: (v: unknown) => <Badge variant={v ? 'success' : 'default'} size="sm">{v ? t('status.active') : t('status.inactive')}</Badge> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" icon={ArrowLeft} onClick={() => router.push('/manage/accounts')}>
          {t('common.back')}
        </Button>
        <div className="ml-auto">
          <Button variant="secondary" icon={Pencil} size="sm" onClick={() => setShowEdit(true)}>
            {t('form.edit')}
          </Button>
        </div>
      </div>

      <Card glass padding="lg">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('accounts.account_id')}</p>
            <p className="text-lg font-semibold text-gray-900 mt-1">{account.account_id}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('accounts.account_name')}</p>
            <p className="text-sm text-gray-700 mt-1">{account.name || '—'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('accounts.investor')}</p>
            <p className="text-sm text-gray-700 mt-1">{investorName}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('accounts.institution')}</p>
            <p className="text-sm text-gray-700 mt-1">{account.institution}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('accounts.account_type')}</p>
            <p className="text-sm text-gray-700 mt-1">{account.account_type}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('accounts.currency')}</p>
            <Badge variant="default" size="sm" className="mt-1">{account.currency}</Badge>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('accounts.sleeve')}</p>
            <p className="text-sm text-gray-700 mt-1">{account.sleeve}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('accounts.status')}</p>
            <Badge variant={account.is_active ? 'success' : 'default'} size="sm" className="mt-1">
              {account.is_active ? t('status.active') : t('status.inactive')}
            </Badge>
          </div>
          {account.first_deposit_date && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('accounts.first_deposit_date')}</p>
              <p className="text-sm text-gray-700 mt-1">{formatDate(account.first_deposit_date, locale)}</p>
            </div>
          )}
          {account.created_at && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('accounts.created_at')}</p>
              <p className="text-sm text-gray-700 mt-1">{formatDate(account.created_at.split('T')[0] || account.created_at.split(' ')[0], locale)}</p>
            </div>
          )}
          {account.tracking_since && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('accounts.tracking_since')}</p>
              <p className="text-sm text-gray-700 mt-1">{formatDate(account.tracking_since, locale)}</p>
            </div>
          )}
        </div>
        {account.notes && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('accounts.notes')}</p>
            <p className="text-sm text-gray-600 mt-1">{account.notes}</p>
          </div>
        )}
      </Card>

      {positions.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard label={t('dashboard.balance')} value={fmtCompact(totalCurrentValue)} icon={DollarSign} iconColor="text-primary" />
          <MetricCard label={t('dashboard.capital')} value={fmtCompact(totalCostBasis)} icon={Wallet} iconColor="text-accent" />
          <MetricCard
            label={t('dashboard.returns')}
            value={fmtCompact(totalPnl)}
            icon={BarChart3}
            iconColor={totalPnl >= 0 ? 'text-success' : 'text-error'}
            delta={formatPercent(returnPct)}
            deltaType={totalPnl >= 0 ? 'positive' : 'negative'}
          />
          <MetricCard
            label={t('accounts.return_pct')}
            value={formatPercent(returnPct)}
            icon={TrendingUp}
            iconColor={returnPct >= 0 ? 'text-success' : 'text-error'}
            delta={(() => {
              const startDate = account.first_deposit_date;
              if (!startDate || totalCostBasis <= 0) return undefined;
              const cagr = computeCAGR(totalCurrentValue, totalCostBasis, startDate);
              if (!cagr.is_annualized) return undefined;
              return `${formatPercent(cagr.annualized_pct)} ${t('dashboard.annualized')} (${cagr.years}yr)`;
            })()}
            deltaType={returnPct >= 0 ? 'positive' : 'negative'}
          />
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">{t('accounts.positions_in_account')} ({positions.length})</h2>
        <Card>
          <DataTable columns={positionCols} data={positions} emptyMessage={t('table.no_data')} />
        </Card>
      </div>

      {showEdit && (
        <AccountForm isOpen={true} onClose={() => setShowEdit(false)} onSubmit={handleEdit} investors={investors} institutions={institutions} mode="edit" initialData={account} />
      )}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
