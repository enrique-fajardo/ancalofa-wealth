import type Anthropic from '@anthropic-ai/sdk';
import getDb from '@/lib/db';

// ── Tool Definitions ─────────────────────────────────────────────────────────
export function getTools(): Anthropic.Tool[] {
  return [
    {
      name: 'get_portfolio_summary',
      description: 'Get total portfolio summary: balance, capital, returns, return %',
      input_schema: { type: 'object' as const, properties: {}, required: [] },
    },
    {
      name: 'get_positions',
      description: 'Get all active investment positions with values',
      input_schema: {
        type: 'object' as const,
        properties: {
          account_id: { type: 'string', description: 'Filter by account ID (optional)' },
        },
        required: [],
      },
    },
    {
      name: 'get_investors',
      description: 'Get list of investors (family members) and their balances',
      input_schema: { type: 'object' as const, properties: {}, required: [] },
    },
    {
      name: 'get_accounts',
      description: 'Get investment accounts list',
      input_schema: { type: 'object' as const, properties: {}, required: [] },
    },
    {
      name: 'get_alerts',
      description: 'Get active portfolio alerts that need attention',
      input_schema: { type: 'object' as const, properties: {}, required: [] },
    },
    {
      name: 'get_transactions',
      description: 'Get recent transactions (deposits, withdrawals, interest, etc.)',
      input_schema: {
        type: 'object' as const,
        properties: {
          account_id: { type: 'string', description: 'Filter by account (optional)' },
          limit: { type: 'number', description: 'Max rows to return (default 20)' },
        },
        required: [],
      },
    },
    {
      name: 'get_allocation',
      description: 'Get target vs actual portfolio allocation by sleeve (asset class)',
      input_schema: { type: 'object' as const, properties: {}, required: [] },
    },
    {
      name: 'get_market_data',
      description: 'Get current market data: TRM exchange rate, macro indicators',
      input_schema: { type: 'object' as const, properties: {}, required: [] },
    },
    {
      name: 'get_maturities',
      description: 'Get upcoming CDT/CAT maturities and their dates',
      input_schema: { type: 'object' as const, properties: {}, required: [] },
    },
    {
      name: 'run_query',
      description: 'Run a read-only SQL query against the financial database',
      input_schema: {
        type: 'object' as const,
        properties: {
          sql: { type: 'string', description: 'SELECT query only' },
        },
        required: ['sql'],
      },
    },
  ];
}

// ── Tool Executor ─────────────────────────────────────────────────────────────
export async function executeTool(
  toolName: string,
  input: Record<string, unknown>
): Promise<unknown> {
  try {
    const db = getDb();
    const TRM = 4200;

    switch (toolName) {
      case 'get_portfolio_summary': {
        const positions = db.prepare(`
          SELECT p.cost_currency, p.current_value, p.cost_basis
          FROM positions p WHERE p.is_active=1
        `).all() as Array<{ cost_currency: string; current_value?: number; cost_basis: number }>;

        let totalCOP = 0, capitalCOP = 0;
        for (const pos of positions) {
          const val = pos.current_value ?? pos.cost_basis;
          const valCOP = pos.cost_currency === 'USD' ? val * TRM : val;
          const costCOP = pos.cost_currency === 'USD' ? pos.cost_basis * TRM : pos.cost_basis;
          totalCOP += valCOP;
          capitalCOP += costCOP;
        }
        const returns = totalCOP - capitalCOP;
        const returnPct = capitalCOP > 0 ? (returns / capitalCOP) * 100 : 0;
        return { total_value_cop: totalCOP, capital_cop: capitalCOP, returns_cop: returns, return_pct: returnPct, positions: positions.length };
      }

      case 'get_positions': {
        const { account_id } = input;
        let rows;
        if (account_id) {
          rows = db.prepare('SELECT * FROM positions WHERE account_id=? AND is_active=1').all(account_id);
        } else {
          rows = db.prepare('SELECT * FROM positions WHERE is_active=1 ORDER BY account_id, symbol').all();
        }
        return rows;
      }

      case 'get_investors': {
        const investors = db.prepare('SELECT * FROM investors').all() as Array<{ investor_id: string }>;
        const positions = db.prepare(`
          SELECT p.cost_currency, p.current_value, p.cost_basis, a.investor_id
          FROM positions p JOIN accounts a ON p.account_id=a.account_id WHERE p.is_active=1
        `).all() as Array<{ investor_id: string; cost_currency: string; current_value?: number; cost_basis: number }>;

        return investors.map(inv => {
          const invPos = positions.filter(p => p.investor_id === inv.investor_id);
          const total = invPos.reduce((s, p) => s + ((p.current_value ?? p.cost_basis) * (p.cost_currency === 'USD' ? TRM : 1)), 0);
          const capital = invPos.reduce((s, p) => s + (p.cost_basis * (p.cost_currency === 'USD' ? TRM : 1)), 0);
          return { ...inv, total_value_cop: total, capital_cop: capital, return_pct: capital > 0 ? ((total - capital) / capital) * 100 : 0 };
        });
      }

      case 'get_accounts':
        return db.prepare('SELECT * FROM accounts ORDER BY account_id').all();

      case 'get_alerts':
        return db.prepare('SELECT * FROM alerts WHERE is_acknowledged=0 ORDER BY created_at DESC').all();

      case 'get_transactions': {
        const { account_id, limit = 20 } = input;
        if (account_id) {
          return db.prepare('SELECT * FROM transactions WHERE account_id=? ORDER BY transaction_date DESC LIMIT ?').all(account_id, limit);
        }
        return db.prepare('SELECT * FROM transactions ORDER BY transaction_date DESC LIMIT ?').all(limit);
      }

      case 'get_allocation': {
        const TARGETS: Record<string, number> = { cop_equity: 25, usd_equity: 35, fixed_income: 25, crypto: 5, cash: 10 };
        const positions = db.prepare('SELECT position_type as sleeve, cost_currency, current_value, cost_basis FROM positions WHERE is_active=1').all() as Array<{ sleeve?: string; cost_currency: string; current_value?: number; cost_basis: number }>;
        let totalCOP = 0;
        const totals: Record<string, number> = {};
        for (const pos of positions) {
          const val = (pos.current_value ?? pos.cost_basis) * (pos.cost_currency === 'USD' ? TRM : 1);
          totalCOP += val;
          const s = pos.sleeve || 'cash';
          totals[s] = (totals[s] ?? 0) + val;
        }
        return Object.entries(TARGETS).map(([s, t]) => ({
          sleeve: s, target_pct: t,
          actual_pct: totalCOP > 0 ? ((totals[s] ?? 0) / totalCOP) * 100 : 0,
          drift: totalCOP > 0 ? (((totals[s] ?? 0) / totalCOP) * 100 - t) : -t,
        }));
      }

      case 'get_market_data': {
        let trm = TRM;
        try {
          const r = db.prepare(`SELECT value FROM macro_history WHERE indicator_id='trm' ORDER BY period DESC LIMIT 1`).get() as { value: number } | undefined;
          if (r?.value) trm = r.value;
        } catch { /* ok */ }
        return [{ symbol: 'TRM', name: 'USD/COP', price: trm, currency: 'COP' }];
      }

      case 'get_maturities': {
        const today = new Date().toISOString().slice(0, 10);
        return db.prepare(`
          SELECT p.description, p.maturity_date, p.interest_rate, p.current_value, p.cost_basis, a.account_id
          FROM positions p JOIN accounts a ON p.account_id=a.account_id
          WHERE p.is_active=1 AND p.maturity_date >= ? ORDER BY p.maturity_date ASC
        `).all(today);
      }

      case 'run_query': {
        const { sql } = input;
        if (typeof sql !== 'string' || !sql.trim().toUpperCase().startsWith('SELECT')) {
          return { error: 'Only SELECT queries are allowed' };
        }
        return db.prepare(sql as string).all();
      }

      default:
        return { error: `Unknown tool: ${toolName}` };
    }
  } catch (e) {
    return { error: String(e) };
  }
}
