'use client';

import { useState } from 'react';
import type { Position, Account } from '@/types';
import { POSITION_TYPES, CURRENCIES } from '@/types';
import { useLocale } from '@/hooks/useLocale';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import FormField from '@/components/ui/FormField';

type PositionFormData = Omit<Position, 'position_id' | 'current_value' | 'pnl' | 'pnl_pct'>;

interface PositionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PositionFormData) => Promise<void>;
  accounts: Account[];
  mode: 'create' | 'edit';
  initialData?: Position;
  preselectedAccount?: string;
}

export default function PositionForm({ isOpen, onClose, onSubmit, accounts, mode, initialData, preselectedAccount }: PositionFormProps) {
  const { t } = useLocale();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<PositionFormData>(
    initialData ? {
      account_id: initialData.account_id,
      symbol: initialData.symbol,
      description: initialData.description,
      quantity: initialData.quantity,
      cost_basis: initialData.cost_basis,
      cost_currency: initialData.cost_currency,
      acquisition_date: initialData.acquisition_date,
      position_type: initialData.position_type,
      maturity_date: initialData.maturity_date,
      is_active: initialData.is_active,
    } : {
      account_id: preselectedAccount || '',
      symbol: '',
      description: '',
      quantity: 0,
      cost_basis: 0,
      cost_currency: 'COP' as const,
      acquisition_date: new Date().toISOString().split('T')[0],
      position_type: '',
      maturity_date: undefined,
      is_active: true,
    }
  );

  const set = (field: keyof PositionFormData) => (value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.account_id) errs.account_id = t('form.required_field');
    if (!form.symbol) errs.symbol = t('form.required_field');
    if (!form.description) errs.description = t('form.required_field');
    if (!form.position_type) errs.position_type = t('form.required_field');
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await onSubmit(form);
      onClose();
    } catch {
      setErrors({ symbol: 'Failed to save' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? t('positions.add_position') : t('positions.edit_position')}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>{t('form.cancel')}</Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading}>{t('form.save')}</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label={t('positions.account')} name="account_id" type="select" value={form.account_id} onChange={set('account_id')} required error={errors.account_id} options={accounts.filter(a => a.is_active).map(a => ({ value: a.account_id, label: `${a.account_id} (${a.institution})` }))} placeholder={t('form.select_option')} />
        <FormField label={t('positions.position_type')} name="position_type" type="select" value={form.position_type} onChange={set('position_type')} required error={errors.position_type} options={POSITION_TYPES.map(p => ({ value: p, label: p }))} placeholder={t('form.select_option')} />
        <FormField label={t('positions.symbol')} name="symbol" value={form.symbol} onChange={set('symbol')} required error={errors.symbol} placeholder="VOO" />
        <FormField label={t('positions.description')} name="description" value={form.description} onChange={set('description')} required error={errors.description} placeholder="Vanguard S&P 500 ETF" />
        <FormField label={t('positions.quantity')} name="quantity" type="number" value={form.quantity} onChange={set('quantity')} />
        <FormField label={t('positions.cost_basis')} name="cost_basis" type="number" value={form.cost_basis} onChange={set('cost_basis')} />
        <FormField label={t('positions.cost_currency')} name="cost_currency" type="select" value={form.cost_currency} onChange={set('cost_currency')} options={CURRENCIES.map(c => ({ value: c, label: c }))} />
        <FormField label={t('positions.acquisition_date')} name="acquisition_date" type="date" value={form.acquisition_date} onChange={set('acquisition_date')} />
        <FormField label={t('positions.maturity_date')} name="maturity_date" type="date" value={form.maturity_date || ''} onChange={set('maturity_date')} />
      </div>
    </Modal>
  );
}
