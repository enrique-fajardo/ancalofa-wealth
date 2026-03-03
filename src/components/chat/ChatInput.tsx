'use client';

import { useRef, useCallback } from 'react';
import { cn } from '@/lib/formatters';
import { SendHorizontal, Loader2 } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isStreaming: boolean;
  disabled?: boolean;
}

export default function ChatInput({ value, onChange, onSend, isStreaming, disabled }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { t } = useLocale();

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isStreaming && !disabled) {
        onSend();
      }
    }
  }, [value, isStreaming, disabled, onSend]);

  const handleInput = useCallback(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 120) + 'px';
    }
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    handleInput();
  }, [onChange, handleInput]);

  return (
    <div className="border-t border-gray-200 bg-white px-3 py-2.5 shrink-0">
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={t('chat.placeholder')}
          disabled={isStreaming || disabled}
          rows={1}
          className={cn(
            'flex-1 resize-none rounded-xl border border-gray-300 px-3 py-2 text-sm',
            'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
            'placeholder:text-gray-400 transition-all',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'max-h-[100px]'
          )}
        />
        <button
          onClick={onSend}
          disabled={!value.trim() || isStreaming || disabled}
          className={cn(
            'p-2 rounded-xl transition-all shrink-0',
            value.trim() && !isStreaming
              ? 'bg-primary text-white hover:bg-primary-700 shadow-sm'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          )}
        >
          {isStreaming ? (
            <Loader2 className="w-[18px] h-[18px] animate-spin" />
          ) : (
            <SendHorizontal className="w-[18px] h-[18px]" />
          )}
        </button>
      </div>
    </div>
  );
}
