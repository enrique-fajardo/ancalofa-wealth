// ─── Currency Formatters ──────────────────────────────────────────────────────
export function formatCOP(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatUSD(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatCOPCompact(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1_000_000_000) return `${sign}$${(abs / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000)     return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000)         return `${sign}$${(abs / 1_000).toFixed(0)}K`;
  return formatCOP(value);
}

export function formatUSDCompact(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000)     return `${sign}$${(abs / 1_000).toFixed(1)}K`;
  return formatUSD(value);
}

// ─── Percent Formatter (magnitude-based decimals) ─────────────────────────────
export function formatPercent(value: number, forceSign = false): string {
  const abs = Math.abs(value);
  let decimals: number;
  if (abs === 0)       decimals = 0;
  else if (abs < 10)   decimals = 2;
  else if (abs < 100)  decimals = 1;
  else                 decimals = 0;

  const formatted = abs.toFixed(decimals) + '%';
  const sign = value < 0 ? '-' : forceSign ? '+' : '';
  return sign + formatted;
}

// ─── Price ────────────────────────────────────────────────────────────────────
export function formatPrice(value: number, currency: string): string {
  return currency === 'COP' ? formatCOP(value) : formatUSD(value);
}

// ─── Date Formatters ──────────────────────────────────────────────────────────
export function formatDate(dateStr: string, locale = 'es'): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr.slice(0, 10) + 'T00:00:00');
  if (isNaN(d.getTime())) return dateStr;
  const localeStr = locale === 'es' ? 'es-CO' : 'en-US';
  return d.toLocaleDateString(localeStr, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateShort(dateStr: string): string {
  if (!dateStr) return '—';
  return dateStr.slice(0, 10);
}

// ─── Class Name Utility ───────────────────────────────────────────────────────
export function cn(...classes: (string | undefined | null | false | 0)[]): string {
  return classes.filter(Boolean).join(' ');
}

// ─── CAGR Computation ────────────────────────────────────────────────────────
export interface CAGRResult {
  annualized_pct: number;
  years: number;
  is_annualized: boolean;
}

export function computeCAGR(
  currentValue: number,
  costBasis: number,
  startDate: string
): CAGRResult {
  if (!startDate || costBasis <= 0) {
    return { annualized_pct: 0, years: 0, is_annualized: false };
  }
  const start = new Date(startDate.slice(0, 10) + 'T00:00:00');
  const now = new Date();
  const years = (now.getTime() - start.getTime()) / (365.25 * 24 * 3600 * 1000);

  if (years < 1) {
    return { annualized_pct: 0, years: Math.round(years * 10) / 10, is_annualized: false };
  }

  const totalReturn = currentValue / costBasis;
  const annualized = (Math.pow(totalReturn, 1 / years) - 1) * 100;

  return {
    annualized_pct: Math.round(annualized * 100) / 100,
    years: Math.round(years * 10) / 10,
    is_annualized: true,
  };
}
