'use client';

import { Users, Building2, Wallet, Briefcase, ArrowRightLeft } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import TabBar from '@/components/ui/TabBar';

export default function ManageLayout({ children }: { children: React.ReactNode }) {
  const { t } = useLocale();

  const tabs = [
    { key: 'investors', label: t('manage.tab_investors'), href: '/manage/investors', icon: Users },
    { key: 'institutions', label: t('manage.tab_institutions'), href: '/manage/institutions', icon: Building2 },
    { key: 'accounts', label: t('manage.tab_accounts'), href: '/manage/accounts', icon: Wallet },
    { key: 'positions', label: t('manage.tab_positions'), href: '/manage/positions', icon: Briefcase },
    { key: 'transactions', label: t('manage.tab_transactions'), href: '/manage/transactions', icon: ArrowRightLeft },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">{t('manage.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('manage.subtitle')}</p>
      </div>
      <TabBar tabs={tabs} />
      {children}
    </div>
  );
}
