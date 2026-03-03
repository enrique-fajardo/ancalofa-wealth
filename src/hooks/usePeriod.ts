'use client';

import { useState, useEffect, useCallback } from 'react';
import type { PeriodKey } from '@/types';

function getInitialPeriod(): PeriodKey {
  if (typeof window !== 'undefined') {
    try {
      const url = new URL(window.location.href);
      const param = url.searchParams.get('period') as PeriodKey | null;
      if (param) return param;
    } catch { /* ignore */ }
    return (localStorage.getItem('selectedPeriod') as PeriodKey) || 'total';
  }
  return 'total';
}

export function usePeriod() {
  const [period, setPeriodState] = useState<PeriodKey>(getInitialPeriod);

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
