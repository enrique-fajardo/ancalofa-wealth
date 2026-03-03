import type {
  PeriodKey, PortfolioSummary, AllocationTarget, Alert, MarketData,
  InvestorSummary, MacroIndicator, InflationCumulative, InflationDataPoint,
  Account, Investor, Institution, Position, Transaction, CockpitData,
  PortfolioSnapshot, Insight, MaturityItem, PensionContribution, PensionProjection,
  ChatSession, ChatMessage,
} from '@/types';

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

const api = {
  // ── Portfolio ────────────────────────────────────────────────────────────────
  getPortfolioSummary: (period: PeriodKey = 'total') =>
    fetchJSON<PortfolioSummary>(`/api/portfolio-summary?period=${period}`),

  getAllocationTargets: () =>
    fetchJSON<AllocationTarget[]>('/api/allocation'),

  getPortfolioSnapshots: () =>
    fetchJSON<PortfolioSnapshot[]>('/api/portfolio-snapshots'),

  // ── Alerts ───────────────────────────────────────────────────────────────────
  getAlerts: (acknowledged = false) =>
    fetchJSON<Alert[]>(`/api/alerts?acknowledged=${acknowledged}`),

  acknowledgeAlert: (alertId: string) =>
    fetchJSON<{ ok: boolean }>('/api/alerts', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alert_id: alertId, is_acknowledged: true }),
    }),

  // ── Market & Macro ───────────────────────────────────────────────────────────
  getMarketData: () => fetchJSON<MarketData[]>('/api/market-data'),
  getMacroIndicators: () => fetchJSON<MacroIndicator[]>('/api/macro-indicators'),
  getInflationCumulative: (period: PeriodKey = 'total') =>
    fetchJSON<InflationCumulative>(`/api/inflation-cumulative?period=${period}`),
  getInflationHistory: () =>
    fetchJSON<InflationDataPoint[]>('/api/inflation-history'),

  // ── Investors ────────────────────────────────────────────────────────────────
  getInvestors: () => fetchJSON<Investor[]>('/api/investors'),
  getInvestorById: (id: string) => fetchJSON<Investor>(`/api/investors?id=${id}`),
  getAccountsByInvestor: (investorId: string) =>
    fetchJSON<Account[]>(`/api/accounts?investor_id=${investorId}`),
  getInvestorSummaries: (period: PeriodKey = 'total') =>
    fetchJSON<InvestorSummary[]>(`/api/investor-summaries?period=${period}`),

  // ── Accounts ────────────────────────────────────────────────────────────────
  getAccounts: () => fetchJSON<Account[]>('/api/accounts'),
  getAccountById: (id: string) => fetchJSON<Account>(`/api/accounts?id=${id}`),
  createAccount: (data: Partial<Account>) =>
    fetchJSON<Account>('/api/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  updateAccount: (id: string, data: Partial<Account>) =>
    fetchJSON<Account>(`/api/accounts?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  deleteAccount: (id: string) =>
    fetchJSON<{ ok: boolean }>(`/api/accounts?id=${id}`, { method: 'DELETE' }),

  // ── Institutions ─────────────────────────────────────────────────────────────
  getInstitutions: () => fetchJSON<Institution[]>('/api/institutions'),
  createInstitution: (data: Partial<Institution>) =>
    fetchJSON<Institution>('/api/institutions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  updateInstitution: (id: string, data: Partial<Institution>) =>
    fetchJSON<Institution>(`/api/institutions?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  deleteInstitution: (id: string) =>
    fetchJSON<{ ok: boolean }>(`/api/institutions?id=${id}`, { method: 'DELETE' }),

  // ── Positions ────────────────────────────────────────────────────────────────
  getPositions: () => fetchJSON<Position[]>('/api/positions'),
  getPositionsByAccount: (accountId: string) =>
    fetchJSON<Position[]>(`/api/positions?account_id=${accountId}`),
  createPosition: (data: Partial<Position>) =>
    fetchJSON<Position>('/api/positions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  updatePosition: (id: string, data: Partial<Position>) =>
    fetchJSON<Position>(`/api/positions?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  deletePosition: (id: string) =>
    fetchJSON<{ ok: boolean }>(`/api/positions?id=${id}`, { method: 'DELETE' }),

  // ── Transactions ─────────────────────────────────────────────────────────────
  getTransactions: () => fetchJSON<Transaction[]>('/api/transactions'),
  getTransactionsByAccount: (accountId: string) =>
    fetchJSON<Transaction[]>(`/api/transactions?account_id=${accountId}`),
  createTransaction: (data: Partial<Transaction>) =>
    fetchJSON<Transaction>('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  deleteTransaction: (id: string) =>
    fetchJSON<{ ok: boolean }>(`/api/transactions?id=${id}`, { method: 'DELETE' }),

  // ── Cockpit ──────────────────────────────────────────────────────────────────
  getCockpit: (period: PeriodKey = 'total') =>
    fetchJSON<CockpitData>(`/api/cockpit?period=${period}`),

  // ── Insights ─────────────────────────────────────────────────────────────────
  getInsights: () => fetchJSON<Insight[]>('/api/insights'),

  // ── Snapshots ────────────────────────────────────────────────────────────────
  getSnapshots: () => fetchJSON<unknown[]>('/api/snapshots'),

  // ── Maturities ───────────────────────────────────────────────────────────────
  getMaturityItems: () => fetchJSON<MaturityItem[]>('/api/maturity-items'),

  // ── Pensions ─────────────────────────────────────────────────────────────────
  getPensionContributions: () =>
    fetchJSON<PensionContribution[]>('/api/pension-contributions'),
  getPensionProjections: () =>
    fetchJSON<PensionProjection[]>('/api/pension-projections'),

  // ── Chat (direct fetch — SSE streaming handled in component) ─────────────────
  getChatSessions: () => fetchJSON<ChatSession[]>('/api/chat'),
  getChatMessages: (sessionId: string) =>
    fetchJSON<ChatMessage[]>(`/api/chat?session_id=${sessionId}`),
  deleteChatSession: (sessionId: string) =>
    fetch(`/api/chat?session_id=${sessionId}`, { method: 'DELETE' }),
};

export default api;
