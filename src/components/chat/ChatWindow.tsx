'use client';

import { useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import { useLocale } from '@/hooks/useLocale';
import { Bot, Sparkles } from 'lucide-react';

interface Message {
  message_id: number;
  role: 'user' | 'assistant';
  content: string;
  tool_calls?: string | null;
}

interface ChatWindowProps {
  messages: Message[];
  streamingContent: string;
  isStreaming: boolean;
  onSuggest: (question: string) => void;
}

export default function ChatWindow({ messages, streamingContent, isStreaming, onSuggest }: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { t } = useLocale();

  // Auto-scroll to bottom on new messages or streaming
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  const suggestions = [
    t('chat.suggest_1'),
    t('chat.suggest_2'),
    t('chat.suggest_3'),
    t('chat.suggest_4'),
  ];

  // Empty state
  if (messages.length === 0 && !isStreaming) {
    return (
      <div className="flex-1 flex items-center justify-center px-5 py-8 overflow-y-auto">
        <div className="text-center w-full">
          <div className="w-14 h-14 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center mb-3">
            <Bot className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-gray-800 mb-1">{t('chat.welcome_title')}</h2>
          <p className="text-sm text-gray-500 mb-5 leading-relaxed">{t('chat.welcome_desc')}</p>

          <div className="space-y-2">
            {suggestions.map((q, i) => (
              <button
                key={i}
                onClick={() => onSuggest(q)}
                className="w-full text-left px-3.5 py-2.5 rounded-xl border border-gray-200 hover:border-primary/30 hover:bg-primary/5 transition-all text-sm text-gray-600 group flex items-start gap-2.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-primary/50 group-hover:text-primary mt-0.5 shrink-0" />
                <span className="leading-snug">{q}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
      {messages.map(msg => (
        <MessageBubble
          key={msg.message_id}
          role={msg.role}
          content={msg.content}
          toolCalls={msg.tool_calls}
        />
      ))}

      {/* Streaming message */}
      {isStreaming && streamingContent && (
        <MessageBubble
          role="assistant"
          content={streamingContent}
          isStreaming
        />
      )}

      {/* Typing indicator (before any text arrives) */}
      {isStreaming && !streamingContent && (
        <div className="flex gap-2.5">
          <div className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center shrink-0">
            <Bot className="w-3.5 h-3.5" />
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-2xl rounded-tl-md px-4 py-3">
            <div className="flex gap-1.5">
              <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
