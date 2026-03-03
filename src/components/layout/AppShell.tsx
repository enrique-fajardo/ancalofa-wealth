'use client';

import { useState } from 'react';
import { cn } from '@/lib/formatters';
import { useLocale } from '@/hooks/useLocale';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import ChatDrawer from '../chat/ChatDrawer';
import { MessageSquare } from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const { t } = useLocale();
  const [collapsed, setCollapsed] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <TopBar collapsed={collapsed} />
      <main
        className={cn(
          'pt-14 p-6 min-h-screen transition-all duration-300 ease-in-out',
          collapsed ? 'pl-[calc(64px+24px)]' : 'pl-[calc(240px+24px)]'
        )}
      >
        {children}
      </main>

      {/* Floating AI Chat button */}
      <button
        onClick={() => setChatOpen(true)}
        aria-label={t('chat.title')}
        className={cn(
          'fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full',
          'bg-primary text-white shadow-lg hover:shadow-xl',
          'flex items-center justify-center',
          'hover:scale-105 active:scale-95 transition-all duration-200',
          chatOpen && 'hidden'
        )}
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {/* Chat Drawer */}
      <ChatDrawer open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}
