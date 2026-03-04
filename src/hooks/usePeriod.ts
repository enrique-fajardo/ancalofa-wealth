'use client';

import { useState, useEffect, useCallback } from 'react';
import type { PeriodKey } from '@/types';

export function usePeriod() {
  // Always start with 'total' — matches server render, avoids hydration mismatch.
  // Sync from URL/localStorage after mount (client only).
  const [period, setPeriodState] = useState<PeriodKey>('total');

  useEffect(() => {
    // Read stored/URL period once after mount
    try {
      const url = new URL(window.location.href);
      const param = url.searchParams.get('period') as PeriodKey | null;
      if (param) { setPeriodState(param); return; }
    } catch { /* ignore */ }
    const stored = (localStorage.getItem('selectedPeriod') as PeriodKey) || 'total';
    if (stored !== 'total') setPeriodState(stored);
  }, []);

  useEffect(() => {
    const handler = () => {
      const stored = (localStorage.getItem('selectedPeriod') as PeriodKey) || 'total';
      setPeriodState(stored);
    };
    window.addEventListener('periodChanged', handler);
    return () => window.removeEventListener('periodChanged', handler);
  }, []);

  const setPeriod = useCallback((p: PeriodKey) => {
    localStorage.setItem('selectedPeriod', p);
    setPeriodState(p);
    window.dispatchEvent(new CustomEvent('periodChanged'));
    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('period', p);
        window.history.replaceState({}, '', url.toString());
      } catch { /* ignore */ }
    }
  }, []);

  return { period, setPeriod };
}
