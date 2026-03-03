import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

const TRM_FALLBACK = 4200;

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'total';
    void period; // period-aware logic can be added later

    let TRM = TRM_FALLBACK;
    try {
      const r = db.prepare(`SELECT value FROM macro_history WHERE indicator_id='trm' ORDER BY period DESC LIMIT 1`).get() as { value: number } | undefined;
      if (r?.value) TRM = r.value;
    } catch { /* ok */ }

    const investors = db.prepare('SELECT * FROM investors ORDER BY investor_type, full_name').all() as Array<{
      investor_id: string; full_name: string; used_name: string;
      investor_type: string; birth_date: string; status: string;
    }>;

    const accounts = db.prepare('SELECT * FROM accounts').all() as Array<{
      account_id: string; investor_id: string; currency: string;
      first_deposit_date?: string; is_active: boolean;
    }>;

    const positions = db.prepare(`
      SELECT p.*, a.investor_id
      FROM positions p JOIN accounts a ON p.account_id=a.account_id
      WHERE p.is_active=1
    `).all() as Array<{
      investor_id: string; cost_currency: string;
      current_value?: number; cost_basis: number;
    }>;

    // Total portfolio value in COP
    const totalCOP = positions.reduce((s, p) => {
      const val = p.current_value ?? p.cost_basis;
      return s + (p.cost_currency === 'USD' ? val * TRM : val);
    }, 0);

    const summaries = investors.map(inv => {
      const invAccounts = accounts.filter(a => a.investor_id === inv.investor_id);
      const invPositions = positions.filter(p => p.investor_id === inv.investor_id);

      const totalValue = invPositions.reduce((s, p) => {
        const val = p.current_value ?? p.cost_basis;
        return s + (p.cost_currency === 'USD' ? val * TRM : val);
      }, 0);

      const totalCost = invPositions.reduce((s, p) => {
        return s + (p.cost_currency === 'USD' ? p.cost_basis * TRM : p.cost_basis);
      }, 0);

      const returnPct = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;

      // CAGR from earliest first_deposit_date
      let annualizedPct: number | undefined;
      const dates = invAccounts
        .map(a => a.first_deposit_date)
        .filter(Boolean) as string[];
      if (dates.length > 0 && totalCost > 0) {
        const earliest = dates.sort()[0];
        const start = new Date(earliest + 'T00:00:00');
        const years = (Date.now() - start.getTime()) / (365.25 * 24 * 3600 * 1000);
        if (years >= 1) {
          annualizedPct = (Math.pow(totalValue / totalCost, 1 / years) - 1) * 100;
        }
      }

      return {
        investor: inv,
        accounts: invAccounts,
        total_value_cop: Math.round(totalValue),
        total_cost_cop: Math.round(totalCost),
        percentage: totalCOP > 0 ? (totalValue / totalCOP) * 100 : 0,
        return_pct: Math.round(returnPct * 100) / 100,
        annualized_return_pct: annualizedPct !== undefined
          ? Math.round(annualizedPct * 100) / 100
          : undefined,
      };
    });

    return NextResponse.json(summaries);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
