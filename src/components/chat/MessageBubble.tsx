'use client';

import { cn } from '@/lib/formatters';
import { MarkdownRenderer } from '@/lib/markdown';
import { Bot, User, Database } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: string | null;
  isStreaming?: boolean;
}

const TOOL_KEY_MAP: Record<string, string> = {
  get_portfolio_summary: 'chat.tool_portfolio_summary',
  get_investor_summaries: 'chat.tool_investor_summaries',
  get_positions: 'chat.tool_positions',
  get_accounts: 'chat.tool_accounts',
  get_alerts: 'chat.tool_alerts',
  get_allocation: 'chat.tool_allocation',
  get_transactions: 'chat.tool_transactions',
  get_market_data: 'chat.tool_market_data',
  get_maturity_calendar: 'chat.tool_maturity_calendar',
  get_performance_history: 'chat.tool_performance_history',
};

export default function MessageBubble({ role, content, toolCalls, isStreaming }: MessageBubbleProps) {
  const { t } = useLocale();

  const parsedTools: string[] = toolCalls ? (() => {
    try { return JSON.parse(toolCalls); } catch { return []; }
  })() : [];

  return (
    <div className={cn('flex gap-2.5 min-w-0', role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar */}
      <div className={cn(
        'w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5',
        role === 'user' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
      )}>
        {role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
      </div>

      {/* Message content */}
      <div className={cn(
        'rounded-2xl px-3.5 py-2.5 min-w-0',
        role === 'user'
          ? 'bg-primary text-white rounded-tr-md max-w-[calc(100%-3rem)]'
          : 'bg-gray-50 border border-gray-200 rounded-tl-md flex-1 overflow-x-auto'
      )}>
        {role === 'assistant' ? (
          <MarkdownRenderer content={content} />
        ) : (
          <p className="whitespace-pre-wrap text-sm">{content}</p>
        )}

        {/* Streaming cursor */}
        {isStreaming && (
          <span className="inline-block w-1.5 h-4 bg-primary animate-pulse ml-0.5 rounded-sm" />
        )}

        {/* Tool calls badge */}
        {parsedTools.length > 0 && (
          <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-gray-200/50">
            <Database className="w-3 h-3 text-gray-400" />
            <span className="text-[11px] text-gray-400">
              {t('chat.data_queried')}:{' '}
              {parsedTools.map(toolName => t(TOOL_KEY_MAP[toolName] || toolName)).join(', ')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
