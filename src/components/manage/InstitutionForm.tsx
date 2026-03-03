'use client';

import { useState } from 'react';
import type { Institution } from '@/types';
import { INSTITUTION_TYPES } from '@/types';
import { useLocale } from '@/hooks/useLocale';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import FormField from '@/components/ui/FormField';

type InstitutionFormData = Omit<Institution, 'institution_id'>;

interface InstitutionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: InstitutionFormData) => Promise<void>;
  mode: 'create' | 'edit';
  initialData?: Institution;
}

export default function InstitutionForm({ isOpen, onClose, onSubmit, mode, initialData }: InstitutionFormProps) {
  const { t } = useLocale();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<InstitutionFormData>(
    initialData ? {
      name: initialData.name,
      short_code: initialData.short_code,
      institution_type: initialData.institution_type,
      country: initialData.country,
      is_active: initialData.is_active,
      notes: initialData.notes,
    } : {
      name: '',
      short_code: '',
      institution_type: '',
      country: 'Colombia',
      is_active: true,
      notes: '',
    }
  );

  const set = (field: keyof InstitutionFormData) => (value: string | number) => {
    setForm(prev => {
      const updated = { ...prev, [field]: value };
      // Auto-generate short_code from name (first 3 chars, uppercase)
      if (field === 'name' && mode === 'create') {
        updated.short_code = String(value).replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase();
      }
      if (field === 'short_code') {
        updated.short_code = String(value).toUpperCase().substring(0, 3);
      }
      return updated;
    });
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.name) errs.name = t('form.required_field');
    if (!form.short_code) errs.short_code = t('form.required_field');
    else if (form.short_code.length !== 3) errs.short_code = t('institutions.short_code_length');
    if (!form.institution_type) errs.institution_type = t('form.required_field');
    if (!form.country) errs.country = t('form.required_field');
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
      setErrors({ name: 'Failed to save' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? t('institutions.add_institution') : t('institutions.edit_institution')}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>{t('form.cancel')}</Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading}>{t('form.save')}</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label={t('institutions.name')} name="name" value={form.name} onChange={set('name')} required error={errors.name} placeholder="e.g. Skandia" />
        <FormField label={t('institutions.short_code')} name="short_code" value={form.short_code} onChange={set('short_code')} required error={errors.short_code} placeholder="Auto-generated" disabled />
        <FormField label={t('institutions.institution_type')} name="institution_type" type="select" value={form.institution_type} onChange={set('institution_type')} required error={errors.institution_type} options={INSTITUTION_TYPES.map(t => ({ value: t, label: t.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) }))} placeholder={t('form.select_option')} />
        <FormField label={t('institutions.country')} name="country" value={form.country} onChange={set('country')} required error={errors.country} placeholder="Colombia" />
        <div className="sm:col-span-2">
          <FormField label={t('institutions.notes')} name="notes" type="textarea" value={form.notes || ''} onChange={set('notes')} placeholder="Optional notes..." />
        </div>
      </div>
    </Modal>
  );
}
