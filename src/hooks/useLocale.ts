'use client';

import { useState, useEffect, useCallback } from 'react';
import en from '@/lib/locales/en.json';
import es from '@/lib/locales/es.json';

type Locale = 'es' | 'en';

const translations: Record<Locale, Record<string, unknown>> = { en, es };

function getNestedValue(obj: Record<string, unknown>, key: string): string {
  const parts = key.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current && typeof current === 'object') {
      current = (current as Record<string, unknown>)[part];
    } else {
      return key;
    }
  }
  return typeof current === 'string' ? current : key;
}

export function useLocale() {
  // Always start with 'es' — matches the server render, avoids hydration mismatch.
  // useEffect then syncs from localStorage after mount.
  const [locale, setLocaleState] = useState<Locale>('es');

  useEffect(() => {
    // Sync from localStorage on first mount
    const stored = (localStorage.getItem('locale') as Locale) || 'es';
    if (stored !== 'es') setLocaleState(stored);

    const handler = () => {
      const val = (localStorage.getItem('locale') as Locale) || 'es';
      setLocaleState(val);
    };
    window.addEventListener('localeChanged', handler);
    return () => window.removeEventListener('localeChanged', handler);
  }, []);

  const setLocale = useCallback((l: Locale) => {
    localStorage.setItem('locale', l);
    setLocaleState(l);
    window.dispatchEvent(new CustomEvent('localeChanged'));
  }, []);

  const t = useCallback(
    (key: string): string => {
      return getNestedValue(translations[locale] as Record<string, unknown>, key) || key;
    },
    [locale]
  );

  return { locale, setLocale, t };
}
