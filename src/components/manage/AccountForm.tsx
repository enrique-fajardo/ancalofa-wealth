'use client';

import { useState } from 'react';
import type { Account, Institution, Investor } from '@/types';
import { ACCOUNT_TYPES, CURRENCIES, SLEEVES } from '@/types';
import { useLocale } from '@/hooks/useLocale';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import FormField from '@/components/ui/FormField';

interface AccountFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Account) => Promise<void>;
  investors: Investor[];
  institutions: Institution[];
  mode: 'create' | 'edit';
  initialData?: Account;
  existingAccounts?: Account[];
}

function generateAccountId(institutionName: string, investorName: string, existing: Account[], institutions: Institution[]): string {
  const inst = institutions.find(i => i.name === institutionName);
  const prefix = inst ? inst.short_code : institutionName.substring(0, 3).toUpperCase();
  const invPart = (investorName || 'XXX').substring(0, 3).toUpperCase();

  let num = 1;
  while (existing.some(a => a.account_id === `${prefix}-${invPart}-${String(num).padStart(3, '0')}`)) {
    num++;
  }

  return `${prefix}-${invPart}-${String(num).padStart(3, '0')}`;
}

export default function AccountForm({ isOpen, onClose, onSubmit, investors, institutions, mode, initialData, existingAccounts = [] }: AccountFormProps) {
  const { t } = useLocale();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<Account>(
    initialData || {
      account_id: '',
      name: '',
      investor_id: '',
      institution: '',
      account_type: '',
      currency: 'COP' as const,
      sleeve: '',
      is_active: true,
      notes: '',
    }
  );

  const set = (field: keyof Account) => (value: string | number) => {
    setForm(prev => {
      const updated = { ...prev, [field]: value };

      // Auto-generate account_id when institution or investor changes (create mode only)
      if (mode === 'create' && (field === 'institution' || field === 'investor_id')) {
        const investor = investors.find(i => i.investor_id === (field === 'investor_id' ? value : prev.investor_id));
        const inst = field === 'institution' ? String(value) : prev.institution;
        if (investor && inst) {
          updated.account_id = generateAccountId(inst, investor.used_name, existingAccounts, institutions);
        }
      }

      return updated;
    });
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.account_id) errs.account_id = t('form.required_field');
    if (!form.name) errs.name = t('form.required_field');
    if (!form.investor_id) errs.investor_id = t('form.required_field');
    if (!form.institution) errs.institution = t('form.required_field');
    if (!form.account_type) errs.account_type = t('form.required_field');
    if (!form.currency) errs.currency = t('form.required_field');
    if (!form.sleeve) errs.sleeve = t('form.required_field');
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
      setErrors({ account_id: 'Failed to save' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? t('accounts.add_account') : t('accounts.edit_account')}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>{t('form.cancel')}</Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading}>{t('form.save')}</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label={t('accounts.investor')} name="investor_id" type="select" value={form.investor_id} onChange={set('investor_id')} required error={errors.investor_id} options={investors.map(i => ({ value: i.investor_id, label: `${i.used_name} (${i.investor_id})` }))} placeholder={t('form.select_option')} />
        <FormField label={t('accounts.institution')} name="institution" type="select" value={form.institution} onChange={set('institution')} required error={errors.institution} options={institutions.filter(i => i.is_active).map(i => ({ value: i.name, label: i.name }))} placeholder={t('form.select_option')} />
        <FormField label={t('accounts.account_id')} name="account_id" value={form.account_id} onChange={set('account_id')} required error={errors.account_id} disabled placeholder="Auto-generated" />
        <FormField label={t('accounts.account_name')} name="name" value={form.name} onChange={set('name')} required error={errors.name} placeholder="e.g. Juanita's Skandia Fund" />
        <FormField label={t('accounts.account_type')} name="account_type" type="select" value={form.account_type} onChange={set('account_type')} required error={errors.account_type} options={ACCOUNT_TYPES.map(at => ({ value: at, label: at }))} placeholder={t('form.select_option')} />
        <FormField label={t('accounts.currency')} name="currency" type="select" value={form.currency} onChange={set('currency')} required error={errors.currency} options={CURRENCIES.map(c => ({ value: c, label: c }))} />
        <FormField label={t('accounts.sleeve')} name="sleeve" type="select" value={form.sleeve} onChange={set('sleeve')} required error={errors.sleeve} options={SLEEVES.map(s => ({ value: s, label: s }))} placeholder={t('form.select_option')} />
        {initialData?.first_deposit_date && (
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1">{t('accounts.first_deposit_date')}</p>
            <p className="text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">{initialData.first_deposit_date}</p>
            <p className="text-xs text-gray-400 mt-1">{t('accounts.first_deposit_date_hint')}</p>
          </div>
        )}
        {initialData?.created_at && (
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1">{t('accounts.created_at')}</p>
            <p className="text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">{initialData.created_at.split('T')[0] || initialData.created_at.split(' ')[0]}</p>
          </div>
        )}
        <div className="sm:col-span-2">
          <FormField label={t('accounts.notes')} name="notes" type="textarea" value={form.notes || ''} onChange={set('notes')} placeholder="Optional notes..." />
        </div>
      </div>
    </Modal>
  );
}
