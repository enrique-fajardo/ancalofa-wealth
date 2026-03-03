// ─── Shared Period Key ────────────────────────────────────────────────────────
export type PeriodKey = 'total' | 'ytd' | 'mtd' | '12m' | '3y' | '5y';

// ─── Shared Constants ─────────────────────────────────────────────────────────
export const CURRENCIES = ['COP', 'USD'] as const;

export const ACCOUNT_TYPES = [
  'Investment Fund', 'CDT', 'CAT', 'Savings', 'Checking',
  'Pension', 'Brokerage', 'Crypto', 'Other',
] as const;

export const SLEEVES = [
  'cop_equity', 'usd_equity', 'fixed_income', 'crypto', 'cash',
] as const;

export const POSITION_TYPES = [
  'Investment Fund', 'CDT', 'CAT', 'ETF', 'Stock', 'Bond',
  'Crypto', 'Pension', 'Cash', 'Other',
] as const;

export const INSTITUTION_TYPES = [
  'Bank', 'Fund Manager', 'Broker', 'Insurance',
  'Pension', 'Crypto Exchange', 'Other',
] as const;

export const TRANSACTION_TYPES = [
  'deposit', 'withdrawal', 'fee', 'dividend', 'interest',
  'purchase', 'sale', 'transfer', 'other',
] as const;

// ─── Core Entities ────────────────────────────────────────────────────────────
export interface Investor {
  investor_id: string;
  full_name: string;
  used_name: string;
  investor_type: 'Primary' | 'Secondary' | 'Child';
  birth_date: string;
  status: 'Active' | 'No Active';
}

export interface Account {
  account_id: string;
  investor_id: string;
  institution: string;
  account_type: string;
  currency: 'COP' | 'USD';
  sleeve: string;
  name?: string;
  is_active: boolean;
  notes?: string;
  first_deposit_date?: string;
  opened_date?: string;
  created_at?: string;
  tracking_since?: string;
}

export interface Institution {
  institution_id: string;
  name: string;
  type: string;
  country: string;
}

export interface Position {
  position_id: string;
  account_id: string;
  symbol: string;
  description: string;
  quantity: number;
  cost_basis: number;
  current_value?: number;
  cost_currency: 'COP' | 'USD';
  position_type: string;
  acquisition_date?: string;
  is_active: boolean;
  pnl?: number;
  pnl_pct?: number;
  interest_rate?: number;
  maturity_date?: string;
}

export interface Transaction {
  transaction_id: string;
  account_id: string;
  symbol?: string;
  description?: string;
  transaction_type: string;
  amount: number;
  currency: 'COP' | 'USD';
  transaction_date: string;
  created_at?: string;
  notes?: string;
}

export interface Alert {
  alert_id: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: string;
  title: string;
  message: string;
  is_acknowledged: boolean;
  created_at?: string;
}

// ─── Portfolio & Allocation ───────────────────────────────────────────────────
export interface PortfolioSummary {
  total_cop: number;
  capital_cop: number;
  returns_cop: number;
  cop_accounts: number;
  total_usd: number;
  capital_usd: number;
  returns_usd: number;
  usd_accounts: number;
  total_pnl: number;
  total_cost_basis: number;
  total_return_pct: number;
  active_positions: number;
  active_accounts: number;
  return_pct: number;
  annualized_return_pct?: number;
  data_coverage_months?: number;
  is_partial_period?: boolean;
}

export interface AllocationTarget {
  sleeve_id: string;
  description: string;
  target_pct: number;
  actual_pct: number;
  drift: number;
  status: 'ok' | 'over' | 'under';
}

// ─── Investor Summary ─────────────────────────────────────────────────────────
export interface InvestorSummary {
  investor: Investor;
  accounts: Account[];
  total_value_cop: number;
  total_cost_cop: number;
  percentage: number;
  return_pct: number;
  annualized_return_pct?: number;
}

// ─── Market & Macro ───────────────────────────────────────────────────────────
export interface MarketData {
  symbol: string;
  name: string;
  price: number;
  change_pct: number;
  currency: string;
  source?: string;
}

export interface MacroIndicator {
  id: string;
  name: string;
  value: number | null;
  unit: string;
  country: string;
  change?: number | null;
  source?: string;
  as_of?: string;
}

// ─── Inflation ────────────────────────────────────────────────────────────────
export interface InflationCumulative {
  ipc_co: number | null;
  ipc_co_annualized: number | null;
  months: number;
  from: string | null;
  to: string | null;
}

export interface InflationDataPoint {
  period: string; // "YYYY-MM"
  ipc_co?: number;
  cpi_us?: number;
}

// ─── History & Snapshots ──────────────────────────────────────────────────────
export interface PortfolioSnapshot {
  date: string;
  month_label: string;
  capital: number;
  returns: number;
  return_pct: number;
}

// ─── KPI Cockpit ─────────────────────────────────────────────────────────────
export interface CockpitData {
  totals: {
    balance: number;
    capital: number;
    returns: number;
    return_pct: number;
    cop_balance: number;
    cop_capital: number;
    cop_returns: number;
    usd_balance: number;
    usd_capital: number;
    usd_returns: number;
  };
  by_investor: Array<{
    name: string;
    balance: number;
    capital: number;
    returns: number;
    return_pct: number;
  }>;
  by_institution: Array<{
    name: string;
    balance: number;
    capital: number;
    returns: number;
    return_pct: number;
  }>;
}

// ─── Insights ────────────────────────────────────────────────────────────────
export interface Insight {
  id: string;
  category: 'risk' | 'alert' | 'opportunity' | 'recommendation' | 'status';
  severity: 'P1' | 'P2' | 'P3' | 'P4';
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

// ─── Maturities ──────────────────────────────────────────────────────────────
export interface MaturityItem {
  id: string;
  instrument_name: string;
  type: string;
  investor_name: string;
  account_id: string;
  interest_rate: number;
  maturity_date: string;
  value_at_maturity: number;
}

// ─── Pensions ─────────────────────────────────────────────────────────────────
export interface PensionContribution {
  id: string;
  date: string;
  amount: number;
  type: string;
  description?: string;
}

export interface PensionProjection {
  year: number;
  age: number;
  projected_value: number;
  contributions_cumulative: number;
}

// ─── Chat ─────────────────────────────────────────────────────────────────────
export interface ChatSession {
  session_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  message_id: number;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  tool_calls?: string;
  created_at: string;
}
