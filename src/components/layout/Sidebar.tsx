'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/formatters';
import { useLocale } from '@/hooks/useLocale';
import {
  LayoutDashboard, Briefcase, Bell, CalendarClock, Landmark,
  TrendingUp, Database, Upload, Calculator, Settings,
  ChevronLeft, ChevronRight, Gauge, Lightbulb,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  href: string;
  labelKey: string;
  icon: LucideIcon;
  badge?: number;
}

const navItems: NavItem[] = [
  { href: '/', labelKey: 'nav.dashboard', icon: LayoutDashboard },
  { href: '/insights', labelKey: 'nav.insights', icon: Lightbulb },
  { href: '/portfolio', labelKey: 'nav.portfolio', icon: Briefcase },
  { href: '/cockpit', labelKey: 'nav.cockpit', icon: Gauge },
  { href: '/alerts', labelKey: 'nav.alerts', icon: Bell, badge: 3 },
  { href: '/maturities', labelKey: 'nav.maturities', icon: CalendarClock },
  { href: '/pensions', labelKey: 'nav.pensions', icon: Landmark },
  { href: '/history', labelKey: 'nav.history', icon: TrendingUp },
  { href: '/manage', labelKey: 'nav.manage', icon: Database },
  { href: '/import', labelKey: 'nav.import', icon: Upload },
  { href: '/calendar', labelKey: 'nav.calendar', icon: Calculator },
];

const bottomItems: NavItem[] = [
  { href: '/settings', labelKey: 'nav.settings', icon: Settings },
];

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useLocale();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const renderItem = (item: NavItem) => {
    const active = isActive(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          'flex items-center gap-3 py-2.5 text-sm transition-all duration-200 relative group',
          collapsed ? 'justify-center px-2 mx-2 rounded-lg' : 'px-4 rounded-r-lg',
          active
            ? 'text-white bg-white/12 border-l-3 border-accent font-semibold'
            : 'text-white/70 hover:text-white hover:bg-white/8'
        )}
      >
        <item.icon className={cn('w-5 h-5 shrink-0', active ? 'text-accent' : '')} strokeWidth={1.5} />
        {!collapsed && <span className="truncate">{t(item.labelKey)}</span>}
        {item.badge && !collapsed && (
          <span className="ml-auto bg-accent text-dark text-[10px] font-bold px-1.5 py-0.5 rounded-full">
            {item.badge}
          </span>
        )}
        {item.badge && collapsed && (
          <span className="absolute -top-0.5 -right-0.5 bg-accent text-dark text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
            {item.badge}
          </span>
        )}
        {collapsed && (
          <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
            {t(item.labelKey)}
          </div>
        )}
      </Link>
    );
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen z-30 flex flex-col transition-all duration-300 ease-in-out',
        collapsed ? 'w-16' : 'w-60',
        'bg-primary-900 glass-dark'
      )}
    >
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        {collapsed ? (
          <div className="flex justify-center">
            <span className="text-xl font-bold text-white">A</span>
          </div>
        ) : (
          <div>
            <div className="text-lg font-semibold text-white tracking-wider">ANCALOFA</div>
            <div className="text-xs text-accent tracking-[0.3em] -mt-0.5">WEALTH</div>
          </div>
        )}
      </div>

      {/* Main Nav */}
      <nav className="flex-1 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(renderItem)}
      </nav>

      {/* Bottom Nav */}
      <div className="border-t border-white/10 py-2 space-y-0.5">
        {bottomItems.map(renderItem)}
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={onToggle}
        className="flex items-center justify-center py-3 text-white/50 hover:text-white transition-colors border-t border-white/10"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  );
}
