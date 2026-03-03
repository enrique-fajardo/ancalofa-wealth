'use client';

import { useState } from 'react';
import type { Transaction, Account } from '@/types';
import { TRANSACTION_TYPES, CURRENCIES } from '@/types';
import { useLocale } from '@/hooks/useLocale';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import FormField from '@/components/ui/FormField';

type TransactionFormData = Omit<Transaction, 'transaction_id'>;

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TransactionFormData) => Promise<void>;
  accounts: Account[];
}

export default function TransactionForm({ isOpen, onClose, onSubmit, accounts }: TransactionFormProps) {
  const { t } = useLocale();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<TransactionFormData>({
    account_id: '',
    transaction_date: new Date().toISOString().split('T')[0],
    transaction_type: 'buy',
    symbol: '',
    description: '',
    quantity: undefined,
    price: undefined,
    amount: 0,
    currency: 'COP' as const,
    fees: 0,
    notes: '',
  });

  const set = (field: keyof TransactionFormData) => (value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.account_id) errs.account_id = t('form.required_field');
    if (!form.transaction_type) errs.transaction_type = t('form.required_field');
    if (!form.transaction_date) errs.transaction_date = t('form.required_field');
    if (!form.amount && form.amount !== 0) errs.amount = t('form.required_field');
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await onSubmit(form);
      onClose();
      // Reset form
      setForm({
        account_id: '',
        transaction_date: new Date().toISOString().split('T')[0],
        transaction_type: 'buy',
        symbol: '',
        description: '',
        quantity: undefined,
        price: undefined,
        amount: 0,
        currency: 'COP' as const,
        fees: 0,
        notes: '',
      });
    } catch {
      setErrors({ account_id: 'Failed to save' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('transactions.add_transaction')}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>{t('form.cancel')}</Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading}>{t('form.save')}</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label={t('transactions.account')} name="account_id" type="select" value={form.account_id} onChange={set('account_id')} required error={errors.account_id} options={accounts.filter(a => a.is_active).map(a => ({ value: a.account_id, label: `${a.account_id} (${a.institution})` }))} placeholder={t('form.select_option')} />
        <FormField label={t('transactions.transaction_type')} name="transaction_type" type="select" value={form.transaction_type} onChange={set('transaction_type')} required error={errors.transaction_type} options={TRANSACTION_TYPES.map(tt => ({ value: tt, label: tt }))} />
        <FormField label={t('transactions.date')} name="transaction_date" type="date" value={form.transaction_date} onChange={set('transaction_date')} required error={errors.transaction_date} />
        <FormField label={t('transactions.symbol')} name="symbol" value={form.symbol || ''} onChange={set('symbol')} placeholder="VOO" />
        <FormField label={t('transactions.amount')} name="amount" type="number" value={form.amount} onChange={set('amount')} required error={errors.amount} />
        <FormField label={t('transactions.currency')} name="currency" type="select" value={form.currency} onChange={set('currency')} options={CURRENCIES.map(c => ({ value: c, label: c }))} />
        <FormField label={t('transactions.quantity')} name="quantity" type="number" value={form.quantity ?? ''} onChange={set('quantity')} />
        <FormField label={t('transactions.price')} name="price" type="number" value={form.price ?? ''} onChange={set('price')} />
        <FormField label={t('transactions.fees')} name="fees" type="number" value={form.fees ?? 0} onChange={set('fees')} />
        <div className="sm:col-span-2">
          <FormField label={t('transactions.description')} name="description" type="textarea" value={form.description || ''} onChange={set('description')} placeholder="Transaction description..." />
        </div>
      </div>
    </Modal>
  );
}
