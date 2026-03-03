'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import ChatWindow from './ChatWindow';
import ChatInput from './ChatInput';
import { useLocale } from '@/hooks/useLocale';
import { cn } from '@/lib/formatters';
import { X, History, ChevronLeft, Trash2, MessageSquare } from 'lucide-react';
import type { ChatSession, ChatMessage } from '@/types';

interface ChatDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function ChatDrawer({ open, onClose }: ChatDrawerProps) {
  const { locale, t } = useLocale();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Load sessions when drawer opens
  useEffect(() => {
    if (open) {
      loadSessions();
    }
  }, [open]);

  // Load messages when active session changes
  useEffect(() => {
    if (activeSessionId) {
      loadMessages(activeSessionId);
    } else {
      setMessages([]);
    }
  }, [activeSessionId]);

  const loadSessions = async () => {
    try {
      const res = await fetch('/api/chat');
      if (res.ok) setSessions(await res.json());
    } catch (err) {
      console.error('Failed to load sessions:', err);
    }
  };

  const loadMessages = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/chat?session_id=${sessionId}`);
      if (res.ok) setMessages(await res.json());
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    setInput('');
    setIsStreaming(true);
    setStreamingContent('');
    setShowHistory(false);

    // Optimistic: add user message
    const tempUserMsg: ChatMessage = {
      message_id: Date.now(),
      session_id: activeSessionId || 'temp',
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      abortRef.current = new AbortController();

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          session_id: activeSessionId,
          locale,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No reader available');

      const decoder = new TextDecoder();
      let accumulated = '';
      let sessionId = activeSessionId;
      let toolCalls: string[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;

          try {
            const event = JSON.parse(jsonStr);
            if (event.type === 'text') {
              accumulated += event.content;
              setStreamingContent(accumulated);
            } else if (event.type === 'tool_call') {
              toolCalls.push(event.tool);
            } else if (event.type === 'done') {
              sessionId = event.session_id;
              if (event.tool_calls) toolCalls = event.tool_calls;
            } else if (event.type === 'error') {
              throw new Error(event.error);
            }
          } catch (parseErr) {
            if (parseErr instanceof SyntaxError) continue;
            throw parseErr;
          }
        }
      }

      if (sessionId && sessionId !== activeSessionId) {
        setActiveSessionId(sessionId);
      }

      const assistantMsg: ChatMessage = {
        message_id: Date.now() + 1,
        session_id: sessionId || 'temp',
        role: 'assistant',
        content: accumulated,
        tool_calls: toolCalls.length > 0 ? JSON.stringify(toolCalls) : undefined,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMsg]);
      await loadSessions();
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      console.error('Send error:', err);
      const errMsg: ChatMessage = {
        message_id: Date.now() + 2,
        session_id: activeSessionId || 'temp',
        role: 'assistant',
        content: `⚠️ ${(err as Error).message}`,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsStreaming(false);
      setStreamingContent('');
      abortRef.current = null;
    }
  }, [input, isStreaming, activeSessionId, locale]);

  const handleNewChat = useCallback(() => {
    setActiveSessionId(null);
    setMessages([]);
    setInput('');
    setStreamingContent('');
    setShowHistory(false);
  }, []);

  const handleDeleteSession = useCallback(async (sessionId: string) => {
    try {
      await fetch(`/api/chat?session_id=${sessionId}`, { method: 'DELETE' });
      setSessions(prev => prev.filter(s => s.session_id !== sessionId));
      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  }, [activeSessionId]);

  const handleSuggest = useCallback((question: string) => {
    setInput(question);
  }, []);

  const handleSelectSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
    setShowHistory(false);
  }, []);

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer panel */}
      <div
        className={cn(
          'fixed right-0 top-0 h-full z-50 flex flex-col bg-white shadow-2xl border-l border-gray-200',
          'transition-transform duration-300 ease-in-out',
          'w-[680px] max-w-[90vw]',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white shrink-0">
          {showHistory ? (
            <>
              <button
                onClick={() => setShowHistory(false)}
                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-primary transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                {t('common.back')}
              </button>
              <span className="text-sm font-semibold text-gray-800">{t('chat.history_title')}</span>
              <div className="w-16" /> {/* spacer */}
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-semibold text-gray-800">
                  {t('chat.welcome_title')}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { setShowHistory(true); loadSessions(); }}
                  className="p-1.5 text-gray-400 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors"
                  title={t('chat.history_title')}
                >
                  <History className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNewChat}
                  className="px-2 py-1 text-xs text-primary hover:bg-primary/5 rounded-lg transition-colors font-medium"
                >
                  {t('chat.new_chat')}
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Content area */}
        {showHistory ? (
          <div className="flex-1 overflow-y-auto py-2">
            {sessions.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-12">{t('chat.no_sessions')}</p>
            ) : (
              sessions.map(session => (
                <div
                  key={session.session_id}
                  className={cn(
                    'group flex items-center gap-3 mx-2 mb-1 px-3 py-2.5 rounded-lg cursor-pointer transition-colors',
                    activeSessionId === session.session_id
                      ? 'bg-primary/10 text-primary'
                      : 'text-gray-600 hover:bg-gray-50'
                  )}
                  onClick={() => handleSelectSession(session.session_id)}
                >
                  <MessageSquare className="w-4 h-4 shrink-0 opacity-40" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate font-medium">{session.title}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {new Date(session.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSession(session.session_id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        ) : (
          <>
            <ChatWindow
              messages={messages}
              streamingContent={streamingContent}
              isStreaming={isStreaming}
              onSuggest={handleSuggest}
            />
            <ChatInput
              value={input}
              onChange={setInput}
              onSend={handleSend}
              isStreaming={isStreaming}
            />
          </>
        )}
      </div>
    </>
  );
}
