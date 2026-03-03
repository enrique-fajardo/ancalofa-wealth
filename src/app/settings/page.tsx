'use client';

import { useEffect, useState } from 'react';
import { Settings, Globe, Palette, DollarSign, Bell, User, Database } from 'lucide-react';
import api from '@/lib/api';
import type { AppSettings, CurrencyPreference, Investor } from '@/types';
import { useLocale } from '@/hooks/useLocale';
import { cn } from '@/lib/formatters';
import { useToast } from '@/hooks/useToast';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ToastContainer from '@/components/ui/Toast';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

export default function SettingsPage() {
  const { t, locale, setLocale } = useLocale();
  const { toasts, showToast, dismissToast } = useToast();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    Promise.all([api.getSettings(), api.getInvestors()]).then(([s, inv]) => {
      setSettings(s);
      setInvestors(inv);
    });
  }, []);

  const updateSetting = async (data: Partial<AppSettings>) => {
    const updated = await api.updateSettings(data);
    setSettings(updated);
    showToast(t('settings.saved'), 'success');
  };

  const handleLanguageChange = (lang: 'en' | 'es') => {
    setLocale(lang);
    updateSetting({ locale: lang });
  };

  const handleCurrencyChange = (currency: CurrencyPreference) => {
    updateSetting({ currency_display: currency });
  };

  const handleNotificationToggle = (key: 'p1' | 'p2' | 'p3' | 'p4') => {
    if (!settings) return;
    updateSetting({ notifications: { ...settings.notifications, [key]: !settings.notifications[key] } });
  };

  const handleClearCache = () => {
    setShowClearConfirm(false);
    showToast(t('settings.saved'), 'success');
  };

  if (!settings) return <p className="text-gray-500">{t('common.loading')}</p>;

  const currencyOptions: { value: CurrencyPreference; label: string }[] = [
    { value: 'COP', label: 'COP' },
    { value: 'USD', label: 'USD' },
    { value: 'both', label: t('settings.both') },
  ];

  const severityLabels: { key: 'p1' | 'p2' | 'p3' | 'p4'; label: string; variant: 'p1' | 'p2' | 'p3' | 'p4' }[] = [
    { key: 'p1', label: t('severity.P1'), variant: 'p1' },
    { key: 'p2', label: t('severity.P2'), variant: 'p2' },
    { key: 'p3', label: t('severity.P3'), variant: 'p3' },
    { key: 'p4', label: t('severity.P4'), variant: 'p4' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('settings.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('settings.subtitle')}</p>
      </div>

      <div className="max-w-2xl space-y-4">
        {/* Language */}
        <Card glass padding="md">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/5">
              <Globe className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900">{t('settings.language')}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{t('settings.language_desc')}</p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => handleLanguageChange('en')}
                  className={cn(
                    'px-4 py-2 text-xs font-semibold rounded-lg transition-colors',
                    locale === 'en' ? 'bg-primary text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-primary hover:text-primary'
                  )}
                >
                  {t('settings.english')}
                </button>
                <button
                  onClick={() => handleLanguageChange('es')}
                  className={cn(
                    'px-4 py-2 text-xs font-semibold rounded-lg transition-colors',
                    locale === 'es' ? 'bg-primary text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-primary hover:text-primary'
                  )}
                >
                  {t('settings.spanish')}
                </button>
              </div>
            </div>
          </div>
        </Card>

        {/* Theme */}
        <Card glass padding="md">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-purple-50">
              <Palette className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900">{t('settings.theme')}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{t('settings.theme_desc')}</p>
              <div className="flex gap-2 mt-3">
                <button className="px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-white">
                  {t('settings.light')}
                </button>
                <button className="px-4 py-2 text-xs font-semibold rounded-lg bg-white text-gray-400 border border-gray-200 cursor-not-allowed" disabled>
                  {t('settings.dark')}
                </button>
                <button className="px-4 py-2 text-xs font-semibold rounded-lg bg-white text-gray-400 border border-gray-200 cursor-not-allowed" disabled>
                  {t('settings.system')}
                </button>
              </div>
            </div>
          </div>
        </Card>

        {/* Currency Display */}
        <Card glass padding="md">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-green-50">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900">{t('settings.currency')}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{t('settings.currency_desc')}</p>
              <div className="flex gap-2 mt-3">
                {currencyOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => handleCurrencyChange(opt.value)}
                    className={cn(
                      'px-4 py-2 text-xs font-semibold rounded-lg transition-colors',
                      settings.currency_display === opt.value
                        ? 'bg-primary text-white'
                        : 'bg-white text-gray-600 border border-gray-200 hover:border-primary hover:text-primary'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Notifications */}
        <Card glass padding="md">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-orange-50">
              <Bell className="w-5 h-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900">{t('settings.notifications')}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{t('settings.notifications_desc')}</p>
              <div className="space-y-2 mt-3">
                {severityLabels.map(sev => (
                  <label key={sev.key} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifications[sev.key]}
                      onChange={() => handleNotificationToggle(sev.key)}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Badge variant={sev.variant} size="sm">{sev.label}</Badge>
                    <span className="text-xs text-gray-500">{sev.key.toUpperCase()}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Profile */}
        <Card glass padding="md">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-50">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900">{t('settings.profile')}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{t('settings.profile_desc')}</p>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <p className="text-xs text-gray-500">{t('settings.family_name')}</p>
                  <p className="text-sm font-semibold text-gray-900">Fajardo López</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">{t('settings.app_version')}</p>
                  <p className="text-sm font-semibold text-gray-900">v0.1.0</p>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-1">{t('investors.title')}</p>
                <div className="flex flex-wrap gap-1">
                  {investors.map(inv => (
                    <Badge key={inv.investor_id} variant="default" size="sm">{inv.used_name}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Data Management */}
        <Card glass padding="md">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-red-50">
              <Database className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900">{t('settings.data_management')}</h3>
              <div className="space-y-3 mt-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{t('settings.export_data')}</p>
                    <p className="text-xs text-gray-500">{t('settings.export_desc')}</p>
                  </div>
                  <Button variant="secondary" size="sm" icon={Settings}>
                    {t('settings.export_data')}
                  </Button>
                </div>
                <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{t('settings.clear_cache')}</p>
                    <p className="text-xs text-gray-500">{t('settings.clear_cache_desc')}</p>
                  </div>
                  <Button variant="danger" size="sm" onClick={() => setShowClearConfirm(true)}>
                    {t('settings.clear_cache')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <ConfirmDialog
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleClearCache}
        title={t('settings.confirm_clear_title')}
        message={t('settings.confirm_clear')}
        confirmLabel={t('settings.clear_cache')}
        variant="danger"
      />
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
