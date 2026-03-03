'use client';

import { cn } from '@/lib/formatters';
import type { Locale } from '@/types';

interface LanguageToggleProps {
  locale: Locale;
  onChange: (locale: Locale) => void;
  className?: string;
}

export default function LanguageToggle({ locale, onChange, className }: LanguageToggleProps) {
  return (
    <div className={cn('flex rounded-lg border border-gray-200 overflow-hidden', className)}>
      <button
        onClick={() => onChange('en')}
        className={cn(
          'px-2.5 py-1 text-xs font-semibold transition-colors',
          locale === 'en' ? 'bg-primary text-white' : 'bg-transparent text-gray-500 hover:text-primary'
        )}
      >
        EN
      </button>
      <button
        onClick={() => onChange('es')}
        className={cn(
          'px-2.5 py-1 text-xs font-semibold transition-colors',
          locale === 'es' ? 'bg-primary text-white' : 'bg-transparent text-gray-500 hover:text-primary'
        )}
      >
        ES
      </button>
    </div>
  );
}
