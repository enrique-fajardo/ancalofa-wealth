'use client';

import { usePathname } from 'next/navigation';
import { cn } from '@/lib/formatters';
import { useLocale } from '@/hooks/useLocale';
import { Search, Bell, ChevronRight } from 'lucide-react';
import LanguageToggle from '../ui/LanguageToggle';

interface TopBarProps {
  collapsed: boolean;
}

const pageNames: Record<string, string> = {
  '/': 'nav.dashboard',
  '/portfolio': 'nav.portfolio',
  '/alerts': 'nav.alerts',
  '/maturities': 'nav.maturities',
  '/pensions': 'nav.pensions',
  '/history': 'nav.history',
  '/manage': 'nav.manage',
  '/manage/investors': 'manage.tab_investors',
  '/manage/accounts': 'manage.tab_accounts',
  '/manage/positions': 'manage.tab_positions',
  '/manage/transactions': 'manage.tab_transactions',
  '/import': 'nav.import',
  '/calendar': 'nav.calendar',
  '/settings': 'nav.settings',
};

export default function TopBar({ collapsed }: TopBarProps) {
  const pathname = usePathname();
  const { locale, setLocale, t } = useLocale();

  const pageKey = pageNames[pathname] || 'nav.dashboard';
  const isManageSub = pathname.startsWith('/manage/');
  const isManageDetail = isManageSub && pathname.split('/').length > 3;

  return (
    <header
      className={cn(
        'fixed top-0 right-0 h-14 z-20 flex items-center justify-between px-6',
        'bg-white/80 backdrop-blur-sm border-b border-gray-200',
        'transition-all duration-300 ease-in-out',
        collapsed ? 'left-16' : 'left-60'
      )}
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-400 font-medium">ANCALOFA Wealth</span>
        {isManageSub ? (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
            <span className="text-gray-400 font-medium">{t('nav.manage')}</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
            <span className={isManageDetail ? 'text-gray-400 font-medium' : 'text-gray-800 font-semibold'}>
              {t(pageNames[`/manage/${pathname.split('/')[2]}`] || 'nav.manage')}
            </span>
            {isManageDetail && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                <span className="text-gray-800 font-semibold">Detail</span>
              </>
            )}
          </>
        ) : (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
            <span className="text-gray-800 font-semibold">{t(pageKey)}</span>
          </>
        )}
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-3">
        <button className="p-2 text-gray-400 hover:text-primary rounded-lg hover:bg-gray-100 transition-colors">
          <Search className="w-4 h-4" />
        </button>

        <button className="relative p-2 text-gray-400 hover:text-primary rounded-lg hover:bg-gray-100 transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full" />
        </button>

        <LanguageToggle locale={locale} onChange={setLocale} />

        <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-semibold">
          EF
        </div>
      </div>
    </header>
  );
}
